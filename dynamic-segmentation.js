define([
    'dojo/text!app/widget/templates/dynamic-segmentation.html',

    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/Color',

    'dojo/json',
    'dojo/number',
    'dojo/on',

    'dijit/form/Button',

    'esri/InfoTemplate',
    'esri/request',
    'esri/SnappingManager',
    'esri/toolbars/draw',
    'esri/layers/GraphicsLayer',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/graphic',
    'esri/geometry/Point',

    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin'
], function(
    template,

    array,
    declare,
    lang,
    Color,

    JSON,
    number,
    on,

    Button,

    InfoTemplate,
    esriRequest,
    SnappingManager,
    Draw,
    GraphicsLayer,
    SimpleMarkerSymbol,
    Graphic,
    Point,

    _WidgetBase,
    _TemplatedMixin
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      Used with Dynamic Segmentation Server Object Extension for locating distance markers

        templateString: template,
        baseClass: 'dynamic-segmentation',

        // Properties to be sent into constructor
	map: null,

	routeLayer: null,

	layerId: null,

	tolerance: null,

	symbol: null,

	constructor: function(params) {
	    console.log('app.dynamic-segmentation::constructor', arguments);
	    this.toolbar = new Draw(params.map);
	    this.mapPoint = new Point();
	    this.graphicsLayer = new GraphicsLayer();
	},

	postMixInProperties: function() {
	    console.log('app.dynamic-segmentation::postMixinProperties', arguments);

	    if (this.map) {
		this.map.addLayer(this.graphicsLayer);
	    }

	    if (!this.symbol) {
		console.log("No symbol specified");
		this.symbol = new SimpleMarkerSymbol();
		this.symbol.setStyle(SimpleMarkerSymbol.STYLE_CIRCLE);
		this.symbol.setColor(new Color([255,0,0,0.5]));
		console.log(this.symbol);
	    }
	},

        postCreate: function() {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            // tags:
            //      private
            console.log('app.dynamic-segmentation::postCreate', arguments);

            this.setupConnections();

            this.inherited(arguments);
        },
        setupConnections: function() {
            // summary:
            //      wire events, and such
            //
            console.log('app.dynamic-segmentation::setupConnections', arguments);

	    on(this.identifyRouteBtn, 'click', lang.hitch(this,'_onIdentifyRouteClick'));
	    on(this.toolbar, 'draw-end', lang.hitch(this,'_identifyRoute'));
        },
	_onIdentifyRouteClick: function() {
	    console.log('app.dynamic-segmentation::_onIdentifyRouteClick', arguments);
	    this.toolbar.activate(Draw.POINT);
	},
	_identifyRoute: function(evt) {
	    console.log('app.dynamic-segmentation::_identifyRoute', arguments);
	    this.graphicsLayer.clear();
	    this.toolbar.deactivate();
	    this.mapPoint = evt.geometry;
	    var params = {
		f: 'json',
		location: JSON.stringify(evt.geometry.toJson()),
		tolerance: this.tolerance
	    };
	    var url = this.routeLayer.url + '/exts/DSUtility/routeLayers/' + this.layerId + '/IdentifyRoute';
	    var identifyRequest = esriRequest({
		url: url,
		content: params,
		callbackParamName: "callback"
	    });
	    identifyRequest.then(lang.hitch(this,'_identifySuccess'), lang.hitch(this, '_identifyError'));
	},
	
	_identifySuccess: function(results) {
	    console.log('app.dynamic-segmentation::_identifySuccess', arguments);
	    var mPoint = this.mapPoint;
	    var gLayer = this.graphicsLayer;
	    var mSymbol = this.symbol;
	    if (results.location.length == 0) {
		var infoTemplate = new InfoTemplate("Route Measurement", "No route measures found");
	    } else {
		var infoTemplate = new InfoTemplate("Route Measurement", "${*}");
		array.forEach(results.location, function(mDetails) {
		    mDetails.measure = number.format(mDetails.measure, {places:3});
		    var attr = {"Route ID" : mDetails.routeID, "Measurement": mDetails.measure};
		    var graphic = new Graphic(mPoint, mSymbol, attr);
		    gLayer.add(graphic);
		});
	    }
	    gLayer.setInfoTemplate(infoTemplate);
	    this.map.infoWindow.show(this.mapPoint);
	},
	
	_identifyError: function() {
	    console.log('app.dynamic-segmentation::_identifyError', arguments);
	}
    });
});

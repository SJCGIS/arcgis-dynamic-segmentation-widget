define([
    'dojo/text!app/widget/templates/dynamic-segmentation.html',

    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/Color',

    'dojo/dom',
    'dojo/dom-construct',
    'dojo/json',
    'dojo/number',
    'dojo/on',

    'esri/dijit/InfoWindow',
    'esri/request',
    'esri/toolbars/draw',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/graphic',
    'esri/geometry/Point',
    'esri/layers/GraphicsLayer',

    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin'
], function(
    template,

    array,
    declare,
    lang,
    Color,

    dom,
    domConstruct,
    JSON,
    number,
    on,

    InfoWindow,
    esriRequest,
    Draw,
    SimpleMarkerSymbol,
    Graphic,
    Point,
    GraphicsLayer,

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

	routeService: null,

	layerId: null,

	tolerance: null,

	symbol: null,

	constructor: function(params) {
	    console.log('app.dynamic-segmentation::constructor', arguments);
	    this.toolbar = new Draw(params.map);
	    this.mapPoint = new Point();
	    this.drawToolbar = new Draw(params.map, {
		showTooltips: false
	    });
	    this.info = new InfoWindow({
		title: "Route Measures"
	    }, domConstruct.create("div"));
	    this.info.startup();
	},

	postMixInProperties: function() {
	    console.log('app.dynamic-segmentation::postMixinProperties', arguments);

	    if (this.map && !this.graphicsLayer) {
		this.graphicsLayer = new GraphicsLayer();
		this.map.addLayer(this.graphicsLayer);
		this.map.infoWindow = this.info;
	    }

	    if (!this.symbol) {
		console.log("No symbol specified");
		this.symbol = new SimpleMarkerSymbol();
		this.symbol.setStyle(SimpleMarkerSymbol.STYLE_CIRCLE);
		this.symbol.setColor(new Color([255,0,0,0.5]));
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
	    on(this.drawToolbar, 'draw-end', lang.hitch(this, '_identifyRoute'));
        },
	_onIdentifyRouteClick: function() {
	    console.log('app.dynamic-segmentation::_onIdentifyRouteClick', arguments);
	    this.drawToolbar.activate(Draw.POINT);
	},
	_identifyRoute: function(evt) {
	    console.log('app.dynamic-segmentation::_identifyRoute', arguments);
	    this.graphicsLayer.clear();
	    this.drawToolbar.deactivate();
	    this.map.infoWindow.hide();
	    this.mapPoint = evt.geometry;
	    var params = {
		f: 'json',
		location: JSON.stringify(this.mapPoint.toJson()),
		tolerance: this.tolerance
	    };
	    var url = this.routeService.url + '/exts/DSUtility/routeLayers/' + this.layerId + '/IdentifyRoute';
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
	    var mSymbol = this.symbol;
	    this.graphicsLayer.add(new Graphic(mPoint, mSymbol));
	    var content;
	    if (results.location.length == 0) {
		console.log("No results");
		content = "No route measures found";
	    } else {
		var ul = domConstruct.create("ul");
		array.map(results.location, function(mDetails) {
		    mDetails.measure = number.format(mDetails.measure, {places:3});
		    var li = domConstruct.create("li");
		    li.innerHTML = 'Route: ' + mDetails.routeID + ' Measure: ' + mDetails.measure;
		    ul.appendChild(li);
		});
		content = ul.innerHTML;
	    }
	    this.map.infoWindow.setContent(content);
	    this.map.infoWindow.show(mPoint);
	},
	
	_identifyError: function(err) {
	    console.log('app.dynamic-segmentation::_identifyError', arguments);
	    this.map.infoWindow.setContent(err.message);
	}
    });
});

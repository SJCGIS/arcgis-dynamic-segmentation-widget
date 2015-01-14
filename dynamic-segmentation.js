define([
    'dojo/text!app/widget/templates/dynamic-segmentation.html',

    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/Color',

    'dojo/dom-construct',
    'dojo/json',
    'dojo/number',
    'dojo/on',

    'dijit/form/Button',

    'esri/dijit/PopupTemplate',
    'esri/request',
    'esri/toolbars/draw',
    'esri/dijit/Popup',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/graphic',
    'esri/geometry/Point',

    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojox/widget/Toaster'
], function(
    template,

    array,
    declare,
    lang,
    Color,

    domConstruct,
    JSON,
    number,
    on,

    Button,

    PopupTemplate,
    esriRequest,
    Draw,
    Popup,
    SimpleMarkerSymbol,
    Graphic,
    Point,

    _WidgetBase,
    _TemplatedMixin,
    Toaster
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
	    this.popup = new Popup({},domConstruct.create("div"));
	    this.popupTemplate = new PopupTemplate();
	},

	postMixInProperties: function() {
	    console.log('app.dynamic-segmentation::postMixinProperties', arguments);

	    if (this.map) {
		this.map.infoWindow = this.popup;
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
	    this.routeIdentifyHandler = on.pausable(this.map, 'click', lang.hitch(this, '_identifyRoute'));
	    this.routeIdentifyHandler.pause();
        },
	_onIdentifyRouteClick: function() {
	    console.log('app.dynamic-segmentation::_onIdentifyRouteClick', arguments);
	    this.routeIdentifyHandler.resume();
	},
	_identifyRoute: function(evt) {
	    console.log('app.dynamic-segmentation::_identifyRoute', arguments);
	    this.map.graphics.clear();
	    this.map.infoWindow.clearFeatures();
	    this.routeIdentifyHandler.pause();
	    this.mapPoint = evt.mapPoint;
	    var params = {
		f: 'json',
		location: JSON.stringify(this.mapPoint.toJson()),
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
	    var mSymbol = this.symbol;
	    var mPopupTemplate = new PopupTemplate();
	    mPopupTemplate.setTitle("Route Measurement");
	    if (results.location.length == 0) {
		console.log("No results");
		mPopupTemplate.setContent("No route measures found");
		var attr = {};
		var graphic = new Graphic(mPoint, mSymbol, attr, mPopupTemplate);
		this.map.graphics.add(graphic);
	    } else {
		mPopupTemplate.setContent("${*}");
		array.forEach(results.location, function(mDetails) {
		    mDetails.measure = number.format(mDetails.measure, {places:3});
		    var attr = {"Route ID" : mDetails.routeID, "Measurement": mDetails.measure};
		    var graphic = new Graphic(mPoint, mSymbol, attr, mPopupTemplate);
		    this.map.graphics.add(graphic);
		});
	    }
	    debugger;
	    this.map.infoWindow.setFeatures(this.map.graphics.graphics);
	    this.map.infoWindow.show(mPoint);
	},
	
	_identifyError: function() {
	    console.log('app.dynamic-segmentation::_identifyError', arguments);
	}
    });
});

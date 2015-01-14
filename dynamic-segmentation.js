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

    'dojox/widget/Toaster',

    'esri/dijit/PopupTemplate',
    'esri/request',
    'esri/toolbars/draw',
    'esri/dijit/Popup',
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

    dom,
    domConstruct,
    JSON,
    number,
    on,

    Toaster,

    PopupTemplate,
    esriRequest,
    Draw,
    Popup,
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
	},

	postMixInProperties: function() {
	    console.log('app.dynamic-segmentation::postMixinProperties', arguments);

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

	    this.toaster = new Toaster({
		id: 'measureToaster',
		positionDirection: 'tl-right'		
	    }, this.toasterPane);

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
	    var toaster = this.toaster;
	    if (results.location.length == 0) {
		console.log("No results");
		toaster.setContent("No route measures found");
	    } else {
		var ul = domConstruct.create("ul");
		array.map(results.location, function(mDetails) {
		    mDetails.measure = number.format(mDetails.measure, {places:3});
		    var li = domConstruct.create("li");
		    li.innerHTML = 'Route: ' + mDetails.routeID + ' Measure: ' + mDetails.measure;
		    ul.appendChild(li);
		});
		toaster.setContent(ul.innerHTML);
	    }
	    toaster.show();
	},
	
	_identifyError: function() {
	    console.log('app.dynamic-segmentation::_identifyError', arguments);
	}
    });
});

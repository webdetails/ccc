
pvc.Abstract = Base.extend({
    invisibleLineWidth: 0.001,
    defaultLineWidth:   1.5
});

/**
 * The main component
 */
pvc.Base = pvc.Abstract.extend({

    isPreRendered: false,
    isAnimating:   false,

    // data
    dataEngine: null,
    resultset:  [],
    metadata:   [],

    // panels
    basePanel:   null,
    titlePanel:  null,
    legendPanel: null,

    legendSource: "series",
    colors: null,

    // renderCallback
    renderCallback: undefined,

    constructor: function(options) {

        this.options = pvc.mergeDefaults({}, pvc.Base.defaultOptions, options);

        this.dataEngine = this.createDataEngine();
    },

    /**
     * Creates an appropriate DataEngine
     * @virtual
     */
    createDataEngine: function() {
        return new pvc.DataEngine(this);
    },

    /**
     * Building the visualization has 2 stages:
     * First the preRender method prepares and builds 
     * every object that will be used.
     * Later the render method effectively renders.
     */
    preRender: function() {
        pvc.log("Prerendering in pvc");

        /* DEBUG current options */
        if(pvc.debug && this.options && typeof(JSON.stringify) !== 'undefined'){
            pvc.log("OPTIONS:\n" + JSON.stringify(this.options));
        }

        // Now's as good a time as any to completely clear out all
        //  tipsy tooltips
        pvc.removeTipsyLegends();

        // If we don't have data, we just need to set a "no data" message
        // and go on with life.
        if (!this.allowNoData && this.resultset.length === 0) {
            throw new NoDataException();
        }

        // Disable animation if browser doesn't support it
        if (!$.support.svg) {
            this.options.animate = false;
        }

        // Getting data engine and initialize the translator
        this.initDataEngine();

        // Create color schemes
        this.colors = pvc.createColorScheme(this.options.colors);
        this.secondAxisColor = pvc.createColorScheme(this.options.secondAxisColor);

        this.initBasePanel();

        this.initTitlePanel();

        this.initLegendPanel();

        this.isPreRendered = true;
    },

    /**
     * Initializes the data engine
     */
    initDataEngine: function() {
        var de = this.dataEngine;

        //de.clearDataCache();
        
        de.setData(this.metadata, this.resultset);
        de.setCrosstabMode(this.options.crosstabMode);
        de.setSeriesInRows(this.options.seriesInRows);
        // TODO: new
        de.setMultiValued(this.options.isMultiValued);

        // columns where measure values are, for relational data
        de.setValuesIndexes(this.options.measuresIndexes);

        de.setDataOptions(this.options.dataOptions);

        // ---

        de.createTranslator();

        if(pvc.debug){ 
            pvc.log(this.dataEngine.getInfo()); 
        }
    },

    /**
     * Creates and initializes the base (root) panel.
     */
    initBasePanel: function() {
        // Since we don't have a parent panel
        // we need to manually create the points.
        this.originalWidth  = this.options.width;
        this.originalHeight = this.options.height;
        
        this.basePanel = new pvc.BasePanel(this);
        this.basePanel.setSize(this.options.width, this.options.height);
        this.basePanel.create();
        this.basePanel.applyExtensions();

        this.basePanel.getPvPanel().canvas(this.options.canvas);
    },

    /**
     * Creates and initializes the title panel,
     * if the title is specified.
     */
    initTitlePanel: function(){
        if (this.options.title != null && this.options.title != "") {
            this.titlePanel = new pvc.TitlePanel(this, {
                title:      this.options.title,
                anchor:     this.options.titlePosition,
                titleSize:  this.options.titleSize,
                titleAlign: this.options.titleAlign
            });

            this.titlePanel.appendTo(this.basePanel); // Add it
        }
    },

    /**
     * Creates and initializes the legend panel,
     * if the legend is active.
     */
    initLegendPanel: function(){
        if (this.options.legend) {
            this.legendPanel = new pvc.LegendPanel(this, {
                anchor: this.options.legendPosition,
                legendSize: this.options.legendSize,
                align: this.options.legendAlign,
                minMarginX: this.options.legendMinMarginX,
                minMarginY: this.options.legendMinMarginY,
                textMargin: this.options.legendTextMargin,
                padding: this.options.legendPadding,
                textAdjust: this.options.legendTextAdjust,
                shape: this.options.legendShape,
                markerSize: this.options.legendMarkerSize,
                drawLine: this.options.legendDrawLine,
                drawMarker: this.options.legendDrawMarker
            });

            this.legendPanel.appendTo(this.basePanel); // Add it
        }
    },

    /**
     * Render the visualization.
     * If not pre-rendered, do it now.
     */
    render: function(bypassAnimation, rebuild) {
        try{
            if (!this.isPreRendered || rebuild) {
                this.preRender();
            }

            if (this.options.renderCallback) {
                this.options.renderCallback.call(this);
            }

            this.basePanel.getPvPanel().render();

            if (this.options.animate && !bypassAnimation) {
                this.isAnimating = true;
                this.basePanel.getPvPanel()
                        .transition()
                        .duration(2000)
                        .ease("cubic-in-out")
                        .start();
            }
        } catch (e) {
            if (e instanceof NoDataException) {

                if (!this.basePanel) {
                    pvc.log("No panel");
                    this.initBasePanel();
                }

                pvc.log("creating message");
                var pvPanel = this.basePanel.getPvPanel(), 
                    message = pvPanel.anchor("center").add(pv.Label);
                
                message.text("No data found");

                this.basePanel.extend(message, "noDataMessage_");
                
                pvPanel.render();

            } else {
                // We don't know how to handle this
                pvc.logError(e.message);
                throw e;
            }
        }
    },

    /**
     * Method to set the data to the chart.
     * Expected object is the same as what comes from the CDA: 
     * {metadata: [], resultset: []}
     */
    setData: function(data, options) {
        this.setResultset(data.resultset);
        this.setMetadata(data.metadata);

        $.extend(this.options, options);
    },

    /**
     * Sets the resultset that will be used to build the chart.
     */
    setResultset: function(resultset) {
        this.resultset = resultset;
        if (resultset.length == 0) {
            pvc.log("Warning: Resultset is empty");
        }
    },

    /**
     * Sets the metadata that, optionally, 
     * will give more information for building the chart.
     */
    setMetadata: function(metadata) {
        this.metadata = metadata;
        if (metadata.length == 0) {
            pvc.log("Warning: Metadata is empty");
        }
    },

    /**
     * This is the method to be used for the extension points
     * for the specific contents of the chart. already ge a pie
     * chart! Goes through the list of options and, if it
     * matches the prefix, execute that method on the mark.
     * WARNING: It's the user's responsibility to make sure that
     * unexisting methods don't blow this.
     */
    extend: function(mark, prefix, keyArgs) {
        // if mark is null or undefined, skip
        if (mark) {
            var points = this.options.extensionPoints;
            if(points){
                var pL = prefix.length,
                    wrapper = pvc.get(keyArgs, 'wrapper'),
                    context = pvc.get(keyArgs, 'context');

                for (var p in points) {
                    // Starts with
                    if (p.indexOf(prefix) === 0) {
                        var m = p.substring(pL),
                            v = points[p];

                        // Distinguish between mark methods and properties
                        if (typeof mark[m] === "function") {
                            // Now check if function wrapping is needed
                            if(wrapper && typeof v === 'function'){
                                v = wrapper.call(context, v);
                            }
                            
                            mark[m](v);
                        } else {
                            mark[m] = v;
                        }
                    }
                }
            }
        }
    },

    /*
     * Animation
     */
    animate: function(start, end) {
        return (!this.options.animate || this.isAnimating) ? end : start;
    },

    isOrientationVertical: function(orientation) {
        return (orientation || this.options.orientation) === "vertical";
    },

    isOrientationHorizontal: function(orientation) {
        return (orientation || this.options.orientation) == "horizontal";
    }
}, {
    // NOTE: undefined values are not considered by $.extend
    // and thus BasePanel does not receive null properties...
    defaultOptions: {
        canvas: null,

        width:  400,
        height: 300,

        orientation: 'vertical',

        extensionPoints:  undefined,
        
        crosstabMode:     true,
        isMultiValued:    false,
        seriesInRows:     false,
        measuresIndexes:  undefined,
        dataOptions:      undefined,
        getCategoryLabel: undefined,
        getSeriesLabel:   undefined,

        timeSeries:       undefined,
        timeSeriesFormat: undefined,

        animate: true,

        title:         null,
        titlePosition: "top", // options: bottom || left || right
        titleAlign:    "center", // left / right / center
        titleSize:     undefined,

        legend:           false,
        legendPosition:   "bottom",
        legendSize:       undefined,
        legendAlign:      undefined,
        legendMinMarginX: undefined,
        legendMinMarginY: undefined,
        legendTextMargin: undefined,
        legendPadding:    undefined,
        legendTextAdjust: undefined,
        legendShape:      undefined,
        legendDrawLine:   undefined,
        legendDrawMarker: undefined,
        legendMarkerSize: undefined,
        
        colors: null,

        secondAxis: false,
        secondAxisIdx: -1,
        secondAxisColor: undefined,

        tooltipFormat: function(s, c, v) {
            return s + ", " + c + ":  " + this.chart.options.valueFormat(v);
        },

        valueFormat: function(d) {
            return pv.Format.number().fractionDigits(0, 2).format(d);
            // pv.Format.number().fractionDigits(0, 10).parse(d));
        },

        clickable:  false,
        selectable: false,

        clickAction: function(s, c, v) {
            pvc.log("You clicked on series " + s + ", category " + c + ", value " + v);
        },

        renderCallback: undefined
    }
});

/**
 * Base panel. 
 * A lot of them will exist here, with some common properties. 
 * Each class that extends pvc.base will be 
 * responsible to know how to use it.
 */
pvc.BasePanel = pvc.Abstract.extend({

    chart: null,
    _parent: null,
    type: pv.Panel, // default one
    height: null,
    width: null,
    anchor: "top",
    pvPanel: null,
    fillColor: "red",
    margins: null,

    constructor: function(chart, options) {

        this.chart = chart;
        
        $.extend(this, options);

        this.margins = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        };
    },

    create: function() {

        if (!this._parent) {
            // Should be created for the vis panel only
            this.pvPanel = new pv.Panel();
            //this.extend(this.pvPanel, "base_");
        } else {
            this.pvPanel = this._parent.pvPanel.add(this.type);
        }

        this.pvPanel
            .width(this.width)
            .height(this.height);
    },

    /**
     * Create the panel, appending it to the previous one using
     * a specified anchor.
     *
     * Will: 
     * 1) create the panel
     * 2) subtract it's size from the previous panel's size 
     * 3) append it to the previous one in the correct position.
     */
    appendTo: function(parent) {

        this._parent = parent;
        this.create();
        this.applyExtensions();

        // Reduce size and update margins
        var a = this.anchor,
            ao = this.anchorOrtho(),
            isTopOrBottom = this.isAnchorTopOrBottom(),
            margins = this._parent.margins;

        if (isTopOrBottom) {
            this._parent.height -= this.height;
        } else {
            this._parent.width -= this.width;
        }

        // See where to attach it.
        this.pvPanel[a ](margins[a ]);
        this.pvPanel[ao](margins[ao]);

        // update margins
        if (isTopOrBottom) {
            margins[a] += this.height;
        } else {
            margins[a] += this.width;
        }
    },
    
    /**
     * Override to apply specific extensions points.
     * @virtual
     */
    applyExtensions: function(){
        if (!this._parent) {
            this.extend(this.pvPanel, "base_");
        }
    },

    /**
     * This is the method to be used for the extension points
     * for the specific contents of the chart. already ge a pie
     * chart! Goes through the list of options and, if it
     * matches the prefix, execute that method on the mark.
     * WARNING: It's the user's responsibility to make sure that
     * unexisting methods don't blow this.
     */
    extend: function(mark, prefix) {
        this.chart.extend(mark, prefix);
    },

    /**
     * Sets the size for the panel, 
     * for when the parent panel is undefined
     */
    setSize: function(w, h) {
        this.width = w;
        this.height = h;
    },

    /**
     * Returns the width of the Panel
     */
    getWidth: function() {
        return this.width;
    },

    /**
     * Returns the height of the Panel
     */
    getHeight: function() {
        return this.height;
    },

    /**
     * Returns the underlying protovis Panel.
     * If 'layer' is specified returns
     * the protovis panel for the specified layer name.
     */
    getPvPanel: function(layer) {
        if(!layer){
            return this.pvPanel;
        }

        if(!this._parent){
            throw new Error("Layers are not possible on a root panel.");
        }

        if(!this.pvPanel){
            throw new Error(
               "Cannot access layer panels without having created the main panel.");
        }

        var pvPanel = null;
        if(!this._layers){
            this._layers = {};
        } else {
            pvPanel = this._layers[layer];
        }

        if(!pvPanel){
            pvPanel = this._parent.pvPanel.add(this.type)
                            .extend(this.pvPanel);

            this.initLayerPanel(pvPanel, layer);

            this._layers[layer] = pvPanel;
        }

        return pvPanel;
    },
    
    /**
     * Initializes a new layer panel.
     * @virtual
     */
    initLayerPanel: function(pvPanel, layer){
    },

    /**
     * Returns true if the anchor is one of the values 'top' or
     * 'bottom'.
     */
    isAnchorTopOrBottom: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return anchor === "top" || anchor === "bottom";
    },

    anchorOrtho: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.relativeAnchor[anchor];
    },

    anchorOrthoMirror: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.relativeAnchorMirror[anchor];
    },

    anchorOpposite: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.oppositeAnchor[anchor];
    },

    anchorLength: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.parallelLength[anchor];
    },

    anchorOrthoLength: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.orthogonalLength[anchor];
    },

    isOrientationVertical: function(orientation) {
        return this.chart.isOrientationVertical(orientation);
    },

    isOrientationHorizontal: function(orientation) {
        return this.chart.isOrientationHorizontal(orientation);
    }
}, {
    // Determine what is the associated method to
    // call to position the labels correctly
    relativeAnchor: {
        top: "left",
        bottom: "left",
        left: "bottom",
        right: "bottom"
    },

    relativeAnchorMirror: {
        top: "right",
        bottom: "right",
        left: "top",
        right: "top"
    },

    oppositeAnchor: {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left"
    },

    parallelLength: {
        top: "width",
        bottom: "width",
        right: "height",
        left: "height"
    },

    orthogonalLength: {
        top: "height",
        bottom: "height",
        right: "width",
        left: "width"
    }
});

/*
 * Title panel. Generates the title. Specific options are: <i>title</i> - text.
 * Default: null <i>titlePosition</i> - top / bottom / left / right. Default:
 * top <i>titleSize</i> - The size of the title in pixels. Default: 25
 * 
 * Has the following protovis extension points:
 * 
 * <i>title_</i> - for the title Panel <i>titleLabel_</i> - for the title
 * Label
 */
pvc.TitlePanel = pvc.BasePanel.extend({

    pvLabel: null,
    anchor: "top",
    titlePanel: null,
    title: null,
    titleSize: 25,
    titleAlign: "center",
    font: "14px sans-serif",

//    constructor: function(chart, options) {
//        this.base(chart, options);
//    },

    create: function() {
        // Size will depend on positioning and font size mainly
        var isTopOrBottom = this.isAnchorTopOrBottom();
        if (isTopOrBottom) {
            this.width = this._parent.width;
            this.height = this.titleSize;
        } else {
            this.height = this._parent.height;
            this.width = this.titleSize;
        }

        this.pvPanel = this._parent.getPvPanel().add(this.type).width(
                this.width).height(this.height);

        // Extend title
        this.extend(this.pvPanel, "title_");

        // Label
        var rotationByAnchor = {
            top: 0,
            right: Math.PI / 2,
            bottom: 0,
            left: -Math.PI / 2
        };

        this.pvLabel = this.pvPanel.add(pv.Label).text(this.title).font(
                this.font).textAlign("center").textBaseline("middle").bottom(
                this.height / 2).left(this.width / 2).textAngle(
                rotationByAnchor[this.anchor]);

        // Cases:
        if (this.titleAlign == "center") {
            this.pvLabel.bottom(this.height / 2).left(this.width / 2);
        } else {

            this.pvLabel.textAlign(this.titleAlign);

            if (isTopOrBottom) {
                this.pvLabel.bottom(null).left(null) // reset
                [this.titleAlign](0).bottom(this.height / 2);

            } else if (this.anchor == "right") {
                if (this.titleAlign == "left") {
                    this.pvLabel.bottom(null).top(0);
                } else {
                    this.pvLabel.bottom(0);
                }
            } else if (this.anchor == "left") {
                if (this.titleAlign == "right") {
                    this.pvLabel.bottom(null).top(0);
                } else {
                    this.pvLabel.bottom(0);
                }
            }
        }

        // Extend title label
        this.extend(this.pvLabel, "titleLabel_");
    }
});

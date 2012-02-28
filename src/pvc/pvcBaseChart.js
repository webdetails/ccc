
/**
 * The main chart component
 */
pvc.BaseChart = pvc.Abstract.extend({

    isPreRendered: false,

    /**
     * Indicates if the chart is rendering with animation.
     */
    isAnimating:   false,
    _renderAnimationStart: false,

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

    _renderVersion: 0,
    
    // renderCallback
    renderCallback: undefined,

    constructor: function(options) {

        this.options = pvc.mergeDefaults({}, pvc.BaseChart.defaultOptions, options);
    },

    /**
     * Creates an appropriate DataEngine
     * @virtual
     */
    createDataEngine: function() {
        return new pvc.DataEngine(this);
    },

    /**
     * Processes options after user options and defaults have been merged.
     * Applies restrictions,
     * performs validations and
     * options values implications.
     */
    _processOptions: function(){

        var options = this.options;

        this._processOptionsCore(options);
        
        /* DEBUG options */
        if(pvc.debug && options){
            pvc.log("OPTIONS:\n" + JSON.stringify(options));
        }

        return options;
    },

    /**
     * Processes options after user options and default options have been merged.
     * Override to apply restrictions, perform validation or
     * options values implications.
     * When overriden, the base implementation should be called.
     * The implementation must be idempotent -
     * its successive application should yield the same results.
     * @virtual
     */
    _processOptionsCore: function(options){
        // Disable animation if environment doesn't support it
        if (!$.support.svg || pv.renderer() === 'batik') {
            options.animate = false;
        }

        var margins = options.margins;
        if(margins){
            options.margins = this._parseMargins(margins);
        }
    },
    
    /**
     * Building the visualization has 2 stages:
     * First the preRender method prepares and builds 
     * every object that will be used.
     * Later the render method effectively renders.
     */
    preRender: function() {
        /* Increment render version to allow for cache invalidation  */
        this._renderVersion++;
        this.isPreRendered = false;

        pvc.log("Prerendering in pvc");

        // If we don't have data, we just need to set a "no data" message
        // and go on with life.
        if (!this.allowNoData && this.resultset.length === 0) {
            throw new NoDataException();
        }

        // Now's as good a time as any to completely clear out all
        //  tipsy tooltips
        pvc.removeTipsyLegends();
        
        /* Options may be changed between renders */
        this._processOptions();

        // Initialize the data engine and its translator
        this.initDataEngine();

        // Create color schemes
        this.colors = pvc.createColorScheme(this.options.colors);
        this.secondAxisColor = pvc.createColorScheme(this.options.secondAxisColor);

        // Initialize chart panels
        this.initBasePanel();

        this.initTitlePanel();

        this.initLegendPanel();

        // ------------

        this.isPreRendered = true;
    },

    /**
     * Initializes the data engine
     */
    initDataEngine: function() {
        var de = this.dataEngine;
        if(!de){
            de = this.dataEngine = this.createDataEngine();
        }
//        else {
//            //de.clearDataCache();
//        }

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
        
        var margins = this.options.margins;
        if(margins){
            this.basePanel.setMargins(margins);
        }
        
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
            this._renderAnimationStart = 
            this.isAnimating = this.options.animate && !bypassAnimation;
            
            if (!this.isPreRendered || rebuild) {
                this.preRender();
            }

            if (this.options.renderCallback) {
                this.options.renderCallback.call(this);
            }

            // When animating, renders the animation's 'start' point
            this.basePanel.getPvPanel().render();

            // Transition to the animation's 'end' point
            if (this.isAnimating) {
                this._renderAnimationStart = false;
                
                var me = this;
                this.basePanel.getPvPanel()
                        .transition()
                        .duration(2000)
                        .ease("cubic-in-out")
                        .start(function(){
                            me.isAnimating = false;
                            me._onRenderEnd(true);
                        });
            } else {
                this._onRenderEnd(false);
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
     * Animation
     */
    animate: function(start, end) {
        return this._renderAnimationStart ? start : end;
    },
    
    /**
     * Called when a render has ended.
     * When the render performed an animation
     * and the 'animated' argument will have the value 'true'.
     *
     * The default implementation calls the base panel's
     * #_onRenderEnd method.
     * @virtual
     */
    _onRenderEnd: function(animated){
        this.basePanel._onRenderEnd(animated);
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
        if(pvc.debug){
            pvc.log("Applying Extension Points for: '" + prefix +
                    "'" + (mark ? "" : "(target mark does not exist)"));
        }

        if (mark) {
            var points = this.options.extensionPoints;
            if(points){
                for (var p in points) {
                    // Starts with
                    if(p.indexOf(prefix) === 0){
                        var m = p.substring(prefix.length);

                        // Not everything that is passed to 'mark' argument
                        //  is actually a mark...(ex: scales)
                        // Not locked and
                        // Not intercepted and
                        if(mark.isLocked && mark.isLocked(m)){
                            pvc.log("* " + m + ": locked extension point!");
                        } else if(mark.isIntercepted && mark.isIntercepted(m)) {
                            pvc.log("* " + m + ":" + JSON.stringify(v) + " (controlled)");
                        } else {
                            var v = points[p];

                            if(pvc.debug){
                                pvc.log("* " + m + ": " + JSON.stringify(v));
                            }

                            // Distinguish between mark methods and properties
                            if (typeof mark[m] === "function") {
                                mark[m](v);
                            } else {
                                mark[m] = v;
                            }
                        }
                    }
                }
            }
        }
    },

    /**
     * Obtains the specified extension point.
     * Arguments are concatenated with '_'.
     */
    _getExtension: function(extPoint) {
        var points = this.options.extensionPoints;
        if(!points){
            return undefined; // ~warning
        }

        extPoint = pvc.arraySlice.call(arguments).join('_');
        return points[extPoint];
    },

    isOrientationVertical: function(orientation) {
        return (orientation || this.options.orientation) === "vertical";
    },

    isOrientationHorizontal: function(orientation) {
        return (orientation || this.options.orientation) == "horizontal";
    },

    /**
     * Converts a css-like shorthand margin string
     * to a margins object.
     *
     * <ol>
     *   <li> "1" - {all: 1}</li>
     *   <li> "1 2" - {top: 1, left: 2, right: 2, bottom: 1}</li>
     *   <li> "1 2 3" - {top: 1, left: 2, right: 2, bottom: 3}</li>
     *   <li> "1 2 3 4" - {top: 1, right: 2, bottom: 3, left: 4}</li>
     * </ol>
     */
    _parseMargins: function(margins){
        if(margins != null){
            if(typeof margins === 'string'){

                var comps = margins.split(/\s+/);
                switch(comps.length){
                    case 1:
                        margins = {all: comps[0]};
                        break;
                    case 2:
                        margins = {top: comps[0], left: comps[1], right: comps[1], bottom: comps[0]};
                        break;
                    case 3:
                        margins = {top: comps[0], left: comps[1], right: comps[1], bottom: comps[2]};
                        break;
                    case 4:
                        margins = {top: comps[0], right: comps[2], bottom: comps[3], left: comps[4]};
                        break;

                    default:
                        pvc.log("Invalid 'margins' option value: " + JSON.stringify(margins));
                        margins = null;
                }
            } else if (typeof margins === 'number') {
                margins = {all: margins};
            } else if (typeof margins !== 'object') {
                pvc.log("Invalid 'margins' option value: " + JSON.stringify(margins));
                margins = null;
            }
        }

        return margins;
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

        tooltipFormat: function(s, c, v, datum) {
            return s + ", " + c + ":  " + this.chart.options.valueFormat(v) +
                   (datum && datum.percent ? ( " (" + datum.percent.label + ")") : "");
        },

        valueFormat: function(d) {
            return pv.Format.number().fractionDigits(0, 2).format(d);
            // pv.Format.number().fractionDigits(0, 10).parse(d));
        },

        stacked: false,
        
        percentageNormalized: false,

        percentValueFormat: function(d){
            return pv.Format.number().fractionDigits(0, 2).format(d) + "%";
        },

        clickable:  false,
        selectable: false,

        clickAction: function(s, c, v) {
            pvc.log("You clicked on series " + s + ", category " + c + ", value " + v);
        },

        renderCallback: undefined,

        margins: undefined
    }
});
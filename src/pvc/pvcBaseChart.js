
/**
 * The main chart component
 */
pvc.BaseChart = pvc.Abstract.extend({

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
        if(pvc.debug && options && typeof(JSON.stringify) !== 'undefined'){
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
            //this.isAnimating = false;
            
            if (!this.isPreRendered || rebuild) {
                this.preRender();
            }

            if (this.options.renderCallback) {
                this.options.renderCallback.call(this);
            }

            this.basePanel.getPvPanel().render();

            // Perform animation
            if (!bypassAnimation && this.options.animate) {
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

    /**
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

        renderCallback: undefined
    }
});
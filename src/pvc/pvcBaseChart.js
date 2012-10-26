/**
 * The main chart component
 */
def
.type('pvc.BaseChart', pvc.Abstract)
.init(function(options) {
    var parent = this.parent = def.get(options, 'parent') || null;
    
    this._initialOptions = options;
    
    /* DEBUG options */
    if(pvc.debug >= 3 && !parent && options){
        try {
            pvc.log("INITIAL OPTIONS:\n" + pvc.stringify(options));
        } catch(ex) {
            /* SWALLOW usually a circular JSON structure */
        }
    }
    
    if(parent) {
        // options != null
        this.root = parent.root;
        
        this.left = options.left;
        this.top  = options.top;
    } else {
        this.root = this;
    }

    this._constructData(options);
    this._constructVisualRoles(options);
    
    this.options = def.mixin({}, this.defaults, options);
})
.add({
    /**
     * Indicates if the chart has been disposed.
     */
    _disposed: false,
    
    /**
     * The chart's parent chart.
     * 
     * <p>
     * The root chart has null as the value of its parent property.
     * </p>
     * 
     * @type pvc.BaseChart
     */
    parent: null,
    
    /**
     * The chart's root chart.
     * 
     * <p>
     * The root chart has itself as the value of the root property.
     * </p>
     * 
     * @type pvc.BaseChart
     */
    root: null,

    /**
     * Indicates if the chart has been pre-rendered.
     * <p>
     * This field is set to <tt>false</tt>
     * at the beginning of the {@link #_preRender} method
     * and set to <tt>true</tt> at the end.
     * </p>
     * <p>
     * When a chart is re-rendered it can, 
     * optionally, also repeat the pre-render phase. 
     * </p>
     * 
     * @type boolean
     */
    isPreRendered: false,

    /**
     * The version value of the current/last creation.
     * 
     * <p>
     * This value is changed on each pre-render of the chart.
     * It can be useful to invalidate cached information that 
     * is only valid for each creation.
     * </p>
     * <p>
     * Version values can be compared using the identity operator <tt>===</tt>.
     * </p>
     * 
     * @type any
     */
    _createVersion: 0,
    
    /**
     * A callback function that is called 
     * when the protovis' panel render is about to start.
     * 
     * <p>
     * Note that this is <i>after</i> the pre-render phase.
     * </p>
     * 
     * <p>
     * The callback is called with no arguments, 
     * but having the chart instance as its context (<tt>this</tt> value). 
     * </p>
     * 
     * @function
     */
    renderCallback: undefined,

    /**
     * Contains the number of pages that a multi-chart contains
     * when rendered with the previous render options.
     * <p>
     * This property is updated after a render of a chart
     * where the visual role "multiChart" is assigned and
     * the option "multiChartPageIndex" has been specified. 
     * </p>
     * 
     * @type number|null
     */
    multiChartPageCount: null,
    
    /**
     * Contains the currently rendered multi-chart page index, 
     * relative to the previous render options.
     * <p>
     * This property is updated after a render of a chart
     * where the visual role "multiChart" is assigned and
     * the <i>option</i> "multiChartPageIndex" has been specified. 
     * </p>
     * 
     * @type number|null
     */
    multiChartPageIndex: null,
    
    /**
     * The options object specified by the user,
     * before any processing.
     */
    _initialOptions: null,
    
    compatVersion: function(options){
        return (options || this.options).compatVersion;
    },
    
    /**
     * Building the visualization is made in 2 stages:
     * First, the {@link #_preRender} method prepares and builds 
     * every object that will be used.
     * 
     * Later the {@link #render} method effectively renders.
     */
    _preRender: function(keyArgs) {
        this._preRenderPhase1(keyArgs);
        this._preRenderPhase2(keyArgs);
    },
    
    _preRenderPhase1: function(keyArgs) {
        var options = this.options;
        
        /* Increment pre-render version to allow for cache invalidation  */
        this._createVersion++;
        
        this.isPreRendered = false;

        if(pvc.debug >= 3){
            pvc.log("Prerendering chart");
        }
        
        /* Any data exists or throws */
        this._checkNoData();
        
        if (!this.parent) {
            // Now's as good a time as any to completely clear out all
            //  tipsy tooltips
            pvc.removeTipsyLegends();
        }
        
        /* Options may be changed between renders */
        this._processOptions();
        
        /* Initialize root visual roles */
        if(!this.parent && this._createVersion === 1) {
            this._initVisualRoles();
            this._bindVisualRolesPre();
        }
        
        /* Initialize the data (and _bindVisualRoles) */
        this._initData(keyArgs);

        var hasMultiRole = this._isRoleAssigned('multiChart');
        
        /* Initialize plots */
        this._initPlots(hasMultiRole);
        
        /* Initialize axes */
        this.axes = {};
        this.axesList = [];
        this.axesByType = {};
        
        this._initAxes(hasMultiRole);
        this._bindAxes(hasMultiRole);
        
        /* Trends and Interpolatation */
        if(this.parent || !hasMultiRole){
            this._generateTrends(hasMultiRole);
            
            this._interpolate(hasMultiRole);
        }
        
        /* Set axes scales */
        this._setAxesScales(hasMultiRole);
    },
    
    _preRenderPhase2: function(keyArgs){
        var hasMultiRole = this._isRoleAssigned('multiChart');
        
        /* Initialize chart panels */
        this._initChartPanels(hasMultiRole);
        
        this.isPreRendered = true;
    },

    // --------------
    
    /**
     * Processes options after user options and defaults have been merged.
     * Applies restrictions,
     * performs validations and
     * options values implications.
     */
    _processOptions: function(){

        var options = this.options;
        
        this._processOptionsCore(options);
        
        this._processExtensionPoints();
        
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
        if(!this.parent){
            if (!$.support.svg || pv.renderer() === 'batik') {
                options.animate = false;
            }
            
            if(options.showTooltips){
                var ts = options.tipsySettings;
                if(ts){
                    this.extend(ts, "tooltip");
                }
            }
        }
    },
    
    // --------------
    
    /**
     * Render the visualization.
     * If not pre-rendered, do it now.
     */
    render: function(bypassAnimation, recreate, reloadData){
        this.useTextMeasureCache(function(){
            try{
                if (!this.isPreRendered || recreate) {
                    this._preRender({reloadData: reloadData});
                } else if(!this.parent && this.isPreRendered) {
                    pvc.removeTipsyLegends();
                }
    
                this.basePanel.render({
                    bypassAnimation: bypassAnimation, 
                    recreate: recreate
                 });
                
            } catch (e) {
                /*global NoDataException:true*/
                if (e instanceof NoDataException) {
                    if(pvc.debug > 1){
                        pvc.log("No data found.");
                    }
    
                    this._addErrorPanelMessage("No data found", true);
                } else {
                    // We don't know how to handle this
                    pvc.logError(e.message);
                    
                    if(pvc.debug > 0){
                        this._addErrorPanelMessage("Error: " + e.message, false);
                    }
                    //throw e;
                }
            }
        });
        
        return this;
    },

    _addErrorPanelMessage: function(text, isNoData){
        var options = this.options,
            pvPanel = new pv.Panel()
                        .canvas(options.canvas)
                        .width(options.width)
                        .height(options.height),
            pvMsg = pvPanel.anchor("center").add(pv.Label)
                        .text(text);

        if(isNoData){
            this.extend(pvMsg, "noDataMessage");
        }
        
        pvPanel.render();
    },
    
    useTextMeasureCache: function(fun, ctx){
        var root = this.root;
        var textMeasureCache = root._textMeasureCache || 
                               (root._textMeasureCache = pvc.text.createCache());
        
        return pvc.text.useCache(textMeasureCache, fun, ctx || this);
    },
    
    /**
     * Animation
     */
    animate: function(start, end) {
        return this.basePanel.animate(start, end);
    },
    
    /**
     * Indicates if the chart is currently 
     * rendering the animation start phase.
     * <p>
     * Prefer using this function instead of {@link #animate} 
     * whenever its <tt>start</tt> or <tt>end</tt> arguments
     * involve a non-trivial calculation. 
     * </p>
     * 
     * @type boolean
     */
    isAnimatingStart: function() {
        return this.basePanel.isAnimatingStart();
    },
    
    isOrientationVertical: function(orientation) {
        return (orientation || this.options.orientation) === pvc.orientation.vertical;
    },

    isOrientationHorizontal: function(orientation) {
        return (orientation || this.options.orientation) === pvc.orientation.horizontal;
    },
    
    /**
     * Disposes the chart, any of its panels and child charts.
     */
    dispose: function(){
        if(!this._disposed){
            
            // TODO: 
            
            this._disposed = true;
        }
    },
    
    defaults: {
//        canvas: null,

        width:  400,
        height: 300,

//      margins:  undefined,
//      paddings: undefined,
//      contentMargins:  undefined,
//      contentPaddings: undefined,
        
//      multiChartMax: undefined,
//      multiChartColumnsMax: undefined,
//      multiChartSingleRowFillsHeight: undefined,
//      multiChartSingleColFillsHeight: undefined,
        
//      smallWidth:       undefined,
//      smallHeight:      undefined,
//      smallAspectRatio: undefined,
//      smallMargins:     undefined,
//      smallPaddings:    undefined,
        
//      smallContentMargins:  undefined,
//      smallContentPaddings: undefined,
//      smallTitlePosition: undefined,
//      smallTitleAlign:    undefined,
//      smallTitleAlignTo:  undefined,
//      smallTitleOffset:   undefined,
//      smallTitleKeepInBounds: undefined,
//      smallTitleSize:     undefined,
//      smallTitleSizeMax:  undefined,
//      smallTitleMargins:  undefined,
//      smallTitlePaddings: undefined,
//      smallTitleFont:     undefined,
        
        orientation: 'vertical',
        
//        extensionPoints:   undefined,
//        
//        visualRoles:       undefined,
//        dimensions:        undefined,
//        dimensionGroups:   undefined,
//        calculations:      undefined,
//        readers:           undefined,
        
        ignoreNulls:       true, // whether to ignore or keep "null"-measure datums upon loading
        crosstabMode:      true,
//        multiChartIndexes: undefined,
        isMultiValued:     false,
        seriesInRows:      false,
        groupedLabelSep:   undefined,
//        measuresIndexes:   undefined,
//        dataOptions:       undefined,
//        
//        timeSeries:        undefined,
//        timeSeriesFormat:  undefined,

        animate: true,

//        title:         null,
        
        titlePosition: "top", // options: bottom || left || right
        titleAlign:    "center", // left / right / center
//        titleAlignTo:  undefined,
//        titleOffset:   undefined,
//        titleKeepInBounds: undefined,
//        titleSize:     undefined,
//        titleSizeMax:  undefined,
//        titleMargins:  undefined,
//        titlePaddings: undefined,
//        titleFont:     undefined,
        
        legend:           false, // Show Legends
        legendPosition:   "bottom",
//        legendFont:       undefined,
//        legendSize:       undefined,
//        legendSizeMax:    undefined,
//        legendAlign:      undefined,
//        legendAlignTo:    undefined,
//        legendOffset:     undefined,
//        legendKeepInBounds:   undefined,
//        legendMargins:    undefined,
//        legendPaddings:   undefined,
//        legendTextMargin: undefined,
//        legendItemPadding:    undefined, // ATTENTION: this is different from legendPaddings
//        legendMarkerSize: undefined,
        
//        colors: null,

        plot2: false,
//      plot2Series
        
//      secondAxis: false, // deprecated
        secondAxisIdx: -1, // deprecated
//      secondAxisColor //deprecated

        showTooltips: true,
//      tooltipFormat: undefined,
        
        v1StyleTooltipFormat: function(s, c, v, datum) {
            return s + ", " + c + ":  " + this.chart.options.valueFormat(v) +
                   (datum && datum.percent ? ( " (" + datum.percent.label + ")") : "");
        },
        
        tipsySettings: {
            gravity:    "s",
            delayIn:     200,
            delayOut:    80, // smoother moving between marks with tooltips, possibly slightly separated
            offset:      2,
            opacity:     0.8,
            html:        true,
            fade:        false, // fade out
            corners:     false,
            followMouse: false
        },
        
        valueFormat: def.scope(function(){
            var pvFormat = pv.Format.number().fractionDigits(0, 2);
            
            return function(d) {
                return pvFormat.format(d);
                // pv.Format.number().fractionDigits(0, 10).parse(d));
            };
        }),
        
        /* For numeric values in percentage */
        percentValueFormat: def.scope(function(){
            var pvFormat = pv.Format.number().fractionDigits(0, 1);
            
            return function(d){
                return pvFormat.format(d * 100) + "%";
            };
        }),
        
        // Content/Plot area clicking
        clickable:  false,
//        clickAction: null,
//        doubleClickAction: null,
        doubleClickMaxDelay: 300, //ms
//      
        hoverable:  false,
        selectable: false,
        
//        selectionChangedAction: null,
//        userSelectionAction: null, 
            
        // Use CTRL key to make fine-grained selections
        ctrlSelectMode: true,
        clearSelectionMode: 'emptySpaceClick', // or null <=> 'manual' (i.e., by code)
        
//        renderCallback: undefined,

        compatVersion: Infinity // numeric, 1 currently recognized
    }
});


/**
 * The main chart component
 */
def
.type('pvc.BaseChart', pvc.Abstract)
.init(function(options) {
    var originalOptions = options;
    
    var parent = this.parent = def.get(options, 'parent') || null;
    if(parent){
        /*jshint expr:true */
        options || def.fail.argumentRequired('options');
    } else {
        options = def.mixin.copy({}, this.defaults, options);
    }

    this.options = options;

    if(parent) {
        this.root = parent.root;
        this.smallColIndex = options.smallColIndex; // required for the logId msk, setup in base
        this.smallRowIndex = options.smallRowIndex;

        this._tooltipEnabled = parent._tooltipEnabled;
        this._tooltipOptions = parent._tooltipOptions;
    } else {
        this.root = this;
    }
    
    this.base();
    
    if(pvc.debug >= 3){
        this._info("NEW CHART\n" + pvc.logSeparator.replace(/-/g, '=') + 
                "\n  DebugLevel: " + pvc.debug);
    }
    
    /* DEBUG options */
    if(pvc.debug >= 3 && !parent && originalOptions){
        this._info("OPTIONS:\n", originalOptions);
        if(pvc.debug >= 5){
            // Log also as text, for easy copy paste of options JSON
            this._trace(pvc.stringify(options, {ownOnly: false, funs: true}));
        }
    }
    
    if(parent){
         parent._addChild(this);
    }

    this._constructData(options);
    this._constructVisualRoles(options);
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
     * The chart's child charts.
     * 
     * @type pvc.BaseChart[]
     */
    children: null,
    
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
    
    left: 0,
    top:  0,
    
    width: null,
    height: null,
    margins:  null,
    paddings: null,
    
    _allowV1SecondAxis: false, 
        
    //------------------
    compatVersion: function(options){
        return (options || this.options).compatVersion;
    },
    
    _createLogInstanceId: function(){
        return "" + 
            this.constructor + this._createLogChildSuffix();
    },
    
    _createLogChildSuffix: function(){
        return this.parent ? 
               (" (" + (this.smallRowIndex + 1) + "," + 
                       (this.smallColIndex + 1) + ")") : 
               "";
    },
    
    _addChild: function(childChart){
        /*jshint expr:true */
        (childChart.parent === this) || def.assert("Not a child of this chart.");
        
        this.children.push(childChart);
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
        /* Increment pre-render version to allow for cache invalidation  */
        this._createVersion++;
        
        this.isPreRendered = false;
        
        if(pvc.debug >= 3){
            this._log("Prerendering");
        }
        
        this.children = [];
        
        if (!this.parent) {
            // Now's as good a time as any to completely clear out all
            //  tipsy tooltips
            pvc.removeTipsyLegends();
        }
        
        /* Options may be changed between renders */
        this._processOptions();
        
        /* Any data exists or throws
         * (must be done AFTER processing options
         *  because of width, height properties and noData extension point...) 
         */
        this._checkNoDataI();
        
        /* Initialize root visual roles */
        if(!this.parent && this._createVersion === 1) {
            this._initVisualRoles();
            
            this._bindVisualRolesPreI();
            
            this._complexTypeProj = this._createComplexTypeProject();
            
            this._bindVisualRolesPreII();
        }
        
        /* Initialize the data (and _bindVisualRolesPost) */
        this._initData(keyArgs);

        /* When data is excluded, there may be no data after all */
        this._checkNoDataII();
        
        var hasMultiRole = this._isRoleAssigned('multiChart');
        
        /* Initialize plots */
        this._initPlots(hasMultiRole);
        
        /* Initialize axes */
        this._initAxes(hasMultiRole);
        this._bindAxes(hasMultiRole);
        
        /* Trends and Interpolation */
        if(this.parent || !hasMultiRole){
            // Interpolated data affects generated trends
            this._interpolate(hasMultiRole);
            
            this._generateTrends(hasMultiRole);
        }
        
        /* Set axes scales */
        this._setAxesScales(hasMultiRole);
    },
    
    _preRenderPhase2: function(/*keyArgs*/){
        var hasMultiRole = this._isRoleAssigned('multiChart');
        
        /* Initialize chart panels */
        this._initChartPanels(hasMultiRole);
        
        this.isPreRendered = true;
    },

    // --------------
    
    _setSmallLayout: function(keyArgs){
        if(keyArgs){
            var basePanel = this.basePanel;
            
            if(this._setProp('left', keyArgs) | this._setProp('top', keyArgs)){
                if(basePanel) {
                    def.set(
                       basePanel.position,
                       'left', this.left, 
                       'top',  this.top);
                }
            }
            
            if(this._setProp('width', keyArgs) | this._setProp('height', keyArgs)){
                if(basePanel){
                    basePanel.size = new pvc.Size (this.width, this.height);
                }
            }
            
            if(this._setProp('margins', keyArgs) && basePanel){
                basePanel.margins = new pvc.Sides(this.margins);
            }
            
            if(this._setProp('paddings', keyArgs) && basePanel){
                basePanel.paddings = new pvc.Sides(this.paddings);
            }
        }
    },
    
    _setProp: function(p, keyArgs){
        var v = keyArgs[p];
        if(v != null){
            this[p] = v;
            return true;
        }
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
        if(!this.parent){
            this.width    = options.width; 
            this.height   = options.height;
            this.margins  = options.margins;
            this.paddings = options.paddings;
        }
        
        if(this.compatVersion() <= 1){
            options.plot2 = this._allowV1SecondAxis && !!options.secondAxis;
        }
        
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
            
            this._processTooltipOptions(options);
        }
    },
    
    _tooltipDefaults: {
        gravity:     's',
        delayIn:      200,
        delayOut:     80, // smoother moving between marks with tooltips, possibly slightly separated
        offset:       2,
        opacity:      0.9,
        html:         true,
        fade:         true,
        useCorners:   false,
        arrowVisible: true,
        followMouse:  false,
        format:       undefined
    },
    
    _processTooltipOptions: function(options){
        var isV1Compat = this.compatVersion() <= 1;
        
        var tipOptions = options.tooltip;
        var tipEnabled = options.tooltipEnabled;
        if(tipEnabled == null){
            if(tipOptions){
                tipEnabled = tipOptions.enabled;
            }
            
            if(tipEnabled == null){
                if(isV1Compat){
                    tipEnabled = options.showTooltips;
                }
                
                if(tipEnabled == null){
                    tipEnabled = true;
                }
            }
        }
        
        if(tipEnabled){
            if(!tipOptions){
                tipOptions = {};
            }
            
            if(isV1Compat){
                this._importV1TooltipOptions(tipOptions, options);
            }
            
            def.eachOwn(this._tooltipDefaults, function(dv, p){
                var value = options['tooltip' + def.firstUpperCase(p)];
                if(value !== undefined){
                    tipOptions[p] = value;
                } else if(tipOptions[p] === undefined){
                    tipOptions[p] = dv;
                }
            });
        } else {
            tipOptions = {};
        }
        
        this._tooltipEnabled = tipEnabled;
        this._tooltipOptions = tipOptions;
    },
    
    _importV1TooltipOptions: function(tipOptions, options){
        var v1TipOptions = options.tipsySettings;
        if(v1TipOptions){
            this.extend(v1TipOptions, "tooltip");
            
            for(var p in v1TipOptions){
                if(tipOptions[p] === undefined){
                    tipOptions[p] = v1TipOptions[p];
                }
            }
            
            // Force V1 html default
            if(tipOptions.html == null){
                tipOptions.html = false;
            }
        }
    },
    
    // --------------
    
    /**
     * Render the visualization.
     * If not pre-rendered, do it now.
     */
    render: function(bypassAnimation, recreate, reloadData){
        var hasError;
        
        /*global console:true*/
        if(pvc.debug > 1){
            pvc.group("CCC RENDER");
        }
        
        // Don't let selection change events to fire before the render is finished
        this._suspendSelectionUpdate();
        try{
            this.useTextMeasureCache(function(){
                try{
                    if (!this.isPreRendered || recreate){
                        this._preRender({reloadData: reloadData});
                    } else if(!this.parent && this.isPreRendered){
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
                            this._log("No data found.");
                        }
        
                        this._addErrorPanelMessage("No data found", true);
                    } else {
                        hasError = true;
                        
                        // We don't know how to handle this
                        pvc.logError(e.message);
                        
                        if(pvc.debug > 0){
                            this._addErrorPanelMessage("Error: " + e.message, false);
                        }
                        //throw e;
                    }
                }
            });
        } finally {
            if(!hasError){
                this._resumeSelectionUpdate();
            }
            
            if(pvc.debug > 1){
                pvc.groupEnd();
            }
        }
        
        return this;
    },

    _addErrorPanelMessage: function(text, isNoData){
        var options = this.options,
            pvPanel = new pv.Panel()
                        .canvas(options.canvas)
                        .width(this.width)
                        .height(this.height),
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
                               (root._textMeasureCache = pv.Text.createCache());
        
        return pv.Text.usingCache(textMeasureCache, fun, ctx || this);
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
//      leafContentOverflow: 'auto',
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
//        dataSeparator
//        dataMeasuresInColumns
//        dataCategoriesCount
        
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

        v1StyleTooltipFormat: function(s, c, v, datum) {
            return s + ", " + c + ":  " + this.chart.options.valueFormat(v) +
                   (datum && datum.percent ? ( " (" + datum.percent.label + ")") : "");
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
        
        selectable:    false,
        selectionMode: 'rubberband', // focuswindow, // single (click-only) // custom (by code only)
        //selectionCountMax: 0, // <= 0 -> no limit
        
//        selectionChangedAction: null,
//        userSelectionAction: null, 
            
        // Use CTRL key to make fine-grained selections
        ctrlSelectMode: true,
        clearSelectionMode: 'emptySpaceClick', // or null <=> 'manual' (i.e., by code)
        
//        renderCallback: undefined,

        compatVersion: Infinity // numeric, 1 currently recognized
    }
});


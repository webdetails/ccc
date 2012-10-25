
/**
 * MetricPointAbstract is the base class of metric dot and line.
 */
pvc.MetricPointAbstract = pvc.MetricXYAbstract.extend({

    constructor: function(options){

        this.base(options);

        var parent = this.parent;
        if(parent) {
            this._colorRole = parent._colorRole;
            this._sizeRole = parent._sizeRole;
        }
    },
    
    /**
     * @override 
     */
    _processOptionsCore: function(options){
        this.base(options);
        
        if(options.nullColor){
            options.nullColor = pv.color(options.nullColor);
        }
    },
    
    _initPlotsCore: function(){
        var options = this.options;
        
        this._createPointPlot();
        
        var trend = options.trendType;
        if(trend && trend !== 'none'){
            // Trend Plot
            new pvc.visual.MetricPointPlot(this, {
                name: 'trend',
                fixed: {
                    DataPart: 'trend',
                    TrendType: 'none',
                    NullInterpolatioMode: 'none',
                    SizeRole: null,
                    SizeAxis: null
                },
                defaults: {
                    LinesVisible: true,
                    DotsVisible:  true
                }
            });
        }
    },
    
    //_createPointPlot: function(){},
    
    _hasDataPartRole: function(){
        return true;
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRoles({
            color: {
                isMeasure: true,
                //requireSingleDimension: true, // TODO: generalize this...
                //requireIsDiscrete: false,
                //valueType: Number,
                defaultDimensionName: 'color'
            },
            size: {
                isMeasure: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: 'size'
            }
        });

        this._colorRole = this.visualRoles('color');
        this._sizeRole  = this.visualRoles('size' );
    },
    
    _getTranslationClass: function(translOptions){
        return def
            .type(this.base(translOptions))
            .add(pvc.data.MetricPointChartTranslationOper);
    },
    
    _initData: function(keyArgs){
        
        this.base(keyArgs);

        // Cached
        var sizeGrouping = this._sizeRole.grouping;
        if(sizeGrouping){
            this._sizeDim = this.data.dimensions(sizeGrouping.firstDimensionName());
        }

        /* Change the legend source role */
        if(!this.parent){
            var colorGrouping = this._colorRole.grouping;
            if(colorGrouping) {
                if(colorGrouping.isDiscrete()){
                    // role is bound and discrete => change legend source
                    this.legendSource = 'color';
                } else {
                    /* The "color legend" has no use
                     * but to, possibly, show/hide "series",
                     * if any
                     */
                    this.options.legend = false;
                }
            }
        }
    },
    
    _collectPlotAxesDataCells: function(plot, dataCellsByAxisTypeThenIndex){
        
        this.base(plot, dataCellsByAxisTypeThenIndex);
        
        /* NOTE: Cartesian axes are created even when hasMultiRole && !parent
         * because it is needed to read axis options in the root chart.
         * Also binding occurs to be able to know its scale type. 
         * Yet, their scales are not setup at the root level.
         */
        
        /* Configure Base Axis Data Cell */
        if(plot.type === 'scatter' && plot.option('DotsVisible')){
            
            var sizeRoleName = plot.option('SizeRole');
            if(sizeRoleName){
                var sizeRole = this.visualRoles(sizeRoleName);
                if(sizeRole.isBound()){
                    var sizeDataCellsByAxisIndex = 
                        def
                        .array
                        .lazy(dataCellsByAxisTypeThenIndex, 'size');
                    
                    def
                    .array
                    .lazy(sizeDataCellsByAxisIndex, plot.option('SizeAxis') - 1)
                    .push({
                        plot:          plot,
                        role:          this.visualRoles(plot.option('SizeRole')),
                        dataPartValue: plot.option('DataPart')
                    });
                }
            }
        }
    },
    
    _setAxesScales: function(hasMultiRole){
        
        this.base(hasMultiRole);
        
        if(!hasMultiRole || this.parent){
            
            var sizeAxis = this.axes.size;
            if(sizeAxis && sizeAxis.isBound()){
                this._createAxisScale(sizeAxis);
            }
        }
    },
    
     /**
      * @override 
      */
    _createMainContentPanel: function(parentPanel, baseOptions){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in MetricPoint");
        }
        
        // TODO: integrate these options in the MetricPointPlot or in the SizeAxis?
        var options = this.options;
        var panelOptions = def.set(
            Object.create(baseOptions),
            'sizeAxisRatio',        options.sizeAxisRatio,
            'sizeAxisRatioTo',      options.sizeAxisRatioTo,
            'autoPaddingByDotSize', options.autoPaddingByDotSize);
        
        var scatterPlot = this.plots.scatter;
        var scatterChartPanel = 
            this.scatterChartPanel = // V1 property 
            new pvc.MetricPointPanel(this, parentPanel, scatterPlot, panelOptions);

        var trendPlot = this.plots.trend;
        if(trendPlot){
            new pvc.MetricPointPanel(
                this, 
                parentPanel, 
                trendPlot, 
                Object.create(panelOptions));
        }
        
        return scatterChartPanel;
    },
    
    defaults: def.create(pvc.MetricXYAbstract.prototype.defaults, {
        originIsZero: false,
        
        tipsySettings: { offset: 15 },
        
        /* Continuous Color Role */
        // TODO:
        colorScaleType: "linear", // "discrete", "normal" (distribution) or "linear"
        colorRange: ['red', 'yellow','green'],
//        colorRangeInterval:  undefined,
//        minColor:  undefined, //"white",
//        maxColor:  undefined, //"darkgreen",
        nullColor: "#efc5ad"   // white with a shade of orange
         
        /* Size Role */
//      sizeAxisUseAbs:   true,
//      sizeAxisFixedMin: undefined,
//      sizeAxisFixedMax: undefined,
//      sizeAxisOriginIsZero: false,

//      sizeAxisRatio:    undefined,
//      sizeAxisRatioTo:  undefined,
//      autoPaddingByDotSize: undefined
    })
});

/**
 * Metric Dot Chart
 */
pvc.MetricDotChart = pvc.MetricPointAbstract.extend({
    _createPointPlot: function(){
        return new pvc.visual.MetricPointPlot(this, {
            fixed: {DotsVisible: true}
        });
    }
});


/**
 * Metric Line Chart
 */
pvc.MetricLineChart = pvc.MetricPointAbstract.extend({
    _createPointPlot: function(){
        return new pvc.visual.MetricPointPlot(this, {
            fixed: {LinesVisible: true}
        });
    }
});
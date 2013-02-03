
/**
 * MetricPointAbstract is the base class of metric dot and line.
 */
def
.type('pvc.MetricPointAbstract', pvc.MetricXYAbstract)
.init(function(options){

    this.base(options);

    var parent = this.parent;
    if(parent) {
        this._colorRole = parent._colorRole;
        this._sizeRole  = parent._sizeRole;
    }
})
.add({
    _initPlotsCore: function(){
        var pointPlot = this._createPointPlot();
        
        var trend = pointPlot.option('Trend');
        if(trend){
            // Trend Plot
            new pvc.visual.MetricPointPlot(this, {
                name: 'trend',
                fixed: {
                    DataPart: 'trend',
                    TrendType: 'none',
                    NullInterpolatioMode: 'none',
                    ColorRole: 'series', // one trend per series
                    SizeRole:  null,
                    SizeAxis:  null,
                    OrthoAxis:    1
                },
                defaults: {
                    ColorAxis:    2,
                    LinesVisible: true,
                    DotsVisible:  false
                }
            });
        }
    },
    
    //_createPointPlot: function(){},
    
    /* Required because of trends */
    _hasDataPartRole: function(){
        return true;
    },
    
    _getColorRoleSpec: function(){
        return {
            //isMeasure: true, // TODO: not being set as measure when continuous...
            defaultSourceRole: 'series',
            defaultDimension:  'color*',
            dimensionDefaults: {
                valueType: Number
            }
        };
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._sizeRole = this._addVisualRole('size', {
                isMeasure: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                defaultDimension: 'size',
                dimensionDefaults: {
                    valueType: Number
                }
            });
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
    _createPlotPanels: function(parentPanel, baseOptions){
        // TODO: integrate these options in the MetricPointPlot or in the SizeAxis?
        var options = this.options;
        var panelOptions = def.set(
            Object.create(baseOptions),
            'sizeAxisRatio',        options.sizeAxisRatio,
            'sizeAxisRatioTo',      options.sizeAxisRatioTo,
            'autoPaddingByDotSize', options.autoPaddingByDotSize);
        
        var scatterPlot = this.plots.scatter;
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
    },
    
    defaults: {
        axisOriginIsZero: false,
        
        tooltipOffset: 10
        
        /* Continuous Color Role */
        // TODO:
        //colorScaleType: "linear", // "discrete", "normal" (distribution) or "linear"
        //colors: ['red', 'yellow','green'],
        //colorDomain:  undefined,
        //colorMin:  undefined, //"white",
        //colorMax:  undefined, //"darkgreen",
        //colorNull: "#efc5ad"   // white with a shade of orange
         
        /* Size Role */
//      sizeAxisUseAbs:   true,
//      sizeAxisFixedMin: undefined,
//      sizeAxisFixedMax: undefined,
//      sizeAxisOriginIsZero: false,

//      sizeAxisRatio:    undefined,
//      sizeAxisRatioTo:  undefined,
//      autoPaddingByDotSize: undefined
    }
});

/**
 * Metric Dot Chart
 */
def
.type('pvc.MetricDotChart', pvc.MetricPointAbstract)
.add({
    _createPointPlot: function(){
        return new pvc.visual.MetricPointPlot(this, {
            fixed: {DotsVisible: true}
        });
    }
});


/**
 * Metric Line Chart
 */
def
.type('pvc.MetricLineChart', pvc.MetricPointAbstract)
.add({
    _createPointPlot: function(){
        return new pvc.visual.MetricPointPlot(this, {
            fixed: {LinesVisible: true}
        });
    }
});
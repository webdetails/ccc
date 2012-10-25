
/**
 * PointAbstract is the class that will be extended by
 * dot, line, stacked-line and area charts.
 */
pvc.PointAbstract = pvc.CategoricalAbstract.extend({
    
    _processOptionsCore: function(options){
        // Has no meaning in this chart type
        options.panelSizeRatio = 1;
        
        this.base(options);
    },
    
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
            /* value: required, continuous, numeric */
            value: { 
                isMeasure: true, 
                isRequired: true, 
                isPercent: this.options.stacked,
                requireSingleDimension: true, 
                requireIsDiscrete: false, 
                valueType: Number, 
                defaultDimensionName: 'value' 
            }
        });
    },
    
    _initPlotsCore: function(hasMultiRole){
        var options = this.options;
        
        this._createPointPlot();
        
        // secondAxis V1 compatibility
        if(options.plot2 || options.secondAxis){
            // Line Plot
            new pvc.visual.PointPlot(this, {
                name: 'plot2',
                fixed: {
                    DataPart: '1'
                },
                defaults: {
                    ColorAxis:    2,
                    LinesVisible: true,
                    DotsVisible:  true
                }});
        }
        
        var trend = options.trendType;
        if(trend && trend !== 'none'){
            // Trend Plot
            new pvc.visual.PointPlot(this, {
                name: 'trend',
                fixed: {
                    DataPart: 'trend',
                    TrendType: 'none',
                    NullInterpolatioMode: 'none'
                },
                defaults: {
                    LinesVisible: true,
                    DotsVisible:  true
                }
            });
        }
    },
    
    //_createPointPlot: function(){},
    
    /* @override */
    _createMainContentPanel: function(parentPanel, baseOptions){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in PointAbstract");
        }
        
        var options = this.options;
        var axes    = this.axes;
        var plots   = this.plots;
        
        var pointPlot = plots.point;
        var pointPanel = 
            this.scatterChartPanel = 
            new pvc.PointPanel(
                this, 
                parentPanel, 
                pointPlot, 
                Object.create(baseOptions));
        
        var plot2Plot = plots.plot2;
        if(plot2Plot){
            if(pvc.debug >= 3){
                pvc.log("Creating second Point panel.");
            }
            
            new pvc.PointPanel(
                    this, 
                    parentPanel, 
                    plot2Plot,
                    Object.create(baseOptions));
        }
        
        var trendPlot = plots.trend;
        if(trendPlot){
            if(pvc.debug >= 3){
                pvc.log("Creating Trends Point panel.");
            }
            
            new pvc.PointPanel(
                    this, 
                    parentPanel, 
                    trendPlot,
                    Object.create(baseOptions));
        }
        
        return pointPanel;
    },
    
    defaults: def.create(pvc.CategoricalAbstract.prototype.defaults, {
        // TODO: Set this way, setting, "axisOffset: 0" has no effect...
        orthoAxisOffset: 0.04,
        baseAxisOffset:  0.01, // TODO: should depend on being discrete or continuous base
        
        tipsySettings: { offset: 15 }
    })
});

/**
 * Dot Chart
 */
pvc.DotChart = pvc.PointAbstract.extend({
    _createPointPlot: function(){
        return new pvc.visual.PointPlot(this, {
            fixed: {DotsVisible: true}
        });
    }
});

/**
 * Line Chart
 */
pvc.LineChart = pvc.PointAbstract.extend({
    _createPointPlot: function(){
        return new pvc.visual.PointPlot(this, {
            fixed: {LinesVisible: true}
        });
    }
});

/**
 * Area Chart
 */
pvc.AreaChart = pvc.PointAbstract.extend({
    _createPointPlot: function(){
        return new pvc.visual.PointPlot(this, {
            fixed:    {AreasVisible: true},
            defaults: {LinesVisible: true}
        });
    }
});

/**
 * Stacked Line Chart
 */
pvc.StackedLineChart = 
pvc.mStackedLineChart = // V1 compatibility    
pvc.PointAbstract.extend({
    _createPointPlot: function(){
        return new pvc.visual.PointPlot(this, {
            fixed:    {LinesVisible: true, Stacked: true}
        });
    }
});

/**
 * Stacked Area Chart
 */
pvc.StackedAreaChart =
pvc.mStackedAreaChart = // V1 compatibility
pvc.PointAbstract.extend({
    _createPointPlot: function(){
        return new pvc.visual.PointPlot(this, {
            fixed:    {AreasVisible: true, Stacked: true},
            defaults: {LinesVisible: true}
        });
    }
});

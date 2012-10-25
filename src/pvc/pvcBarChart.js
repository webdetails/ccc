
/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */
def
.type('pvc.BarChart', pvc.BarAbstract)
.add({
    
    _initPlotsCore: function(hasMultiRole){
        var options = this.options;
        
        new pvc.visual.BarPlot(this);
        
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
    
    _hasDataPartRole: function(){
        return true;
    },
    
    /**
     * @override 
     */
    _createMainContentPanel: function(parentPanel, baseOptions){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in barChart");
        }
        
        var options = this.options;
        var plots = this.plots;
        
        var barPlot = plots.bar;
        var barPanel = new pvc.BarPanel(
                this, 
                parentPanel, 
                barPlot, 
                Object.create(baseOptions));

        // legacy field
        this.barChartPanel = barPanel;
        
        var plot2Plot = plots.plot2;
        if(plot2Plot){
            if(pvc.debug >= 3){
                pvc.log("Creating Point panel.");
            }
            
            var pointPanel = new pvc.PointPanel(
                    this, 
                    parentPanel, 
                    plot2Plot,
                    Object.create(baseOptions));
            
            // Legacy fields
            barPanel.pvSecondLine = pointPanel.pvLine;
            barPanel.pvSecondDot  = pointPanel.pvDot;
            
            pointPanel._applyV1BarSecondExtensions = true;
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
        
        return barPanel;
    }
});

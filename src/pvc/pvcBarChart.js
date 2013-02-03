
/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */
def
.type('pvc.BarChart', pvc.BarAbstract)
.add({

    _allowV1SecondAxis: true, 
    
    _initPlotsCore: function(hasMultiRole){
        var options = this.options;
        
        var barPlot = new pvc.visual.BarPlot(this);
        var trend   = barPlot.option('Trend');
        
        if(options.plot2){
            // Line Plot
            var plot2Plot = new pvc.visual.PointPlot(this, {
                name: 'plot2',
                fixed: {
                    DataPart: '1'
                },
                defaults: {
                    ColorAxis:    2,
                    LinesVisible: true,
                    DotsVisible:  true
                }});
            
            if(!trend){
                trend = plot2Plot.option('Trend');
            }
        }
        
        if(trend){
            // Trend Plot
            new pvc.visual.PointPlot(this, {
                name: 'trend',
                fixed: {
                    DataPart: 'trend',
                    TrendType: 'none',
                    ColorRole: 'series', // one trend per series
                    NullInterpolatioMode: 'none'
                },
                defaults: {
                    ColorAxis:    2,
                    LinesVisible: true,
                    DotsVisible:  false
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
    _createPlotPanels: function(parentPanel, baseOptions){
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
                this._log("Creating Point panel.");
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
                this._log("Creating Trends Point panel.");
            }
            
            new pvc.PointPanel(
                    this, 
                    parentPanel, 
                    trendPlot,
                    Object.create(baseOptions));
        }
    }
});

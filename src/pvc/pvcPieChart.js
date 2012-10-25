
/**
 * PieChart is the main class for generating... pie charts (surprise!).
 */
pvc.PieChart = pvc.BaseChart.extend({

    pieChartPanel: null,
    
    legendSource: 'category',

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRoles({
            category: { 
                isRequired: true, 
                defaultDimensionName: 'category*', 
                autoCreateDimension: true 
            },
            
            /* value: required, continuous, numeric */
            value:  { 
                isMeasure:  true,
                isRequired: true,
                isPercent:  true,
                requireSingleDimension: true, 
                requireIsDiscrete: false,
                valueType: Number, 
                defaultDimensionName: 'value' 
            }
        });
    },
    
    _initPlotsCore: function(hasMultiRole){
        new pvc.visual.PiePlot(this);
    },
    
    _preRenderContent: function(contentOptions) {

        this.base();

        if(pvc.debug >= 3){
            pvc.log("Prerendering in pieChart");
        }
        
        var piePlot = this.plots.pie;
        
        this.pieChartPanel = new pvc.PieChartPanel(this, this.basePanel, piePlot, def.create(contentOptions, {
            scenes: def.getPath(this.options, 'pie.scenes')
        }));
    }
});

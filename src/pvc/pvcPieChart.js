
/**
 * PieChart is the main class for generating... pie charts (surprise!).
 */
def
.type('pvc.PieChart', pvc.BaseChart)
.add({

    pieChartPanel: null,

    _getColorRoleSpec: function(){
        return { isRequired: true, defaultSourceRole: 'category', defaultDimension: 'color*', requireIsDiscrete: true };
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRole('category', { 
                isRequired: true, 
                defaultDimension: 'category*', 
                autoCreateDimension: true 
            });
            
        this._addVisualRole('value', { 
                isMeasure:  true,
                isRequired: true,
                isPercent:  true,
                requireSingleDimension: true, 
                requireIsDiscrete: false,
                valueType: Number, 
                defaultDimension: 'value' 
            });
    },
    
    _initPlotsCore: function(hasMultiRole){
        new pvc.visual.PiePlot(this);
    },
    
    _preRenderContent: function(contentOptions) {

        this.base();
        
        var isV1Compat = this.compatVersion() <= 1;
        if(isV1Compat){
            var innerGap = pvc.castNumber(this.options.innerGap) || 0.95;
            innerGap = def.between(innerGap, 0.1, 1);
            contentOptions.paddings = ((1 - innerGap) * 100 / 2).toFixed(2) + "%";
        } else if(contentOptions.paddings == null) {
            contentOptions.paddings = new pvc.PercentValue(0.025);
        }
        
        var piePlot = this.plots.pie;
        this.pieChartPanel = new pvc.PieChartPanel(this, this.basePanel, piePlot, def.create(contentOptions, {
            scenes: def.getPath(this.options, 'pie.scenes')
        }));
    }
});

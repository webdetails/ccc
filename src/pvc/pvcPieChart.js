
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
            category: { isRequired: true, defaultDimensionName: 'category*', autoCreateDimension: true },
            
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
    
    _preRenderContent: function(contentOptions) {

        this.base();

        if(pvc.debug >= 3){
            pvc.log("Prerendering in pieChart");
        }
        
        var options = this.options;
        
        this.pieChartPanel = new pvc.PieChartPanel(this, this.basePanel, def.create(contentOptions, {
            innerGap: options.innerGap,
            explodedOffsetRadius: options.explodedSliceRadius,
            explodedSliceIndex: options.explodedSliceIndex,
            activeOffsetRadius: options.activeSliceRadius,
            showValues:  options.showValues,
            valuesMask:  options.valuesMask,
            labelStyle:  options.valuesLabelStyle,
            linkedLabel: options.linkedLabel,
            labelFont:   options.valuesLabelFont,
            scenes:      def.getPath(options, 'pie.scenes')
        }));
    },
    
    defaults: def.create(pvc.BaseChart.prototype.defaults, {
//      showValues: undefined,
//      innerGap: undefined,
//      
//      explodedSliceRadius: undefined,
//      explodedSliceIndex: undefined,
//      activeSliceRadius: undefined,
//      
//      valuesMask: undefined, // example: "{value} ({value.percent})"
//      pie: undefined, // pie options object
//      
//      valuesLabelFont:  undefined,
//      valuesLabelStyle: undefined,
//      
//      linkedLabel: undefined
//      
//      // tipsySettings: def.create(pvc.BaseChart.defaultOptions.tipsySettings, { offset: 15, gravity: 'se' })
    })
});

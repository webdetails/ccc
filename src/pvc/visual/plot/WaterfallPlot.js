def.scope(function(){

    /**
     * Initializes a waterfall plot.
     * 
     * @name pvc.visual.WaterfallPlot
     * @class Represents a waterfall plot.
     * @extends pvc.visual.BarPlotAbstract
     */
    def
    .type('pvc.visual.WaterfallPlot', pvc.visual.BarPlotAbstract)
    .add({
        type: 'water',
        _getOptionsDefinition: function(){
            return pvc.visual.WaterfallPlot.optionsDef;
        }
    });
    
    pvc.visual.WaterfallPlot.optionsDef = def.create(
        pvc.visual.BarPlotAbstract.optionsDef, 
        {
            Stacked: { // override
                resolve: null, 
                value:   true
            },
            
            WaterLineLabel: {
                resolve: '_resolveNormal',
                cast:    String,
                value:   "Accumulated"
            },
            
            WaterValuesVisible: {
                // Values Visible?
                resolve: pvc.options.resolvers([
                             '_resolveNormal',
                             function(optionInfo){
                                 optionInfo.specify(this.option('ValuesVisible'));
                                 return true;
                             }
                         ]),
                cast:    Boolean
            },
            
            Direction: { // up/down
                resolve: '_resolveNormal',
                cast:    pvc.parseWaterDirection,
                value:   'down'
            },
            
            AreasVisible: {
                resolve: '_resolveNormal',
                cast:    Boolean,
                value:   true
            },
            
            AllCategoryLabel: {
                resolve: '_resolveNormal',
                cast:    String,
                value:   "All"
            }
        });
});
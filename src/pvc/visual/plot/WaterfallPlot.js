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
            
            TotalLineLabel: {
                resolve: '_resolveFull',
                cast:    String,
                value:   "Accumulated"
            },
            
            TotalValuesVisible: { 
                resolve: '_resolveFull',
                data: {
                    // Dynamic default
                    resolveDefault: function(optionInfo){
                        optionInfo.defaultValue(this.option('ValuesVisible'));
                        return true;
                    }
                },
                cast:    Boolean
            },
            
            Direction: { // up/down
                resolve: '_resolveFull',
                cast:    pvc.parseWaterDirection,
                value:   'down'
            },
            
            AreasVisible: {
                resolve: '_resolveFull',
                cast:    Boolean,
                value:   true
            },
            
            AllCategoryLabel: {
                resolve: '_resolveFull',
                cast:    String,
                value:   "All"
            }
        });
});
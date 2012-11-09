def.scope(function(){

    /**
     * Initializes a normalized bar plot.
     * 
     * @name pvc.visual.NormalizedBarPlot
     * @class Represents a normalized bar plot.
     * @extends pvc.visual.BarPlotAbstract
     */
    def
    .type('pvc.visual.NormalizedBarPlot', pvc.visual.BarPlotAbstract)
    .add({
        type: 'bar',
        _getOptionsDefinition: function(){
            return pvc.visual.NormalizedBarPlot.optionsDef;
        }
    });
    
    pvc.visual.NormalizedBarPlot.optionsDef = def.create(
        pvc.visual.BarPlotAbstract.optionsDef, 
        {
            Stacked: {
                resolve: null, 
                value: true
            }
        });
});
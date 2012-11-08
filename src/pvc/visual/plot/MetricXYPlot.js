def.scope(function(){

    /**
     * Initializes an abstract metric XY plot.
     * 
     * @name pvc.visual.MetricXYPlot
     * @class Represents an abstract metric XY plot.
     * @extends pvc.visual.CartesianPlot
     */
    def
    .type('pvc.visual.MetricXYPlot', pvc.visual.CartesianPlot)
    .add({
        _getOptionsDefinition: function(){
            return pvc.visual.MetricXYPlot.optionsDef;
        }
    });
    
    pvc.visual.MetricXYPlot.optionsDef = def.create(
        pvc.visual.CartesianPlot.optionsDef, {
            BaseRole: { // override
                value:   'x'
            },
            
            OrthoAxis: { // override -> value 1
                resolve: null
            },
            
            OrthoRole: {
                value: 'y'
            }
        });
});
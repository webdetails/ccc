def.scope(function(){

    /**
     * Initializes an abstract categorical plot.
     * 
     * @name pvc.visual.CategoricalPlot
     * @class Represents an abstract categorical plot.
     * @extends pvc.visual.CartesianPlot
     */
    def
    .type('pvc.visual.CategoricalPlot', pvc.visual.CartesianPlot)
    .add({
        _getOptionsDefinition: function(){
            return pvc.visual.CategoricalPlot.optionsDef;
        }
    });
    
    pvc.visual.CategoricalPlot.optionsDef = def.create(
        pvc.visual.CartesianPlot.optionsDef, {
        
        Stacked: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   false
        },
        
        BaseRole: {
            value: 'category'
        },
        
        OrthoRole: { // override 
            value: 'value'
        }
    });
});
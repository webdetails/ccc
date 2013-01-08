def.scope(function(){

    /**
     * Initializes a heat grid plot.
     * 
     * @name pvc.visual.HeatGridPlot
     * @class Represents a heat grid plot.
     * @extends pvc.visual.CategoricalPlot
     */
    def
    .type('pvc.visual.HeatGridPlot', pvc.visual.CategoricalPlot)
    .add({
        type: 'heatGrid',
        _getOptionsDefinition: function(){
            return pvc.visual.HeatGridPlot.optionsDef;
        }
    });
    
    pvc.visual.HeatGridPlot.optionsDef = def.create(
        pvc.visual.CategoricalPlot.optionsDef, 
        {
            SizeRole: {
                value: 'size'
            },
            
            SizeAxis: {
                value: 1
            },
            
            UseShapes: {
                resolve: '_resolveFull',
                cast:    Boolean,
                value:   false
            },
            
            Shape: {
                resolve: '_resolveFull',
                cast:    pvc.parseShape,
                value:   'square'
            },
            
            NullShape: {
                resolve: '_resolveFull',
                cast:    pvc.parseShape,
                value:   'cross'
            },
            
            ValuesVisible: { // override
                value: true
            },
            
            OrthoRole: { // override
                value: 'series'
            },
            
            OrthoAxis: { // override
                resolve: null
            },
            
            // Not supported
            NullInterpolationMode: {
                resolve: null,
                value: 'none'
            },
            
            // Not supported
            Stacked: { // override
                resolve: null, 
                value: false
            }
        });
});
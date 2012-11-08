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
            
            ShowValues: { // override
                value: true
            },
            
            NullColor: { // TODO: this is in the color axis already...
                resolve: '_resolveFull',
                cast:    pv.color,
                value:   pv.color("#efc5ad")
            },
            
            MinColor: {
                resolve: '_resolveFull',
                cast:    pv.color
            },
            
            MaxColor: {
                resolve: '_resolveFull',
                cast:    pv.color
            },
            
            // TODO: "discrete", "normal" (distribution) or "linear"
            ColorScaleType: {
                resolve: pvc.options.resolvers([
                     '_resolveFixed',
                     '_resolveNormal',
                     function(optionInfo){
                         var value = this.option('ScalingType');
                         if(value !== undefined){
                             optionInfo.specify(value);
                             return true;
                         }
                     },
                     '_resolveDefault'
                ]),
                cast:    String,
                value:   'linear'
            },
            
            ScalingType: {
                resolve: '_resolveFull',
                cast:    String
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
                value: ' none'
            },
            
            // Not supported
            Stacked: { // override
                resolve: null, 
                value: false
            }
        });
});
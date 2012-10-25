def.scope(function(){
    /**
     * Initializes a point plot.
     * 
     * @name pvc.visual.PointPlot
     * @class Represents a Point plot.
     * @extends pvc.visual.CategoricalPlot
     */
    def
    .type('pvc.visual.PointPlot', pvc.visual.CategoricalPlot)
    .add({
        type: 'point',
        _getOptionsDefinition: function(){
            return pvc.visual.PointPlot.optionsDef;
        }
    });
    
    var specNormalBool = {
            resolve: '_resolveNormal',
            cast:    Boolean
        };
    
    function visibleResolver(type){
        return pvc.options.resolvers([
               '_resolveFixed',
               '_resolveNormal',
               
               // V1 compatibility
               pvc.options.specify(function(){
                   return this.option('Show' + type);
               }),
               
               '_resolveDefault'
           ]);
    }
    
    pvc.visual.PointPlot.optionsDef = def.create(
        pvc.visual.CategoricalPlot.optionsDef, {
            DotsVisible: {
                resolve: visibleResolver('Dots'),
                cast:    Boolean,
                value:   false
            },
            
            LinesVisible: {
                resolve: visibleResolver('Lines'),
                cast:    Boolean,
                value:   false
            },
            
            AreasVisible: {
                resolve: visibleResolver('Areas'),
                cast:    Boolean,
                value:   false
            },
            
            // Deprecated
            ShowDots:  specNormalBool,
            
            // Deprecated
            ShowLines: specNormalBool,
            
            // Deprecated
            ShowAreas: specNormalBool,
            
            ValuesAnchor: { // override
                value: 'right'
            }
        });
});
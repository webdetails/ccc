def.scope(function(){

    /**
     * Initializes a metric XY plot.
     * 
     * @name pvc.visual.MetricPointPlot
     * @class Represents a metric point plot.
     * @extends pvc.visual.MetricXYPlot
     */
    def
    .type('pvc.visual.MetricPointPlot', pvc.visual.MetricXYPlot)
    .add({
        type: 'scatter',
        _getOptionsDefinition: function(){
            return pvc.visual.MetricPointPlot.optionsDef;
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
    
    pvc.visual.MetricPointPlot.optionsDef = def.create(
        pvc.visual.MetricXYPlot.optionsDef, {
            SizeRole: {
                resolve: '_resolveFixed',
                value: 'size'
            },
            
            SizeAxis: {
                resolve: '_resolveFixed',
                value: 1
            },
            
            Shape: {
                resolve: '_resolveFull',
                cast:    pvc.parseShape,
                value:   'circle'
            },
            
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
            
            // Deprecated
            ShowDots:  specNormalBool,
            
            // Deprecated
            ShowLines: specNormalBool,
            
            ValuesAnchor: { // override
                value: 'right'
            }
        });
});
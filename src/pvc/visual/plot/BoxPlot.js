def.scope(function(){

    /**
     * Initializes a box plot.
     * 
     * @name pvc.visual.BoxPlot
     * @class Represents a box plot.
     * @extends pvc.visual.CategoricalPlot
     */
    def
    .type('pvc.visual.BoxPlot', pvc.visual.CategoricalPlot)
    .add({
        type: 'box',
        
        _getOptionsDefinition: function(){
            return pvc.visual.BoxPlot.optionsDef;
        }
    });
    
    pvc.visual.BoxPlot.optionsDef = def.create(
        pvc.visual.CategoricalPlot.optionsDef, 
        {
            // NO Values Label!
            
            Stacked: {
                resolve: null,
                value:   false
            },
            
            OrthoRole: {
                value:   ['median', 'lowerQuartil', 'upperQuartil', 'minimum', 'maximum'] // content of pvc.BoxplotChart.measureRolesNames
            },
            
            BoxSizeRatio: {
                resolve: '_resolveFull',
                cast: function(value){
                    value = pvc.castNumber(value);
                    if(value == null){
                        value = 1;
                    } else if(value < 0.05){
                        value = 0.05;
                    } else if(value > 1){
                        value = 1;
                    }
                    
                    return value;
                },
                value: 1/3
            },
            
            BoxSizeMax: {
                resolve: pvc.options.resolvers([
                    '_resolveFixed',
                    '_resolveNormal',
                    function(optionInfo){
                        var value = this.option('MaxBoxSize');
                        if(value !== undefined){
                            optionInfo.specify(value);
                            return true;
                        }
                    },
                    '_resolveDefault'
                ]),
                cast: function(value){
                    value = pvc.castNumber(value);
                    if(value == null){
                        value = Infinity;
                    } else if(value < 1){
                        value = 1;
                    }
                    
                    return value;
                },
                value: Infinity
            },
            
            // Deprecated
            MaxBoxSize: {
                resolve: '_resolveFull',
                cast:    pvc.castNumber
            }
        });
});
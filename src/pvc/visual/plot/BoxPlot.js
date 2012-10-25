def.scope(function(){

    /**
     * Initializes a box plot.
     * 
     * @name pvc.visual.BoxPlot
     * @class Represents a box plot.
     * @extends pvc.visual.BarPlotAbstract
     */
    def
    .type('pvc.visual.BoxPlot', pvc.visual.BarPlotAbstract)
    .add({
        type: 'box',
        
        _getOptionsDefinition: function(){
            return pvc.visual.BoxPlot.optionsDef;
        }
    });
    
    pvc.visual.BoxPlot.optionsDef = def.create(
        pvc.visual.BarPlotAbstract.optionsDef, 
        {
            Stacked: {
                resolve: null,
                value:   false
            },
            
            OrthoRole: {
                resolve: null,
                value:   ['median', 'lowerQuartil', 'upperQuartil', 'minimum', 'maximum'] // content of pvc.BoxplotChart.measureRolesNames
            },
            
            BoxSizeRatio: {
                resolve: '_resolveFull',
                cast:    pvc.castNumber,
                value:   1/3
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
                cast:    pvc.castNumber,
                value:   Infinity
            },
            
            // Deprecated
            MaxBoxSize: {
                resolve: '_resolveFull',
                cast:    pvc.castNumber
            },
            
            BoxColor: {
                resolve: '_resolveFull',
                cast:    pv.color,
                value:   pv.color('darkgreen')
            }
        });
});
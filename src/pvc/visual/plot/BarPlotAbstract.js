def.scope(function(){

    /**
     * Initializes an abstract bar plot.
     * 
     * @name pvc.visual.BarPlotAbstract
     * @class Represents an abstract bar plot.
     * @extends pvc.visual.CategoricalPlot
     */
    def
    .type('pvc.visual.BarPlotAbstract', pvc.visual.CategoricalPlot)
    .add({
        _getOptionsDefinition: function(){
            return pvc.visual.BarPlotAbstract.optionsDef;
        }
    });
    
    pvc.visual.BarPlotAbstract.optionsDef = def.create(
        pvc.visual.CategoricalPlot.optionsDef, {
        
        BarSizeRatio: { // for grouped bars
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
            value: 0.9
        },
        
        BarSizeMax: {
            resolve: pvc.options.resolvers([
                         '_resolveFixed',
                         '_resolveNormal',
                         function(optionInfo){
                             // default to v1 option
                             var barSizeMax = this.option('MaxBarSize');
                             if(barSizeMax !== undefined){
                                 optionInfo.specify(barSizeMax);
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
            value: 2000
        },
        
        BarStackedMargin: { // for stacked bars
            resolve: '_resolveFull',
            cast: function(value){
                value = pvc.castNumber(value);
                if(value != null && value < 0){
                    value = 0;
                }
                
                return value;
            },
            value:   0
        },
        
        // Deprecated
        MaxBarSize: {
            resolve: '_resolveFull',
            cast:    pvc.castNumber
        },
        
        OverflowMarkersVisible: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   true
        },
        
        ValuesAnchor: { // override default value only
            value: 'center'
        }
        
        /* TODO valuesMask...  showValuePercentage
        ValuePercentage: {
            value: false
        }
        */
    });
});
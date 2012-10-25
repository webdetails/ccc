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
            cast:    pvc.castNumber,
            value:   0.9
        },
        
        BarSizeMax: {
            resolve: pvc.options.resolvers([
                         '_resolveFixed',
                         '_resolveNormal',
                         function(optionInfo){
                             // default to v1 option
                             var barSizeMax = this.option('MaxBarSize');
                             if(barSizeMax !== undefined){
                                 this.specify(barSizeMax);
                                 return true;
                             }
                         },
                         '_resolveDefault'
                     ]),
            cast:    pvc.castNumber,
            value:   2000
        },
        
        BarStackedMargin: { // for stacked bars
            resolve: '_resolveFull',
            cast:    pvc.castNumber,
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
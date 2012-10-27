def.scope(function(){

    /**
     * Initializes an abstract cartesian plot.
     * 
     * @name pvc.visual.CartesianPlot
     * @class Represents an abstract cartesian plot.
     * @extends pvc.visual.Plot
     */
    def
    .type('pvc.visual.CartesianPlot', pvc.visual.Plot)
    .add({
        _getOptionsDefinition: function(){
            return pvc.visual.CartesianPlot.optionsDef;
        }
    });
    
    pvc.visual.CartesianPlot.optionsDef = def.create(
        pvc.visual.Plot.optionsDef, {
            BaseAxis: {
                value: 1
            },
            
            BaseRole: {
                resolve: '_resolveFixed',
                cast:    String
            },
            
            OrthoAxis: {
                resolve: pvc.options.resolvers([
                    function(optionInfo){
                        if(this.globalIndex === 0){
                            // plot0 must use ortho axis 0!
                            // This also ensures that the ortho axis 0 is created...
                            optionInfo.specify(1);
                            return true;
                        }
                        
                        // V1 compatibility
                        if(this.name === 'plot2' && this._chartOption('secondAxisIndependentScale')){
                            optionInfo.specify(2);
                            return true;
                        }
                    },
                    '_resolveFixed',
                    '_resolveNormal',
                    '_resolveDefault'
                ]),
                cast:  function(value){
                    value = pvc.castNumber(value);
                    if(value != null){
                        value = def.between(value, 1, 10);
                    } else {
                        value = 1;
                    }
                    
                    return value;
                },
                value: 1
            },
            
            OrthoRole: {
                resolve: '_resolveFull'
                // String or string array
            },
            
            TrendType: {
                resolve: '_resolveFull',
                cast:    pvc.parseTrendType,
                value:   'none'
            },
            
            NullInterpolationMode: {
                resolve: '_resolveFull',
                cast:    pvc.parseNullInterpolationMode,
                value:   'none' 
            }
        });
});
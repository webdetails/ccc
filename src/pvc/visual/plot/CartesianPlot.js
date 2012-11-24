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
    
    function castTrend(trend){
        // The trend plot itself does not have trends...
        if(this.name === 'trend'){
            return null;
        }
        
        var type = this.option('TrendType');
        if(!type && trend){
            type = trend.type;
        }
        
        if(!type || type === 'none'){
            return null;
        }
        
        if(!trend){
            trend = {};
        } else {
            trend = Object.create(trend);
        }
        
        trend.type = type;
       
        var label = this.option('TrendLabel');
        if(label !== undefined){
            trend.label = label;
        }
        
        return trend;
    }
    
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
                resolve: function(optionInfo){
                    if(this.globalIndex === 0){
                        // plot0 must use ortho axis 0!
                        // This also ensures that the ortho axis 0 is created...
                        optionInfo.specify(1);
                        return true;
                    }
                    
                    return this._resolveFull(optionInfo);
                },
                data: {
                    resolveV1: function(optionInfo){
                        if(this.name === 'plot2' &&
                            this.chart._allowV1SecondAxis &&
                            this._chartOption('secondAxisIndependentScale')){
                             optionInfo.specify(2);
                        }
                        return true;
                    }
                },
                cast: function(value){
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
                resolve: pvc.options.resolvers([
                      '_resolveFixed',
                      '_resolveDefault'
                    ])
                // String or string array
            },
            
            Trend: {
                resolve: '_resolveFull',
                data: {
                    resolveDefault: function(optionInfo){
                        var type = this.option('TrendType');
                        if(type){
                            // Cast handles the rest
                            optionInfo.defaultValue({
                                type: type
                            });
                            return true;
                        }
                    }
                },
                cast: castTrend
            },
            
            TrendType: {
                resolve: '_resolveFull',
                cast:    pvc.parseTrendType
                //value:   'none'
            },
            
            TrendLabel: {
                resolve: '_resolveFull',
                cast:    String
            },
            
            NullInterpolationMode: {
                resolve: '_resolveFull',
                cast:    pvc.parseNullInterpolationMode,
                value:   'none' 
            }
        });
});
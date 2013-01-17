def.scope(function(){

    /**
     * Initializes a plot.
     * 
     * @name pvc.visual.Plot
     * @class Represents a plot.
     * @extends pvc.visual.OptionsBase
     */
    def
    .type('pvc.visual.Plot', pvc.visual.OptionsBase)
    .init(function(chart, keyArgs){
        // Peek plot type-index
        var typePlots = def.getPath(chart, ['plotsByType', this.type]);
        var index = typePlots ? typePlots.length : 0;
        
        // Elements of the first plot (of any type)
        // can be accessed without prefix.
        // Peek chart's plotList (globalIndex is only set afterwards in addPlot)
        var globalIndex = chart.plotList.length;
        keyArgs = def.set(keyArgs, 'byNaked', !globalIndex);
        
        this.base(chart, this.type, index, keyArgs);
        
        // fills globalIndex
        chart._addPlot(this);
        
        // -------------
        
        // Last prefix has more precedence.
        
        // The plot id is always a valid prefix (type+index)
        var prefixes = this.extensionPrefixes = [this.id];
        
        if(!this.globalIndex){
            // Elements of the first plot (of any type)
            // can be accessed without prefix
            prefixes.push('');
        }
        
        // The plot name, if any is always a valid prefix (name)
        if(this.name){
            prefixes.push(this.name);
        }
    })
    .add({
        // Override
        _getOptionsDefinition: function(){
            return pvc.visual.Plot.optionsDef;
        },
        
        // Override
        _resolveByNaked: pvc.options.specify(function(optionInfo){
            if(!this.globalIndex){
                return this._chartOption(def.firstLowerCase(optionInfo.name));
            }
        })
    });
    
    pvc.visual.Plot.optionsDef = {
        // Box model options?
            
        Orientation: {
            resolve: function(optionInfo){
                optionInfo.specify(this._chartOption('orientation') || 'vertical');
                return true;
            },
            cast: String
        },
        
        ValuesVisible: {
            resolve: '_resolveFull',
            data: {
                resolveV1: function(optionInfo){
                    if(this.globalIndex === 0){
                        var show = this._chartOption('showValues');
                        if(show !== undefined){
                            optionInfo.specify(show);
                        } else {
                            show = this.type !== 'point';
                            optionInfo.defaultValue(show);
                        }
                        
                        return true;
                    }
                }
            },
            cast:  Boolean,
            value: false
        },
        
        ValuesAnchor: {
            resolve: '_resolveFull',
            cast:    pvc.parseAnchor
        },
        
        ValuesFont: {
            resolve: '_resolveFull',
            cast:    String,
            value:   '10px sans-serif'
        },
        
        // Each plot type must provide an appropriate default mask
        // depending on its scene variable names
        ValuesMask: {
            resolve: '_resolveFull',
            cast:    String,
            value:   "{value}"
        },
        
        DataPart: {
            resolve: '_resolveFixed',
            cast: String,
            value:   '0'
        },
        
        // ---------------
        
        ColorRole: {
            resolve: '_resolveFixed',
            cast:    String,
            value:   'color'
        },
        
        ColorAxis: {
            resolve: pvc.options.resolvers([
                function(optionInfo){
                    if(this.globalIndex === 0){
                        // plot0 must use color axis 0!
                        // This also ensures that the color axis 0 is created...
                        optionInfo.specify(1);
                        return true;
                    }
                },
                '_resolveFull'
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
        }
    };
});
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
        
        this.base(chart, this.type, index, keyArgs);
        
        // fills globalIndex
        chart._addPlot(this);
        
        // -------------
        
        this.option = pvc.options(this._getOptionsDefinition(), this);
        
        var fixed = def.get(keyArgs, 'fixed');
        if(fixed){
            this._fixed = fixed;
        }
        
        var defaults = def.get(keyArgs, 'defaults');
        if(defaults){
            this._defaults = defaults;
        }
        
        // -------------
        
        // Last prefix has more precedence.
        
        // The plot id is always a valid prefix (type+index)
        var prefixes = this.extensionPrefixes = [this.id];
        
        if(this.globalIndex === 0){
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
            resolve: pvc.options.resolvers([
                 '_resolveFixed',
                 '_resolveNormal',
                 function(optionInfo){
                     // V1 ?
                     var show = this.option('ShowValues');
                     if(show !== undefined){
                         optionInfo.specify(show);
                     } else {
                         show = this.chart.compatVersion <= 1 && (this.type !== 'point');
                         optionInfo.defaultValue(show);
                     }
                     
                     return true;
                 }
              ]),
            cast: Boolean
        },
        
        // Deprecated
        ShowValues: {
            resolve: '_resolveFull',
            cast:    Boolean
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
                '_resolveFixed',
                '_resolveNormal',
                function(optionInfo){
                    // Trends must have its own color scale
                    // cause otherwise each trend series
                    // would have exactly the same color as the corresponding
                    // non-trended series; the only distinction between
                    // the two sets of points is its data part (and the values...).
                    // Specifically the currently user color scale key 
                    // (the value of the series or the category role)
                    // is the same. Same value => same color.
                    if(this.name === 'trend'){
                        optionInfo.defaultValue(3);
                        return true;
                    }
                },
                '_resolveDefault'
            ]),
            cast:  function(value){
                value = pvc.castNumber(value);
                if(value != null){
                    value = def.between(value, 1, 3);
                } else {
                    value = 1;
                }
                
                return value;
            },
            value: 1
        },
        
        ColorRole: {
            resolve: pvc.options.resolvers([
                '_resolveFixed',
                '_resolveNormal',
                function(optionInfo){
                    optionInfo.specify(this.chart.legendSource);
                },
                '_resolveDefault'
            ]),
            cast: String
        }
    };
});
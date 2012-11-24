
/**
 * Initializes a chart object with options.
 * 
 * @name pvc.visual.OptionsBase
 * 
 * @class Represents a chart object that has options.
 * 
 * @property {pvc.BaseChart} chart The associated chart.
 * @property {string} type The type of object.
 * @property {number} index The index of the object within its type (0, 1, 2...).
 * @property {string} [name] The name of the object.
 * 
 * @constructor
 * @param {pvc.BaseChart} chart The associated chart.
 * @param {string} type The type of the object.
 * @param {number} [index=0] The index of the object within its type.
 * @param {object} [keyArgs] Keyword arguments.
 * @param {string} [keyArgs.name] The name of the object.
 */
def
.type('pvc.visual.OptionsBase')
.init(function(chart, type, index, keyArgs){
    this.chart = chart;
    this.type  = type;
    this.index = index == null ? 0 : index;
    this.name  = def.get(keyArgs, 'name');
    this.id    = this._buildId();
    this.optionId = this._buildOptionId();
    
    var rs = this._resolvers = [];
    
    this._registerResolversFull(rs, keyArgs);
    
    this.option = pvc.options(this._getOptionsDefinition(), this);
})
.add(/** @lends pvc.visual.OptionsBase# */{
    
    _buildId: function(){
        return pvc.buildIndexedId(this.type, this.index);
    },
    
    _buildOptionId: function(){
        return this.id;
    },
        
    _getOptionsDefinition: def.method({isAbstract: true}),
    
    _chartOption: function(name) {
        return this.chart.options[name];
    },
    
    _registerResolversFull: function(rs, keyArgs){
        // I - By Fixed values
        var fixed = def.get(keyArgs, 'fixed');
        if(fixed){
            this._fixed = fixed;
            rs.push(
                pvc.options.specify(function(optionInfo){
                    return fixed[optionInfo.name];
                }));
        }
        
        this._registerResolversNormal(rs, keyArgs);
        
        // VI - By Default Values
        var defaults = def.get(keyArgs, 'defaults');
        if(defaults){
            this._defaults = defaults;
        }
        
        rs.push(this._resolveDefault);
    },
    
    _registerResolversNormal: function(rs, keyArgs){
        // II - By V1 Only Logic
        if(this.chart.compatVersion() <= 1){
            rs.push(this._resolveByV1OnlyLogic);
        }
        
        // III - By Name (ex: plot2, trend)
        if(this.name){
            rs.push(
                pvc.options.specify(function(optionInfo){
                      return this._chartOption(this.name + def.firstUpperCase(optionInfo.name));
                }));
        }
        
        // IV - By OptionId
        rs.push(this._resolveByOptionId);
        
        // V - By Naked Id
        if(def.get(keyArgs, 'byNaked', !this.index)){
            rs.push(this._resolveByNaked);
        }
    },
    
    // -------------
    
    _resolveFull: function(optionInfo){
        var rs = this._resolvers;
        for(var i = 0, L = rs.length ; i < L ; i++){
            if(rs[i].call(this, optionInfo)){
                return true;
            }
        }
        return false;
    },
    
    _resolveFixed: pvc.options.specify(function(optionInfo){
        if(this._fixed){
            return this._fixed[optionInfo.name];
        }
    }),
    
    _resolveByV1OnlyLogic: function(optionInfo){
        var data = optionInfo.data;
        var resolverV1;
        if(data && (resolverV1 = data.resolveV1)){
            return resolverV1.call(this, optionInfo);
        }
    },
    
    _resolveByName: pvc.options.specify(function(optionInfo){
        if(this.name){ 
            return this._chartOption(this.name + def.firstUpperCase(optionInfo.name));
        }
    }),
    
    _resolveByOptionId: pvc.options.specify(function(optionInfo){
        return this._chartOption(this.optionId + def.firstUpperCase(optionInfo.name));
    }),
    
    _resolveByNaked: pvc.options.specify(function(optionInfo){
        // The first of the type receives options without any prefix.
        if(!this.index){
            return this._chartOption(def.firstLowerCase(optionInfo.name));
        }
    }),
    
    _resolveDefault: function(optionInfo){
        // Dynamic default value?
        var data = optionInfo.data;
        var resolverDefault;
        if(data && (resolverDefault = data.resolveDefault)){
            if(resolverDefault.call(this, optionInfo)){
                return true;
            }
        }
        
        if(this._defaults){
            var value = this._defaults[optionInfo.name];
            if(value !== undefined){
                optionInfo.defaultValue(value);
                return true;
            }
        }
    },
    
    _specifyChartOption: function(optionInfo, asName){
        var value = this._chartOption(asName);
        if(value != null){
            optionInfo.specify(value);
            return true;
        }
    }
});


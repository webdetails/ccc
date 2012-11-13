
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
    
    var fixed = def.get(keyArgs, 'fixed');
    if(fixed){
        this._fixed = fixed;
    }
    
    var defaults = def.get(keyArgs, 'defaults');
    if(defaults){
        this._defaults = defaults;
    }
    
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
    
    _resolveFull: function(optionInfo){
        return this._resolveFixed  (optionInfo) || 
               this._resolveNormal (optionInfo) ||
               this._resolveDefault(optionInfo)
               ;
    },
    
    _resolveNormal: function(optionInfo){
        return this._resolveByName    (optionInfo) ||
               this._resolveByOptionId(optionInfo) ||
               this._resolveByNaked   (optionInfo)
               ;
    },
    
    _resolveFixed: pvc.options.specify(function(optionInfo){
        if(this._fixed){
            return this._fixed[optionInfo.name];
        }
    }),
    
    _resolveByOptionId: pvc.options.specify(function(optionInfo){
        return this._chartOption(this.optionId + def.firstUpperCase(optionInfo.name));
    }),
    
    _resolveByName: pvc.options.specify(function(optionInfo){
        if(this.name){ 
            return this._chartOption(this.name + def.firstUpperCase(optionInfo.name));
        }
    }),
    
    _resolveByNaked: pvc.options.specify(function(optionInfo){
        // The first of the type receives options without any prefix.
        if(!this.index){
            return this._chartOption(def.firstLowerCase(optionInfo.name));
        }
    }),
    
    _resolveDefault: pvc.options.defaultValue(function(optionInfo){
        if(this._defaults){
            return this._defaults[optionInfo.name];
        }
    }),
    
    _specifyChartOption: function(optionInfo, asName){
        var value = this._chartOption(asName);
        if(value != null){
            optionInfo.specify(value);
            return true;
        }
    }
});


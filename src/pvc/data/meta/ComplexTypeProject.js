/**
 * Initializes a complex type project.
 * 
 * @name pvc.data.ComplexType
 * 
 * @class A complex type project is a work in progress set of dimension specifications.
 */
def.type('pvc.data.ComplexTypeProject')
.init(
function(dimGroupSpecs){
    this._dims = {};
    this._dimList = [];
    this._dimGroupsDims = {};
    this._dimGroupSpecs = dimGroupSpecs || {};
    
    this._calcList = [];
})
.add(/** @lends pvc.data.ComplexTypeProject# */{
    _ensureDim: function(name){
        /*jshint expr:true*/
        name || def.fail.argumentInvalid('name', "Invalid dimension name '{0}'.", [name]);
        
        var info = def.getOwn(this._dims, name);
        if(!info){
            info = this._dims[name] = this._createDim(name);
            
            this._dimList.push(info);
            
            var groupDimsNames = def.array.lazy(this._dimGroupsDims, info.groupName);
            // TODO: this sorting is lexicographic but should be numeric
            def.array.insert(groupDimsNames, name, def.compare);
        }
        
        return info;
    },
    
    hasDim: function(name){
        return def.hasOwn(this._dims, name);
    },
    
    setDim: function(name, spec){
        var _ = this._ensureDim(name).spec;
        if(spec){
            def.copy(_, spec);
        }
        
        return this;
    },
    
    setDimDefaults: function(name, spec){
        def.setUDefaults(this._ensureDim(name).spec, spec);
        return this;
    },
    
    _createDim: function(name, spec){
        var dimGroupName = pvc.data.DimensionType.dimensionGroupName(name);
        var dimGroupSpec = this._dimGroupSpecs[dimGroupName];
        if(dimGroupSpec) {
            spec = def.create(dimGroupSpec, spec /* Can be null */); 
        }
        return {
            name: name,
            groupName: dimGroupName,
            spec: spec || {}
        };
    },
    
    readDim: function(name){
        var info = this._ensureDim(name);
        if(info.isRead){
            throw def.error.operationInvalid("Dimension '{0}' already is the target of a reader.", [name]);
        }
        if(info.isCalc){
            throw def.error.operationInvalid("Dimension '{0}' is being calculated, so it cannot be the target of a reader.", [name]);
        }
        
        info.isRead = true;
    },
    
    calcDim: function(name){
        var info = this._ensureDim(name);
        if(info.isCalc){
            throw def.error.operationInvalid("Dimension '{0}' already is being calculated.", [name]);
        }
        if(info.isRead){
            throw def.error.operationInvalid("Dimension '{0}' is the target of a reader, so it cannot be calculated.", [name]);
        }
        
        info.isCalc = true;
    },
    
    isReadOrCalc: function(name){
        if(name){
            var info = def.getOwn(this._dims, name);
            if(info){
                return info.isRead || info.isCalc;
            }
        }
        
        return false;
    },
    
    groupDimensionsNames: function(groupDimName){
        return this._dimGroupsDims[groupDimName];
    },
    
    setCalc: function(calcSpec){
        /*jshint expr:true */
        calcSpec || def.fail.argumentRequired('calculations[i]');
        calcSpec.calculation || def.fail.argumentRequired('calculations[i].calculation');
        
        var dimNames = calcSpec.names;
        if(typeof dimNames === 'string'){
            dimNames = dimNames.split(/\s*\,\s*/);
        } else {
            dimNames = def.array.as(dimNames);
        }
        
        if(dimNames && dimNames.length){
            dimNames.forEach(this.calcDim, this);
        }
        
        this._calcList.push(calcSpec);
    },
    
    configureComplexType: function(complexType, translOptions){
        //var keyArgs = {assertExists: false};
        
        this._dimList.forEach(function(dimInfo){
            var dimName = dimInfo.name;
            //if(!complexType.dimensions(dimName, keyArgs)){
            var spec = dimInfo.spec;
            
            spec = pvc.data.DimensionType.extendSpec(dimName, spec, translOptions);
            
            complexType.addDimension(dimName, spec);
            //} // TODO: else assert has not changed?
        });
        
        this._calcList.forEach(function(calcSpec){
            complexType.addCalculation(calcSpec);
        });
    }
});
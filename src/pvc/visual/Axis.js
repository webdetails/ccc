// Sharing this globally allows other axes sub types to inherit
//  their own options defs from this one.
// A ccc-wide closure can hide this from global scope.
var axis_optionsDef;

def.scope(function(){

/**
 * Initializes an axis.
 * 
 * @name pvc.visual.Axis
 * 
 * @class Represents an axis for a role in a chart.
 * 
 * @property {pvc.BaseChart} chart The associated chart.
 * @property {string} type The type of the axis.
 * @property {number} index The index of the axis within its type (0, 1, 2...).
 * @property {pvc.visual.Role} role The associated visual role.
 * @property {pv.Scale} scale The associated scale.
 * 
 * @constructor
 * @param {pvc.BaseChart} chart The associated cartesian chart.
 * @param {string} type The type of the axis.
 * @param {number} [index=0] The index of the axis within its type.
 * @param {object} [keyArgs] Keyword arguments.
 */
def
.type('pvc.visual.Axis')
.init(function(chart, type, index, keyArgs){
    this.chart = chart;
    this.type  = type;
    this.index = index == null ? 0 : index;
    this.id = pvc.visual.Axis.getId(type, this.index);
    this.option = pvc.options(this._getOptionsDefinition(), this);
})
.add(/** @lends pvc.visual.Axis# */{
    isVisible: true,
    
    /**
     * Binds the axis to a set of data cells.
     * @param {object|object[]} dataCells The associated data cells.
     * @type pvc.visual.Axis
     */
    bind: function(dataCells){
        /*jshint expr:true */
        dataCells || def.fail.argumentRequired('dataCells');
        !this.dataCells || def.fail.operationInvalid('Axis is already bound.');
        
        this.dataCells = def.array.to(dataCells);
        this.dataCell  = this.dataCells[0];
        this.role = this.dataCell && this.dataCell.role;
        this.scaleType = groupingScaleType(this.role.grouping);
        
        this._checkRoleCompatibility();
        
        return this;
    },
    
    isBound: function(){
        return !!this.role;
    },
    
    setScale: function(scale){
        /*jshint expr:true */
        this.role || def.fail.operationInvalid('Axis is unbound.');
        
        this.scale = scale;
        
        if(scale){
            scale.type = this.scaleType;
        }
        
        return this;
    },
    
    /**
     * Obtains a scene-scale function to compute values of this axis' main role.
     * 
     * @param {object} [keyArgs] Keyword arguments object.
     * @param {string} [keyArgs.sceneVarName] The local scene variable name by which this axis's role is known. Defaults to the role's name.
     * @param {boolean} [keyArgs.nullToZero=true] Indicates that null values should be converted to zero before applying the scale.
     * @type function
     */
    sceneScale: function(keyArgs){
        var varName  = def.get(keyArgs, 'sceneVarName') || this.role.name,
            grouping = this.role.grouping;

        if(grouping.isSingleDimension && grouping.firstDimension.type.valueType === Number){
            var scale = this.scale,
                nullToZero = def.get(keyArgs, 'nullToZero', true);
            
            var by = function(scene){
                var value = scene.vars[varName].value;
                if(value == null){
                    if(!nullToZero){
                        return value;
                    }
                    value = 0;
                }
                return scale(value);
            };
            def.copy(by, scale);
            
            return by;
        }

        return this.scale.by1(function(scene){
            return scene.vars[varName].value;
        });
    },
    
    _getOptionsDefinition: function(){
        return axis_optionsDef;
    },
    
    _checkRoleCompatibility: function(){
        var L = this.dataCells.length;
        if(L > 1){
            var grouping = this.role.grouping, 
                i;
            if(this.scaleType === 'Discrete'){
                for(i = 1; i < L ; i++){
                    if(grouping.id !== this.dataCells[i].role.grouping.id){
                        throw def.error.operationInvalid("Discrete roles on the same axis must have equal groupings.");
                    }
                }
            } else {
                if(!grouping.firstDimension.type.isComparable){
                    throw def.error.operationInvalid("Continuous roles on the same axis must have 'comparable' groupings.");
                }

                for(i = 1; i < L ; i++){
                    if(this.scaleType !== groupingScaleType(this.dataCells[i].role.grouping)){
                        throw def.error.operationInvalid("Continuous roles on the same axis must have scales of the same type.");
                    }
                }
            }
        }
    }
});

/**
 * Calculates the id of an axis given its type and index.
 * @param {string} type The type of the axis.
 * @param {number} index The index of the axis within its type. 
 * @type string
 */
pvc.visual.Axis.getId = function(type, index){
    if(index === 0) {
        return type; // base, ortho, legend
    }
    
    return type + "" + (index + 1); // base2, ortho3,..., legend2
};

function groupingScaleType(grouping){
    return grouping.isDiscrete() ?
                'Discrete' :
                (grouping.firstDimension.type.valueType === Date ?
                'Timeseries' :
                'Continuous');
}

axis_optionsDef = {
// NOOP
};

});
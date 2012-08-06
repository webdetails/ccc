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
 * <p>
 * The main properties of an axis: {@link #type}, {@link #orientation} and relevant chart's properties 
 * are related as follows:
 * </p>
 * <pre>
 * axisType={base, ortho} = f(axisOrientation={x,y})
 * 
 *          Vertical   Horizontal   (chart orientation)
 *         +---------+-----------+
 *       x | base    |   ortho   |
 *         +---------+-----------+
 *       y | ortho   |   base    |
 *         +---------+-----------+
 * (axis orientation)
 * </pre>
 * 
 * @property {pvc.CartesianAbstract} chart The associated cartesian chart.
 * @property {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @property {number} index The index of the axis within its type (0, 1, 2...).
 * @property {string} orientation The orientation of the axis. 
 * One of the values: 'x' or 'y', for horizontal and vertical axis orientations, respectively.
 * @property {string} orientatedId The id of the axis with respect to the orientation and the index of the axis ("").
 * @property {pvc.visual.Role} role The associated visual role.
 * @property {pv.Scale} scale The associated scale.
 * 
 * @constructor
 * @param {pvc.CartesianAbstract} chart The associated cartesian chart.
 * @param {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @param {number} [index=0] The index of the axis within its type.
 * @param {pvc.visual.Role || pvc.visual.Role[]} roles The associated visual role or roles.
 * 
 * @param {object} [keyArgs] Keyword arguments.
 * @param {pv.Scale} scale The associated scale.
 */
def.type('pvc.visual.Axis')
.init(function(chart, type, index, roles, keyArgs){
    /*jshint expr:true */
    roles || def.fail.argumentRequired('roles');
    
    this.chart = chart;
    this.type  = type;
    this.index = index == null ? 0 : index;
    this.roles = def.array.as(roles);
    this.role  = this.roles[0];
    this.scaleType = groupingScaleType(this.role.grouping);
    this.id = pvc.visual.Axis.getId(this.type, this.index);
    
    this.option = pvc.options(this._getOptionsDefinition(), this);
    
    this._checkRoleCompatibility();
    
    this.setScale(def.get(keyArgs, 'scale', null));
})
.add(/** @lends pvc.visual.Axis# */{
    isVisible: true,
   
    setScale: function(scale){
        this.scale = scale;
        
        if(scale){
            scale.type = this.scaleType;
        }
        
        return this;
    },
    
    /**
     * Determines the type of scale required by the axis.
     * The scale types are 'Discrete', 'Timeseries' and 'Continuous'.
     * 
     * @type string
     */
    scaleType: function(){
        return groupingScaleType(this.role.grouping);
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

        return this.scale.by(function(scene){
            return scene.vars[varName].value;
        });
    },
    
    _getOptionsDefinition: function(){
        return axis_optionsDef;
    },
    
    _checkRoleCompatibility: function(){
        var L = this.roles.length;
        if(L > 1){
            var grouping = this.role.grouping, 
                i;
            if(this.scaleType === 'Discrete'){
                for(i = 1; i < L ; i++){
                    if(grouping.id !== this.roles[i].grouping.id){
                        throw def.error.operationInvalid("Discrete roles on the same axis must have equal groupings.");
                    }
                }
            } else {
                if(!grouping.firstDimension.type.isComparable){
                    throw def.error.operationInvalid("Continuous roles on the same axis must have 'comparable' groupings.");
                }

                for(i = 1; i < L ; i++){
                    if(this.scaleType !== groupingScaleType(this.roles[i].grouping)){
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
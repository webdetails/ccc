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
     * @extends pvc.visual.OptionsBase
     * 
     * @property {pvc.visual.Role} role The associated visual role.
     * @property {pv.Scale} scale The associated scale.
     * 
     * @constructor
     * @param {pvc.BaseChart} chart The associated chart.
     * @param {string} type The type of the axis.
     * @param {number} [index=0] The index of the axis within its type.
     * @param {object} [keyArgs] Keyword arguments.
     */
    def
    .type('pvc.visual.Axis', pvc.visual.OptionsBase)
    .init(function(chart, type, index, keyArgs){
        
        this.base(chart, type, index, keyArgs);
        
        // Fills #axisIndex and #typeIndex
        chart._addAxis(this);
    })
    .add(/** @lends pvc.visual.Axis# */{
        isVisible: true,
        
        // should null values be converted to zero or to the minimum value in what scale is concerned?
        // 'null', 'zero', 'min', 'value'
        scaleTreatsNullAs: function(){
            return 'null';
        },
        
        scaleNullRangeValue: function(){
            return null;
        },
        
        scaleUsesAbs: function(){
            return false;
        },
        
        /**
         * Binds the axis to a set of data cells.
         * 
         * <p>
         * Only after this operation is performed will
         * options with a scale type prefix be found.
         * </p>
         * 
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
        
        isDiscrete: function() {
            return this.role && this.role.isDiscrete();
        },
        
        isBound: function() {
            return !!this.role;
        },
        
        setScale: function(scale, noWrap) {
            /*jshint expr:true */
            this.role || def.fail.operationInvalid('Axis is unbound.');
            
            this.scale = scale ? (noWrap ? scale : this._wrapScale(scale)) : null;
    
            return this;
        },
        
        _wrapScale: function(scale) {
            scale.type = this.scaleType;
            
            var by;
            
            // Applying 'scaleNullRangeValue' to discrete scales
            // would cause problems in discrete color scales,
            // where we want null to be matched to the first color of the color scale
            // (typically happens when there is only a null series).
            if(scale.type !== 'discrete' ){
                var useAbs = this.scaleUsesAbs();
                var nullAs = this.scaleTreatsNullAs();
                if(nullAs && nullAs !== 'null'){
                    var nullIsMin = nullAs === 'min';
                    // Below, the min valow is evaluated each time on purpose,
                    // because otherwise we would have to rewrap when the domain changes.
                    // It does change, for example, on MultiChart scale coordination.
                    if(useAbs){
                        by = function(v){
                            return scale(v == null ? (nullIsMin ? scale.domain()[0] : 0) : (v < 0 ? -v : v));
                        };
                    } else {
                        by = function(v){
                            return scale(v == null ? (nullIsMin ? scale.domain()[0] : 0) : v);
                        };
                    }
                } else {
                    var nullRangeValue = this.scaleNullRangeValue();
                    if(useAbs){
                        by = function(v){
                            return v == null ? nullRangeValue : scale(v < 0 ? -v : v);
                        };
                    } else {
                        by = function(v){
                            return v == null ? nullRangeValue : scale(v);
                        };
                    }
                }
            } else {
                // ensure null -> ""
                by = function(v){
                    return scale(v == null ? '' : v);
                };
            }
            
            // don't overwrite scale with by! it would cause infinite recursion...
            return def.copy(by, scale);
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
            
            // TODO: isn't this redundant with the code in _wrapScale??
            if(grouping.isSingleDimension && grouping.firstDimensionValueType() === Number){
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
        
        _checkRoleCompatibility: function(){
            var L = this.dataCells.length;
            if(L > 1){
                var grouping = this.role.grouping, 
                    i;
                if(this.scaleType === 'discrete'){
                    for(i = 1; i < L ; i++){
                        if(grouping.id !== this.dataCells[i].role.grouping.id){
                            throw def.error.operationInvalid("Discrete roles on the same axis must have equal groupings.");
                        }
                    }
                } else {
                    if(!grouping.firstDimensionType().isComparable){
                        throw def.error.operationInvalid("Continuous roles on the same axis must have 'comparable' groupings.");
                    }
    
                    for(i = 1; i < L ; i++){
                        if(this.scaleType !== groupingScaleType(this.dataCells[i].role.grouping)){
                            throw def.error.operationInvalid("Continuous roles on the same axis must have scales of the same type.");
                        }
                    }
                }
            }
        },
        
        _getOptionsDefinition: function(){
            return axis_optionsDef;
        }
    });
    
    function groupingScaleType(grouping){
        return grouping.isDiscrete() ?
                    'discrete' :
                    (grouping.firstDimensionValueType() === Date ?
                    'timeSeries' :
                    'numeric');
    }
    
    axis_optionsDef = {
    // NOOP
    };
});
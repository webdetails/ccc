
/**
 * Initializes a visual role.
 * 
 * @name pvc.visual.Role
 * 
 * @class Represents a role that is somehow played by visualization.  
 * 
 * @property {string} name The name of the role.
 * 
 * @property {pvc.data.GroupingSpec} grouping The grouping specification currently bound to the visual role.
 * 
 * @property {boolean} isRequired Indicates that the role is required and must be satisfied.
 * 
 * @property {boolean} isSingleDimension Indicates that the role can only be satisfied by a single dimension.
 * A {@link pvc.visual.Role} of this type must have an associated {@link pvc.data.GroupingSpec}
 * that has {@link pvc.data.GroupingSpec#isSingleDimension} equal to <tt>true</tt>.
 * 
 * @property {boolean} singleValueType When not nully, 
 * restricts the allowed value type of the single dimension of the 
 * associated {@link pvc.data.GroupingSpec} to this type.
 * 
 * @property {boolean|null} isSingleDiscrete
 * Indicates if the single dimension should be discrete, when <tt>true</tt>, continuous, when <tt>false</tt>, 
 * or any, when <tt>null</tt>.
 * 
 * @property {string} defaultDimensionName The default dimension name.
 * 
 * @constructor
 * @param {string} name The name of the role.
 * @param {object} [keyArgs] Keyword arguments.
 * 
 * @param {boolean} [keyArgs.isRequired=false] Indicates a required role.
 * 
 * @param {boolean} [keyArgs.isSingleDimension=false] Indicates that the role 
 * can only be satisfied by a single dimension. 
 * 
 * @param {boolean} [keyArgs.isMeasure=false] Indicates that <b>datums</b> that do not 
 * contain a non-null atom in any of the dimensions bound to measure roles should be readily excluded.
 * 
 * @param {boolean} [keyArgs.singleValueType] Restricts the allowed value type of the single dimension.
 * 
 * @param {boolean|null} [keyArgs.isSingleDiscrete=null] Indicates if the single dimension should be discrete, continuous or any.
 * 
 * @param {string} [keyArgs.defaultDimensionName] The default dimension name.
 */
def.type('pvc.visual.Role')
.init(function(name, keyArgs){
    this.name = name;
    
    if(def.get(keyArgs, 'isRequired', false)) {
        this.isRequired = true;
    }
    
    var defaultDimensionName = def.get(keyArgs, 'defaultDimensionName'); 
    if(defaultDimensionName) {
        this.defaultDimensionName = defaultDimensionName;
    }
    
    if(def.get(keyArgs, 'isSingleDimension', false)) {
        this.isSingleDimension = true;
        
        if(def.get(keyArgs, 'isMeasure', false)) {
            this.isMeasure = true;
            
            if(def.get(keyArgs, 'isPercent', false)) {
                this.isPercent = true;
            }
        }
        
        var singleValueType = def.get(keyArgs, 'singleValueType', null);
        if(singleValueType != this.singleValueType) {
            this.singleValueType = singleValueType;
        }
        
        var isSingleDiscrete = def.get(keyArgs, 'isSingleDiscrete');
        if(isSingleDiscrete != this.isDiscrete) {
            this.isDiscrete = !!isSingleDiscrete;
        }
    } else {
        this.isDiscrete = true; 
    }
})
.add(/** @lends pvc.visual.Role# */{
    isRequired:        false,
    isSingleDimension: false,
    singleValueType:   null,
    isDiscrete:        null,
    isMeasure:         false,
    isPercent:         false,
    defaultDimensionName: null,
    grouping: null,
    
    /** 
     * Obtains the name of the first dimension type that is bound to the role.
     * @type string 
     */
    firstDimensionName: function(){
        return this.grouping && this.grouping.firstDimension.name;
    },
    
    /** 
     * Obtains the first dimension type that is bound to the role.
     * @type pvc.data.Dimension
     */
    firstDimension: function(){
        return this.grouping && this.grouping.firstDimension;
    },
    
    /**
     * Binds a grouping specification to playing this role.
     * 
     * @param {pvc.data.GroupingSpec} groupingSpec The grouping specification of the visual role.
     */
    bind: function(groupingSpec){
        if(groupingSpec) {
            if(groupingSpec.hasCompositeLevels) {
                throw def.error.argumentInvalid(def.format('visualRoles.{0}', [name]), "Role assigned to a composite level grouping, which is invalid.");
            }
            
            /** Validate grouping spec according to role */
            if(this.isSingleDimension) {
                groupingSpec.isSingleDimension || def.fail.operationInvalid("Role '{0}' only accepts a single dimension.", [this.name]);
                
                var singleDimension = groupingSpec.firstDimension,
                    dimType = singleDimension.type;
                
                var valueType = this.singleValueType;
                if(valueType && dimType.valueType !== valueType) {
                    throw def.error.operationInvalid("Role '{0}' only accepts a single dimension of type '{1}'.", [this.name, dimType.valueTypeName]);
                }
                
                var isDiscrete = this.isDiscrete;
                if(isDiscrete != null && dimType.isDiscrete !== isDiscrete) {
                    throw def.error.operationInvalid("Role '{0}' only accepts a single and discrete dimension.", [this.name]);
                }
            }
        }
        
        if(this.grouping) {
            // unregister from current dimension types
            this.grouping.dimensions().each(function(dimSpec){
                dimType_removeVisualRole.call(dimSpec.type, this);  
            }, this);
        }
        
        this.grouping = groupingSpec;
        
        if(this.grouping) {
            // register from current dimension types
            this.grouping.dimensions().each(function(dimSpec){
                dimType_addVisualRole.call(dimSpec.type, this);  
            }, this);
        }
    }
});


/**
 * Initializes a visual role.
 * 
 * @name pvc.visual.Role
 * 
 * @class Represents a role that is somehow played by a visualization.
 * 
 * @property {string} name The name of the role.
 *
 * @property {string} label
 * The label of this role.
 * The label <i>should</i> be unique on a visualization.
 *
 * @property {pvc.data.GroupingSpec} grouping The grouping specification currently bound to the visual role.
 * 
 * @property {boolean} isRequired Indicates that the role is required and must be satisfied.
 * 
 * @property {boolean} requireSingleDimension Indicates that the role can only be satisfied by a single dimension.
 * A {@link pvc.visual.Role} of this type must have an associated {@link pvc.data.GroupingSpec}
 * that has {@link pvc.data.GroupingSpec#isSingleDimension} equal to <tt>true</tt>.
 * 
 * @property {boolean} valueType When not nully, 
 * restricts the allowed value type of the single dimension of the 
 * associated {@link pvc.data.GroupingSpec} to this type.
 * 
 * @property {boolean|null} requireIsDiscrete
 * Indicates if 
 * only discrete, when <tt>true</tt>, 
 * continuous, when <tt>false</tt>, 
 * or any, when <tt>null</tt>,
 * groupings are accepted.
 * 
 * @property {string} defaultDimensionName The default dimension name.
 *
 * @property {boolean} autoCreateDimension Indicates if a dimension with the default name (the first level of, when a group name),
 * should be created when the role has not been read by a translator (required or not).
 *
 * @constructor
 * @param {string} name The name of the role.
 * @param {object} [keyArgs] Keyword arguments.
 * @param {string} [keyArgs.label] The label of this role.
 *
 * @param {boolean} [keyArgs.isRequired=false] Indicates a required role.
 * 
 * @param {boolean} [keyArgs.requireSingleDimension=false] Indicates that the role 
 * can only be satisfied by a single dimension. 
 * 
 * @param {boolean} [keyArgs.isMeasure=false] Indicates that <b>datums</b> that do not 
 * contain a non-null atom in any of the dimensions bound to measure roles should be readily excluded.
 * 
 * @param {boolean} [keyArgs.valueType] Restricts the allowed value type of dimensions.
 * 
 * @param {boolean|null} [keyArgs.requireIsDiscrete=null] Indicates if the grouping should be discrete, continuous or any.
 * 
 * @param {string} [keyArgs.defaultDimensionName] The default dimension name.
 * @param {boolean} [keyArgs.autoCreateDimension=false]
 * Indicates if a dimension with the default name (the first level of, when a group name),
 * should be created when the role is required and it has not been read by a translator.
 *
 * @param {string} [keyArgs.flatteningMode='singleLevel'] Indicates if the role presents
 * the leaf data nodes or all the nodes in the tree, in pre or post order.
 * Possible values are <tt>'singleLevel'</tt>, <tt>'tree-pre'</tt> and <tt>'tree-post'</tt>.
 */
def.type('pvc.visual.Role')
.init(function(name, keyArgs){
    this.name  = name;
    this.label = def.get(keyArgs, 'label') || pvc.buildTitleFromName(name);
    this.index = def.get(keyArgs, 'index') || 0;
    
    this.dimensionDefaults = def.get(keyArgs, 'dimensionDefaults') || {};
    
    if(def.get(keyArgs, 'isRequired', false)) {
        this.isRequired = true;
    }
    
    if(def.get(keyArgs, 'autoCreateDimension', false)) {
        this.autoCreateDimension = true;
    }
    
    var defaultSourceRoleName = def.get(keyArgs, 'defaultSourceRole');
    if(defaultSourceRoleName) {
        this.defaultSourceRoleName = defaultSourceRoleName;
    }
    
    var defaultDimensionName = def.get(keyArgs, 'defaultDimension');
    if(defaultDimensionName) {
        this.defaultDimensionName = defaultDimensionName;
    }

    if(!defaultDimensionName && this.autoCreateDimension){
        throw def.error.argumentRequired('defaultDimension');
    }
    
    var requireSingleDimension;
    var requireIsDiscrete = def.get(keyArgs, 'requireIsDiscrete'); // isSingleDiscrete
    if(requireIsDiscrete != null) {
        if(!requireIsDiscrete) {
            requireSingleDimension = true;
        }
    }
    
    if(requireSingleDimension != null) {
        requireSingleDimension = def.get(keyArgs, 'requireSingleDimension', false);
        if(requireSingleDimension) {
            if(def.get(keyArgs, 'isMeasure', false)) {
                this.isMeasure = true;
                
                if(def.get(keyArgs, 'isPercent', false)) {
                    this.isPercent = true;
                }
            }
            
            var valueType = def.get(keyArgs, 'valueType', null);
            if(valueType !== this.valueType) {
                this.valueType = valueType;
                this.dimensionDefaults.valueType = valueType;
            }
        }
    }
    
    if(requireSingleDimension !== this.requireSingleDimension) {
        this.requireSingleDimension = requireSingleDimension;
    }
    
    if(requireIsDiscrete != this.requireIsDiscrete) {
        this.requireIsDiscrete = !!requireIsDiscrete;
        this.dimensionDefaults.isDiscrete = this.requireIsDiscrete;
    }

    var flatteningMode = def.get(keyArgs, 'flatteningMode');
    if(flatteningMode && flatteningMode != this.flatteningMode) {
        this.flatteningMode = flatteningMode;
    }
})
.add(/** @lends pvc.visual.Role# */{
    isRequired: false,
    requireSingleDimension: false,
    valueType: null,
    requireIsDiscrete: null,
    isMeasure: false,
    isPercent: false,
    defaultSourceRoleName: null,
    defaultDimensionName:  null,
    grouping: null,
    flatteningMode: 'singleLevel',
    flattenRootLabel: '',
    autoCreateDimension: false,
    isReversed: false,
    label: null,
    sourceRole: null,
    
    /** 
     * Obtains the first dimension type that is bound to the role.
     * @type pvc.data.DimensionType
     */
    firstDimensionType: function(){
        var g = this.grouping;
        return g && g.firstDimensionType();
    },
    
    /** 
     * Obtains the name of the first dimension type that is bound to the role.
     * @type string 
     */
    firstDimensionName: function(){
        var g = this.grouping;
        return g && g.firstDimensionName();
    },
    
    /** 
     * Obtains the value type of the first dimension type that is bound to the role.
     * @type function
     */
    firstDimensionValueType: function(){
        var g = this.grouping;
        return g && g.firstDimensionValueType();
    },

    isDiscrete: function(){
        var g = this.grouping;
        return g && g.isDiscrete();
    },
    
    setSourceRole: function(sourceRole){
        this.sourceRole = sourceRole;
    },
    
    setIsReversed: function(isReversed){
        if(!isReversed){ // default value
            delete this.isReversed;
        } else {
            this.isReversed = true;
        }
    },
    
    setFlatteningMode: function(flatteningMode){
        if(!flatteningMode || flatteningMode === 'singleLevel'){ // default value
            delete this.flatteningMode;
        } else {
            this.flatteningMode = flatteningMode;
        }
    },

    setFlattenRootLabel: function(flattenRootLabel){
        if(!flattenRootLabel){ // default value
            delete this.flattenRootLabel;
        } else {
            this.flattenRootLabel = flattenRootLabel;
        }
    },

    /**
     * Applies this role's grouping to the specified data
     * after ensuring the grouping is of a certain type.
     *
     * @param {pvc.data.Data} data The data on which to apply the operation.
     * @param {object} [keyArgs] Keyword arguments.
     * ...
     * 
     * @type pvc.data.Data
     */
    flatten: function(data, keyArgs){
        if(this.grouping){
            return data.flattenBy(this, keyArgs);
        }
    },

    flattenedGrouping: function(keyArgs){
        var grouping = this.grouping;
        if(grouping){
            keyArgs = def.setDefaults(keyArgs,
                'flatteningMode', this.flatteningMode,
                'flattenRootLabel', this.flattenRootLabel);

            return grouping.ensure(keyArgs);
        }
    },

    select: function(data, keyArgs){
        var grouping = this.grouping;
        if(grouping){
            return data.groupBy(grouping.ensure(keyArgs), keyArgs);
        }
    },

    view: function(complex){
        var grouping = this.grouping;
        if(grouping){
            return grouping.view(complex);
        }
    },

    /**
     * Pre-binds a grouping specification to playing this role.
     * 
     * @param {pvc.data.GroupingSpec} groupingSpec The grouping specification of the visual role.
     */
    preBind: function(groupingSpec){
        this.__grouping = groupingSpec;

        return this;
    },

    isPreBound: function(){
        return !!this.__grouping;
    },
    
    preBoundGrouping: function(){
        return this.__grouping;
    },
    
    isBound: function(){
        return !!this.grouping;
    },
    
    /**
     * Finalizes a binding initiated with {@link #preBind}.
     *
     * @param {pvc.data.ComplexType} type The complex type with which
     * to bind the pre-bound grouping and then validate the
     * grouping and role binding.
     */
    postBind: function(type){
        var grouping = this.__grouping;
        if(grouping){
            delete this.__grouping;

            grouping.bind(type);

            this.bind(grouping);
        }
        
        return this;
    },

    /**
     * Binds a grouping specification to playing this role.
     * 
     * @param {pvc.data.GroupingSpec} groupingSpec The grouping specification of the visual role.
     */
    bind: function(groupingSpec){
        if(groupingSpec) {
            if(groupingSpec.isNull()){
                groupingSpec = null;
           } else {
                /* Validate grouping spec according to role */

                if(this.requireSingleDimension && !groupingSpec.isSingleDimension) {
                    throw def.error.operationInvalid(
                            "Role '{0}' only accepts a single dimension.",
                            [this.name]);
                }

                var valueType = this.valueType;
                var requireIsDiscrete = this.requireIsDiscrete;
                groupingSpec.dimensions().each(function(dimSpec){
                    var dimType = dimSpec.type;
                    if(valueType && dimType.valueType !== valueType) {
                        throw def.error.operationInvalid(
                                "Role '{0}' cannot be bound to dimension '{1}'. \nIt only accepts dimensions of type '{2}' and not of type '{3}'.",
                                [this.name, dimType.name, pvc.data.DimensionType.valueTypeName(valueType), dimType.valueTypeName]);
                    }

                    if(requireIsDiscrete != null &&
                       dimType.isDiscrete !== requireIsDiscrete) {
                        
                        if(requireIsDiscrete){
                            // A continuous dimension can be "coerced" to behave as discrete
                            dimType._toDiscrete();
                        } else {
                            throw def.error.operationInvalid(
                                "Role '{0}' cannot be bound to dimension '{1}'. \nIt only accepts {2} dimensions.",
                                [this.name, dimType.name, requireIsDiscrete ? 'discrete' : 'continuous']);
                        }
                    }
                }, this);
            }
        }
        
        // ----------
        
        if(this.grouping) {
            // unregister from current dimension types
            this.grouping.dimensions().each(function(dimSpec){
                if(dimSpec.type){
                    /*global dimType_removeVisualRole:true */
                    dimType_removeVisualRole.call(dimSpec.type, this);
                }
            }, this);
        }
        
        this.grouping = groupingSpec;
        
        if(this.grouping) {
            
            if(this.isReversed){
                this.grouping = this.grouping.reversed();
            }
            
            // register in current dimension types
            this.grouping.dimensions().each(function(dimSpec){
                /*global dimType_addVisualRole:true */
                dimType_addVisualRole.call(dimSpec.type, this);  
            }, this);
        }

        return this;
    }
});

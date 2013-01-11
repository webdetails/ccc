
/**
 * Initializes a dimension type
 * 
 * @name pvc.data.DimensionType
 * 
 * @class A dimension type describes a dimension of a complex type.
 * <p>
 * Most of the held information is of 
 * intrinsic characteristics of the dimensions values.
 * Yet, it also holds information 
 * related to a specific data translation usage.
 * </p>
 *
 * @property {pvc.data.ComplexType} complexType
 * The complex type that this dimension type belongs to.
 * 
 * @property {string} name
 * The name of this dimension type.
 * The name of a dimension type is unique on its complex type.
 * 
 * @property {string} label
 * The label of this dimension type.
 * The label <i>should</i> be unique on its complex type.
 * 
 * @property {string} group The group that the dimension type belongs to.
 * <p>
 * The group name is taken to be the name of the dimension
 * without any suffix numbers. 
 * So, if the name of a dimension type is 'series2',
 * then its default group is 'series'.
 * </p>
 *
 * @property {number} groupLevel The index within the group that the dimension type belongs to.
 *
 * @property {Function} valueType
 * The type of the value of atoms belonging to dimensions of this type.
 * It is a function that casts values to the represented type.
 * 
 * The values null and undefined are never converted by this function.
 * 
 * The function must be idempotent.
 *
 * @property {string} valueTypeName A description of the value type.
 * 
 * @property {boolean} isDiscrete
 * Indicates if the values of this dimension are 
 * to be considered discrete,
 * as opposed to continuous,
 * even if the value type is continuous.
 *
 * @property {boolean} isDiscreteValueType
 * Indicates if the value type of the values of this dimension are discrete,
 * as opposed to continuous.
 *
 * @property {boolean} isComparable
 * Indicates if the values of this dimension can be compared.
 * 
 * @property {boolean} isHidden Indicates if the dimension is
 * hidden from the user, in places like a tooltip, for example, or in the legend.
 * 
 * @property {def.Map} playedVisualRoles
 * A map of {@link pvc.visual.Role} indexed by visual role name, of the visual roles currently being played by this dimension type.
 * 
 * @constructor
 *
 * @param {pvc.data.ComplexType} complexType The complex type that this dimension belongs to.
 * @param {string} name The name of the dimension type.
 *
 * @param {object} [keyArgs] Keyword arguments.
 * @param {string} [keyArgs.label] The label of this dimension type.
 * Defaults to the name of the dimension type.
 * @param {function} [keyArgs.valueType=null] The type of the values of this dimension type.
 * <p>
 * The supported value types are: <i>null</i> (which really means <i>any</i>), {@link Boolean}, {@link Number}, {@link String}, {@link Date} and {@link Object}.
 * </p>
 * @param {boolean} [keyArgs.isHidden=false] Indicates if the dimension should
 * be hidden from the user, in places like a tooltip, for example, or in the legend.
 * @param {boolean} [keyArgs.isDiscrete]
 * Indicates if the dimension
 * is considered discrete.
 * The default value depends on the value of {@link valueType};
 * it is true unless the {@link valueType} is Number or Date.
 * 
 * @param {function} [keyArgs.converter] A function used in the translation phase
 * to convert raw values into values of the dimension's value type.
 * Its signature is:
 * <pre>
 * function(rawValue : any) : valueType
 * </pre>
 * 
 * @param {string} [keyArgs.rawFormat] A protovis format mask adequate to the specified value type.
 * When specified and a converter is not specified, it is used to create a converter
 * for the Date and Number value types.
 * 
 * @param {function} [keyArgs.key] A function used in the translation phase
 * to obtain the string key of each value.
 * Its signature is:
 * <pre>
 * function(value : valueType) : string
 * </pre>
 * <p>
 * Nully values have a fixed key of '', 
 * so to the function never receives a "nully" value argument.
 * A consequence is that no other values can have an empty key.
 * </p>
 * <p>
 * The default key is obtained by calling the value's {@link Object#toString} method.
 * </p>
 * 
 * @param {function} [keyArgs.formatter] A function used in the translation phase
 * to format the values of this dimension type.
 * Its signature is:
 * <pre>
 * function(value : valueType, rawValue : any) : string
 * </pre>
 * <p>
 * Only a "nully" value <i>should</i> have an empty label.
 * </p>
 * <p>
 * The label is not necessarily unique.
 * </p>
 * <p>
 * The default format is the empty string for null values, 
 * or the result of calling the <i>value</i>'s {@link Object#toString} method.
 * </p>
 * 
 * @param {string} [keyArgs.format] A protovis format mask adequate to the specified value type.
 * When specified and a formatter is not specified, it is used to create a formatter
 * for the Date and Number value types.
 *
 * @param {function} [keyArgs.comparer]
 * Specifies a comparator function for the values of this dimension type.
 * Its signature is:
 * <pre>
 * function(valueA : valueType, valueB : valueType) : number
 * </pre>
 * 
 * The default value depends on the value of {@link valueType};
 * it is {@link def.compare} when the {@link valueType} is Date,
 * and null otherwise.
 */

/**
 * Cache of reverse order context-free value comparer function.
 * 
 * @name pvc.data.DimensionType#_reverseComparer
 * @field
 * @type function
 * @private
 */

/**
 * Cache of reverse order context-free atom comparer function.
 * 
 * @name pvc.data.DimensionType#_reverseAtomComparer
 * @field
 * @type function
 * @private
 */

/**
 * Cache of normal order context-free value comparer function.
 * 
 * @name pvc.data.DimensionType#_directComparer
 * @field
 * @type function
 * @private
 */

/**
 * Cache of normal order context-free atom comparer function.
 * 
 * @name pvc.data.DimensionType#_directAtomComparer
 * @field
 * @type function
 * @private
 */
def.type('pvc.data.DimensionType')
.init(
function(complexType, name, keyArgs){
    this.complexType = complexType;
    this.name  = name;
    this.label = def.get(keyArgs, 'label') || pvc.buildTitleFromName(name);

    var groupAndLevel = pvc.splitIndexedId(name);
    this.group = groupAndLevel[0];
    this.groupLevel = def.nullyTo(groupAndLevel[1], 0);

    if(this.label.indexOf('{') >= 0){
        this.label = def.format(this.label, [this.groupLevel+1]);
    }

    this.playedVisualRoles = new def.Map();
    this.isHidden = !!def.get(keyArgs, 'isHidden');
    
    var valueType = def.get(keyArgs, 'valueType') || null;
    var valueTypeName = pvc.data.DimensionType.valueTypeName(valueType);
    var cast = def.getOwn(pvc.data.DimensionType.cast, valueTypeName, null);
    
    this.valueType = valueType;
    this.valueTypeName = valueTypeName;
    this.cast = cast;
    
    this.isDiscreteValueType = (this.valueType !== Number && this.valueType !== Date);
    this.isDiscrete = def.get(keyArgs, 'isDiscrete');
    if(this.isDiscrete == null){
        this.isDiscrete = this.isDiscreteValueType;
    } else {
        // Normalize the value
        this.isDiscrete = !!this.isDiscrete;
        if(!this.isDiscrete && this.isDiscreteValueType) {
            throw def.error.argumentInvalid('isDiscrete', "The only supported continuous value types are Number and Date.");
        }
    }
    
    /** 
     * @private
     * @internal
     * @see pvc.data.Dimension#convert
     */
    this._converter = def.get(keyArgs, 'converter') || null;
    if(!this._converter) {
        var rawFormat = def.get(keyArgs, 'rawFormat');
        if(rawFormat) {
            /*jshint onecase:true */
            switch(this.valueType) {
//                case Number:
//                    // TODO: receive extra format configuration arguments
//                    // this._converter = pv.Format.createParser(pv.Format.number().fractionDigits(0, 2));
//                    break;
                    
                case Date:
                    this._converter = pv.Format.createParser(pv.Format.date(rawFormat));
                    break;
            }
        }
    }
    
    /** 
     * @private
     * @internal
     * @see pvc.data.Dimension#key
     */
    this._key = def.get(keyArgs, 'key') || null;
    
    /** @private */
    this._comparer = def.get(keyArgs, 'comparer');
    if(this._comparer === undefined){ // It is possible to prevent the default specifying null
        switch(this.valueType){
            case Number:
            case Date:
                this._comparer = def.compare;
                break;
                
            default:
                 this._comparer = null;
        }
    }

    this.isComparable = this._comparer != null;
    
    /** 
     * @private
     * @internal
     * @see pvc.data.Dimension#format
     */
    this._formatter = def.get(keyArgs, 'formatter') || null;
    if(!this._formatter) {
        switch(this.valueType) {
            case Number:
                // TODO: receive extra format configuration arguments
                this._formatter = pv.Format.createFormatter(pv.Format.number().fractionDigits(0, 2));
                break;
                
            case Date:
                var format = def.get(keyArgs, 'format'); 
                if(!format){
                    // Try to create one from raw format
                    // slightly modifying it to look like 
                    // protovis' continuous date scale dynamic formats
                    format = def.get(keyArgs, 'rawFormat');
                    if(format){
                        format = format.replace(/-/g, "/");
                    }
                }
                
                if(!format){
                    format = "%Y/%m/%d";
                }
                
                this._formatter = pv.Format.createFormatter(pv.Format.date(format));
                break;
        }
    }
})
.add(/** @lends pvc.data.DimensionType# */{
    
    isCalculated: false,
    
    /**
     * Compares two values of the dimension's {@link #valueType}, in ascending order.
     * <p>
     * To compare two values in descending order multiply the result by -1.
     * </p>
     * <p>
     * Values can be nully.
     * </p>
     * @param {any} a A value of the dimension's {@link #valueType}.
     * @param {any} b A value of the dimension's {@link #valueType}.
     *  
     * @returns {Number}
     * A negative number if {@link a} is before {@link b},
     * a positive number if {@link a} is after {@link b},
     * and 0 if they are considered to have the same order.
     */
    compare: function(a, b){
        if(a == null) {
            if(b == null) {
                return 0;
            }
            return -1;
        } else if(b == null) {
            return 1;
        }
        
        return this._comparer.call(null, a, b);
    },
    
    /**
     * Gets a context-free comparer function 
     * for values of the dimension's {@link #valueType}
     * and for a specified order.
     * 
     * <p>When the dimension type is not comparable, <tt>null</tt> is returned.</p>
     * 
     * @param {boolean} [reverse=false] Indicates if the comparison order should be reversed.
     * 
     * @type function
     */
    comparer: function(reverse){
        if(!this.isComparable) {
            return null;
        }
        
        var me = this;
        if(reverse){
            return this._reverseComparer || 
                   (this._reverseComparer = function(a, b){ return me.compare(b, a); }); 
        }
        
        return this._directComparer || (this._directComparer = function(a, b){ return me.compare(a, b); }); 
    },
    
    /**
     * Gets a context-free atom comparer function, 
     * for a specified order.
     * 
     * @param {boolean} [reverse=false] Indicates if the comparison order should be reversed.
     * 
     * @type function
     */
    atomComparer: function(reverse){
        if(reverse){
            return this._reverseAtomComparer || 
                   (this._reverseAtomComparer = this._createReverseAtomComparer()); 
        }
        
        return this._directAtomComparer ||
                (this._directAtomComparer = this._createDirectAtomComparer());
    },
    
    // Coercion to discrete upon the role binding (irreversible...)
    _toDiscrete: function(){
        this.isDiscrete = true;
    },
    
    _toCalculated: function(){
        this.isCalculated = true;
    },
    
    _createReverseAtomComparer: function(){
        if(!this.isComparable){
            /*global atom_idComparerReverse:true */
            return atom_idComparerReverse;
        }
        
        var me = this;
        
        function reverseAtomComparer(a, b){
            if(a === b) { return 0; } // Same atom
            return me.compare(b.value, a.value); 
        }
        
        return reverseAtomComparer;
    },
    
    _createDirectAtomComparer: function(){
        if(!this.isComparable){
            /*global atom_idComparer:true */
            return atom_idComparer;
        }
        
        var me = this;
        
        function directAtomComparer(a, b){
            if(a === b) { return 0; } // Same atom
            return me.compare(a.value, b.value);
        }
        
        return directAtomComparer;
    },
    
    /**
     * Gets the dimension type's context-free formatter function, if one is defined, or <tt>null</tt> otherwise.
     * @type function
     */
    formatter: function(){
        return this._formatter;
    },
    
    /**
     * Gets the dimension type's context-free converter function, if one is defined, or <tt>null</tt> otherwise.
     * @type function
     */
    converter: function(){
        return this._converter;
    },
    
    /**
     * Obtains a value indicating if this dimension type plays any visual role 
     * such that {@link pvc.visual.Role#isPercent} is <tt>true</tt>.
     * @type boolean
     */
    playingPercentVisualRole: function(){
        return def.query(this.playedVisualRoles.values())
                  .any(function(visualRole){ 
                      return visualRole.isPercent; 
                  }); 
    }
});

pvc.data.DimensionType.cast = {
    'Date': function(value) {
        return value instanceof Date ? value : new Date(value);
    },

    'Number': function(value) {
        value = Number(value);
        return isNaN(value) ? null : value;
    },

    'String':  String,
    'Boolean': Boolean,
    'Object':  Object,
    'Any':     null
};

/**
 * Obtains the default group name for a given dimension name.
 * 
 * @param {string} dimName The dimension name.
 * 
 *  @type string
 */
pvc.data.DimensionType.dimensionGroupName = function(dimName){
    return dimName.replace(/^(.*?)(\d*)$/, "$1");
};

// TODO: Docs
pvc.data.DimensionType.valueTypeName = function(valueType){
    if(valueType == null){
        return "Any";
    }
    
    switch(valueType){
        case Boolean: return 'Boolean';
        case Number:  return 'Number';
        case String:  return 'String';
        case Object:  return 'Object';
        case Date:    return 'Date';
        default: throw def.error.argumentInvalid('valueType', "Invalid valueType function: '{0}'.", [valueType]);
    }
};

/**
 * Extends a dimension type specification with defaults based on
 * group name and specified options.
 *  
 * @param {object} [keyArgs] Keyword arguments.
 * @param {function} [keyArgs.isCategoryTimeSeries=false] Indicates if category dimensions are to be considered time series.
 * @param {string} [keyArgs.timeSeriesFormat] The parsing format to use to parse a Date dimension when the converter and rawFormat options are not specified.
 * @param {function} [keyArgs.valueNumberFormatter] The formatter to use to parse a numeric dimension of the 'value' dimension group, when the formatter and format options are not specified.
 * @param {object} [keyArgs.dimensionGroups] A map of dimension group names to dimension type specifications to be used as prototypes of corresponding dimensions.
 * 
 *  @returns {object} The extended dimension type specification.
 */
pvc.data.DimensionType.extendSpec = function(dimName, dimSpec, keyArgs){
    
    var dimGroup = pvc.data.DimensionType.dimensionGroupName(dimName),
        userDimGroupsSpec = def.get(keyArgs, 'dimensionGroups');
    
    if(userDimGroupsSpec) {
        var groupDimSpec = userDimGroupsSpec[dimGroup];
        if(groupDimSpec) {
            dimSpec = def.create(groupDimSpec, dimSpec /* Can be null */); 
        }
    }
    
    if(!dimSpec) { 
        dimSpec = {};
    }
    
    switch(dimGroup) {
        case 'category':
            var isCategoryTimeSeries = def.get(keyArgs, 'isCategoryTimeSeries', false);
            if(isCategoryTimeSeries) {
                if(dimSpec.valueType === undefined) {
                    dimSpec.valueType = Date; 
                }
            }
            break;
        
        case 'value':
            if(dimSpec.valueType === undefined) {
                dimSpec.valueType = Number;
            }

            if(dimSpec.valueType === Number) {
                if(dimSpec.formatter === undefined && 
                   !dimSpec.format){
                    dimSpec.formatter = def.get(keyArgs, 'valueNumberFormatter');
                }
            }
            break;
    }
    
    if(dimSpec.converter === undefined && 
       dimSpec.valueType === Date && 
       !dimSpec.rawFormat) {
        dimSpec.rawFormat = def.get(keyArgs, 'timeSeriesFormat');
    }
    
    return dimSpec;
};

/**
 * Adds a visual role to the dimension type.
 * 
 * @name pvc.data.DimensionType#_addVisualRole
 * @function
 * @param {pvc.visual.Role} visualRole The visual role.
 * @type undefined
 * @private
 * @internal
 */
function dimType_addVisualRole(visualRole) {
    this.playedVisualRoles.set(visualRole.name, visualRole);
    /*global compType_dimensionRolesChanged:true */
    compType_dimensionRolesChanged.call(this.type, this);
}

/**
 * Removes a visual role from the dimension type.
 * 
 * @name pvc.data.DimensionType#_removeVisualRole
 * @function
 * @param {pvc.visual.Role} visualRole The visual role.
 * @type undefined
 * @private
 * @internal
 */
function dimType_removeVisualRole(visualRole) {
    this.playedVisualRoles.rem(visualRole.name);
    compType_dimensionRolesChanged.call(this.type, this);
}
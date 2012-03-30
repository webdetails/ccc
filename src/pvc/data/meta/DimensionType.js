
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
 * @property {string} group The group that the dimension type belongs to.
 * <p>
 * The group name is taken to be the name of the dimension
 * without any suffix numbers. 
 * So, if the name of a dimension type is 'series2',
 * then its default group is 'series'.
 * </p>
 * 
 * @property {Function} valueType
 * The type of the value of atoms belonging to dimensions of this type.
 * It is a function that casts values to the represented type.
 * 
 * The values null and undefined are never converted by this function.
 * 
 * The function must be idempotent.
 *
 * @property {boolean} isDiscrete
 * Indicates if the values of this dimension are discrete,
 * as opposed to continuous.
 *
 * @property {boolean} isComparable
 * Indicates if the values of this dimension can be compared.
 * 
 * @constructor
 *
 * @param {pvc.data.ComplexType} complexType The complex type that this dimension belongs to.
 * @param {string} name The name of the dimension type.
 *
 * @param {object} [keyArgs] Keyword arguments.
 * 
 * @param {function} [keyArgs.valueType=null] The type of the values of this dimension type.
 * <p>
 * The supported value types are: <i>null</i> (which really means <i>any</i>), {@link Boolean}, {@link Number}, {@link String}, {@link Date} and {@link Object}.
 * </p>
 * <p>
 * Note that internally the {@link Date} value type is switched by {@link Date2}. It allows conversion, as well of construction of Date objects.  
 * </p>
 * @param {boolean} [keyArgs.isDiscrete]
 * Indicates if the dimension
 * is considered discrete.
 * The default value depends on the value of {@link valueType};
 * it is true unless the {@link valueType} is Number.
 * 
 * @param {function} [keyArgs.convert] A function used in the translation phase
 * to convert raw values into values of the dimension's value type.
 * Its signature is:
 * <pre>
 * function(rawValue : any, item : any, dimension : pvc.data.Dimension) : valueType
 * </pre>
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
 * @param {function} [keyArgs.format] A function used in the translation phase
 * to format the values of this dimension type.
 * Its signature is:
 * <pre>
 * function(value : valueType, item : any, dimension : pvc.data.Dimension) : string
 * </pre>
 * <p>
 * Only a "nully" value can have an empty label.
 * </p>
 * <p>
 * The label is not necessarily unique.
 * </p>
 * <p>
 * The default format is the empty string for null values, 
 * or the result of calling the <i>value</i>'s {@link Object#toString} method.
 * </p>
 *
 * @param {function} [keyArgs.compare]
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
 * Cache of reverse order context-free atom comparer function.
 * 
 * @name pvc.data.DimensionType#_reverseAtomComparer
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
    this.group = pvc.data.DimensionType.dimensionGroupName(name);
       
    var valueType = def.get(keyArgs, 'valueType') || null;
    if(valueType){
        switch(valueType){
            case Boolean:
            case Number:
            case String:
            case Object:
                break;
            
            case Date:
                valueType = Date2;
                break;
                
            default: throw def.error.argumentInvalid('valueType', "Invalid valueType function: '{0}'.", [valueType]);
        }
    }
    
    this.valueType = valueType;
    
    this.isDiscrete = def.get(keyArgs, 'isDiscrete');
    if(this.isDiscrete == null){
        this.isDiscrete = (this.valueType !== Number && 
                           this.valueType !== Date2);
    } else {
        // Normalize the value
        this.isDiscrete = !!this.isDiscrete;
    }
    
    /** 
     * @private
     * @internal
     * @see pvc.data.Dimension#convert
     */
    this._convert = def.get(keyArgs, 'convert') || null;
    
    /** 
     * @private
     * @internal
     * @see pvc.data.Dimension#key
     */
    this._key = def.get(keyArgs, 'key') || null;
    
    /** @private */
    this._compare = def.get(keyArgs, 'compare');
    if(this._compare === undefined){
        switch(this.valueType){
            case Number:
                if(!this.isDiscrete) {
                    this._compare = def.compare;    
                }
                break;
                
            case Date2:
                this._compare = def.compare;
                break;
                
             default:
                 this._compare = null;
        }
    }

    this.isComparable = this._compare != null;
    
    /** 
     * @private
     * @internal
     * @see pvc.data.Dimension#format
     */
    this._format = def.get(keyArgs, 'format') || null;
})
.add(/** @lends pvc.data.DimensionType# */{

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
        
        return this._compare.call(null, a, b);
    },

    /**
     * Gets a context-free atom comparer function.
     * 
     * @param {boolean} [reverse=false] Indicates if the comparison order should be reversed.
     * 
     * @type function
     */
    atomComparer: function(reverse){
        var me = this;
        if(this.isComparable) {
            if(reverse){
                return this._reverseAtomComparer || 
                       (this._reverseAtomComparer = function(a, b){ return me.compare(b.value, a.value); }); 
            }
            
            return this._directAtomComparer || (this._directAtomComparer = function(a, b){ return me.compare(a.value, b.value); }); 
        }
        
        return reverse ? atom_idComparerReverse : atom_idComparer;
    }
});

/** Casts values to a Date object */
function Date2(value) {
    return value instanceof Date ? value : new Date(value);
}

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

/**
 * Splits a dimension name to its default group name and a group index.
 * 
 * @param {string} dimName The dimension name.
 * 
 * @type Array
 */
pvc.data.DimensionType.splitDimensionGroupName = function(dimName){
    var match = /^(.*?)(\d*)$/.exec(dimName);
    var index = null;
    
    if(match[2]) {
        index = Number(match[2]);
        if(index === 1) {
            index = 0;
        }
    }
    
    return [match[1],  index];  
};

/**
 * Computes the name of the nth level dimension 
 * of a dimension group (protected).
 * <p>
 * Generated dimension names follow the naming pattern:
 * 'value', 'value2', 'value3', 'value4', etc.,
 * where the dimension group name is 'value'.
 * </p>
 * 
 * @param {string} dimGroupName The name of the dimension group.
 * @param {number} level The 0-based level of the dimension.
 * 
 * @type string
 */
pvc.data.DimensionType.dimensionGroupLevelName = function(baseDimName, level){
    return baseDimName + (level >= 1 ? (level + 1) : '');
};
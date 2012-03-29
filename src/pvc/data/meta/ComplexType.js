/**
 * Initializes a complex type instance.
 * 
 * @name pvc.data.ComplexType
 * 
 * @class A complex type is, essentially, a named set of dimension types.
 *
 * @constructor
 * 
 * @param {object} [dimTypeSpecs]
 * A map of dimension names to dimension type constructor's keyword arguments.
 *
 * @see pvc.data.DimensionType
 */
def.type('pvc.data.ComplexType')
.init(
function(dimTypeSpecs){
    /**
     * A map of the dimension types by name.
     * 
     * @type object
     * @private
     */
    this._dims = {};
    
    /**
     * A list of the dimension types.
     * 
     * @type pvc.data.DimensionType[]
     * @private
     */
    this._dimsList = [];
    
    /**
     * A list of the dimension type names.
     * 
     * @type string[]
     * @private
     */
    this._dimsNames = [];
    
    /**
     * An index of the dimension types by group name.
     * 
     * @type object
     * @private
     */
    this._dimsByGroup = {};
    
    /**
     * An index of the dimension type names by group name.
     * 
     * @type object
     * @private
     */
    this._dimsNamesByGroup = {};
    
    if(dimTypeSpecs) {
        for(var name in dimTypeSpecs){
            this.addDimension(name, dimTypeSpecs[name]);
        }
    }
})
.add(/** @lends pvc.data.ComplexType# */{
    
    /**
     * Obtains a dimension type given its name.
     * 
     * <p>
     * If no name is specified,
     * a map with all dimension types indexed by name is returned.
     * Do <b>NOT</b> modify this map.
     * </p>
     * 
     * @param {string} [name] The dimension type name.
     * 
     * @param {object} [keyArgs] Keyword arguments
     * @param {boolean} [keyArgs.assertExists=true] Indicates that an error is signaled 
     * if a dimension type with the specified name does not exist.
     * 
     * @type pvc.data.DimensionType | pvc.data.DimensionType[] | null
     */
    dimensions: function(name, keyArgs){
        if(name == null) {
            return this._dims;
        }
        
        var dimType = def.getOwn(this._dims, name, null);
        if(!dimType && def.get(keyArgs, 'assertExists', true)) {
            throw def.error.argumentInvalid('name', "Undefined dimension '{0}'", [name]); 
        }
        
        return dimType;
    },
    
    /**
     * Obtains an array with all the dimension types.
     * 
     * <p>
     * Do <b>NOT</b> modify the returned array. 
     * </p>
     * @type pvc.data.DimensionType[]
     */
    dimensionsList: function(){
        return this._dimsList;
    },
    
    /**
     * Obtains an array with all the dimension type names.
     * 
     * <p>
     * Do <b>NOT</b> modify the returned array. 
     * </p>
     * @type string[]
     */
    dimensionsNames: function(){
        return this._dimsNames;
    },
    
    /**
     * Obtains an array of the dimension types of a given group.
     * 
     * <p>
     * Do <b>NOT</b> modify the returned array. 
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * @param {boolean} [keyArgs.assertExists=true] Indicates if an error is signaled when the specified group name is undefined.
     * 
     * @type pvc.data.DimensionType[]
     */
    groupDimensions: function(group, keyArgs){
        var dims = def.getOwn(this._dimsByGroup, group);
        if(!dims && def.get(keyArgs, 'assertExists', true)) {
            throw def.error.operationInvalid("There is no dimension type group with name '{0}'.", [group]);
        }
        
        return dims;
    },
    
    /**
     * Obtains an array of the dimension type names of a given group.
     * 
     * <p>
     * Do <b>NOT</b> modify the returned array. 
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * @param {boolean} [keyArgs.assertExists=true] Indicates if an error is signaled when the specified group name is undefined.
     *  
     * @type string[]
     */
    groupDimensionsNames: function(group, keyArgs){
        var dimNames = def.getOwn(this._dimsNamesByGroup, group);
        if(!dimNames && def.get(keyArgs, 'assertExists', true)) {
            throw def.error.operationInvalid("There is no dimension type group with name '{0}'.", [group]);
        }
        
        return dimNames;
    },
    
    /**
     * Creates and adds to the complex type a new dimension type, 
     * given its name and specification.
     * 
     * @param {string} name The name of the dimension type.
     * @param {object} [dimTypeSpec] The dimension type specification.
     * Essentially its a <i>keyArgs</i> object.
     * See {@link pvc.data.DimensionType}'s <i>keyArgs</i> constructor
     * to know about available arguments.
     *  
     * @type {pvc.data.DimensionType}
     */
    addDimension: function(name, dimTypeSpec){
        // <Debug>
        name || def.fail.argumentRequired('name');
        !def.hasOwn(this._dims, name) || def.fail.operationInvalid("A dimension type with name '{0}' is already defined.", [name]);
        // </Debug>
        
        var dimension = new pvc.data.DimensionType(this, name, dimTypeSpec);
        this._dims[name] = dimension;
        this._dimsList.push(dimension);
        this._dimsNames.push(name);
        
        // group
        
        var group = dimension.group;
        if(group) {
            var groupDims = def.getOwn(this._dimsByGroup, group),
                groupDimsNames;
            
            if(!groupDims) {
                groupDims = this._dimsByGroup[group] = [];
                groupDimsNames = this._dimsNamesByGroup[group] = [];
            } else {
                groupDimsNames = this._dimsNamesByGroup[group];
            }
            
            var level = def.array.insert(groupDimsNames, name, def.compare);
            def.array.insertAt(groupDims, ~level, dimension);
        }
        
        return dimension;
    }
});
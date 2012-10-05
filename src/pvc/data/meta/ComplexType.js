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
     * An object with the dimension indexes by dimension name.
     * 
     * @type object
     * @private
     */
    this._dimsIndexByName = {};
    
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
    describe: function(){

        var out = ["\n------------------------------------------"];
        out.push("Complex Type Information");
        
        this._dimsList.forEach(function(type){
            var features = [];
            
            features.push(type.valueTypeName);
            if(type.isComparable) { features.push("comparable"); }
            if(!type.isDiscrete)  { features.push("continuous"); }
            if(type.isHidden)     { features.push("hidden"); }

            out.push("  " + type.name + " (" + features.join(', ') + ")");
        });
        
        out.push("------------------------------------------");

        return out.join("\n");
    },
    
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
        /*jshint expr:true */
        name || def.fail.argumentRequired('name');
        !def.hasOwn(this._dims, name) || def.fail.operationInvalid("A dimension type with name '{0}' is already defined.", [name]);
        // </Debug>
        
        var dimension = new pvc.data.DimensionType(this, name, dimTypeSpec);
        this._dims[name] = dimension;
        this._dimsIndexByName[name] = this._dimsList.length;
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
        
        this._isPctRoleDimTypeMap = null;
        
        return dimension;
    },
    
    /**
     * Obtains a map of the dimension types, indexed by their name,
     * that are playing a role such that {@link pvc.visual.Role#isPercent} is <tt>true</tt>.
     * 
     * @type def.Map
     */
    getPlayingPercentVisualRoleDimensionMap: function(){
        var map = this._isPctRoleDimTypeMap;
        if(!map) {
            map = this._isPctRoleDimTypeMap = new def.Map(
                def.query(def.own(this._dims))
                    .where(function(dimType){ return dimType.playingPercentVisualRole(); })
                    .object({
                        name: function(dimType) { return dimType.name; } 
                    }));
        }
        
        return map;
    },
    
    /**
     * Sorts a specified dimension array in place, 
     * according to the definition order.
     * 
     * @param {any[]} dims Array of dimension names.
     * @param {function} [nameKey] Allows extracting the dimension name from
     * each of the elements of the specified array.
     * 
     * @type undefined
     */
    sortDimensionNames: function(dims, nameKey){
        var dimsIndexByName = this._dimsIndexByName;
        
        dims.sort(function(da, db){
            return def.compare(
                    dimsIndexByName[nameKey ? nameKey(da) : da],
                    dimsIndexByName[nameKey ? nameKey(db) : db]);
                    
        });
    }
});

/**
 * Called by a dimension type to indicate that its assigned roles have changed.
 * 
 * @name pvc.data.ComplexType#_dimensionRolesChanged
 * @function
 * @param {pvc.data.DimensionType} dimType The affected dimension type.
 * @type undefined
 * @private
 * @internal
 */
function compType_dimensionRolesChanged(dimType) {
    this._isPctRoleDimTypeMap = null;
}
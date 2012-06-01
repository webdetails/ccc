
/**
 * Initializes a dimension instance.
 * 
 * @name pvc.data.Dimension
 * 
 * @class A dimension holds unique atoms,
 * of a given dimension type,
 * and for a given data instance.
 *
 * @property {pvc.data.Data} data The data that owns this dimension.
 * @property {pvc.data.DimensionType} type The dimension type of this dimension.
 * @property {string} name Much convenient property with the name of {@link #type}.
 * 
 * @property {pvc.data.Dimension} parent The parent dimension.
 * A root dimension has a null parent.
 * 
 * @property {pvc.data.Dimension} linkParent The link parent dimension.
 * 
 * @property {pvc.data.Dimension} root The root dimension.
 * A root dimension has itself as the value of {@link #root}.
 * 
 * @property {pvc.data.Dimension} owner The owner dimension.
 * An owner dimension is the topmost root dimension (accessible from this one).
 * An owner dimension owns its atoms, while others simply contain them.
 * The value of {@link pvc.data.Atom#dimension} is an atom's <i>owner</i> dimension.
 * 
 * @constructor
 * 
 * @param {pvc.data.Data} data The data that owns this dimension.
 * @param {pvc.data.DimensionType} type The type of this dimension.
 */

def.type('pvc.data.Dimension')
.init(function(data, type){
    this.data  = data;
    this.type  = type;
    this.root  = this;
    this.owner = this;
    this.name  = type.name;
    
    // Cache
    // -------
    // The atom id comparer ensures we keep atoms in the order they were added, 
    //  even when no semantic comparer is provided.
    // This is important, at least, to keep the visible atoms cache in the correct order.
    this._atomComparer = type.atomComparer();
    this._atomsByKey = {};
    
    if(data.isOwner()){
        // Owner
        // Atoms are interned by #intern
        this._atoms = [];
        
        dim_createVirtualNullAtom.call(this);
        
    } else {
        // Not an owner
        
        var source; // Effective parent / atoms source
        if(data.parent){
            // Not a root
            source = data.parent.dimensions(this.name);
            dim_addChild.call(source, this);
            
            this.root = data.parent.root;
        } else {
            // A root that is not topmost
            data.linkParent || def.assert("Data must have a linkParent");
            
            source = data.linkParent.dimensions(this.name);
            dim_addLinkChild.call(source, this);
        }
        
        // Not in _atomsKey
        this._nullAtom = this.owner._nullAtom; // may be null
        
        this._lazyInit = function(){ /* captures 'source' variable */
            this._lazyInit = null;
            
            // Collect distinct atoms in data._datums
            this.data._datums.forEach(function(datum){
                // NOTE: Not checking if atom is already added,
                // but it has no adverse side-effect.
                var atom = datum.atoms[this.name];
                this._atomsByKey[atom.key] = atom;
            }, this);
            
            // Filter parentEf dimension's atoms; keeps order.
            this._atoms = source.atoms().filter(function(atom){
                return def.hasOwn(this._atomsByKey, atom.key);
            }, this);
        };
    }
})
.add(/** @lends pvc.data.Dimension# */{
    
    parent: null,
    
    linkParent: null,
    
    /**
     * The array of child dimensions.
     * @type pvc.data.Dimension[] 
     */
    _children: null,
    
    /**
     * The array of link child dimensions.
     * @type pvc.data.Dimension[] 
     */
    _linkChildren: null,
    
    /**
     * A map of the contained atoms by their {@link pvc.data.Atom#key} property.
     * 
     * Supports the intern(...), atom(.), and the control of the visible atoms cache.
     *
     * @type object
     */
    _atomsByKey: null,
    
    /**
     * A map of the count of visible datums per atom {@link pvc.data.Atom#key} property.
     *
     * @type object
     */
    _atomVisibleDatumsCount: null, 
    
    /** 
     * Indicates if the object has been disposed.
     * 
     * @type boolean
     * @private 
     */
    _disposed: false,

    /**
     * The atom with a null value.
     *
     * @type pvc.data.Atom
     * @private
     */
    _nullAtom: null,
    
    /**
     * The virtual null atom.
     *
     * <p>
     * This atom exists to resolve situations 
     * where a null atom does not exist in the loaded data.
     * When a null <i>datum</i> is built, it may not specify
     * all dimensions. When such an unspecified dimension
     * is accessed the virtual null atom is returned by 
     * lookup of the atoms prototype chain (see {@link pvc.data.Data#_atomsBase}.
     * </p>
     * 
     * @type pvc.data.Atom
     * @private
     */
    _virtualNullAtom: null,
    
    /**
     * Cache of sorted visible and invisible atoms.
     * A map from visible state to {@link pvc.data.Atom[]}.
     * <p>
     * Cleared whenever any atom's "visible state" changes.
     * </p>
     * 
     * @type object
     * @private
     */
    _visibleAtoms: null, 
    
    /**
     * Cache of sorted visible and invisible indexes.
     * A map from visible state to {@link number[]}.
     * <p>
     * Cleared whenever any atom's "visible state" changes.
     * </p>
     * 
     * @type object
     * @private
     */
    _visibleIndexes: null,
    
    /**
     * Cache of the dimension type's normal order atom comparer.
     * 
     * @type function
     * @private
     */
    _atomComparer: null,
    
    /**
     * The ordered array of contained atoms.
     * <p>
     * The special null atom, if existent, is the first item in the array.
     *</p>
     *<p>
     * On a child dimension it is a filtered version 
     * of the parent's array, 
     * and thus has the same atom relative order.
     * 
     * In a link child dimension it is copy
     * of the link parent's array.
     * </p>
     * 
     * @type pvc.data.Atom[]
     * @see #_nullAtom
     */
    _atoms: null,

    /**
     * An object with cached results of the {@link #sum} method.
     *
     * @type object
     */
    _sumCache: null,

    /**
     * Obtains the number of atoms contained in this dimension.
     * 
     * <p>
     * Consider calling this method on the root or owner dimension.
     * </p>
     *
     * @returns {Number} The number of contained atoms.
     *
     * @see pvc.data.Dimension#root
     * @see pvc.data.Dimension#owner
     */
    count: function(){
        if(this._lazyInit) { this._lazyInit(); }
        return this._atoms.length;
    },
    
    /**
     * Indicates if an atom belonging to this dimension 
     * is considered visible in it.
     * 
     * <p>
     * An atom is considered visible in a dimension
     * if there is at least one datum of the dimension's data
     * that has the atom and is visible.
     * </p>
     *
     * @param {pvc.data.Atom} atom The atom of this dimension whose visible state is desired.
     * 
     * @type boolean
     */
    isVisible: function(atom){
        if(this._lazyInit) { this._lazyInit(); }
        
        // <Debug>
        def.hasOwn(this._atomsByKey, atom.key) || def.assert("Atom must exist in this dimension.");
        // </Debug>
        
        return dim_getVisibleDatumsCountMap.call(this)[atom.key] > 0;
    },
    
    /**
     * Obtains the atoms contained in this dimension,
     * possibly filtered.
     * 
     * <p>
     * Consider calling this method on the root or owner dimension.
     * </p>
     * 
     * @param {Object} [keyArgs] Keyword arguments.
     * @param {boolean} [keyArgs.visible=null] 
     *      Only considers atoms that  
     *      have the specified visible state.
     * 
     * @returns {pvc.data.Atom[]} An array with the requested atoms.
     * Do <b>NOT</b> modify the returned array.
     * 
     * @see pvc.data.Dimension#root
     * @see pvc.data.Dimension#owner
     */
    atoms: function(keyArgs){
        if(this._lazyInit) { this._lazyInit(); }
        
        var visible = def.get(keyArgs, 'visible');
        if(visible == null){
            return this._atoms;
        }
        
        visible = !!visible;
        
        this._visibleAtoms || (this._visibleAtoms = {});
        
        return this._visibleAtoms[visible] || 
               (this._visibleAtoms[visible] = dim_calcVisibleAtoms.call(this, visible));
    },
    
    /**
     * Obtains the local indexes of all, visible or invisible atoms.
     * 
     * @param {Object} [keyArgs] Keyword arguments.
     * @param {boolean} [keyArgs.visible=null] 
     *      Only considers atoms that 
     *      have the specified visible state.
     * 
     * @type number[]
     */
    indexes: function(keyArgs){
        if(this._lazyInit) { this._lazyInit(); }
        
        var visible = def.get(keyArgs, 'visible');
        if(visible == null) {
            // Not used much so generate each time
            return pv.range(0, this._atoms.length);
        }
        
        visible = !!visible;
        
        this._visibleIndexes || (this._visibleIndexes = {});
        return this._visibleIndexes[visible] || 
               (this._visibleIndexes[visible] = dim_calcVisibleIndexes.call(this, visible));
    },
    
    /**
     * Obtains an atom that represents the specified value, if one exists.
     * 
     * @param {any} value A value of the dimension type's {@link pvc.data.DimensionType#valueType}.
     * 
     * @returns {pvc.data.Atom} The existing atom with the specified value, or null if there isn't one.
     */
    atom: function(value){
        if(value == null || value === '') {
            return this._nullAtom; // may be null
        }
        
        if(value instanceof pvc.data.Atom) {
            return value;
        }
        
        if(this._lazyInit) { this._lazyInit(); }

        var key = this.type._key ? this.type._key.call(null, value) : value;
        return this._atomsByKey[key] || null; // undefined -> null
    },
    
    /**
     * Obtains the minimum and maximum atoms of the dimension,
     * possibly filtered.
     * 
     * <p>
     * Assumes that the dimension type is comparable.
     * If not the result will coincide with "first" and "last".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * <p>
     * Consider calling this method on the root or owner dimension.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link #atoms} for a list of available filtering keyword arguments. 
     *
     * @returns {object} 
     * An extent object with 'min' and 'max' properties, 
     * holding the minimum and the maximum atom, respectively,
     * if at least one atom satisfies the selection;
     * undefined otherwise.
     * 
     * @see #root
     * @see #owner
     * @see #atoms
     * @see pvc.data.DimensionType.isComparable
     */
    extent: function(keyArgs){
        // Assumes atoms are sorted (null, if existent is the first).
        var atoms  = this.atoms(keyArgs),
            L = atoms.length,
            offset = this._nullAtom && atoms[0].value == null ? 1 : 0;
        
        return (L > offset) ?
               {min: atoms[offset], max: atoms[L - 1]} :
               undefined;
    },
    
    /**
     * Obtains the minimum atom of the dimension,
     * possibly after filtering.
     * 
     * <p>
     * Assumes that the dimension type is comparable.
     * If not the result will coincide with "first".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * <p>
     * Consider calling this method on the root or owner dimension.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link #atoms} for a list of available filtering keyword arguments. 
     *
     * @returns {pvc.data.Atom} The minimum atom satisfying the selection;
     * undefined if none.
     * 
     * @see #root
     * @see #owner
     * @see #atoms
     * @see pvc.data.DimensionType.isComparable
     */
    min: function(keyArgs){
        // Assumes atoms are sorted.
        var atoms = this.atoms(keyArgs),
            L = atoms.length,
            offset = this._nullAtom && atoms[0].value == null ? 1 : 0;
        
        return (L > offset) ? atoms[offset] : undefined;
    },
    
    /**
     * Obtains the maximum atom of the dimension,
     * possibly after filtering.
     * 
     * <p>
     * Assumes that the dimension type is comparable.
     * If not the result will coincide with "last".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * <p>
     * Consider calling this method on the root or owner dimension.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link #atoms} for a list of available filtering keyword arguments. 
     *
     * @returns {pvc.data.Atom} The maximum atom satisfying the selection;
     * undefined if none.
     * 
     * @see #root
     * @see #owner
     * @see #atoms
     * 
     * @see pvc.data.DimensionType.isComparable
     */
    max: function(keyArgs){
        // Assumes atoms are sorted.
        var atoms = this.atoms(keyArgs),
            L = atoms.length;
        
        return L > 0 && atoms[L - 1].value != null ? atoms[L - 1] : undefined;
    },
    
    /**
     * Obtains the sum of this dimension's values over all datums of the data,
     * possibly after filtering.
     * 
     * <p>
     * Assumes that the dimension type {@link pvc.data.DimensionType#valueType} is "Number".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link pvc.data.Data#datums} for a list of available filtering keyword arguments. 
     *
     * @param {boolean} [keyArgs.abs=false] Indicates if it is the sum of the absolute value that is desired.
     * @param {boolean} [keyArgs.zeroIfNone=true] Indicates that zero should be returned when there are no datums
     * or no datums with non-null values.
     * When <tt>false</tt>, <tt>null</tt> is returned, in that situation.
     *
     * @returns {number} The sum of considered datums or <tt>0</tt> or <tt>null</tt>, if none.
     * 
     * @see #root
     * @see #owner
     * @see #atoms
     */
    sum: function(keyArgs){
        var isAbs = !!def.get(keyArgs, 'abs', false),
            zeroIfNone = def.get(keyArgs, 'zeroIfNone', true),
            key   = dim_buildDatumsFilterKey(keyArgs) + ':' + isAbs;
              
        var sum = def.getOwn(this._sumCache, key);
        if(sum === undefined) {
            var dimName = this.name;
            sum = this.data.datums(null, keyArgs).reduce(function(sum, datum){
                var value = datum.atoms[dimName].value;
                if(isAbs && value < 0){ // null < 0 is false
                    value = -value;
                }

                return sum != null ? (sum + value) : value; // null preservation
            },
            null);
            
            (this._sumCache || (this._sumCache = {}))[key] = sum;
        }
        
        return zeroIfNone ? (sum || 0) : sum;
    },
    
    /**
     * Obtains the percentage of a specified atom or value,
     * over the <i>sum</i> of the absolute values of a specified datum set.
     * 
     * <p>
     * Assumes that the dimension type {@link pvc.data.DimensionType#valueType} is "Number".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * @param {pvc.data.Atom|any} [atomOrValue] The atom or value on which to calculate the percent.
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link pvc.data.Dimension#sum} for a list of available filtering keyword arguments. 
     *
     * @returns {number} The calculated percentage.
     * 
     * @see #root
     * @see #owner
     */
    percent: function(atomOrValue, keyArgs){
        var value = (atomOrValue instanceof pvc.data.Atom) ? atomOrValue.value : atomOrValue;
        if(!value) { // nully or zero
            return 0;
        }
        // if value != 0 => sum != 0, but JIC, we test for not 0...
        var sum = this.sum(def.create(keyArgs, {abs: true}));
        return sum ? (Math.abs(value) / sum) : 0;
    },
    
    /**
     * Obtains the percentage of the local <i>sum</i> of a specified selection,
     * over the <i>sum</i> of the absolute values of an analogous selection in the parent data.
     * 
     * <p>
     * Assumes that the dimension type {@link pvc.data.DimensionType#valueType} is "Number".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link pvc.data.Dimension#sum} for a list of available filtering keyword arguments. 
     *
     * @returns {number} The calculated percentage.
     * 
     * @see #root
     * @see #owner
     */
    percentOverParent: function(keyArgs){
        var value = this.sum(keyArgs); // normal sum
        if(!value) { // nully or zero
            return 0;
        }
        
        // if value != 0 => sum != 0, but JIC, we test for not 0...
        var parentData = this.data.parent;
        if(!parentData) {
            return 0;
        }

        // The following would not work because, in each group,
        //  abs would not be used...
        //var sum = parentData.dimensions(this.name).sum();

        var sum = parentData.dimensionsSumAbs(this.name, keyArgs);

        return sum ? (Math.abs(value) / sum) : 0;
    },
    
    
    format: function(value, sourceValue){
        return "" + (this.type._formatter ? this.type._formatter.call(null, value, sourceValue) : "");
    },
    
    /**
     * Obtains an atom that represents the specified sourceValue,
     * creating one if one does not yet exist.
     * 
     * <p>
     * Used by a translation to 
     * obtain atoms of a dimension for raw values of source items.
     * </p>
     * <p>
     * This method can only be called on an owner dimension.
     * </p>
     * <p>
     * An empty string value is considered equal to a null value. 
     * </P>
     * @param {any} sourceValue The source value.
     *
     * @type pvc.data.Atom
     */
    intern: function(sourceValue){
        // <Debug>
        (this.owner === this) || def.assert("Can only internalize on an owner dimension.");
        // </Debug>
        
        // NOTE:
        // This function is performance critical!
      
        // The null path and the existing atom path 
        // are as fast and direct as possible
        
        // - NULL -
        if(sourceValue == null || sourceValue === '') {
            return this._nullAtom || dim_createNullAtom.call(this, sourceValue);
        }
        
        var type = this.type;
        
        // - CONVERT - 
        var value, label;
        if(type._converter){
            value = type._converter.call(null, sourceValue);
        } else if(typeof sourceValue === 'object' && ('v' in sourceValue)){
            // Assume google table style cell {v: , f: }
            value = sourceValue.v;
            label = sourceValue.f;
        } else {
            value = sourceValue;
        }
        
        if(value == null || value === '') {
            // Null after all
            return this._nullAtom || dim_createNullAtom.call(this, sourceValue);
        }
        
        // - CAST -
        // Any cast function?
        if(type.cast) {
            value = type.cast.call(null, value);
            if(value == null || value === ''){
                // Null after all (normally a cast failure)
                return this._nullAtom || dim_createNullAtom.call(this);
            }
        }
        
        // - KEY -
        var key = '' + (type._key ? type._key.call(null, value) : value);
        // <Debug>
        key || def.fail.operationInvalid("Only a null value can have an empty key.");
        // </Debug>
        
        // - ATOM -
        var atom = this._atomsByKey[key];
        if(atom) {
            return atom;
        }
        
        // - LABEL -
        if(label == null){
            if(type._formatter){
                label = type._formatter.call(null, value, sourceValue);
            } else {
                label = value;
            }
        }

        label = "" + label; // J.I.C.
        
        if(!label && pvc.debug >= 2){
            pvc.log("Only the null value should have an empty label.");
        }
        
        // - ATOM! -
        atom = new pvc.data.Atom(this, value, label, sourceValue, key);
        
        // Insert atom in order (or at the end when !_atomComparer)
        def.array.insert(this._atoms, atom, this._atomComparer);
        
        dim_clearVisiblesCache.call(this);
        
        this._atomsByKey[key] = atom;
        
        return atom;
    },
    
    /**
     * Disposes the dimension and all its children.
     */
    dispose: function(){
        if(!this._disposed){
            
            data_disposeChildList(this._children,     'parent');
            data_disposeChildList(this._linkChildren, 'linkParent');
            
            // myself
            
            this.parent     &&  dim_removeChild.call(this.parent, this);
            this.linkParent &&  dim_removeLinkChild.call(this.linkParent, this);
            
            dim_clearVisiblesCache.call(this);
            
            this._lazyInit  = null;
            
            this._atoms = 
            this._nullAtom = 
            this._virtualNullAtom = null;
            
            this._disposed = true;
        }
    }
});

/**
 * Builds a key string suitable for identifying a call to {@link pvc.data.Data#datums}
 * with no where specification.
 *
 * @name pvc.data.Dimension#_buildDatumsFilterKey
 * @function
 * @param {object} [keyArgs] The keyword arguments used in the call to {@link pvc.data.Data#datums}.
 * @type string
 */
function dim_buildDatumsFilterKey(keyArgs){
    var visible  = def.get(keyArgs, 'visible'),
        selected = def.get(keyArgs, 'selected');
    return (visible == null ? null : !!visible) + ':' + (selected == null ? null : !!selected);
}

/**
 * Creates the null atom if it isn't created yet.
 * 
 * @name pvc.data.Dimension#_createNullAtom
 * @function
 * @param {any} [sourceValue] The source value of null. Can be used to obtain the null format.
 * @type undefined
 * @private
 */
function dim_createNullAtom(sourceValue){
    // <Debug>
    (this.owner === this) || def.assert("Can only create atoms on an owner dimension.");
    // </Debug>
    
    if(!this._nullAtom){
        var label = "" + (this.type._formatter ? this.type._formatter.call(null, null, sourceValue) : "");
        
        this._nullAtom = new pvc.data.Atom(this, null, label, null, '');
        
        this._atomsByKey[''] = this._nullAtom;
        
        this._atoms.unshift(this._nullAtom);
        
        this.data._atomsBase[this.name] = this._nullAtom; 
    }
    
    return this._nullAtom;
}

/**
 * Creates the virtual null atom if it isn't created yet.
 * 
 * @name pvc.data.Dimension#_createNullAtom
 * @function
 * @type undefined
 * @private
 */
function dim_createVirtualNullAtom(){
    // <Debug>
    (this.owner === this) || def.assert("Can only create atoms on an owner dimension.");
    // </Debug>
    
    if(!this._virtualNullAtom){
        var label = "" + (this.type._formatter ? this.type._formatter.call(null, null, null) : "");
        
        this._virtualNullAtom = new pvc.data.Atom(this, null, label, null, '');

        this.data._atomsBase[this.name] = this._virtualNullAtom; 
    }
    
    return this._virtualNullAtom;
}

/**
 * Uninternalizes the specified atom from the dimension (internal).
 * 
 * @name pvc.data.Dimension#_unintern
 * @function
 * @param {pvc.data.Atom} The atom to uninternalize.
 * @type undefined
 * @private
 * @internal
 */
function dim_unintern(atom){
    // <Debug>
    (this.owner === this) || def.assert("Can only unintern atoms on an owner dimension.");
    (atom && atom.dimension === this) || def.assert("Not an interned atom");
    // </Debug>
    
    if(atom === this._virtualNullAtom){
        return;
    }
    
    // Remove the atom
    var key = atom.key;
    if(this._atomsByKey[key] === atom){
        def.array.remove(this._atoms, atom, this._atomComparer);
        delete this._atomsByKey[key];
        
        if(!key){
            delete this._nullAtom;
            this.data._atomsBase[this.name] = this._virtualNullAtom;
        }
    }
    
    dim_clearVisiblesCache.call(this);
}

/**
 * Clears all caches affected by datum/atom visibility.
 * 
 * @name pvc.data.Dimension#_clearVisiblesCache
 * @function
 * @type undefined
 * @private
 * @internal
 */
function dim_clearVisiblesCache(){
    this._atomVisibleDatumsCount =
    this._sumCache =
    this._visibleAtoms = 
    this._visibleIndexes = null;
}

/**
 * Called by a dimension's data when its datums have changed.
 * 
 * @name pvc.data.Dimension#_onDatumsChanged
 * @function
 * @type undefined
 * @private
 * @internal
 */
function dim_onDatumsChanged(){
    dim_clearVisiblesCache.call(this);
}

/**
 * Adds a child dimension.
 * 
 * @name pvc.data.Dimension#_addChild
 * @function
 * @param {pvc.data.Dimension} child The child to add.
 * @type undefined
 * @private
 */
function dim_addChild(child){
    data_addColChild(this, '_children', child, 'parent');
    
    child.owner = this.owner;
}

/**
 * Removes a child dimension.
 *
 * @name pvc.data.Dimension#_removeChild
 * @function
 * @param {pvc.data.Dimension} child The child to remove.
 * @type undefined
 * @private
 */
function dim_removeChild(child){
    data_removeColChild(this, '_children', child, 'parent');
}

/**
 * Adds a link child dimension.
 * 
 * @name pvc.data.Dimension#_addLinkChild
 * @function
 * @param {pvc.data.Dimension} child The link child to add.
 * @type undefined
 * @private
 */
function dim_addLinkChild(linkChild){
    data_addColChild(this, '_linkChildren', linkChild, 'linkParent');
    
    linkChild.owner = this.owner;
}

/**
 * Removes a link child dimension.
 *
 * @name pvc.data.Dimension#_removeLinkChild
 * @function
 * @param {pvc.data.Dimension} linkChild The child to remove.
 * @type undefined
 * @private
 */
function dim_removeLinkChild(linkChild){
    data_removeColChild(this, '_linkChildren', linkChild, 'linkParent');
}

/**
 * Called by the data of this dimension when 
 * the visible state of a datum has changed. 
 * 
 * @name pvc.data.Dimension#_onDatumVisibleChanged
 * @function
 * @type undefined
 * @private
 * @internal
 */
function dim_onDatumVisibleChanged(datum, visible) {
    var map;
    if(!this._disposed && (map = this._atomVisibleDatumsCount)) {
        var atom = datum.atoms[this.name],
            key = atom.key;
        
        // <Debug>
        def.hasOwn(this._atomsByKey, key) || def.assert("Atom must exist in this dimension.");
        // </Debug>
        
        var count = map[key];
        
        // <Debug>
        (visible || (count > 0)) || def.assert("Must have had accounted for at least one visible datum."); 
        // </Debug>
        
        map[key] = (count || 0) + (visible ? 1 : -1);
        
        // clear dependent caches
        this._visibleAtoms =
        this._sumCache = 
        this._visibleIndexes = null;
    }
}

/**
 * Obtains the map of visible datums count per atom, 
 * creating the map if necessary.
 * 
 * @name pvc.data.Dimension#_getVisibleDatumsCountMap
 * @function
 * @type undefined
 * @private
 */
function dim_getVisibleDatumsCountMap() {
    var map = this._atomVisibleDatumsCount;
    if(!map) {
        map = {};
        
        this.data.datums(null, {visible: true}).each(function(datum){
            var atom = datum.atoms[this.name],
                key  = atom.key;
            map[key] = (map[key] || 0) + 1;
        }, this);
        
        this._atomVisibleDatumsCount = map;
    }
    
    return map;
}

/**
 * Calculates the list of indexes of visible or invisible atoms.
 * <p>
 * Does not include the null atom.
 * </p>
 * 
 * @name pvc.data.Dimension#_calcVisibleIndexes
 * @function
 * @param {boolean} visible The desired atom visible state.
 * @type number[]
 * @private
 */
function dim_calcVisibleIndexes(visible){
    var indexes = [];
    
    this._atoms.forEach(function(atom, index){
        if(this.isVisible(atom) === visible) {
            indexes.push(index);
        }
    }, this);
    
    return indexes;
}

/**
 * Calculates the list of visible or invisible atoms.
 * <p>
 * Does not include the null atom.
 * </p>
 * 
 * @name pvc.data.Dimension#_calcVisibleAtoms
 * @function
 * @param {boolean} visible The desired atom visible state.
 * @type number[]
 * @private
 */
function dim_calcVisibleAtoms(visible){
    return def.query(this._atoms)
            .where(function(atom){ return this.isVisible(atom) === visible; }, this)
            .array();
}
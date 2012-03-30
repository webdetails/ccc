
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
    
    /**
     * A map of the contained atoms by their {@link pvc.data.Atom#key} property.
     * 
     * Supports the intern(...), atom(.), and the control of the visible atoms cache.
     *
     * @type object
     */
    this._atomsByKey = {};
    
    if(data.isOwner()){
        // Owner
        // Atoms are interned by #intern
        this._atoms = [];
        
        dim_createNullAtom.call(this);
        
    } else {
        // Not an owner
        
        var source;
        if(data.parent){
            // Not a root
            source = data.parent.dimensions(this.name);
            dim_addChild.call(source, this);
            
            this.root  = parent.root;
        } else {
            // A root that is not topmost
            data.linkParent || def.assert("Data must have a linkParent");
            
            source = data.linkParent.dimensions(this.name);
            dim_addLinkChild.call(source, this);
        }
        
        // Not in _atomsKey
        this._nullAtom = this.owner._nullAtom;
        
        // Collect distinct atoms in data._datums
        this.data._datums.forEach(function(datum){
            // NOTE: Not checking if atom is already added,
            // but it has no adverse side-effect.
            var atom = datum.atoms[this.name];
            this._atomsByKey[atom.key] = atom;
        }, this);
        
        // Filter parentEf dimension's atoms; keeps order.
        this._atoms = source._atoms.filter(function(atom){
            return def.hasOwn(this._atomsByKey, atom.key);
        }, this);
    }
})
.add(/** @lends pvc.data.Dimension# */{
    
    parent: null,
    
    /**
     * The array of child dimensions.
     * @type pvc.data.Dimension[] 
     */
    _children: null,
    
    linkParent: null,
    
    /**
     * The array of link child dimensions.
     * @type pvc.data.Dimension[] 
     */
    _linkChildren: null,
    
    /** 
     * Indicates if the object has been disposed.
     * 
     * @type boolean
     * @private 
     */
    _disposed: false,

    /**
     * The atom with a null value.
     * Supports the interning operation.
     *
     * @type pvc.data.Atom
     * @private
     */
    _nullAtom: null,
    
    /**
     * Cache of sorted visible atoms.
     * 
     * @type pvc.data.Atom[]
     * @private
     */
    _visibleAtoms: null, 
    
    /**
     * Cache of visible indexes.
     * Cleared whenever any atom's visible state changes.
     * 
     * @type number[]
     * @private
     */
    _visibleIndexes: null,
    
    /**
     * Cache of sorted invisible atoms.
     * Cleared whenever any atom's visible state changes.
     * 
     * @type pvc.data.Atom[]
     * @private
     */
    _invisibleAtoms: null, 
    
    /**
     * Cache of invisible indexes.
     * Cleared whenever any atom's visible state changes.
     * 
     * @type number[]
     * @private
     */
    _invisibleIndexes: null,
    
    /**
     * Cache of the dimension type's normal order atom comparer.
     * 
     * @type function
     * @private
     */
    _atomComparer: null,
    
    /**
     * The ordered array of contained atoms.
     * Does not include the special null atom.
     *
     * On a child dimension it is a filtered version 
     * of the parent's array, 
     * and thus has the same atom relative order.
     * 
     * In a link child dimension it is copy
     * of the link parent's array.
     * 
     * @type pvc.data.Atom[]
     * @private
     * 
     * @see #_nullAtom
     */
    _atoms: null,

    /**
     * Obtains the number of atoms contained in this dimension.
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
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
        return this._atoms.length;
    },

    /**
     * Obtains the atoms contained in this dimension,
     * possibly filtered.
     * 
     * <p>
     * The null atom is not returned.
     * </p>
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
        var visible = def.get(keyArgs, 'visible');
        if(visible == null){
            return this._atoms;
        }
        
        if(visible) {
            return this._visibleAtoms || 
                   (this._visibleAtoms = this._atoms.filter(function(atom){ return atom.isVisible; }));
        }
        
        return this._invisibleAtoms || 
                (this._invisibleAtoms = this._atoms.filter(function(atom){ return !atom.isVisible; }));
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
        var visible = def.get(keyArgs, 'visible');
        if(visible == null) {
            // Not used much so generate each time
            return pv.range(0, this._atoms.length);
        }
        
        if(visible) {
            return this._visibleIndexes || 
                   (this._visibleIndexes = dim_calcVisibleIndexes.call(this, true));
        }
        
        return this._invisibleIndexes || 
            (this._invisibleIndexes = dim_calcVisibleIndexes.call(this, false));
    },
    
    /**
     * Obtains an atom that represents the specified value, if one exists.
     * 
     * @param {any} value A value of the dimension type's {@link pvc.data.DimensionType#valueType}.
     * 
     * @returns {pvc.data.Atom} The existing atom with the specified value, or null if there isn't one.
     */
    atom: function(value){
        if(value == null) {
            return this._nullAtom;
        }
        
        if(value instanceof pvc.data.Atom) {
            return value;
        }
        
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
     * The null atom is not returned as minimum or maximum.
     * </p>
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
        // Assumes atoms are sorted.
        var atoms = this.atoms(keyArgs);
        return atoms.length ? 
                {min: atoms[0], max: atoms[atoms.length - 1]} :
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
     * The null atom is not returned.
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
        var atoms = this.atoms(keyArgs);
        return atoms.length ? atoms[0] : undefined;
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
     * The null atom is not returned.
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
        var atoms = this.atoms(keyArgs);
        return atoms.length ? atoms[atoms.length - 1] : undefined;
    },
    
    /**
     * Obtains the sum of the dimension's atom values,
     * possibly after filtering.
     * 
     * <p>
     * Assumes that the dimension type {@link pvc.data.DimensionType#valueType} is "Number".
     * </p>
     * 
     * <p>
     * The null atom is not considered.
     * </p>
     * 
     * <p>
     * Consider calling this method on the root or owner dimension.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link #atoms} for a list of available filtering keyword arguments. 
     *
     * @returns {number} The sum of considered atoms or undefined if none.
     * 
     * @see #root
     * @see #owner
     * @see #atoms
     */
    sum: function(keyArgs){
        // TODO: cache, how to key?
        var atoms = this.atoms(keyArgs);
        return atoms.length ? pv.sum(atoms) : undefined;
    },
    
    /**
     * Obtains an atom that represents the specified rawValue, 
     * creating one if one does not yet exist.
     * 
     * <p>
     * Used by a translation to 
     * obtain atoms of a dimension for raw values of source items.
     * </p>
     * <p>
     * This method can only be called on an owner dimension.
     * </p>
     * 
     * @param {any} rawValue A raw value.
     * @param {any} [sourceItem] A translation source item.
     *
     * @type pvc.data.Atom
     */
    intern: function(rawValue, sourceItem){
        // <Debug>
        (this.owner === this) || def.assert("Can only internalize on an owner dimension.");
        // </Debug>
        
        // NOTE:
        // This function is performance critical!
        // The null path and the existing atom path 
        // are as fast and direct as possible
        
        // - NULL -
        if(rawValue == null || rawValue === '') {
            return this._nullAtom;
        }
        
        var type = this.type;
        
        // - CONVERT - 
        var value = type._convert ? type._convert.call(null, rawValue, sourceItem, this) : rawValue;
        // <Debug>
        (value != null ) || def.fail.operationInvalid("Cannot convert to null");
        // </Debug>
        
        // - CAST -
        // Any type?
        if(type.valueType) {
            // Assume valueType functions are safe and do not return null values
            value = type.valueType.call(null, value);
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
        var label = "" + (type._format ? type._format.call(null, value, sourceItem, this) : value);
        // <Debug>
        label || def.fail.operationInvalid("Only a null value can have an empty label.");
        // </Debug>
        
        // - ATOM! -
        atom = new pvc.data.Atom(this, value, label, rawValue, key);
        
        // Insert atom in order (or at the end when !_atomComparer)
        def.array.insert(this._atoms, atom, this._atomComparer);
        
        if(this._visibleAtoms) {
            def.array.insert(this._visibleAtoms, atom, this._atomComparer);
        }
        
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
            
            this._visibleAtoms = 
            this._invisibleAtoms = 
            this._visibleIndexes =
            this._invisibleIndexes =
            this._atoms = 
            this._nullAtom = null;
            
            this._disposed = true;
        }
    }
});

/**
 * Creates the null atom.
 * 
 * @type undefined
 */
function dim_createNullAtom(){
    var label = "" + (this.type._format ? this.type._format.call(null, null, null, this) : "");
    
    this._nullAtom = new pvc.data.Atom(this, null, label, null, '');
    
    this._atomsByKey[''] = this._nullAtom;
}

/**
 * Uninternalizes the specified atom from the dimension (internal).
 * @param {pvc.data.Atom} The atom to uninternalize.
 * @private
 */
function dim_unintern(atom){
    // <Debug>
    (atom && atom.dimension === this) || def.assert("Not an interned atom");
    // </Debug>
    
    // Remove atom
    def.array.remove(this._atoms, atom, this._atomComparer);
    var visibleAtoms = atom.isVisible ? this._visibleAtoms : this._invisibleAtoms;  
    if(visibleAtoms) {
        def.array.remove(visibleAtoms, atom, this._atomComparer);
    }
    
    this._visibleIndexes =
    this._invisibleIndexes = null;
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
    
    child.owner  = this.owner;
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
 * Initially, 
 * called by an atom, 
 * on its owner dimension, 
 * when its visible state has changed (internal).
 * 
 * Then, called by parent and link parent dimensions
 * on their children and link children.
 * 
 * @name pvc.data.Dimension#_onAtomVisibleChanged
 * @function
 * @type undefined
 * @private
 */
function dim_onAtomVisibleChanged(atom, visible){
    if(!this._disposed){
        if(def.hasOwn(this._atomsByKey, atom.key)){
            
            // Update local visibles cache
            var removeVisibles = !visible ? this._visibleAtoms : this._invisibleAtoms;
            if(removeVisibles) {
                def.array.remove(removeVisibles, atom, this._atomComparer);
            }
            
            var addVisibles = visible ? this._visibleAtoms : this._invisibleAtoms;
            if(addVisibles) {
                def.array.insert(addVisibles, atom, this._atomComparer);
            }
            
            this._visibleIndexes =
            this._invisibleIndexes = null;
            
            // Notify children and link children,
            dim_notifyChildListAtomVisibleChanged(this._children, atom, visible);
            dim_notifyChildListAtomVisibleChanged(this._linkChildren, atom, visible);
        }
    }
}

/**
 * Notifies children or link children in list
 * that an atom's visible state has changed.
 * 
 * @name pvc.data.Dimension._notifyChildListAtomVisibleChanged
 * @function
 * @type undefined
 * @static
 * @private
 */
function dim_notifyChildListAtomVisibleChanged(list, atom, visible){
    if(list) {
        list.forEach(function(child){
            dim_onAtomVisibleChanged.call(child, atom, visible);
        });
    }
}

/**
 * Calculates the list of indexes of visible or invisible atoms.
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
        if(atom.isVisible === visible) {
            indexes.push(index);
        }
    }, this);
    
    return indexes;
}
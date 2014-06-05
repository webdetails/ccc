/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a dimension instance.
 * 
 * @name cdo.Dimension
 * 
 * @class A dimension holds unique atoms,
 * of a given dimension type,
 * and for a given data instance.
 *
 * @property {cdo.Data} data The data that owns this dimension.
 * @property {cdo.DimensionType} type The dimension type of this dimension.
 * @property {string} name Much convenient property with the name of {@link #type}.
 * 
 * @property {cdo.Dimension} parent The parent dimension.
 * A root dimension has a null parent.
 * 
 * @property {cdo.Dimension} linkParent The link parent dimension.
 * 
 * @property {cdo.Dimension} root The root dimension.
 * A root dimension has itself as the value of {@link #root}.
 * 
 * @property {cdo.Dimension} owner The owner dimension.
 * An owner dimension is the topmost root dimension (accessible from this one).
 * An owner dimension owns its atoms, while others simply contain them.
 * The value of {@link cdo.Atom#dimension} is an atom's <i>owner</i> dimension.
 * 
 * @constructor
 * 
 * @param {cdo.Data} data The data that owns this dimension.
 * @param {cdo.DimensionType} type The type of this dimension.
 */
def.type('cdo.Dimension')
.init(function(data, type) {
    /* NOTE: this function is a hot spot and as such is performance critical */
    this.data  = data;
    this.type  = type;
    this.root  = this;
    this.owner = this;
    
    var name = type.name;
    
    this.name = name;
    
    // Cache
    // -------
    // The atom id comparer ensures we keep atoms in the order they were added, 
    //  even when no semantic comparer is provided.
    // This is important, at least, to keep the visible atoms cache in the correct order.
    this._atomComparer = type.atomComparer();
    this._atomsByKey = {};
    
    if(data.isOwner()) {
        // Owner
        // Atoms are interned by #intern
        this._atoms = [];
        
        dim_createVirtualNullAtom.call(this);
        
    } else {
        // Not an owner
        var parentData = data.parent;
        
        var source; // Effective parent / atoms source
        if(parentData) {
            // Not a root
            source = parentData._dimensions[name];
            dim_addChild.call(source, this);
            
            this.root = data.parent.root;
        } else {
            parentData = data.linkParent;
            // A root that is not topmost
            /*jshint expr:true */
            parentData || def.assert("Data must have a linkParent");
            
            source = parentData._dimensions[name];
            dim_addLinkChild.call(source, this);
        }
        
        // Not in _atomsKey
        this._nullAtom = this.owner._nullAtom; // may be null
        
        this._lazyInit = function() { /* captures 'source' and 'name' variable */
            this._lazyInit = null;
            
            // Collect distinct atoms in data._datums
            var datums = this.data._datums,
                L = datums.length,
                atomsByKey = this._atomsByKey;
            for(var i = 0 ; i < L ; i++) {
                // NOTE: Not checking if atom is already added,
                // but it has no adverse side-effect.
                var atom = datums[i].atoms[name];
                atomsByKey[atom.key] = atom;
            }
            
            // Filter parentEf dimension's atoms; keeps order.
            this._atoms = source.atoms().filter(function(atom) {
                return def.hasOwnProp.call(atomsByKey, atom.key);
            });
        };
    }
})
.add(/** @lends cdo.Dimension# */{
    
    parent: null,
    
    linkParent: null,
    
    /**
     * The array of child dimensions.
     * @name childNodes
     * @type cdo.Dimension[]
     */
    
    /**
     * The array of link child dimensions.
     * @type cdo.Dimension[]
     */
    _linkChildren: null,
    
    /**
     * A map of the contained atoms by their {@link cdo.Atom#key} property.
     * 
     * Supports the intern(...), atom(.), and the control of the visible atoms cache.
     *
     * @type object
     */
    _atomsByKey: null,
    
    /**
     * A map of the count of visible datums per atom {@link cdo.Atom#key} property.
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
     * @type cdo.Atom
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
     * lookup of the atoms prototype chain (see {@link cdo.Data#_atomsBase}.
     * </p>
     * 
     * @type cdo.Atom
     * @private
     */
    _virtualNullAtom: null,
    
    /**
     * Cache of sorted visible and invisible atoms.
     * A map from visible state to {@link cdo.Atom[]}.
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
     * @type cdo.Atom[]
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
     * @see cdo.Dimension#root
     * @see cdo.Dimension#owner
     */
    count: function() {
        if(this._lazyInit) this._lazyInit();
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
     * @param {cdo.Atom} atom The atom of this dimension whose visible state is desired.
     * 
     * @type boolean
     */
    isVisible: function(atom) {
        if(this._lazyInit) this._lazyInit();
        
        // <Debug>
        /*jshint expr:true */
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
     * @returns {cdo.Atom[]} An array with the requested atoms.
     * Do <b>NOT</b> modify the returned array.
     * 
     * @see cdo.Dimension#root
     * @see cdo.Dimension#owner
     */
    atoms: function(keyArgs) {
        if(this._lazyInit) this._lazyInit();
        
        var visible = def.get(keyArgs, 'visible');
        if(visible == null) return this._atoms;
        
        visible = !!visible;
        
        /*jshint expr:true */
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
    indexes: function(keyArgs) {
        if(this._lazyInit) this._lazyInit();
        
        var visible = def.get(keyArgs, 'visible');
        // Not used much so generate each time
        if(visible == null) return pv.range(0, this._atoms.length);
        
        visible = !!visible;
        
        /*jshint expr:true */
        this._visibleIndexes || (this._visibleIndexes = {});
        return this._visibleIndexes[visible] || 
               (this._visibleIndexes[visible] = dim_calcVisibleIndexes.call(this, visible));
    },
    
    /**
     * Obtains an atom that represents the specified value, if one exists.
     * 
     * @param {any} value A value of the dimension type's {@link cdo.DimensionType#valueType}.
     * 
     * @returns {cdo.Atom} The existing atom with the specified value, or null if there isn't one.
     */
    atom: function(value) {
        if(value == null || value === '') return this._nullAtom; // may be null
        if(value instanceof cdo.Atom) return value;
        
        if(this._lazyInit) this._lazyInit();
        var typeKey = this.type._key,
            key = typeKey ? typeKey.call(null, value) : value;
        return this._atomsByKey[key] || null; // undefined -> null
    },
    
    getDistinctAtoms: function(values) {
        var atoms = [],
            L = values ? values.length : 0,
            atom, key, atomsByKey;
        if(L) {
            atomsByKey = {};
            for(var i = 0 ; i < L ; i++)
                if((atom = this.atom(values[i])) && !atomsByKey[(key = '\0' + atom.key)]) {
                    atomsByKey[key] = atom;
                    atoms.push(atom);
                }
        }
        return atoms;
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
     * See {@link #atoms} for additional keyword arguments. 
     * @param {boolean} [keyArgs.abs=false] Determines if the extent should consider the absolute value.
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
     * @see cdo.DimensionType.isComparable
     */
    extent: function(keyArgs) {
        // Assumes atoms are sorted (null, if existent is the first).
        var atoms  = this.atoms(keyArgs), L = atoms.length, tmp;
        if(!L) return undefined;
        
        var offset = this._nullAtom && atoms[0].value == null ? 1 : 0,
            countWithoutNull = L - offset;

        if(countWithoutNull > 0) {
            var min = atoms[offset], max = atoms[L - 1];

            if(min !== max && def.get(keyArgs, 'abs', false)) {
                var minSign = min.value < 0 ? -1 : 1,
                    maxSign = max.value < 0 ? -1 : 1;
                if(minSign === maxSign) {
                    if(maxSign < 0) tmp = max, max = min, min = tmp;
                } else if(countWithoutNull > 2) {
                    // There's a third atom in between
                    // min is <= 0
                    // max is >= 0
                    // and, of course, min !== max
                    
                    // One of min or max has the biggest abs value
                    if(max.value < -min.value) max = min;
                    
                    // The smallest atom is the one in atoms that is closest to 0, possibly 0 itself
                    var zeroIndex = def.array.binarySearch(atoms, 0, this.type.comparer(), function(a) { return a.value; });
                    if(zeroIndex < 0) {
                        zeroIndex = ~zeroIndex;
                        // Not found directly. 
                        var negAtom = atoms[zeroIndex - 1],
                            posAtom = atoms[zeroIndex];

                        min = (-negAtom.value < posAtom.value) ? negAtom : posAtom;
                    } else {
                        // Zero was found
                        // It is the minimum
                        min = atoms[zeroIndex];
                    }
                } else if(max.value < -min.value) {
                    // min is <= 0
                    // max is >= 0
                    // and, of course, min !== max
                    tmp = max, max = min, min = tmp;
                }
            }

            return {min: min, max: max};
        }
        
        return undefined;
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
     * @returns {cdo.Atom} The minimum atom satisfying the selection;
     * undefined if none.
     * 
     * @see #root
     * @see #owner
     * @see #atoms
     * @see cdo.DimensionType.isComparable
     */
    min: function(keyArgs) {
        // Assumes atoms are sorted.
        var atoms = this.atoms(keyArgs), L = atoms.length;
        if(!L) return undefined;
        
        var offset = this._nullAtom && atoms[0].value == null ? 1 : 0;
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
     * @returns {cdo.Atom} The maximum atom satisfying the selection;
     * undefined if none.
     * 
     * @see #root
     * @see #owner
     * @see #atoms
     * 
     * @see cdo.DimensionType.isComparable
     */
    max: function(keyArgs) {
        // Assumes atoms are sorted.
        var atoms = this.atoms(keyArgs), L = atoms.length;
        
        return L && atoms[L - 1].value != null ? atoms[L - 1] : undefined;
    },
    
    /**
     * Obtains the sum of this dimension's <i>absolute</i> values over all datums of the data,
     * possibly after filtering.
     * 
     * <p>
     * Assumes that the dimension type {@link cdo.DimensionType#valueType} is "Number".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link cdo.Data#datums} for a list of available filtering keyword arguments.
     *
     * @param {boolean} [keyArgs.zeroIfNone=true] Indicates that zero should be returned when there are no datums
     * or no datums with non-null values.
     * When <tt>false</tt>, <tt>null</tt> is returned, in that situation.
     *
     * @returns {number} The sum of considered datums or <tt>0</tt> or <tt>null</tt>, if none.
     * 
     * @see #sum
     */
    sumAbs: function(keyArgs) {
        return this.sum(def.create(keyArgs, {abs: true}));
    },

    /**
     * Obtains the aggregated value of this dimension, possibly for a filtered subset of the datums. 
     * It is the sum of the values of the datums of the data. 
     * 
     * <p>
     * Assumes that the dimension type {@link cdo.DimensionType#valueType} is "Number".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link cdo.Data#datums} for a list of available filtering keyword arguments.
     *
     * @param {boolean} [keyArgs.zeroIfNone=true] Indicates that zero should be returned when there are no datums
     * or no datums with non-null values.
     * When <tt>false</tt>, <tt>null</tt> is returned, in that situation.
     *
     * @returns {number} The value of the considered datums or <tt>0</tt> or <tt>null</tt>, if none.
     * 
     * @see #sum
     */
    value: function(keyArgs) {
        return this.sum(keyArgs && keyArgs.abs ? def.create(keyArgs, {abs: false}) : keyArgs);
    },

    /**
     * Obtains the absolute value of the aggregated value of this dimension, 
     * possibly for a filtered subset of the datums. 
     * It is the absolute value of the sum of the values of the datums of the data.
     * 
     * <p>
     * Assumes that the dimension type {@link cdo.DimensionType#valueType} is "Number".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link cdo.Data#datums} for a list of available filtering keyword arguments.
     *
     * @param {boolean} [keyArgs.zeroIfNone=true] Indicates that zero should be returned when there are no datums
     * or no datums with non-null values.
     * When <tt>false</tt>, <tt>null</tt> is returned, in that situation.
     *
     * @returns {number} The absolute value of the considered datums or <tt>0</tt> or <tt>null</tt>, if none.
     * 
     * @see #sum
     */
    valueAbs: function(keyArgs) {
        var value = this.value(keyArgs);
        // null or 0
        return value ? Math.abs(value) : value;
    },

    /**
     * Obtains the sum of this dimension's values over all datums of the data,
     * possibly after filtering.
     * 
     * <p>
     * Assumes that the dimension type {@link cdo.DimensionType#valueType} is "Number".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link cdo.Data#datums} for a list of available filtering keyword arguments.
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
    sum: function(keyArgs) {
        var isAbs = !!def.get(keyArgs, 'abs', false),
            zeroIfNone = def.get(keyArgs, 'zeroIfNone', true),
            key   = dim_buildDatumsFilterKey(keyArgs) + ':' + isAbs,
            sum = def.getOwn(this._sumCache, key);

        if(sum === undefined) {
            var dimName = this.name;
            sum = this.data.datums(null, keyArgs).reduce(function(sum2, datum) {
                var value = datum.atoms[dimName].value;
                // null < 0 is false
                if(isAbs && value < 0) value = -value;

                return sum2 != null ? (sum2 + value) : value; // null preservation
            },
            null);
            
            (this._sumCache || (this._sumCache = {}))[key] = sum;
        }
        
        return zeroIfNone ? (sum || 0) : sum;
    },
    
    /**
     * Obtains the percentage of the absolute value of a specified atom or value,
     * over the <i>sum</i> of the absolute values of a specified datum set
     * of this dimension.
     * 
     * <p>
     * Assumes that the dimension type {@link cdo.DimensionType#valueType} is "Number".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * @param {cdo.Atom|any} [atomOrValue] The atom or value on which to calculate the percent.
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link cdo.Dimension#sum} for a list of available filtering keyword arguments.
     *
     * @returns {number} The calculated percentage.
     * 
     * @see #root
     * @see #owner
     */
    percent: function(atomOrValue, keyArgs) {
        var value = (atomOrValue instanceof cdo.Atom) ? atomOrValue.value : atomOrValue;
        // nully or zero
        if(!value) return 0;
        
        var sum = this.sumAbs(keyArgs);

        // if value != 0 => sum != 0, but JIC, we test for not 0...
        return sum ? (Math.abs(value) / sum) : 0;
    },
    
    /**
     * Obtains the percentage of the absolute value of this dimension, of a specified selection,
     * over the <i>sum</i> of the absolute values of an analogous selection in the parent data.
     * 
     * <p>
     * Assumes that the dimension type {@link cdo.DimensionType#valueType} is "Number".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link cdo.Dimension#sum} for a list of available filtering keyword arguments.
     *
     * @returns {number} The calculated percentage.
     * 
     * @see #root
     * @see #owner
     */
    valuePercent: function(keyArgs) {
        var value = this.valueAbs(keyArgs);
        // nully or zero
        if(!value) return 0;
        
        // if no parent, we're the root and so we're 100%
        var parentData = this.data.parent;
        if(!parentData) return 1;

        // The following would not work because, in each group,
        //  abs would not be used...
        //var sum = parentData.dimensions(this.name).sum();

        var sum = parentData.dimensionsSumAbs(this.name, keyArgs);

        // assert sum >= value
        return value / sum;
    },
    
    /** @deprecated Use valuePercent instead. */
    percentOverParent: function(keyArgs) {
        return this.valuePercent(keyArgs);
    },

    format: function(value, sourceValue) {
        return def.string.to(this.type._formatter ? this.type._formatter.call(null, value, sourceValue) : value);
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
     * If this method is not called on an owner dimension,
     * and if the requested values isn't locally present,
     * the call is recursively forwarded to the dimension's
     * parent or link parent until the atom is found.
     * Ultimately, if the atom does not yet exist, 
     * it is created in the owner dimension. 
     * </p>
     * <p>
     * An empty string value is considered equal to a null value. 
     * </P>
     * @param {any | cdo.Atom} sourceValue The source value.
     * @param {boolean} [isVirtual=false] Indicates that 
     * the (necessarily non-null) atom is the result of interpolation or regression.
     * 
     * @type cdo.Atom
     */
    intern: function(sourceValue, isVirtual) {
        // NOTE: This function is performance critical!
      
        // The null path and the existing atom path 
        // are as fast and direct as possible
        
        // - NULL -
        if(sourceValue == null || sourceValue === '')
            return this._nullAtom || dim_createNullAtom.call(this, sourceValue);
        
        if(sourceValue instanceof cdo.Atom) {
            if(sourceValue.dimension !== this) throw def.error.operationInvalid("Atom is of a different dimension.");
            return sourceValue;
        }
        
        var value, label, type = this.type;
        
        // Is google table style cell {v: , f: } ?
        if(typeof sourceValue === 'object' && ('v' in sourceValue)) {
            // Get info and get rid of the cell
            label = sourceValue.f;
            sourceValue = sourceValue.v;
            if(sourceValue == null || sourceValue === '') return this._nullAtom || dim_createNullAtom.call(this);
        }
        
        // - CONVERT - 
        if(!isVirtual) {
            var converter = type._converter;
            if(!converter) {
                value = sourceValue;
            } else {
                value = converter(sourceValue);
                // Null after all
                if(value == null || value === '') return this._nullAtom || dim_createNullAtom.call(this, sourceValue);

                // Just in case it came from a google style cell.
                // The value is now different from the original one, so the label is invalid.
                label = undefined;
           }
        } else {
            value = sourceValue;
        }
        
        // - CAST -
        // Any cast function?
        var cast = type.cast;
        if(cast) {
            value = cast(value);
            // Null after all (normally a cast failure)
            if(value == null || value === '') return this._nullAtom || dim_createNullAtom.call(this);
        }
        
        // - KEY -
        var keyFun = type._key,
            key = '' + (keyFun ? keyFun(value) : value);
        // <Debug>
        /*jshint expr:true */
        key || def.fail.operationInvalid("Only a null value can have an empty key.");
        // </Debug>
        
        // - ATOM -
        var atom = this._atomsByKey[key];
        if(atom) {
            if(!isVirtual && atom.isVirtual) delete atom.isVirtual;
            return atom;
        }
        
        return dim_createAtom.call(
                   this,
                   type,
                   sourceValue,
                   key,
                   value,
                   label,
                   isVirtual);
    },

    read: function(sourceValue, label) {
        // - NULL -
        if(sourceValue == null || sourceValue === '') return null;
        
        var value,
            type = this.type,
            labelSpecified = label != null;
        
        // Is google table style cell {v: , f: } ?
        if(typeof sourceValue === 'object' && ('v' in sourceValue)) {
            // Get info and get rid of the cell
            label = sourceValue.f;
            sourceValue = sourceValue.v;
            if(sourceValue == null || sourceValue === '') return null;
        }
        
        // - CONVERT - 
        var converter = type._converter;
        value = converter ? converter(sourceValue) : sourceValue;
        if(value == null || value === '') return null;
        else if(!labelSpecified && converter) label = null;
        
        // - CAST -
        // Any cast function?
        var cast = type.cast;
        if(cast) {
            value = cast(value);
            // Null after all? 
            // (normally a cast failure)
            if(value == null || value === '') return null;
        }
        
        // - KEY -
        var keyFun = type._key,
            key = '' + (keyFun ? keyFun(value) : value),
        // - ATOM -
            atom = this._atomsByKey[key];

        if(atom) return {
            rawValue: sourceValue,
            key:      key,
            value:    atom.value,
            label:    '' + (label == null ? atom.label : label)
        };
        
        // - LABEL -
        if(label == null) {
            var formatter = type._formatter;
            label = formatter ? formatter(value, sourceValue) : value;
        }

        label = def.string.to(label); // J.I.C.
        
        return {
            rawValue: sourceValue,
            key:      key,
            value:    value,
            label:    label
        };
    },
    
    /**
     * Disposes the dimension and all its children.
     */
    dispose: function() {
        var me = this, v;
        if(!me._disposed) {
            /*global cdo_disposeChildList:true */
            cdo_disposeChildList(me.childNodes,    'parent');
            cdo_disposeChildList(me._linkChildren, 'linkParent');

            /*global cdo_removeColChild:true */
            if((v = me.parent))     cdo_removeColChild(v, 'childNodes',    /*child*/me,     'parent');
            if((v = me.linkParent)) cdo_removeColChild(v, '_linkChildren', /*linkChild*/me, 'linkParent');
            
            dim_clearVisiblesCache.call(me);
            
            me._lazyInit  =
            me._atoms = 
            me._nullAtom = 
            me._virtualNullAtom = null;
            
            me._disposed = true;
        }
    }
});

/**
 * Creates an atom, 
 * in the present dimension if it is the owner dimension,
 * or delegates the creation to its parent, or linked parent dimension.
 * 
 * The atom must not exist in the present dimension.
 * 
 * @name cdo.Dimension#_createAtom
 * @function
 * @param {cdo.DimensionType} type The dimension type of this dimension.
 * @param {any} sourceValue The source value.
 * @param {string} key The key of the value.
 * @param {any} value The typed value.
 * @param {string} [label] The label, if it is present directly
 * in {@link sourceValue}, in Google format.
 * @param {boolean} [isVirtual=false] Indicates if the atom is virtual.
 * @type cdo.Atom
 */
function dim_createAtom(type, sourceValue, key, value, label, isVirtual) {
    var atom;
    if(this.owner === this) {
        // Create the atom
        
        // - LABEL -
        if(label == null) {
            var formatter = type._formatter;
            label = formatter ? formatter(value, sourceValue) : value;
        }

        label = def.string.to(label); // J.I.C.
        
        if(!label && pvc.debug >= 2) pvc.log("Only the null value should have an empty label.");
        
        // - ATOM! -
        atom = new cdo.Atom(this, value, label, sourceValue, key);
        if(isVirtual) atom.isVirtual = true;
    } else {
        var source = this.parent || this.linkParent;
        atom = source._atomsByKey[key] ||
               dim_createAtom.call(
                    source, 
                    type, 
                    sourceValue, 
                    key, 
                    value, 
                    label,
                    isVirtual);
    }
        
    // Insert atom in order (or at the end when !_atomComparer)
    def.array.insert(this._atoms, atom, this._atomComparer);
    
    dim_clearVisiblesCache.call(this);
    
    this._atomsByKey[key] = atom;
    
    return atom;
}

/**
 * Ensures that the specified atom exists in this dimension.
 * The atom must have been created in a dimension of this dimension tree.
 * 
 * If the virtual null atom is found it is replaced by the null atom,
 * meaning that, after all, the null is really present in the data.
 * 
 * @param {cdo.Atom} atom the atom to intern.
 * 
 * @name cdo.Dimension#_internAtom
 * @function
 * @type cdo.Atom
 */
function dim_internAtom(atom) {
    var key = atom.key,
        me = this;

    // Root load will fall in this case
    if(atom.dimension === me) {
        /*jshint expr:true */
        (me.owner === me) || def.assert("Should be an owner dimension");

        // This indicates that there is a dimension for which
        // there was no configured reader,
        // so nulls weren't read.
        //
        // We will register the real null,
        // and the virtual null atom will not show up again,
        // because it appears through the prototype chain
        // as a default value.
        if(!key && atom === me._virtualNullAtom) atom = me.intern(null);

        return atom;
    }
    
    var hasInited = !me._lazyInit;
    if(hasInited) {
        // Else, not yet initialized, so there's no need to add the atom now
        var localAtom = me._atomsByKey[key];
        if(localAtom) {
            if(localAtom !== atom) throw def.error.operationInvalid("Atom is from a different root data.");
            return atom;
        }
        
        // Should have been created in a dimension along the way.
        if(me.owner === me) throw def.error.operationInvalid("Atom is from a different root data.");
    }
    
    dim_internAtom.call(me.parent || me.linkParent, atom);
    
    if(hasInited) {
        // Insert atom in order (or at the end when !_atomComparer)
        me._atomsByKey[key] = atom;
        
        if(!key) {
            me._nullAtom = atom;
            me._atoms.unshift(atom);
        } else {
            def.array.insert(me._atoms, atom, me._atomComparer);
        }
        
        dim_clearVisiblesCache.call(me);
    }
    
    return atom;
}

/**
 * Builds a key string suitable for identifying a call to {@link cdo.Data#datums}
 * with no where specification.
 *
 * @name cdo.Dimension#_buildDatumsFilterKey
 * @function
 * @param {object} [keyArgs] The keyword arguments used in the call to {@link cdo.Data#datums}.
 * @type string
 */
function dim_buildDatumsFilterKey(keyArgs) {
    var visible  = def.get(keyArgs, 'visible'),
        selected = def.get(keyArgs, 'selected');
    return (visible == null ? null : !!visible) + ':' + (selected == null ? null : !!selected);
}

/**
 * Creates the null atom if it isn't created yet.
 * 
 * @name cdo.Dimension#_createNullAtom
 * @function
 * @param {any} [sourceValue] The source value of null. Can be used to obtain the null format.
 * @type undefined
 * @private
 */
function dim_createNullAtom(sourceValue) {
    var nullAtom = this._nullAtom;
    if(!nullAtom) {
        if(this.owner === this) {
            var typeFormatter = this.type._formatter,
                label = typeFormatter ? def.string.to(typeFormatter.call(null, null, sourceValue)) : "";
            
            nullAtom = new cdo.Atom(this, null, label, null, '');
            
            this.data._atomsBase[this.name] = nullAtom; 
        } else {
            // Recursively set the null atom, up the parent/linkParent chain
            // until reaching the owner (root) dimension.
            nullAtom = dim_createNullAtom.call(this.parent || this.linkParent, sourceValue);
        }
        
        this._atomsByKey[''] = this._nullAtom = nullAtom;
        
        // The null atom is always in the first position
        this._atoms.unshift(nullAtom);
    }
    
    return nullAtom;
}

/**
 * Creates the virtual null atom if it isn't created yet.
 * 
 * @name cdo.Dimension#_createNullAtom
 * @function
 * @type undefined
 * @private
 */
function dim_createVirtualNullAtom() {
    // <Debug>
    /*jshint expr:true */
    (this.owner === this) || def.assert("Can only create atoms on an owner dimension.");
    // </Debug>
    
    if(!this._virtualNullAtom) {
        // The virtual null's label is always "".
        // Don't bother the formatter with a value that
        // does not exist in the data.
        this._virtualNullAtom = new cdo.Atom(this, null, "", null, '');

        this.data._atomsBase[this.name] = this._virtualNullAtom; 
    }
    
    return this._virtualNullAtom;
}

/**
 * Uninternalizes the specified atom from the dimension (internal).
 * 
 * @name cdo.Dimension#_unintern
 * @function
 * @param {cdo.Atom} atom The atom to uninternalize.
 * @type undefined
 * @private
 * @internal
 */
function dim_unintern(atom) {
    // <Debug>
    /*jshint expr:true */
    (this.owner === this) || def.assert("Can only unintern atoms on an owner dimension.");
    (atom && atom.dimension === this) || def.assert("Not an interned atom");
    // </Debug>
    
    if(atom === this._virtualNullAtom) return;
    
    // Remove the atom
    var key = atom.key;
    if(this._atomsByKey[key] === atom) {
        def.array.remove(this._atoms, atom, this._atomComparer);
        delete this._atomsByKey[key];
        
        if(!key) {
            delete this._nullAtom;
            this.data._atomsBase[this.name] = this._virtualNullAtom;
        }
    }
    
    dim_clearVisiblesCache.call(this);
}

function dim_uninternUnvisitedAtoms() {
    // <Debug>
    /*jshint expr:true */
    (this.owner === this) || def.assert("Can only unintern atoms of an owner dimension.");
    // </Debug>
    
    var atoms = this._atoms;
    if(atoms) {
        var atomsByKey = this._atomsByKey,
            i = 0,
            L = atoms.length;
        while(i < L) {
            var atom = atoms[i];
            if(atom.visited) {
                delete atom.visited;
                i++;
            } else if(atom !== this._virtualNullAtom) {
                // Remove the atom
                atoms.splice(i, 1);
                L--;
                
                var key = atom.key;
                delete atomsByKey[key];
                if(!key) {
                    delete this._nullAtom;
                    this.data._atomsBase[this.name] = this._virtualNullAtom;
                }
            }
        }
        
        dim_clearVisiblesCache.call(this);
    }
}

function dim_uninternVirtualAtoms() {
    // This assumes that this same function has been called on child/link child dimensions
    var atoms = this._atoms;
    if(atoms) {
        var atomsByKey = this._atomsByKey,
            i = 0,
            L = atoms.length,
            removed;
        while(i < L) {
            var atom = atoms[i];
            if(!atom.isVirtual) {
                i++;
            } else {
                // Remove the atom
                atoms.splice(i, 1);
                L--;
                removed = true;
                var key = atom.key || def.assert("Cannot be the null or virtual null atom.");
                delete atomsByKey[key];
            }
        }
        
        if(removed) dim_clearVisiblesCache.call(this);
    }
}

/**
 * Clears all caches affected by datum/atom visibility.
 * 
 * @name cdo.Dimension#_clearVisiblesCache
 * @function
 * @type undefined
 * @private
 * @internal
 */
function dim_clearVisiblesCache() {
    this._atomVisibleDatumsCount =
    this._sumCache =
    this._visibleAtoms = 
    this._visibleIndexes = null;
}

/**
 * Called by a dimension's data when its datums have changed.
 * 
 * @name cdo.Dimension#_onDatumsChanged
 * @function
 * @type undefined
 * @private
 * @internal
 */
function dim_onDatumsChanged() {
    dim_clearVisiblesCache.call(this);
}

/**
 * Adds a child dimension.
 * 
 * @name cdo.Dimension#_addChild
 * @function
 * @param {cdo.Dimension} child The child to add.
 * @type undefined
 * @private
 */
function dim_addChild(child) {
    /*global cdo_addColChild:true */
    cdo_addColChild(this, 'childNodes', child, 'parent');
    
    child.owner = this.owner;
}


/**
 * Adds a link child dimension.
 * 
 * @name cdo.Dimension#_addLinkChild
 * @function
 * @param {cdo.Dimension} linkChild The link child to add.
 * @type undefined
 * @private
 */
function dim_addLinkChild(linkChild) {
    cdo_addColChild(this, '_linkChildren', linkChild, 'linkParent');
    
    linkChild.owner = this.owner;
}

/**
 * Called by the data of this dimension when 
 * the visible state of a datum has changed. 
 * 
 * @name cdo.Dimension#_onDatumVisibleChanged
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
        
        if(DEBUG) def.hasOwn(this._atomsByKey, key) || def.assert("Atom must exist in this dimension.");

        var count = map[key];

        if(DEBUG) (visible || (count > 0)) || def.assert("Must have had accounted for at least one visible datum.");
        
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
 * @name cdo.Dimension#_getVisibleDatumsCountMap
 * @function
 * @type undefined
 * @private
 */
function dim_getVisibleDatumsCountMap() {
    var map = this._atomVisibleDatumsCount;
    if(!map) {
        map = {};
        
        this.data.datums(null, {visible: true}).each(function(datum) {
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
 * @name cdo.Dimension#_calcVisibleIndexes
 * @function
 * @param {boolean} visible The desired atom visible state.
 * @type number[]
 * @private
 */
function dim_calcVisibleIndexes(visible) {
    var indexes = [];
    
    this._atoms.forEach(function(atom, index) {
        if(this.isVisible(atom) === visible) indexes.push(index);
    }, this);
    
    return indexes;
}

/**
 * Calculates the list of visible or invisible atoms.
 * <p>
 * Does not include the null atom.
 * </p>
 * 
 * @name cdo.Dimension#_calcVisibleAtoms
 * @function
 * @param {boolean} visible The desired atom visible state.
 * @type number[]
 * @private
 */
function dim_calcVisibleAtoms(visible) {
    return def.query(this._atoms)
            .where(function(atom) { return this.isVisible(atom) === visible; }, this)
            .array();
}
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a data instance.
 * 
 * @name cdo.Data
 * 
 * @class A data represents a set of datums of the same complex type {@link #type}.
 * <p>
 * A data <i>may</i> have a set of atoms that are shared by all of its datums. 
 * In that case, the {@link #atoms} property holds those atoms.
 * </p>
 * <p>
 * A data has one dimension per dimension type of the complex type {@link #type}.
 * Each holds information about the atoms of it's type in this data.
 * Dimensions are obtained by calling {@link #dimensions}.
 * </p>
 * <p>
 * A data may have child data instances.
 * </p>
 * 
 * @extends cdo.Complex
 * 
 * @borrows pv.Dom.Node#visitBefore as #visitBefore
 * @borrows pv.Dom.Node#visitAfter as #visitAfter
 * 
 * @borrows pv.Dom.Node#nodes as #nodes
 * @borrows pv.Dom.Node#firstChild as #firstChild
 * @borrows pv.Dom.Node#lastChild as #lastChild
 * @borrows pv.Dom.Node#previousSibling as #previousSibling
 * @borrows pv.Dom.Node#nextSibling as #nextSibling
 * 
 * @property {cdo.ComplexType} type The type of the datums of this data.
 * 
 * @property {cdo.Data} root The root data.
 * The {@link #root} of a root data is itself.
 * 
 * @property {cdo.Data} parent The parent data.
 * A root data has a no parent.
 * 
 * @property {cdo.Data} linkParent The link parent data.
 * 
 * @property {Number} depth The depth of the data relative to its root data.
 * @property {string} label The composite label of the (common) atoms in the data.
 * 
 * @property {string} absLabel The absolute label of the data; 
 * a composition of all labels up to the root data.
 * 
 * @property {number} absKey
 *           The absolute semantic identifier;
 *           a composition of all keys up to the root data.
 * 
 * @constructor
 * @param {object} keyArgs Keyword arguments
 * @param {cdo.Data}   [keyArgs.parent]      The parent data.
 * @param {cdo.Data}   [keyArgs.linkParent]  The link parent data.
 * @param {map(string union(any cdo.Atom))} [keyArgs.atoms] The atoms shared by contained datums.
 * @param {string[]} [keyArgs.atomsDimNames] The dimension names of atoms in {@link keyArgs.atoms}.
 * This argument must be specified whenever {@link keyArgs.atoms} is.
 * @param {cdo.Datum[]|def.Query} [keyArgs.datums] The contained datums array or enumerable.
 * @param {cdo.Data}    [keyArgs.owner] The owner data.
 * The topmost root data is its own owner.
 * An intermediate root data must specify its owner data.
 * 
 * @param {cdo.ComplexType} [keyArgs.type] The complex type.
 * Required when no parent or owner are specified.
 * 
 * @param {number} [index=null] The index at which to insert the child in its parent or linked parent.
 */
def.type('cdo.Data', cdo.Complex)
.init(function(keyArgs) {
    /* NOTE: this function is a hot spot and as such is performance critical */
    
    /*jshint expr:true*/
    keyArgs || def.fail.argumentRequired('keyArgs');
    
    this._visibleNotNullDatums = new def.Map();
    
    var owner,
        atoms,
        atomsBase,
        atomsDimNames,
        datums,
        index,
        parent = this.parent = keyArgs.parent || null;
    if(parent) {
        // Not a root
        this.root  = parent.root;
        this.depth = parent.depth + 1;
        this.type  = parent.type;

        datums     = keyArgs.datums || def.fail.argumentRequired('datums');
        owner = parent.owner;
        atoms     = keyArgs.atoms   || def.fail.argumentRequired('atoms');
        atomsDimNames  = keyArgs.atomsDimNames|| def.fail.argumentRequired('atomsDimNames');
        atomsBase = parent.atoms;
    } else {
        // Root (topmost or not)
        this.root = this;
        // depth = 0
        
        atomsDimNames = [];
        
        var linkParent = keyArgs.linkParent || null;
        if(linkParent) {
            // A root that is not topmost - owned, linked
            owner = linkParent.owner;
            //atoms = pv.values(linkParent.atoms); // is atomsBase, below
            
            this.type   = owner.type;
            datums      = keyArgs.datums || def.fail.argumentRequired('datums');//linkParent._datums.slice();
            this._leafs = [];
            
            this._wherePred = keyArgs.where || null;

            /* 
             * Inherit link parent atoms.
             */
            atomsBase = linkParent.atoms;
            //atoms = null
            
            index = def.get(keyArgs, 'index', null);
            
            cdo_addLinkChild.call(linkParent, this, index);
        } else {
            // Topmost root - an owner
            owner = this;
            //atoms = null
            atomsBase = {};
            
            if(keyArgs.labelSep) this.labelSep = keyArgs.labelSep;
            if(keyArgs.keySep  ) this.keySep   = keyArgs.keySep;
            
            this.type = keyArgs.type || def.fail.argumentRequired('type');
            
            // Only owner datas cache selected datums
            this._selectedNotNullDatums = new def.Map();
        }
    }
    
    /*global data_setDatums:true */
    if(datums) data_setDatums.call(this, datums);
    
    // Must anticipate setting this (and not wait for the base constructor)
    // because otherwise new Dimension( ... ) fails.
    this.owner = owner;
    
    /* Need this because of null interning/un-interning and atoms chaining */
    this._atomsBase = atomsBase;
    
    this._dimensions = {};
    this._dimensionsList = [];
    this.type.dimensionsList().forEach(this._initDimension, this);
    
    // Call base constructors
    this.base(owner, atoms, atomsDimNames, atomsBase, /* wantLabel */ true);
    
    pv.Dom.Node.call(this); // nodeValue is only created when not undefined
    
    // Build absolute label and key
    // The absolute key is relative to the root data (not the owner - the topmost root)
    if(parent) {
        index = def.get(keyArgs, 'index', null);
        
        cdo_addChild.call(parent, this, index);

        this.absLabel = parent.absLabel
            ? def.string.join(owner.labelSep, parent.absLabel, this.label)
            : this.label;

        this.absKey = parent.absKey
            ? def.string.join(owner.keySep, parent.absKey, this.key)
            : this.key;
    } else {
        this.absLabel = this.label;
        this.absKey   = this.key;
    }
})

// Mix pv.Dom.Node.prototype
.add(pv.Dom.Node)

.add(/** @lends cdo.Data# */{
    parent:       null,
    linkParent:   null,
    
    /**
     * The dimension instances of this data.
     * @type object<string, cdo.Dimension>
     */
    _dimensions: null,

    /**
     * The dimension instances of this data.
     * @type cdo.Dimension[]
     */
    _dimensionsList: null, 

    /**
     * The names of unbound dimensions.
     * @type string[]
     */
    _freeDimensionNames: null,
    
    /**
     * The child data instances of this data.
     * @name childNodes
     * @type cdo.Data[]
     * @internal
     */
    
    /**
     * The link child data instances of this data.
     * @type cdo.Data[]
     * @internal
     */
    _linkChildren: null,
    
    /**
     * The leaf data instances of this data.
     * 
     * @type cdo.Data[]
     * @internal
     */
    _leafs: null,
    
    /** 
     * The map of child datas by their key.
     * 
     * @type string
     * @internal
     */
    _childrenByKey: null,
    
    /**
     * A map of non-null visible datums indexed by id.
     * @type def.Map
     */
    _visibleNotNullDatums: null,
    
    /**
     * A map of non-null selected datums indexed by id.
     * @type def.Map
     */
    _selectedNotNullDatums: null, 
    
    /**
     * Cache of link child data by grouping operation key.
     * @type object
     * @internal
     */
    _groupByCache: null,

    /**
     * An object with cached results of the {@link #dimensionsSumAbs} method.
     *
     * @type object
     */
    _sumAbsCache: null,

    /**
     * The height of the tree of datas headed by a root data.
     * Only defined in root datas. 
     */
    treeHeight: null,
    
    /**
     * The grouping operation object used to create this data. 
     * Only defined in root datas.
     * @type cdo.GroupingOper
     */
    _groupOper: null,
    
    /**
     * The predicate from which this data was obtained.
     * Only defined in root datas.
     * @type function
     */
    _wherePred: null,

    /**
     * A grouping specification object used to create this data, 
     * along with {@link #groupLevel}. 
     * Only defined in datas that have children.
     * 
     * @type cdo.GroupingSpec
     */
    _groupSpec: null,
    
    /**
     * A grouping level specification object used to create this data, 
     * along with {@link #groupSpec}. 
     * Only defined in datas that have children.
     * 
     * @type cdo.GroupingLevelSpec
     */
    _groupLevel: null,
    
    /** 
     * The datums of this data.
     * @type cdo.Datum[]
     * @internal
     */
    _datums: null,
    
    /** 
     * A map of the datums of this data indexed by id.
     * @type object
     * @internal
     */
    _datumsById: null, 

    /** 
     * A map of the datums of this data indexed by semantic id - the key.
     * @type object
     * @internal
     */
    _datumsByKey: null, 
    
    depth:    0,
    label:    "",
    absLabel: "",
    
    /** 
     * Indicates if the object has been disposed.
     * 
     * @type boolean 
     */
    _disposed: false,
    
    /**
     * Indicates that the data was a parent group 
     * in the flattening group operation.
     * 
     * @type boolean
     */
    _isFlattenGroup: false,
    _isDegenerateFlattenGroup: false,
    
    _initDimension: function(dimType) {
        var dim = new cdo.Dimension(this, dimType);
        this._dimensions[dimType.name] =  dim;
        this._dimensionsList.push(dim);
    },
    
    /**
     * Obtains a dimension given its name.
     * 
     * <p>
     * If no name is specified,
     * a map with all dimensions indexed by name is returned.
     * Do <b>NOT</b> modify this map.
     * </p>
     * 
     * <p>
     * There is one dimension instance per 
     * dimension type of the data's complex type.
     * </p>
     * <p>
     * If this is not a root data,
     * the dimensions will be child dimensions of
     * the corresponding parent data's dimensions.
     * </p>
     * <p>
     * If this is a root data,
     * the dimensions will 
     * have no parent dimension, but instead, an owner dimension.
     * </p>
     * 
     * @param {string} [name] The dimension name.
     * @param {object} [keyArgs] Keyword arguments.
     * @param {string} [keyArgs.assertExists=true} Indicates that a missing child should be signaled as an error.
     * 
     * @type cdo.Dimension
     */
    dimensions: function(name, keyArgs) {
        if(name == null) { return this._dimensions; }
        
        var dim = def.getOwn(this._dimensions, name);
        if(!dim && def.get(keyArgs, 'assertExists', true))
            throw def.error.argumentInvalid('name', "Undefined dimension '{0}'.", [name]);
         
        return dim;
    },

    dimensionsList: function() { return this._dimensionsList; },
    
    /**
     * Obtains an array of the names of dimensions that are not bound in {@link #atoms}.
     * @type string[]
     */
    freeDimensionsNames: function() {
        var free = this._freeDimensionNames;
        if(!free) {
            this._freeDimensionNames = free = this.type.dimensionsNames()
                .filter(function(dimName) {
                    var atom = this.atoms[dimName];
                    return !(atom instanceof cdo.Atom) || (atom.value == null);
                }, this);
        }
        return free;
    },
    
    /**
     * Indicates if the data is an owner.
     * 
     * @type boolean
     */
    isOwner: function() { return this.owner === this; },
    
    /**
     * Obtains an enumerable of the child data instances of this data.
     * 
     * @type def.Query
     */
    children: function() {
        var cs = this.childNodes;
        return cs.length ? def.query(cs) : def.query();
    },
    
    /**
     * Obtains a child data given its key.
     * 
     * @param {string} key The key of the child data.
     * @type cdo.Data | null
     */
    child: function(key) { return def.getOwn(this._childrenByKey, key, null); },
    
    /**
     * Obtains the number of children.
     *
     * @type number
     */
    childCount: function() { return this.childNodes.length; },

    /**
     * Obtains an enumerable of the leaf data instances of this data.
     * 
     * @type def.Query 
     */
    leafs: function() { return def.query(this._leafs); },
    
    /**
     * Obtains the number of contained datums.
     * @type number
     */
    count: function() { return this._datums.length; },
    
    /**
     * Obtains the first datum of this data, if any.
     * @return {cdo.Datum} The first datum or <i>null</i>.
     * @see #singleDatum 
     */
    firstDatum: function() { return this._datums.length ? this._datums[0] : null; },
    
    /**
     * Obtains the atoms of the first datum of this data, if any, or the data own atoms, if none.
     * @type object
     * @see #firstDatum
     */
    firstAtoms: function() { return (this.firstDatum() || this).atoms; },

    /**
     * Obtains the single datum of this data, 
     * or null, when the has data no datums or has more than one.
     * 
     * @type cdo.Datum
     * @see #firstDatum
     */
    singleDatum: function() {
        var datums = this._datums;
        return datums.length === 1 ? datums[0] : null;
    },
    
    /**
     * Disposes the child datas, the link child datas and the dimensions.
     * @type undefined
     */
    dispose: function() {
        var me = this;
        if(!me._disposed) {
            cdo_disposeChildLists.call(me);

            var v;
            (v = me._selectedNotNullDatums) && v.clear();

            me._visibleNotNullDatums.clear();
            
            v = me._dimensionsList;
            for(var i = 0, L = v.length ; i < L ; i++) v[i].dispose();
            me._dimensions = null;
            me._dimensionsLIst = null;

            if((v = me.parent)) {
                v.removeChild(me);
                me.parent = null;
            }
            
            if((v = me.linkParent))
                /*global cdo_removeLinkChild:true */
                cdo_removeLinkChild.call(v, me);
            
            me._disposed = true;
        }
    },
    
    /**
     * Disposes the child datas and the link child datas.
     * @type undefined
     */
    disposeChildren: function() {
        /*global cdo_disposeChildLists:true */
        cdo_disposeChildLists.call(this);
    }
});

/**
 * Adds a child data.
 * 
 * @name cdo.Data#_addChild
 * @function
 * @param {cdo.Data} child The child data to add.
 * @param {number} [index=null] The index at which to insert the child.
 * @type undefined
 * @private
 */
function cdo_addChild(child, index) {
    // this   -> ((pv.Dom.Node#)child).parentNode
    // child  -> ((pv.Dom.Node#)this).childNodes
    // ...
    this.insertAt(child, index);
    
    def.lazy(this, '_childrenByKey')[child.key] = child;
}

/**
 * Adds a link child data.
 * 
 * @name cdo.Data#_addLinkChild
 * @function
 * @param {cdo.Data} linkChild The link child data to add.
 * @param {number} [index=null] The index at which to insert the child.
 * @type undefined
 * @private
 */
function cdo_addLinkChild(linkChild, index) {
    /*global cdo_addColChild:true */
    cdo_addColChild(this, '_linkChildren', linkChild, 'linkParent', index);
}

/**
 * Removes a link child data.
 *
 * @name cdo.Data#_removeLinkChild
 * @function
 * @param {cdo.Data} linkChild The link child data to remove.
 * @type undefined
 * @private
 */
function cdo_removeLinkChild(linkChild) {
    /*global cdo_removeColChild:true */
    cdo_removeColChild(this, '_linkChildren', linkChild, 'linkParent');
}

/**
 * Disposes the child datas and the link child datas.
 * 
 * @name cdo.Data#_disposeChildLists
 * @function
 * @type undefined
 * @private
 */
function cdo_disposeChildLists() {
    /*global cdo_disposeChildList:true */
    cdo_disposeChildList(this.childNodes, 'parent');
    this._childrenByKey = null;
    
    cdo_disposeChildList(this._linkChildren, 'linkParent');
    this._groupByCache = null;  
    
    // ~ datums.{isSelected, isVisible, isNull}, children
    this._sumAbsCache = null;
}

/**
 * Called to assert that this is an owner data.
 *  
 * @private
 */
function cdo_assertIsOwner() {
    /*jshint expr:true */
    this.isOwner() || def.fail("Can only be called on the owner data.");
}


/**
 * Initializes a data instance.
 * 
 * @name pvc.data.Data
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
 * @extends pvc.data.Complex
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
 * @property {pvc.data.ComplexType} type The type of the datums of this data.
 * 
 * @property {pvc.data.Data} root The root data. 
 * The {@link #root} of a root data is itself.
 * 
 * @property {pvc.data.Data} parent The parent data. 
 * A root data has a no parent.
 * 
 * @property {pvc.data.Data} linkParent The link parent data.
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
 * @param {pvc.data.Data}   [keyArgs.parent]      The parent data.
 * @param {pvc.data.Data}   [keyArgs.linkParent]  The link parent data.
 * @param {map(string union(any pvc.data.Atom))} [keyArgs.atoms] The atoms shared by contained datums.
 * @param {string[]} [keyArgs.dimNames] The dimension names of atoms in {@link keyArgs.atoms}.
 * This argument must be specified whenever {@link keyArgs.atoms} is.
 * @param {pvc.data.Datum[]|def.Query} [keyArgs.datums] The contained datums array or enumerable.
 * @param {pvc.data.Data}    [keyArgs.owner] The owner data.
 * The topmost root data is its own owner.
 * An intermediate root data must specify its owner data.
 * 
 * @param {pvc.data.ComplexType} [keyArgs.type] The complex type.
 * Required when no parent or owner are specified.
 * 
 * @param {number} [index=null] The index at which to insert the child in its parent or linked parent.
 */
def.type('pvc.data.Data', pvc.data.Complex)
.init(function(keyArgs){
    /* NOTE: this function is a hot spot and as such is performance critical */
    
    /*jshint expr:true*/
    keyArgs || def.fail.argumentRequired('keyArgs');
    
    this._visibleDatums = new def.Map();
    
    var owner,
        atoms,
        atomsBase,
        dimNames,
        datums,
        index,
        parent = this.parent = keyArgs.parent || null;
    if(parent){
        // Not a root
        this.root  = parent.root;
        this.depth = parent.depth + 1;
        this.type  = parent.type;
        datums     = keyArgs.datums || def.fail.argumentRequired('datums');
        
        owner = parent.owner;
        atoms     = keyArgs.atoms   || def.fail.argumentRequired('atoms');
        dimNames  = keyArgs.dimNames|| def.fail.argumentRequired('dimNames');
        atomsBase = parent.atoms;
    } else {
        // Root (topmost or not)
        this.root = this;
        // depth = 0
        
        dimNames = [];
        
        var linkParent = keyArgs.linkParent || null;
        if(linkParent){
            // A root that is not topmost - owned, linked
            owner = linkParent.owner;
            //atoms = pv.values(linkParent.atoms); // is atomsBase, below
            
            this.type   = owner.type;
            datums      = keyArgs.datums || def.fail.argumentRequired('datums');//linkParent._datums.slice();
            this._leafs = [];
            
            /* 
             * Inherit link parent atoms.
             */
            atomsBase = linkParent.atoms;
            //atoms = null
            
            index = def.get(keyArgs, 'index', null);
            
            data_addLinkChild.call(linkParent, this, index);
        } else {
            // Topmost root - an owner
            owner = this;
            //atoms = null
            atomsBase = {};
            
            if(keyArgs.labelSep){
                this.labelSep = keyArgs.labelSep;
            }
            
            this.type = keyArgs.type || def.fail.argumentRequired('type');
            
            // Only owner datas cache selected datums
            this._selectedDatums = new def.Map();
        }
    }
    
    /*global data_setDatums:true */
    if(datums){
        data_setDatums.call(this, datums);
    }
    
    // Must anticipate setting this (and not wait for the base constructor)
    // because otherwise new Dimension( ... ) fails.
    this.owner = owner;
    
    /* Need this because of null interning/un-interning and atoms chaining */
    this._atomsBase = atomsBase;
    
    this._dimensions = {};
    this.type.dimensionsList().forEach(this._initDimension, this);
    
    // Call base constructors
    this.base(owner, atoms, dimNames, atomsBase, /* wantLabel */ true);
    
    pv.Dom.Node.call(this, /* nodeValue */null);
    delete this.nodeValue;
    this._children = this.childNodes; // pv.Dom.Node#childNodes
    
    // Build absolute label and key
    // The absolute key is relative to the root data (not the owner - the topmost root)
    if(parent){
        index = def.get(keyArgs, 'index', null);
        
        data_addChild.call(parent, this, index);
        
        if(parent.absLabel){
            this.absLabel = def.string.join(owner.labelSep, parent.absLabel, this.label);
        } else {
            this.absLabel = this.label;
        }
        
        if(parent.absKey){
            this.absKey = def.string.join(",", parent.absKey, this.key);
        } else {
            this.absKey = this.key;
        }
    } else {
        this.absLabel = this.label;
        this.absKey   = this.key;
    }
})

// Mix pv.Dom.Node.prototype
.add(pv.Dom.Node)

.add(/** @lends pvc.data.Data# */{
    parent:       null,
    linkParent:   null,
    
    /**
     * The dimension instances of this data.
     * @type pvc.data.Dimension[]
     */
    _dimensions: null, 
    
    /**
     * The names of unbound dimensions.
     * @type string[]
     */
    _freeDimensionNames: null,
    
    /**
     * The child data instances of this data.
     * @type pvc.data.Data[]
     * @internal
     */
    _children: null,
    
    /**
     * The link child data instances of this data.
     * @type pvc.data.Data[]
     * @internal
     */
    _linkChildren: null,
    
    /**
     * The leaf data instances of this data.
     * 
     * @type pvc.data.Data[] 
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
     * A map of visible datums indexed by id.
     * @type def.Map
     */
    _visibleDatums: null,
    
    /**
     * A map of selected datums indexed by id.
     * @type def.Map
     */
    _selectedDatums: null, 
    
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
     * @type pvc.data.GroupingOper
     */
    _groupOper: null,
    
    /**
     * A grouping specification object used to create this data, 
     * along with {@link #groupLevel}. 
     * Only defined in datas that have children.
     * 
     * @type pvc.data.GroupingSpec
     */
    _groupSpec: null,
    
    /**
     * A grouping level specification object used to create this data, 
     * along with {@link #groupSpec}. 
     * Only defined in datas that have children.
     * 
     * @type pvc.data.GroupingLevelSpec
     */
    _groupLevel: null,
    
    /** 
     * The datums of this data.
     * @type pvc.data.Datum[]
     * @internal
     */
    _datums: null,
    
    /** 
     * A map of the datums of this data indexed by id.
     * @type object
     * @internal
     */
    _datumsById: null, 
    
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
    
    _initDimension: function(dimType){
        this._dimensions[dimType.name] = 
                new pvc.data.Dimension(this, dimType);
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
     * @type pvc.data.Dimension
     */
    dimensions: function(name, keyArgs){
        if(name == null) {
            return this._dimensions;
        }
        
        var dim = def.getOwn(this._dimensions, name);
        if(!dim && def.get(keyArgs, 'assertExists', true)) {
            throw def.error.argumentInvalid('name', "Undefined dimension '{0}'.", [name]); 
        }
         
        return dim;
    },
    
    /**
     * Obtains an array of the names of dimensions that are not bound in {@link #atoms}.
     * @type string[]
     */
    freeDimensionNames: function(){
        if(!this._freeDimensionNames) {
            var free = this._freeDimensionNames = [];
            def.eachOwn(this._dimensions, function(dim, dimName){
                var atom = this.atoms[dimName];
                if(!(atom instanceof pvc.data.Atom) || atom.value == null){
                    free.push(dimName);
                }
            }, this);
        }
        return this._freeDimensionNames;
    },
    
    /**
     * Indicates if the data is an owner.
     * 
     * @type boolean
     */
    isOwner: function(){
        return this.owner === this;
    },
    
    /**
     * Obtains an enumerable of the child data instances of this data.
     * 
     * @type pvc.data.Data | def.Query
     */
    children: function(){
        if(!this._children) {
            return def.query();
        }

//        @param {object} [keyArgs] Keyword arguments. 
//        @param {string} [keyArgs.key=null} The key of the desired child.
//        @param {string} [keyArgs.assertExists=true} Indicates that a missing child should be signaled as an error.
//        var key = def.get(keyArgs, 'key');
//        if(key != null) {
//            var child = def.getOwn(this._childrenByKey, key);
//            if(!child && def.get(keyArgs, 'assertExists', true)) {
//               throw def.error.argumentInvalid("Undefined child data with key '{0}'.", [key]); 
//            }
//            
//            return child;
//        }
        
        return def.query(this._children);
    },

    /**
     * Obtains the number of children.
     *
     * @type number
     */
    childCount: function(){
        return this._children ? this._children.length : 0;
    },

    /**
     * Obtains an enumerable of the leaf data instances of this data.
     * 
     * @type def.Query 
     */
    leafs: function(){
        return def.query(this._leafs);
    },
    
    /**
     * Obtains the number of contained datums.
     * @type number
     */
    count: function(){
        return this._datums.length;
    },
    
    /**
     * Obtains the single datum of this data, 
     * or null, when the data no datums or has more than one.
     * 
     * @type pvc.data.Datum
     */
    singleDatum: function(){
        var datums = this._datums;
        return datums.length === 1 ? datums[0] : null;
    },
    
    /**
     * Disposes the child datas, the link child datas and the dimensions.
     * @type undefined
     */
    dispose: function(){
        if(!this._disposed){
            data_disposeChildLists.call(this);
            if(this._selectedDatums) { this._selectedDatums.clear(); }
            this._visibleDatums.clear();
            
            def.eachOwn(this._dimensions, function(dimension){ dimension.dispose(); });
            
            //  myself
            
            if(this.parent){
                this.parent.removeChild(this);
                this.parent = null;
            }
            
            if(this.linkParent) {
                /*global data_removeLinkChild:true */
                data_removeLinkChild.call(this.linkParent, this);
            }
            
            this._disposed = true;
        }
    },
    
    /**
     * Disposes the child datas and the link child datas.
     * @type undefined
     */
    disposeChildren: function(){
        /*global data_disposeChildLists:true */
        data_disposeChildLists.call(this);
    }
});

/**
 * Adds a child data.
 * 
 * @name pvc.data.Data#_addChild
 * @function
 * @param {pvc.data.Data} child The child data to add.
 * @param {number} [index=null] The index at which to insert the child.
 * @type undefined
 * @private
 */
function data_addChild(child, index){
    // this   -> ((pv.Dom.Node#)child).parentNode
    // child  -> ((pv.Dom.Node#)this).childNodes
    // ...
    this.insertAt(child, index);
    
    (this._childrenByKey || (this._childrenByKey = {}))[child.key] = child;
}

/**
 * Adds a link child data.
 * 
 * @name pvc.data.Data#_addLinkChild
 * @function
 * @param {pvc.data.Data} child The link child data to add.
 * @param {number} [index=null] The index at which to insert the child.
 * @type undefined
 * @private
 */
function data_addLinkChild(linkChild, index){
    /*global data_addColChild:true */
    data_addColChild(this, '_linkChildren', linkChild, 'linkParent', index);
}

/**
 * Removes a link child data.
 *
 * @name pvc.data.Data#_removeLinkChild
 * @function
 * @param {pvc.data.Data} child The link child data to remove.
 * @type undefined
 * @private
 */
function data_removeLinkChild(linkChild){
    /*global data_removeColChild:true */
    data_removeColChild(this, '_linkChildren', linkChild, 'linkParent');
}

/**
 * Disposes the child datas and the link child datas.
 * 
 * @name pvc.data.Data#_disposeChildLists
 * @function
 * @type undefined
 * @private
 */
function data_disposeChildLists() {
    /*global data_disposeChildList:true */
    data_disposeChildList(this._children, 'parent');
    this._childrenByKey = null;
    
    data_disposeChildList(this._linkChildren, 'linkParent');
    this._groupByCache = null;  
    
    // ~ datums.{isSelected, isVisible, isNull}, children
    this._sumAbsCache = null;
}

/**
 * Called to assert that this is an owner data.
 *  
 * @private
 */
function data_assertIsOwner(){
    /*jshint expr:true */
    this.isOwner() || def.fail("Can only be called on the owner data.");
}

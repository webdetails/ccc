var data_labelSep = " ~ ";

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
 * @property {pvc.data.Data[]} leafs The leaf data instances of this data.
 * Only defined in root data instances.
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
 * @param {object} [keyArgs] Keyword arguments
 * 
 * @param {pvc.data.Data}    [keyArgs.parent]     The parent data.
 * @param {pvc.data.Data}    [keyArgs.linkParent] The link parent data.
 * @param {pvc.data.Atom[]}  [keyArgs.atoms]      The atoms shared by contained datums.
 * @param {pvc.data.Datum[]} [keyArgs.datums]     The contained datums.
 * @param {pvc.data.Data}    [keyArgs.owner]      The owner data.
 * The topmost root data is its own owner.
 * An intermediate root data must specify its owner data.
 * 
 * @param {pvc.data.ComplexType} [keyArgs.type] The complex type.
 * Required when no parent or owner are specified.
 */
def.type('pvc.data.Data', pvc.data.Complex)
.init(function(keyArgs){
    /**
     * The dimension instances of this data.
     * @name pvc.data.Data#_dimensions
     * @field
     * @type pvc.data.Dimension[]
     * @private  
     */
    this._dimensions = {};
    
    var owner, 
        atoms,
        isOwner;
    
    var parent = this.parent = def.get(keyArgs, 'parent') || null;
    if(parent){
        // Not a root
        this.root    = parent.root;
        this.depth   = parent.depth + 1;
        this.type    = parent.type;
        this._datums = def.get(keyArgs, 'datums') || def.fail.argumentRequired('datums');
        
        owner = parent.owner;
        atoms = def.get(keyArgs, 'atoms') || def.fail.argumentRequired('atoms');
        
    } else {
        // Root (topmost or not)
        this.root = this;
        // depth = 0
        
        var linkParent = def.get(keyArgs, 'linkParent') || null;
        if(linkParent){
            // A root that is not topmost - owned, linked
            owner = linkParent.owner;
            //atoms = pv.values(linkParent.atoms); // is atomsBase
            
            this.type    = owner.type;
            this._datums = def.get(keyArgs, 'datums') || linkParent._datums.slice();
            this.leafs = [];
            
            data_addLinkChild.call(linkParent, this);
        } else {
            // Topmost root - an owner
            isOwner = true;
            owner = this;
            //atoms = null
            
            this.type = def.get(keyArgs, 'type') || def.fail.argumentRequired('type');
            
            // Selection is only handled by owner datas.
            /**
             * A map of selected datums by their indexes.
             * @type object
             * @private
             */
            this._selectedDatums = {};

            /**
             * The number of selected datums.
             * @type number
             * @private
             */
            this._selectedCount = 0;
        }
    }
    
    // Must antecipate setting this (and not wait for the base constructor)
    // because otherwise new Dimension( ... ) fails.
    this.owner = owner;
    
    // Connect .atoms to each other
    var atomsBase = isOwner ? {} : (this.parent || this.linkParent).atoms;
    
    this.type.dimensionsList().forEach(function(dimType){
        var name = dimType.name,
            dimension = new pvc.data.Dimension(this, dimType);
        
        this._dimensions[name] = dimension;
        if(isOwner) {
            atomsBase[name] = dimension.atom(); // null atom
        }
    }, this);
    
    // Call base constructors
    def.base.call(this, owner, atoms, atomsBase);
    
    pv.Dom.Node.call(this, /* nodeValue */null);
    
    this._children = this.childNodes; // pv.Dom.Node#childNodes
    
    // Build label and child key
    if(this.atoms){
        this.absLabel = 
        this.label = def.own(this.atoms)
                        .map(function(atom){ return atom.label; })
                        .filter(def.notEmpty)
                        .join(data_labelSep);
    }

    this.absKey = this.key;
    if(parent){
        data_addChild.call(parent, this);
        
        if(parent.absLabel){
            this.absLabel = def.join(data_labelSep, parent.absLabel, this.label);
        }
        
        if(parent.absKey) {
            this.absKey = parent.absKey + "," + this.key;
        }
    }
})

// Mix pv.Dom.Node.prototype
.add(pv.Dom.Node)

.add(/** @lends pvc.data.Data# */{
    parent:       null,
    linkParent:   null,
    
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
     * The map of child datas by their key.
     * 
     * @type string
     * @internal
     */
    _childrenByKey: null,
    
    /** 
     * The name of the dimension that children have as child key.
     * 
     * @type string
     * @internal
     */
    _childrenKeyDimName: null,
    
    /**
     * Cache of link child data by grouping operation key.
     * @type object
     * @internal
     */
    _groupByCache: null,
    
    /**
     * The height of the tree of datas headed by a root data.
     * Only defined in root datas. 
     */
    treeHeight: null,
    
    /** 
     * The datums of this data.
     * @type pvc.data.Datum[]
     * @internal
     */
    _datums: null,
    
    leafs:    null,
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
     * Indicates if the data is an owner.
     * 
     * @type boolean
     */
    isOwner: function(){
        return this.owner === this;
    },
    
    /**
     * Obtains an enumerable on the child data instances of this data.
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * @param {string} [keyArgs.key=null} The key of the desired child.
     * @param {string} [keyArgs.assertExists=true} Indicates that a missing child should be signaled as an error.
     * 
     * @type pvc.data.Data | def.Query
     */
    children: function(keyArgs){
        if(!this._children) {
            return def.query([]);
        }
        
        var key = def.get(keyArgs, 'key');
        if(key != null) {
            var child = def.getOwn(this._childrenByKey, key);
            if(!child && def.get(keyArgs, 'assertExists', true)) {
               throw def.error.argumentInvalid("Undefined child data with key '{0}'.", [key]); 
            }
            
            return child;
        }
        
        return def.query(this._children);
    },
    
    /**
     * Disposes the child datas, the link child datas and the dimensions.
     */
    dispose: function(){
        if(!this._disposed){
            data_disposeChildLists.call(this);
            
            def.forEachOwn(this._dimensions, function(dimension){ dimension.dispose(); });
            
            //  myself
            
            if(this.parent){
                this.parent.removeChild(this);
                this.parent = null;
            }
            
            this.linkParent && data_removeLinkChild.call(this.linkParent, this);
            
            this._disposed = true;
        }
    }
});



/**
 * Disposes the child datas and the link child datas.
 * 
 * @name pvc.data.Data#_disposeChildLists
 * @function
 * @type undefined
 * @private
 */
function data_disposeChildLists() {
    data_disposeChildList(this._children,     'parent');
    data_disposeChildList(this._linkChildren, 'linkParent');
    
    this._childrenByKey = null;
    this._groupByCache  = null;
    
    if(this._selectedDatums) {
        this._selectedDatums = null;
        this._selectedCount = 0;
    }
}

/**
 * Called to assert that this is an owner data.
 *  
 * @private
 */
function data_assertIsOwner(){
    this.isOwner() || pvc.fail("Can only be called on the owner data.");
}

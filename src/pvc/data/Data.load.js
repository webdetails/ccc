pvc.data.Data.add(/** @lends pvc.data.Data# */{
    /**
     * Loads or reloads the data with the specified enumerable of atoms.
     * 
     * <p>
     * Can only be called on an owner data. 
     * Child datas are instead "loaded" on construction, 
     * with a subset of its parent's datums.
     * </p>
     * 
     * <p>
     * This method was designed to be fed with the output
     * of {@link pvc.data.TranslationOper#execute}.
     * </p>
     * 
     * @param {def.Query} atomz An enumerable of {@link pvc.data.Atom[]}.
     * @param {object} [keyArgs] Keyword arguments.
     * @param {function} [keyArgs.where] Filter function that approves or excludes each newly read new datum.
     */
    load: function(atomz, keyArgs){
        data_assertIsOwner.call(this);
        
        // TODO: Not guarding against re-entry during load
        var whereFun = def.get(keyArgs, 'where');
        var isReload = !!this._datums;
        if(isReload) {
            // Dispose child and link child datas...
            data_disposeChildLists.call(this);
            
            this._datums = data_reloadDatums.call(this, atomz, whereFun);
            
        } else {
            this._datums = data_loadDatums.call(this, atomz, whereFun);
        }
        
        data_syncDatumsState.call(this);
        
        // Allow dimensions to clear their caches
        if(isReload) {
            def.eachOwn(this._dimensions, function(dimension){
                dim_onDatumsChanged.call(dimension);
            });
        }
        
        this._leafs = this._datums; // Share (only on owner)
    }
});

/**
 * Loads the specified enumerable of atoms.
 * 
 * @name pvc.data.Data#_loadDatums
 * @function
 * @param {def.Query} atomz An enumerable of {@link pvc.data.Atom[]}.
 * @param {function} [whereFun] Filter function that approves or excludes each newly read new datum.
 * @returns {pvc.data.Datum[]} The loaded datums.
 * @private
 */
function data_loadDatums(atomz, whereFun) {
    
    function createDatum(atoms){
        return new pvc.data.Datum(this, atoms);
    }
    
    var q = def.query(atomz)
              .select(createDatum, this);
    if(whereFun) {
        q = q.where(whereFun);
    }  
    
    return q.distinct(function(datum){ return datum.key; })
            .array();
}

/**
 * Loads the specified enumerable of atoms
 * joining them with existing loaded datums.
 * 
 * Datums that already exist are preserved
 * while those that are not added again are removed. 
 * 
 * @name pvc.data.Data#_reloadDatums
 * @function
 * @param {def.Query} atomz An enumerable of {@link pvc.data.Atom[]}.
 * @param {function} [whereFun] Filter function that approves or excludes each newly read new datum.
 * @returns {pvc.data.Datum[]} The loaded datums.
 * @private
 */
function data_reloadDatums(atomz, whereFun) {
    
    // Index existing datums by (semantic) key
    var datumsByKey = def.query(this._datums)
                         .uniqueIndex(function(datum){ return datum.key; });
        
    // Atom garbage collection
    
    var dimNames = this.type.dimensionsNames();
    
    // [atom.dimension.name][atom.key] -> true
    var visitedAtomsKeySetByDimension = pv.dict(dimNames, function(){ return {}; });
    
    function internDatum(atoms){
        var newDatum = new pvc.data.Datum(this, atoms);
        if(whereFun && !whereFun(newDatum)) {
            return null;
        }
        
        var datum = datumsByKey[newDatum.key];
        if(!datum) {
            datumsByKey[newDatum.key] = datum = newDatum;
        }
        
        // Visit atoms
        atoms.forEach(function(atom){
            var name = atom.dimension.name,
                key = atom.key;
            if(key) {
                visitedAtomsKeySetByDimension[name][key] = true;
            }
        });
        
        return datum;
    }
    
    var datums = def.query(atomz)
                    .select(internDatum, this)
                    .where(def.notNully)
                    .array();
    
    // Unintern unused atoms
    def.eachOwn(this._dimensions, function(dimension){
        var visitedAtomsKeySet = visitedAtomsKeySetByDimension[dimension.name];
        
        var uninternAtoms = dimension.atoms().filter(function(atom){
                return !def.hasOwn(visitedAtomsKeySet, atom.key);
            });
        
        uninternAtoms.forEach(function(atom){
            dim_unintern.call(dimension, atom);
        });
    });
    
    return datums;
}

/**
 * Adds a child data.
 * 
 * @name pvc.data.Data#_addChild
 * @function
 * @param {pvc.data.Data} child The child data to add.
 * @type undefined
 * @private
 */
function data_addChild(child){
    // this   -> ((pv.Dom.Node#)child).parentNode
    // child  -> ((pv.Dom.Node#)this).childNodes
    // ...
    this.appendChild(child);
    
    (this._childrenByKey || (this._childrenByKey = {}))[child.key] = child;
}

/**
 * Adds a link child data.
 * 
 * @name pvc.data.Data#_addLinkChild
 * @function
 * @param {pvc.data.Data} child The link child data to add.
 * @type undefined
 * @private
 */
function data_addLinkChild(linkChild){
    data_addColChild(this, '_linkChildren', linkChild, 'linkParent');
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
    data_removeColChild(this, '_linkChildren', linkChild, 'linkParent');
}

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
     * @param {def.Query} atomz An enumerable of {@link map(string union(any || pvc.data.Atom))}.
     * @param {object} [keyArgs] Keyword arguments.
     * @param {function} [keyArgs.isNull] Predicate that indicates if a datum is considered null.
     * @param {function} [keyArgs.where] Filter function that approves or excludes each newly read new datum.
     */
    load: function(atomz, keyArgs){
        /*global data_assertIsOwner:true */
        data_assertIsOwner.call(this);
        
        var whereFun  = def.get(keyArgs, 'where');
        var isNullFun = def.get(keyArgs, 'isNull');
        var datums = 
            def
            .query(atomz)
            .select(function(atoms){
                var datum = new pvc.data.Datum(this, atoms);
                
                if(isNullFun && isNullFun(datum)){
                    datum.isNull = true;
                }
                
                if(whereFun && !whereFun(datum)) {
                    return null;
                }
                
                return datum;
            }, this)
            ;
        
        data_setDatums.call(this, datums, { doAtomGC: true });
    },
    
    clearVirtuals: function(){
        // Recursively clears all virtual datums and atoms
        var datums = this._datums;
        if(datums){
            this._sumAbsCache = null;
            
            var visibleDatums  = this._visibleDatums;
            var selectedDatums = this._selectedDatums;
            
            var i = 0;
            var L = datums.length;
            var removed;
            while(i < L){
                var datum = datums[i];
                if(datum.isVirtual){
                    var id = datum.id;
                    if(selectedDatums && datum.isSelected) {
                        selectedDatums.rem(id);
                    }
                    
                    if(datum.isVisible) {
                        visibleDatums.rem(id);
                    }
                    
                    datums.splice(i, 1);
                    L--;
                    removed = true;
                } else {
                    i++;
                }
            }
            
            if(removed){
                if(!datums.length && this.parent){
                    // "Me is a group"
                    this.dispose();
                    return;
                }

                var children = this._children;
                if(children){
                    i = 0;
                    L = children.length;
                    while(i < L){
                        var childData = children[i];
                        childData.clearVirtuals();
                        if(!childData.parent){
                            // Child group was empty and removed itself
                            L--;
                        } else {
                            i++;
                        }
                    }
                }
                
                if(this._linkChildren){
                    this._linkChildren.forEach(function(linkChildData){
                        linkChildData.clearVirtuals();
                    });
                }
            }
        }
        
        def.eachOwn(this._dimensions, function(dim){
            /*global dim_uninternVirtualAtoms:true*/
            dim_uninternVirtualAtoms.call(dim);
        });
    },
    
    /**
     * Adds new datums to the owner data.
     * @param {pvc.data.Datum[]|def.Query} datums The datums to add. 
     */
    add: function(datums){
        /*global data_assertIsOwner:true */
        data_assertIsOwner.call(this);
        
        /*global data_setDatums:true */
        data_setDatums.call(this, datums, {
            isAdditive: true,
            doAtomGC:   true 
        });
    },
    
    /**
     * Groups the datums of this data, possibly filtered,
     * according to a grouping specification.
     * 
     * <p>
     * The result of the grouping operation over a set of datums
     * is a new <i>linked child</i> data.
     * 
     * It is a root data, 
     * but shares the same {@link #owner} and {@link #atoms} with this,
     * and has the considered datums in {@link #datums}.
     * 
     * The data will contain one child data per distinct atom,
     * of the first grouping level dimension, 
     * found in the datums.
     * Each child data will contain the datums sharing that atom.
     * 
     * This logic extends to all following grouping levels.
     * </p>
     * 
     * <p>
     * Datums with null atoms on a grouping level dimension are excluded.
     * </p>
     * 
     * @param {string|string[]|pvc.data.GroupingOperSpec} groupingSpecText A grouping specification string or object.
     * <pre>
     * "series1 asc, series2 desc, category"
     * </pre>
     * 
     * @param {Object} [keyArgs] Keyword arguments object.
     * See additional keyword arguments in {@link pvc.data.GroupingOper}
     * 
     * @see #where
     * @see pvc.data.GroupingLevelSpec
     *
     * @returns {pvc.data.Data} The resulting root data.
     */
    groupBy: function(groupingSpecText, keyArgs){
        var groupOper = new pvc.data.GroupingOper(this, groupingSpecText, keyArgs),
            cacheKey  = groupOper.key,
            groupByCache,
            data;

        if(cacheKey){
            groupByCache = this._groupByCache;

            // Check cache for a linked data with that key
            data = groupByCache && groupByCache[cacheKey];
        }

        if(!data) {
            if(pvc.debug >= 7){
                pvc.log("[GroupBy] " + (cacheKey ? ("Cache key not found: '" + cacheKey + "'") : "No Cache key"));
            }
            
            data = groupOper.execute();

            if(cacheKey){
                (groupByCache || (this._groupByCache = {}))[cacheKey] = data;
            }
        } else if(pvc.debug >= 7){
            pvc.log("[GroupBy] Cache key hit '" + cacheKey + "'");
        }
        
        return data;
    },

    flattenBy: function(role, keyArgs){
        var grouping = role.flattenedGrouping(keyArgs) || 
                       def.fail.operationInvalid("Role is unbound.");
        
        return this.groupBy(grouping, keyArgs);
    },
    
    /**
     * Creates a linked data with the result of filtering
     * the datums of this data.
     *
     * <p>
     * This operation differs from {@link #datums} only in the type of output,
     * which is a new linked data, instead of an enumerable of the filtered datums.
     * See {@link #datums} for more information on the filtering operation.
     * </p>
     *
     * @param {object} [whereSpec] A "where" specification.
     * @param {object} [keyArgs] Keyword arguments object.
     * See {@link #datums} for information on available keyword arguments.
     *
     * @returns {pvc.data.Data} A linked data containing the filtered datums.
     */
    where: function(whereSpec, keyArgs){
        var datums = this.datums(whereSpec, keyArgs);
        return new pvc.data.Data({linkParent: this, datums: datums});
    },

    /**
     * Obtains the datums of this data, 
     * possibly filtered according 
     * to a specified "where" specification,
     * datum selected state and 
     * filtered atom visible state.
     *
     * @param {object} [whereSpec] A "where" specification.
     * A structure with the following form:
     * <pre>
     * // OR of datum filters
     * whereSpec = [datumFilter1, datumFilter2, ...] | datumFilter;
     * 
     * // AND of dimension filters
     * datumFilter = {
     *      // OR of dimension values
     *      dimName1: [value1, value2, ...],
     *      dimName2: value1,
     *      ...
     * }
     * </pre>
     * <p>Values of a datum filter can also directly be atoms.</p>
     * <p>
     *    An example of a "where" specification:
     * </p>
     * <pre>
     * whereSpec = [
     *     // Datums whose series is 'Europe' or 'Australia', 
     *     // and whose category is 2001 or 2002 
     *     {series: ['Europe', 'Australia'], category: [2001, 2002]},
     *     
     *     // Union'ed with
     *     
     *     // Datums whose series is 'America' 
     *     {series: 'America'},
     * ];
     * </pre>
     *  
     * @param {object} [keyArgs] Keyword arguments object.
     * 
     * @param {boolean} [keyArgs.isNull=null]
     *      Only considers datums with the specified isNull attribute.
     * 
     * @param {boolean} [keyArgs.visible=null]
     *      Only considers datums that have the specified visible state.
     * 
     * @param {boolean} [keyArgs.selected=null]
     *      Only considers datums that have the specified selected state.
     * 
     * @param {function} [keyArgs.where] A arbitrary datum predicate.
     *
     * @param {string[]} [keyArgs.orderBySpec] An array of "order by" strings to be applied to each 
     * datum filter of <i>whereSpec</i>.
     * <p>
     * An "order by" string is the same as a grouping specification string, 
     * although it is used here with a slightly different meaning.
     * Here's an example of an "order by" string:
     * <pre>
     * "series1 asc, series2 desc, category"
     * </pre
     * </p>
     * 
     * <p>
     * When not specified, altogether or individually, 
     * these are determined to match the corresponding datum filter of <i>whereSpec</i>.
     * </p>
     * 
     * <p>
     * If a string is specified it is treated as the "order by" string corresponding 
     * to the first datum filter.
     * </p>
     * 
     * @returns {def.Query} A query object that enumerates the desired {@link pvc.data.Datum}.
     */
    datums: function(whereSpec, keyArgs){
        if(!whereSpec){
            if(!keyArgs){
                return def.query(this._datums);
            }
            
            return data_whereState(def.query(this._datums), keyArgs);
        }
        
        whereSpec = data_processWhereSpec.call(this, whereSpec, keyArgs);
        
        return data_where.call(this, whereSpec, keyArgs);
    },
    
    /**
     * Obtains the first datum that 
     * satisfies a specified "where" specification.
     * <p>
     * If no datum satisfies the filter, null is returned.
     * </p>
     * 
     * @param {object} whereSpec A "where" specification.
     * See {@link #datums} to know about this structure.
     * 
     * @param {object} [keyArgs] Keyword arguments object.
     * See {@link #datums} for additional available keyword arguments.
     * 
     * @param {boolean} [keyArgs.createNull=false] Indicates if a 
     * null datum should be returned when no datum is satisfied the specified filter.
     * <p>
     * The assumption is that the "where" specification
     * contains one datum filter, and in turn,
     * that it specifies <b>all</b> the dimensions of this data's complex type.  
     * </p>
     * <p>
     * The first specified datum filter is used as a source to the datums' atoms.
     * Also, it is the first atom of each dimension filter that is used.
     * </p>
     * 
     * @returns {pvc.data.Datum} 
     * The first datum that satisfies the specified filter, 
     * a null datum, if <i>keyArgs.createNull</i> is truthy, 
     * or <i>null</i>.
     * 
     * @see pvc.data.Data#datums 
     */
    datum: function(whereSpec, keyArgs){
        /*jshint expr:true */
        whereSpec || def.fail.argumentRequired('whereSpec');
        
        whereSpec = data_processWhereSpec.call(this, whereSpec, keyArgs);
        
        var datum = data_where.call(this, whereSpec, keyArgs).first() || null;
        if(!datum && def.get(keyArgs, 'createNull') && whereSpec.length) {
            
            /* Create Null Datum */
            var sourceDatumFilter = whereSpec[0],
                atoms = {};
            
            for(var dimName in this._dimensions){
                var dimAtoms = sourceDatumFilter[dimName];
                if(dimAtoms) {
                    atoms[dimName] = dimAtoms[0];
                }
            }
            
            // true => null datum
            datum = new pvc.data.Datum(this, atoms, true);
        }
        
        return datum;
    },
    
    /**
     * Obtains the first datum of this data, if any.
     * @type {pvc.data.Datum} The first datum or <i>null</i>. 
     */
    firstDatum: function(){
        return this._datums.length ? this._datums[0] : null;
    },
    
    /**
     * Sums the absolute value 
     * of the sum of a specified dimension on each child.
     *
     * @param {string} dimName The name of the dimension to sum on each child data.
     * @param {object} [keyArgs] Optional keyword arguments that are
     * passed to each dimension's {@link pvc.data.Dimension#sum} method.
     * 
     * @type number
     */
    dimensionsSumAbs: function(dimName, keyArgs){
        /*global dim_buildDatumsFilterKey:true */
        var key = dimName + ":" + dim_buildDatumsFilterKey(keyArgs),
            sum = def.getOwn(this._sumAbsCache, key);

        if(sum == null) {
            sum = this.children()
                    /* non-degenerate flattened parent groups would account for the same values more than once */
                    .where(function(childData){ return !childData._isFlattenGroup || childData._isDegenerateFlattenGroup; })
                    .select(function(childData){
                        return Math.abs(childData.dimensions(dimName).sum(keyArgs));
                    }, this)
                    .reduce(def.add, 0);

            (this._sumAbsCache || (this._sumAbsCache = {}))[key] = sum;
        }

        return sum;
    }
});


/**
 * Called to add or replace the contained {@link pvc.data.Datum} instances. 
 * 
 * When replacing, all child datas and linked child datas are disposed.
 * 
 * When adding, the specified datums will be added recursively 
 * to this data's parent or linked parent, and its parent, until the owner data is reached.
 * When crossing a linked parent, 
 * the other linked children of that parent
 * are given a chance to receive a new datum, 
 * and it will be added if it satisfies its inclusion criteria.
 * 
 * The datums' atoms must be consistent with the base atoms of this data.
 * If this data inherits a non-null atom in a given dimension and:
 * <ul>
 * <li>a datum has another non-null atom, an error is thrown.</li>
 * <li>a datum has a null atom, an error is thrown.
 * </ul>
 * 
 * @name pvc.data.Data#_setDatums
 * @function
 * @param {pvc.data.Datum[]|def.Query} newDatums An array or enumerable of datums.
 * When an array, and in replace mode, 
 * it is used directly to keep the stored datums and may be modified if necessary.
 * 
 * @param {object} [keyArgs] Keyword arguments.
 * 
 * @param {boolean} [keyArgs.isAdditive=false] Indicates that the specified datums are to be added, 
 * instead of replace existing datums.
 * 
 * @param {boolean} [keyArgs.doAtomGC=true] Indicates that atom garbage collection should be performed.
 * 
 * @type undefined
 * @private
 */
function data_setDatums(newDatums, keyArgs){
    // But may be an empty list
    /*jshint expr:true */
    newDatums || def.fail.argumentRequired('newDatums');
    
    var doAtomGC   = def.get(keyArgs, 'doAtomGC',   false);
    var isAdditive = def.get(keyArgs, 'isAdditive', false);
    
    var visibleDatums  = this._visibleDatums;
    var selectedDatums = this._selectedDatums;
    
    var newDatumsByKey = {};
    var prevDatumsByKey;
    var prevDatums = this._datums;
    if(prevDatums){
        // Visit atoms of existing datums
        // We cannot simply mark all atoms of every dimension
        // cause now, the dimensions may already contain new atoms
        // used (or not) by the new datums
        var processPrevAtoms = isAdditive && doAtomGC;
        
        // Index existing datums by (semantic) key
        // So that old datums may be preserved
        prevDatumsByKey = 
            def
            .query(prevDatums)
            .uniqueIndex(function(datum){
                
                if(processPrevAtoms){ // isAdditive && doAtomGC
                    data_processDatumAtoms.call(
                            this, 
                            datum, 
                            /* intern */      false, 
                            /* markVisited */ true);
                }
                
                return datum.key;
            }, this);
        
        // Clear caches and/or children
        if(isAdditive){
            this._sumAbsCache = null;
        } else {
            /*global data_disposeChildLists:true*/
            data_disposeChildLists.call(this);
            if(selectedDatums) { selectedDatums.clear(); }
            visibleDatums.clear();
        }
    } else {
        isAdditive = false;
    }
    
    var datumsById;
    if(isAdditive){
        datumsById = this._datumsById;
    } else {
        datumsById = this._datumsById = {};
    }
    
    if(def.array.is(newDatums)){
        var i = 0;
        var L = newDatums.length;
        while(i < L){
            var inDatum  = newDatums[i];
            var outDatum = setDatum.call(this, inDatum);
            if(!outDatum){
                newDatums.splice(i, 1);
                L--;
            } else {
                if(outDatum !== inDatum){
                    newDatums[i] = outDatum;
                }
                i++;
            }
        }
    } else if(newDatums instanceof def.Query){
        newDatums = 
            newDatums
            .select(setDatum, this)
            .where(def.notNully)
            .array();
    } else {
        throw def.error.argumentInvalid('newDatums', "Argument is of invalid type.");
    }
    
    if(doAtomGC){
        // Atom garbage collection
        // Unintern unused atoms
        def.eachOwn(this._dimensions, function(dimension){
            /*global dim_uninternUnvisitedAtoms:true*/
            dim_uninternUnvisitedAtoms.call(dimension);
        });
    }
    
    if(isAdditive){
        // newDatums contains really new datums (excluding duplicates)
        // These can be further filtered in the grouping operation
        
        def.array.append(prevDatums, newDatums);
        
        // II - Distribute added datums by linked children
        if(this._linkChildren){
            this._linkChildren.forEach(function(linkChildData){
                data_addDatumsSimple.call(linkChildData, newDatums);
            });
        }
    } else {
        this._datums = newDatums;
    }
    
    function setDatum(newDatum){
        if(!newDatum){
            // Ignore
            return;
        }
        
        /* Use already existing same-key datum, if any */
        var key = newDatum.key;
        
        if(def.hasOwnProp.call(newDatumsByKey, key)){
            // Duplicate in input datums, ignore
            return;
        }
        
        if(prevDatumsByKey){
            var prevDatum = def.getOwn(prevDatumsByKey, key);
            if(prevDatum){
                // Duplicate with previous datums
                if(isAdditive){
                    // Ignore
                    return;
                }
                
                // Prefer to *re-add* the old datum and ignore the new one
                // Not new
                newDatum = prevDatum;
                
                // The old datum is going to be kept.
                // In the end, it will only contain the datums that were "removed"
                //delete prevDatumsByKey[key];
            }
            // else newDatum is really new
        }
        
        newDatumsByKey[key] = newDatum;
        
        var id = newDatum.id;
        datumsById[id] = newDatum;
        
        data_processDatumAtoms.call(
                this,
                newDatum,
                /* intern      */ !!this._dimensions, // When creating a linked data, datums are set when dimensions aren't yet created. 
                /* markVisited */ doAtomGC);
        
        // TODO: make this lazy?
        if(!newDatum.isNull){
            if(selectedDatums && newDatum.isSelected) {
                selectedDatums.set(id, newDatum);
            }
        
            if(newDatum.isVisible) {
                visibleDatums.set(id, newDatum);
            }
        }
        
        return newDatum;
    }
}

/**
 * Processes the atoms of this datum.
 * If a virtual null atom is found then the null atom of that dimension
 * is interned.
 * If desired the processed atoms are marked as visited.
 * 
 * @name pvc.data.Datum._processAtoms
 * @function
 * @param {boolean} [intern=false] If virtual nulls should be detected.
 * @param {boolean} [markVisited=false] If the atoms should be marked as visited. 
 * @type undefined
 * @internal
 */
function data_processDatumAtoms(datum, intern, markVisited){
    
    var dims = this._dimensions;
    if(!dims){
        // data is still initializing and dimensions are not yet created
        intern = false;
    }
    
    def.each(datum.atoms, function(atom){
        if(intern){
            // Ensure that the atom exists in the local dimension
            
            var localDim = def.getOwn(dims, atom.dimension.name) ||
                           def.fail.argumentInvalid("Datum has atoms of foreign dimension.");
            
            /*global dim_internAtom:true */
            dim_internAtom.call(localDim, atom);
        }
        
        if(markVisited){
            // Mark atom as visited
            atom.visited = true;
        }
    });
}

function data_addDatumsSimple(newDatums){
    // But may be an empty list
    /*jshint expr:true */
    newDatums || def.fail.argumentRequired('newDatums');
    
    var groupOper = this._groupOper;
    if(groupOper){
        // This data gets its datums, 
        //  possibly filtered (groupOper calls data_addDatumsLocal).
        // Children get their new datums.
        // Linked children of children get their new datums.
        newDatums = groupOper.executeAdd(this, newDatums);
    } else {
        data_addDatumsLocal.call(this, newDatums);
    }
    
    // Distribute added datums by linked children
    if(this._linkChildren){
        this._linkChildren.forEach(function(linkChildData){
            data_addDatumsSimple.call(linkChildData, newDatums);
        });
    }
}

function data_addDatumsLocal(newDatums){
    var visibleDatums  = this._visibleDatums;
    var selectedDatums = this._selectedDatums;
    
    // Clear caches
    this._sumAbsCache = null;
    
    var datumsById = this._datumsById;
    var datums = this._datums;
    
    newDatums.forEach(addDatum, this);
    
    function addDatum(newDatum){
        var id = newDatum.id;
        
        datumsById[id] = newDatum;
        
        data_processDatumAtoms.call(
                this,
                newDatum,
                /* intern      */ true, 
                /* markVisited */ false);
        
        // TODO: make this lazy?
        if(!newDatum.isNull){
            if(selectedDatums && newDatum.isSelected) {
                selectedDatums.set(id, newDatum);
            }
        
            if(newDatum.isVisible) {
                visibleDatums.set(id, newDatum);
            }
        }
        
        datums.push(newDatum);
    }
}

/**
 * Processes a given "where" specification.
 * <p>
 * Normalizes and validates the specification syntax, 
 * validates dimension names,
 * readily excludes uninterned (unexistent) and duplicate values and
 * atoms based on their "visible state".
 * </p>
 * 
 * <p>
 * The returned specification contains dimensions instead of their names
 * and atoms, instead of their values. 
 * </p>
 * 
 * @name pvc.data.Data#_processWhereSpec
 * @function
 * 
 * @param {object} whereSpec A "where" specification to be normalized.
 * TODO: A structure with the following form: ... 
 *
 * @return Array A <i>processed</i> "where" of the specification.
 * A structure with the following form:
 * <pre>
 * // OR of processed datum filters
 * whereProcSpec = [datumProcFilter1, datumProcFilter2, ...] | datumFilter;
 * 
 * // AND of processed dimension filters
 * datumProcFilter = {
 *      // OR of dimension atoms
 *      dimName1: [atom1, atom2, ...],
 *      dimName2: atom1,
 *      ...
 * }
 * </pre>
 * 
 * @private
 */
function data_processWhereSpec(whereSpec){
    var whereProcSpec = [];
    
    whereSpec = def.array.as(whereSpec);
    if(whereSpec){
        whereSpec.forEach(processDatumFilter, this);
    }
    
    return whereProcSpec;
    
    function processDatumFilter(datumFilter){
        if(datumFilter != null) {
            /*jshint expr:true */
            (typeof datumFilter === 'object') || def.fail.invalidArgument('datumFilter');
            
            /* Map: {dimName1: atoms1, dimName2: atoms2, ...} */
            var datumProcFilter = {},
                any = false;
            for(var dimName in datumFilter) {
                var atoms = processDimensionFilter.call(this, dimName, datumFilter[dimName]);
                if(atoms) {
                    any = true;
                    datumProcFilter[dimName] = atoms;
                }
            }
            
            if(any) {
                whereProcSpec.push(datumProcFilter);
            }
        }
    }
    
    function processDimensionFilter(dimName, values){
        // throws if it doesn't exist
        var dimension = this.dimensions(dimName),
            atoms = def.query(values)
                       .select(function(value){ return dimension.atom(value); }) // null if it doesn't exist
                       .where(def.notNully)
                       .distinct(function(atom){ return atom.key; })
                       .array();
        
        return atoms.length ? atoms : null;
    }
}

/**
 * Filters a datum query according to a specified predicate, 
 * datum selected and visible state.
 * 
 * @name pvc.data.Data#_whereState
 * @function
 * 
 * @param {def.query} q A datum query.
 * @param {object} [keyArgs] Keyword arguments object.
 * See {@link #groupBy} for additional available keyword arguments.
 * 
 * @returns {def.Query} A query object that enumerates the desired {@link pvc.data.Datum}.
 * @private
 * @static
 */
function data_whereState(q, keyArgs){
    var selected = def.get(keyArgs, 'selected'),
        visible  = def.get(keyArgs, 'visible'),
        where    = def.get(keyArgs, 'where'),
        isNull   = def.get(keyArgs, 'isNull')
        ;

    if(visible != null){
        q = q.where(function(datum){ return datum.isVisible === visible; });
    }
    
    if(isNull != null){
        q = q.where(function(datum){ return datum.isNull === isNull; });
    }
    
    if(selected != null){
        q = q.where(function(datum){ return datum.isSelected === selected; });
    }
    
    if(where){
        q = q.where(where);
    }
    
    return q;
}

// All the "Filter" and "Spec" words below should be read as if they were prepended by "Proc"
/**
 * Obtains the datums of this data filtered according to 
 * a specified "where" specification,
 * and optionally, 
 * datum selected state and filtered atom visible state.
 * 
 * @name pvc.data.Data#_where
 * @function
 * 
 * @param {object} [whereSpec] A <i>processed</i> "where" specification.
 * @param {object} [keyArgs] Keyword arguments object.
 * See {@link #groupBy} for additional available keyword arguments.
 * 
 * @param {string[]} [keyArgs.orderBySpec] An array of "order by" strings to be applied to each 
 * datum filter of <i>whereSpec</i>.
 * 
 * @returns {def.Query} A query object that enumerates the desired {@link pvc.data.Datum}.
 * @private
 */
function data_where(whereSpec, keyArgs) {
    
    var orderBys = def.array.as(def.get(keyArgs, 'orderBy')),
        datumKeyArgs = def.create(keyArgs || {}, {
            orderBy: null
        });
    
    var query = def.query(whereSpec)
                   .selectMany(function(datumFilter, index){
                      if(orderBys) {
                          datumKeyArgs.orderBy = orderBys[index];
                      }
                      
                      return data_whereDatumFilter.call(this, datumFilter, datumKeyArgs);
                   }, this);
    
    return query.distinct(function(datum){ return datum.id; });
    
    /*
    // NOTE: this is the brute force / unguided algorithm - no indexes are used
    function whereDatumFilter(datumFilter, index){
        // datumFilter = {dimName1: [atom1, OR atom2, OR ...], AND ...}
        
        return def.query(this._datums).where(datumPredicate, this);
        
        function datumPredicate(datum){
            if((selected === null || datum.isSelected === selected) && 
               (visible  === null || datum.isVisible  === visible)) {
                var atoms = datum.atoms;
                for(var dimName in datumFilter) {
                    if(datumFilter[dimName].indexOf(atoms[dimName]) >= 0) {
                        return true;
                    }
                }   
            }
        }
    }
    */    
}

/**
 * Obtains an enumerable of the datums satisfying <i>datumFilter</i>,
 * by constructing and traversing indexes.
 * 
 * @name pvc.data.Data#_whereDatumFilter
 * @function
 * 
 * @param {string} datumFilter A <i>processed</i> datum filter.
 * 
 * @param {Object} keyArgs Keyword arguments object.
 * See {@link #groupBy} for additional available keyword arguments.
 * 
 * @param {string} [keyArgs.orderBy] An "order by" string.
 * When not specified, one is determined to match the specified datum filter.
 * The "order by" string cannot contain multi-dimension levels (dimension names separated with "|").
 * 
 * @returns {def.Query} A query object that enumerates the desired {@link pvc.data.Datum}.
 * 
 * @private
 */
function data_whereDatumFilter(datumFilter, keyArgs) {
     var groupingSpecText = keyArgs.orderBy; // keyArgs is required
     if(!groupingSpecText) {
         // Choose the most convenient one.
         // A sort on dimension names can yield good cache reuse.
         groupingSpecText = Object.keys(datumFilter).sort().join(',');
     } else {
         if(groupingSpecText.indexOf("|") >= 0) {
             throw def.error.argumentInvalid('keyArgs.orderBy', "Multi-dimension order by is not supported.");
         }
         
         // TODO: not validating that groupingSpecText actually contains the same dimensions referred in datumFilter...
     }
     
     /*
        // NOTE:
        // All the code below is just a stack/state-based translation of 
        // the following recursive code (so that it can be used lazily with a def.query):
        
        recursive(rootData, 0);
        
        function recursive(parentData, h) {
            if(h >= H) {
                // Leaf
                parentData._datums.forEach(fun, ctx);
                return;
            }
            
            var dimName = parentData._groupLevelSpec.dimensions[0].name;
            datumFilter[dimName].forEach(function(atom){
                var childData = parentData._childrenByKey[atom.globalKey];
                if(childData) {
                    recursive(childData, h + 1);
                }
            }, this);
        }
     */
     
     var rootData = this.groupBy(groupingSpecText, keyArgs),
     H = rootData.treeHeight;
     
     var stateStack = [];
     
     // Ad-hoq query
     return def.query(function(/* nextIndex */){
         // Advance to next datum
         var state;

         // No current data means starting
         if(!this._data) {
             this._data = rootData;
             this._dimAtomsOrQuery = def.query(datumFilter[rootData._groupLevelSpec.dimensions[0].name]);
             
         // Are there still any datums of the current data to enumerate?
         } else if(this._datumsQuery) { 
             
             // <Debug>
             /*jshint expr:true */
             this._data || def.assert("Must have a current data");
             stateStack.length || def.assert("Must have a parent data"); // cause the root node is "dummy"
             !this._dimAtomsOrQuery || def.assert();
             // </Debug>
             
             if(this._datumsQuery.next()){
                 this.item = this._datumsQuery.item; 
                 return 1; // has next
             }
             
             // No more datums here
             // Advance to next leaf data node
             this._datumsQuery = null;
             
             // Pop parent data
             state = stateStack.pop();
             this._data = state.data;
             this._dimAtomsOrQuery = state.dimAtomsOrQuery;
         } 
         
         // <Debug>
         this._dimAtomsOrQuery || def.assert("Invalid programmer");
         this._data || def.assert("Must have a current data");
         // </Debug>
         
         // Are there still any OrAtom paths of the current data to traverse? 
         var depth = stateStack.length;
             
         // Any more atom paths to traverse, from the current data?
         do{
             while(this._dimAtomsOrQuery.next()) {
                 
                 var dimAtomOr = this._dimAtomsOrQuery.item,
                     childData = this._data._childrenByKey[dimAtomOr.key];
                 
                 // Also, advance the test of a leaf child data with no datums, to avoid backtracking
                 if(childData && (depth < H - 1 || childData._datums.length)) {
                     
                     stateStack.push({data: this._data, dimAtomsOrQuery: this._dimAtomsOrQuery});
                     
                     this._data = childData;
                     
                     if(depth < H - 1) {
                         // Keep going up, until a leaf datum is found. Then we stop.
                         this._dimAtomsOrQuery = def.query(datumFilter[childData._groupLevelSpec.dimensions[0].name]);
                         depth++;
                     } else {
                         // Leaf data!
                         // Set first datum and leave
                         this._dimAtomsOrQuery = null;
                         this._datumsQuery = def.query(childData._datums);
                         this._datumsQuery.next();
                         this.item = this._datumsQuery.item;
                         return 1; // has next
                     }
                 }
             } // while(atomsOrQuery)
             
             // No more OR atoms in this _data
             if(!depth){
                 return 0; // finished
             }
             
             // Pop parent data
             state = stateStack.pop();
             this._data = state.data;
             this._dimAtomsOrQuery = state.dimAtomsOrQuery;
             depth--;
         } while(true);
         
         // Never executes
         return 0; // finished
     });
}
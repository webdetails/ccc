pvc.data.Data.add(/** @lends pvc.data.Data# */{
    /**
     * Obtains the number of contained datums.
     * @type number
     */
    count: function(){
        return this._datums.length;
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
     * @param {boolean} [keyArgs.visible=null]
     *      Only considers datums whose atoms of the grouping dimensions 
     *      have the specified visible state.
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
            data = groupOper.execute();

            if(cacheKey){
                (groupByCache || (this._groupByCache = {}))[cacheKey] = data;
            }
        }
        
        return data;
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
        var datums = this.datums(whereSpec, keyArgs).array();
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
                atoms = [];
            
            for(var dimName in this._dimensions){
                var dimAtoms = sourceDatumFilter[dimName];
                if(dimAtoms) {
                    atoms.push(dimAtoms[0]);
                }
            }
            
            // true => null datum
            datum = new pvc.data.Datum(this, atoms, true);
        }
        
        return datum;
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
                    /* flattened parent groups would account for the same values more than once */
                    .where(function(childData){ return !childData._isFlattenGroup; })
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
 * A structure with the following form:
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
        where    = def.get(keyArgs, 'where')
        ;

    if(visible != null){
        q = q.where(function(datum){ return datum.isVisible === visible; });
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
            
            var dimName = parentData._childrenKeyDimName;
            datumFilter[dimName].forEach(function(atom){
                var childData = parentData._childrenByKey[atom.key];
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
             this._dimAtomsOrQuery = def.query(datumFilter[rootData._childrenKeyDimName]);
             
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
                     childData = this._data._childrenByKey[dimAtomOr.globalKey()];
                 
                 // Also, advance the test of a leaf child data with no datums, to avoid backtracking
                 if(childData && (depth < H - 1 || childData._datums.length)) {
                     
                     stateStack.push({data: this._data, dimAtomsOrQuery: this._dimAtomsOrQuery});
                     
                     this._data = childData;
                     
                     if(depth < H - 1) {
                         // Keep going up, until a leaf datum is found. Then we stop.
                         this._dimAtomsOrQuery = def.query(datumFilter[childData._childrenKeyDimName]);
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
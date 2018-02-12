
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

cdo.Data.add(/** @lends cdo.Data# */{

    select: null,

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
     * of {@link cdo.TranslationOper#execute}.
     * </p>
     *
     * @param {!def.Query} atomz An enumerable of {@link map(string union(any || cdo.Atom))}.
     * @param {object} [keyArgs] Keyword arguments.
     * @param {function} [keyArgs.isNull] Predicate that indicates if a datum is considered null.
     * @param {function} [keyArgs.where] Filter function that approves or excludes each newly read datum.
     */
    load: function(atomz, keyArgs) {
        /*global cdo_assertIsOwner:true */
        cdo_assertIsOwner.call(this);

        var whereFun = def.get(keyArgs, 'where'),
            isNullFun = def.get(keyArgs, 'isNull'),
            isAdditive = def.get(keyArgs, 'isAdditive', false),
            datums = def.query(atomz)
                .select(function(atoms) {
                    var datum = new cdo.Datum(this, atoms);
                    if(isNullFun && isNullFun(datum)) datum.isNull = true;
                    if(whereFun  && !whereFun(datum)) return null;

                    return datum;
                }, this);

        data_setDatums.call(this, datums, {isAdditive: isAdditive, doAtomGC: true});
    },


    clearVirtuals: function() {
        // Recursively clears all virtual datums and atoms.
        var datums = this._datums;
        var L = datums.length;
        if(L > 0) {
            this._sumAbsCache = null;

            var i = 0,
                removed;
            while(i < L) {
                var datum = datums[i];
                if(datum.isVirtual) {

                    cdo_removeDatumLocal.call(this, datum);
                    L--;
                    removed = true;
                } else {
                    i++;
                }
            }

            if(removed) {
                // "Me is a group"
                if(!datums.length && this.parent) return void this.dispose();

                var children = this.childNodes;
                if(children) {
                    i = 0;
                    L = children.length;
                    while(i < L) {
                        var childData = children[i];
                        childData.clearVirtuals();
                        if(!childData.parent)
                            // Child group was empty and removed itself
                            L--;
                        else
                            i++;
                    }
                }

                if(this._linkChildren) this._linkChildren.forEach(function(linkChildData) {
                    linkChildData.clearVirtuals();
                });
            }
        }

        /* globals dim_uninternVirtualAtoms */
        def.eachOwn(this._dimensions, function(dim) { dim_uninternVirtualAtoms.call(dim); });
    },

    /**
     * Adds new datums to the owner data.
     * @param {cdo.Datum[]|def.Query} datums The datums to add.
     */
    add: function(datums) {

        /* globals cdo_assertIsOwner, data_setDatums */

        cdo_assertIsOwner.call(this);

        data_setDatums.call(this, datums, {isAdditive: true, doAtomGC: true});
    },

    _addDatumsSimple: function(newDatums) {
        this._addDatumsLocal(newDatums);
        this._onDatumsAdded(newDatums);
    },

    _onDatumsAdded: function(newDatums) {
        var linkChildren = this._linkChildren;
        if(linkChildren) {
            var i = -1;
            var L = linkChildren.length;
            while(++i < L) {
                linkChildren[i]._addDatumsSimple(newDatums);
            }
        }
    },

    _addDatumsLocal: function(newDatums) {
        var datums  = this._datums;
        var visibleDatumsMap = this._visibleNotNullDatums;
        var selectedDatumsMap = this._selectedNotNullDatums;
        var datumsById = this._datumsById;
        var datumsByKey = this._datumsByKey;

        // When creating a non-owner data set, any datums added to it
        // call this method before its dimensions are actually created.
        var internAtoms = !!this._dimensions;

        // Clear sums cache.
        // Group By caches are still valid, as resulting data sets are updated.
        this._sumAbsCache = null;

        var i = -1;
        var L = newDatums.length;
        while(++i < L) {
            var newDatum = newDatums[i];
            var id = newDatum.id;

            // J.I.C.
            if(datumsById[id] === undefined) {
                datums.push(newDatum);
                datumsById[id] = newDatum;
                datumsByKey[newDatum.key]  = newDatum;

                if(internAtoms) {
                    // Also clears dimensions' caches.
                    data_processDatumAtoms.call(
                        this,
                        newDatum,
                        /* intern      */ true,
                        /* markVisited */ false);
                }

                // TODO: make this lazy?
                if(!newDatum.isNull) {
                    if(selectedDatumsMap && newDatum.isSelected) {
                        selectedDatumsMap.set(id, newDatum);
                    }

                    if(newDatum.isVisible) {
                        visibleDatumsMap.set(id, newDatum);
                    }
                }
            }
        }
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
     * TODO: is this correct? Null "categories" are excluded?
     * <p>
     * Datums with null atoms on a grouping level dimension are excluded.
     * </p>
     *
     * @param {string|string[]|cdo.GroupingOperSpec} groupingSpecText A grouping specification string or object.
     * <pre>
     * "series1 asc, series2 desc, category"
     * </pre>
     *
     * @param {Object} [keyArgs] Keyword arguments object.
     *
     * @param {Object.<string, !cdo.Data>} [keyArgs.extensionDataSetsMap] -
     * A data sets map with a dataset for each of the grouping specifications' required extension complex types:
     * {@link cdo.GroupingSpec#extensionComplexTypeNames}.
     *
     * @param {boolean} [keyArgs.inverted = false] - Inverts the given grouping specification array.
     * @param {boolean} [keyArgs.isNull = null] - Only considers datums with the specified isNull attribute.
     * @param {boolean} [keyArgs.visible = null] - Only considers datums that have the specified visible state.
     * @param {boolean} [keyArgs.selected = null] - Only considers datums that have the specified selected state.
     * @param {function} [keyArgs.where] - A datum predicate.
     * @param {string} [keyArgs.whereKey] - A key for the specified datum predicate.
     * If <tt>keyArgs.where</tt> is specified and this argument is not, the results will not be cached.
     *
     * @see #where
     * @see cdo.GroupingLevelSpec
     *
     * @returns {cdo.Data} The resulting root data.
     */
    groupBy: function(groupingSpecText, keyArgs) {
        var groupOper = new cdo.GroupingOper(this, groupingSpecText, keyArgs),
            cacheKey  = groupOper.key,
            groupByCache,
            data;

        if(cacheKey) {
            groupByCache = this._groupByCache;

            // Check cache for a linked data with that key
            data = groupByCache && groupByCache[cacheKey];
        }

        if(!data) {
            if(def.debug >= 7) {
                def.log("[GroupBy] " + (cacheKey ? ("Cache key not found : '" + cacheKey + "' on '" + this.id + "'") : "No Cache key"));
            }

            data = groupOper.execute();

            if(cacheKey) (groupByCache || (this._groupByCache = {}))[cacheKey] = data;
        } else if(def.debug >= 7) {
            def.log("[GroupBy] Cache key hit '" + cacheKey + "'");
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
     * <p>
     * Any datums that are later added to `this` will be also added to
     * the returned data set, in case these match the specified filters.
     * </p>
     *
     * @param {object} [querySpec] A query specification.
     * @param {object} [keyArgs] Keyword arguments object.
     * See {@link #datums} for information on available keyword arguments.
     *
     * @returns {!cdo.Data} A linked data containing the filtered datums.
     */
    where: function(querySpec, keyArgs) {
        // This code is adapted from #datums to build a data set, in the end, including the where predicate.
        //
        // var datums = this.datums(querySpec, keyArgs);

        // Normalize the query spec.
        var normalizedQuerySpec = querySpec && data_normalizeQuerySpec.call(this, querySpec);

        var datums = this._datums;
        if(datums.length > 0) {
            if(normalizedQuerySpec) {
                // Filter by the query spec, possibly using the specified keyArgs.orderBy.
                // Also filters by any state attributes (visible, selected, isNull, where).
                // Internal group by operation is cached.
                datums = data_where.call(this, normalizedQuerySpec, keyArgs).array();
            } else if(keyArgs) {
                // Filter datums by their "state" attributes.
                // Search not cached.
                datums = data_whereState(def.query(datums), keyArgs).array();
            }
        }

        // `normalizedQuerySpec` and `keyArgs` arguments must be compiled into a single where predicate
        // so that, later, any added datums flow through to the returned data set.
        // null if nothing to filter on.
        var where = (normalizedQuerySpec || keyArgs) && data_wherePredicate(normalizedQuerySpec, keyArgs);

        return new cdo.FilteredData({linkParent: this, datums: datums, where: where});
    },

    /**
     * Gets an enumerable for the datums of this data,
     * possibly filtered according to a given query specification and datum states.
     *
     * @param {object} [querySpec] A query specification.
     * A structure with the following form:
     * <pre>
     * // OR of datum filters
     * querySpec = [datumFilter1, datumFilter2, ...] | datumFilter;
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
     *    An example of a query specification:
     * </p>
     * <pre>
     * querySpec = [
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
     * @param {function} [keyArgs.where] An arbitrary datum predicate.
     *
     * @param {string} [keyArgs.whereKey] A key for the specified datum predicate.
     * If <tt>keyArgs.where</tt> is specified and this argument is not, the results will not be cached.
     *
     * @param {string[]} [keyArgs.orderBy] An array of "order by" strings to be applied to each
     * datum filter of <i>querySpec</i>.
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
     * these are determined to match the corresponding datum filter of <i>querySpec</i>.
     * </p>
     *
     * <p>
     * If a string is specified it is treated as the "order by" string corresponding
     * to the first datum filter.
     * </p>
     *
     * @return {def.Query} A query object that enumerates the matching {@link cdo.Datum} objects.
     *
     * @see #where
     */
    datums: function(querySpec, keyArgs) {

        if(this._datums.length === 0) {
            return def.query();
        }

        if(!querySpec) {
            if(!keyArgs) {
                return def.query(this._datums);
            }

            // Filter datums by their "state" attributes (visible, selected, isNull, where).
            // Not cached.
            return data_whereState(def.query(this._datums), keyArgs);
        }

        // Normalize the query spec.
        var normalizedQuerySpec = data_normalizeQuerySpec.call(this, querySpec);

        // Filter by the query spec, possibly using the specified keyArgs.orderBy.
        // Also filters by any state attributes (visible, selected, isNull, where).
        // Internal group by operation is cached.
        return data_where.call(this, normalizedQuerySpec, keyArgs);
    },

    /**
     * Obtains the first datum that satisfies a given query specification.
     * <p>
     * If no datum satisfies the filter, null is returned.
     * </p>
     *
     * @param {object} [querySpec] A query specification.
     * See {@link #datums} for information on this structure.
     *
     * @param {object} [keyArgs] Keyword arguments object.
     * See {@link #datums} for additional available keyword arguments.
     *
     * @return {cdo.Datum} The first datum that satisfies the specified filter or <i>null</i>.
     *
     * @see cdo.Data#datums
     */
    datum: function(querySpec, keyArgs) {
        return this.datums(querySpec, keyArgs).first() || null;
    },

    /**
     * Sums the absolute value of a specified dimension on each child data
     * and returns an atom having its value.
     *
     * @param {string|function(!cdo.Data):string} dimName The name of the dimension, or a dimension discriminator function
     *  that, when given a child data set, returns the name of the dimension to use for that child data set.
     *  When a dimension discriminator function is specified,
     *  for the results to be cached, an additional `keyArgs.discrimKey` argument must be specified as well.
     *
     * @param {object} [keyArgs] Optional keyword arguments that are
     *  passed to each dimension's {@link cdo.Dimension#valueAbs} method.
     * @param {string} [keyArgs.discrimKey] When `dimName` is a dimension discriminator function,
     *  specifies the cache key to use to identify it. When unspecified, the results are not cached.
     * @param {string[]} [keyArgs.discrimPossibleDims] When `dimName` is a dimension discriminator function,
     *  specifies the possible dimensions it can returns. If, at the last descendant level of this data set,
     *  the discriminator function does not return a fixed dimension, the sum of these dimensions is returned.
     * @return {number}
     *
     * @deprecated Use #dimensionNumberValue.
     */
    dimensionsSumAbs: function(dimName, keyArgs) {

        var value = this.dimensionNumberValue(dimName, keyArgs).value;

        return value !== null && value < 0 ? -value : value;
    },

    dimensionNumberValue: function(dimName, keyArgs) {

        var operArgs = this._createDimensionOperArgs(dimName, keyArgs);

        return this._dimensionNumberValue(operArgs);
    },

    _createDimensionOperArgs: function(dimName, keyArgs) {
        var discrimFun;
        var discrimPossibleDimNames;
        var discrimKey = null;

        if(typeof dimName === 'function') {
            discrimFun = dimName;
            discrimPossibleDimNames = def.get(keyArgs, 'discrimPossibleDims') || null;
            discrimKey = def.get(keyArgs, 'discrimKey') || null;
            if(discrimKey !== null) {
                discrimKey = "discrim:" + discrimKey;
            }
        } else {
            discrimFun = def.fun.constant(dimName);
            discrimPossibleDimNames = [dimName];
            discrimKey = dimName;
        }

        /* globals dim_buildDatumsFilterKey */

        var cacheKey = null;
        if(discrimKey !== null) {
            cacheKey = discrimKey + ":" + dim_buildDatumsFilterKey(keyArgs) + ':' + (discrimPossibleDimNames || []).join("|");
        }

        return {
            discrimFun: discrimFun,
            discrimPossibleDimNames: discrimPossibleDimNames,
            cacheKey: cacheKey,
            keyArgs: keyArgs
        };
    },

    _dimensionNumberValue: function(operArgs) {

        var valueAtom;
        var cacheKey = operArgs.cacheKey;
        if(cacheKey === null || (valueAtom = def.getOwn(this._sumAbsCache, cacheKey)) === undefined) {

            valueAtom = this._dimensionNumberValueCore(operArgs);

            if(cacheKey !== null) {
                (this._sumAbsCache || (this._sumAbsCache = {}))[cacheKey] = valueAtom;
            }
        }

        return valueAtom;
    },

    _dimensionNumberValueCore: function(operArgs) {

        // If the measure dimension is not defined at this level,
        // create a neutral-atom, formatted using a default number formatter.
        var valueDimName = operArgs.discrimFun(this, /* isOptional: */ operArgs.discrimPossibleDimNames !== null);

        // Because leaf data sets do not use abs to sum their datums,
        // and any other ascendant data set uses abs to sum its children, for matters of percent calculations,
        // to ensure that sums are consistent in hierarchical data sets (with more than two levels),
        // and that it is the leaf grouping that imposes actual valid groupings of datums,
        // any data set which has child data sets cannot simply sum its datums directly,
        // but must instead sum the values of its children.
        // Thus, the value of the "dimension" is only the direct sum of its datums if
        // this data set does have any child data sets...

        var value;

        if(this.childCount() === 0) {
            if(valueDimName !== null) {
                // Already cached.
                return this.dimensions(valueDimName).valueAtom(operArgs.keyArgs);
            }

            // Assume that summing the value across all bound dimensions is meaningful.
            value = def.query(operArgs.discrimPossibleDimNames)
                        .select(function(possibleDimName) {
                            return this.dimensions(possibleDimName).valueAbsAtom(operArgs.keyArgs).value;
                        }, this)
                        .reduce(def.addPreservingNull, null);
        } else {

            value = this.children()
                // Non-degenerate flattened parent groups would account for the same values more than once.
                .where(function(childData) {
                    return !childData._isFlattenGroup || childData._isDegenerateFlattenGroup;
                })
                .select(function(childData) {
                    var value = childData._dimensionNumberValue(operArgs).value;

                    return value !== null && value < 0 ? -value : value;
                })
                .reduce(def.addPreservingNull, null);
        }

        if(valueDimName !== null) {
            return this.dimensions(valueDimName).read(value);
        }

        // Choosing one of discrimPossibleDimNames over the other could produce strange results, when formatted.
        // It's better to use a general formatter.
        return value === null ? this.type.nullNumberAtom : new cdo.NumberAtom(this.type, value);
    },

    dimensionPercentValue: function(dimName, keyArgs) {

        var operArgs = this._createDimensionOperArgs(dimName, keyArgs);

        var valueAtom = this._dimensionNumberValue(operArgs);

        var value = valueAtom.value;
        if(value === null) {
            return valueAtom;
        }

        var valueDim = valueAtom.dimension;

        // Zero?
        if(value === 0) {
            return getAtom.call(this, 0);
        }

        // If no parent, we're the root and so we're 100%
        var parentData = this.parent;
        if(parentData === null) {
            return getAtom.call(this, 1);
        }

        var sumAbsAtom = parentData._dimensionNumberValue(operArgs);

        // assert sumAbs >= |value| > 0

        return getAtom.call(this, Math.abs(value) / sumAbsAtom.value);

        function getAtom(value) {
            return valueDim === null ? new cdo.NumberAtom(this.type, value) : valueDim.read(value);
        }
    }
})
.type()
.add(/** @lends cdo.Data */{
    /**
     * Obtains the lowest common ancestor of the given datas.
     * The algorithm crosses linked parents.
     *
     * @param {cdo.Data[]} datas The data instances of which the lowest common ancestor is desired.
     * @return {cdo.Data} The lowest common ancestor, or <tt>null</tt>, if none.
     */
    lca: function(datas) {
        var L = datas.length,
            a = null,
            dataA, dataB, listA, listB;
        if(L) {
            if(L === 1) return datas[0];
            // L >= 2

            var i = 1;
            //dataA = datas[0];
            listA = data_ancestorsAndSelfList(datas[0]);
            do {
                dataB = datas[i];
                listB = data_ancestorsAndSelfList(dataB);

                if(!(a = data_lowestCommonAncestor(listA, listB))) return null;

                // next
                dataA = dataB;
                listA = listB;
            } while(++i < L);
        }
        return a;
    }
});

function data_ancestorsAndSelfList(data) {
    var ancestors = [data], p;
    while((p = (data.parent || data.linkParent))) ancestors.unshift(data = p);
    return ancestors;
}

function data_lowestCommonAncestor(listA, listB) {
    var i = 0,
        L = Math.min(listA.length, listB.length),
        a = null,
        next;
    while(i < L && ((next = listA[i]) === listB[i])) {
        a = next;
        i++;
    }
    return a;
}

/**
 * Called to add or replace the contained {@link cdo.Datum} instances.
 *
 * When replacing, all child datas and linked child datas are disposed.
 *
 * When adding, the specified datums will be added, recursively,
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
 * @name cdo.Data#_setDatums
 * @function
 * @param {cdo.Datum[]|def.Query} setDatums An array or enumerable of datums. When an array, it is not mutated.
 *
 * @param {object} [keyArgs] Keyword arguments.
 * @param {boolean} [keyArgs.isPreserveExisting=false] Indicates that the specified datums are to be added,
 * instead of replace existing datums.
 * @param {boolean} [keyArgs.doAtomGC=false] Indicates that atom garbage collection should be performed.
 *
 * @type undefined
 * @private
 */
function data_setDatums(setDatums, keyArgs) {

    // cdo_assertIsOwner.call(this);

    // But may be an empty list
    if(!setDatums) throw def.error.argumentRequired('setDatums');

    var hasExisting = this._datums.length > 0;
    var isPreserveExisting = !!def.get(keyArgs, 'isAdditive');
    var existingDatumsByKey = null;

    var nextDatums;
    var nextDatumsByKey;
    var nextDatumsById;

    var visDatumsMap = this._visibleNotNullDatums;
    // Owner data sets cache selected datums. Not null.
    var selDatumsMap = this._selectedNotNullDatums;

    // -- When Has existing datums ---
    // What if children or linked data sets exist?
    // Recursive un-interning is not implemented, so if existing datums are removed, things become inconsistent.
    // When replacing, children are disposed of, and the problem ceases to exist.
    // When adding, the sliding window better not remove any datums...
    // The chart solves this by disposing children in any incremental operation...

    if(hasExisting && !isPreserveExisting) {

        // Replace existing

        /* globals cdo_disposeChildLists */

        // Also clears caches.
        cdo_disposeChildLists.call(this);
        // No children to notify now...

        // Need this to be able to reuse existing datums that are equal to those in setDatums.
        existingDatumsByKey = this._datumsByKey;

        this._datums      = nextDatums      = [];
        this._datumsById  = nextDatumsById  = {};
        this._datumsByKey = nextDatumsByKey = {};

        visDatumsMap.clear();
        selDatumsMap && selDatumsMap.clear();
    } else {
        // Nothing to replace or
        // Preserve existing

        // !hasExisting || isPreserveExisting

        // -- If !hasExisting --
        // Can reuse datums, datumsByKey, datumsById, visDatumsMap, selDatumsMap, _sumAbsCache, ...
        // They're empty, after all.
        // Can have children or linked data sets even when no datums exist at the root,
        // But these data sets must be empty as well, so there's no problem in reusing them.

        nextDatums = this._datums;
        nextDatumsByKey = this._datumsByKey;
        nextDatumsById = this._datumsById;

        if(hasExisting) {
            // Not disposing children, but it better be a purely additive operation...

            // Clear sums cache.
            // Group bys cache is still valid, as groupings' results are updated on added datums.
            this._sumAbsCache = null;
        }
    }

    // From setDatums, those which are actually added to nextDatums, when in preserve mode.
    // Used to notify any linked data sets.
    var preserveExistingAddedDatums = null;

    // Any children to notify of added datums?
    var notifyAddedDatums = !!this._linkChildren && this._linkChildren.length > 0;
    if(notifyAddedDatums && hasExisting && isPreserveExisting) {
        preserveExistingAddedDatums = [];
    }

    // ----------

    // Add new datums to nextDatums.

    if(def.array.is(setDatums)) {
        var i = 0;
        var L = setDatums.length;
        while(i < L) {
            maybeAddDatum.call(this, setDatums[i++]);
        }
    } else if(setDatums instanceof def.Query) {
        setDatums.each(maybeAddDatum, this);
    } else {
        throw def.error.argumentInvalid('setDatums', "Argument is of invalid type.");
    }

    // ----------

    // Datum evaluation according to a score/select criteria.
    if(this.select) {
        this.select(nextDatums).forEach(function(removeDatum) {

            // NOTE: Mutates nextDatums, et. al.
            cdo_removeDatumLocal.call(this, removeDatum);

            if(preserveExistingAddedDatums !== null) {
                preserveExistingAddedDatums.splice(preserveExistingAddedDatums.indexOf(removeDatum), 1);
            }
        }, this);
    }

    cdo_doAtomGC.call(this);

    // ----

    if(notifyAddedDatums) {
        // TODO: not distributing to child lists of this data?
        // Is this assuming that `this` is the root data,
        // and thus was not created from grouping, and so having no children?

        // Linked data sets were not disposed, and can thus exist.
        // Any preserveExistingAddedDatums need to be notified to existing linked data sets.
        this._onDatumsAdded(preserveExistingAddedDatums || nextDatums);
    }

    function maybeAddDatum(datumToSet) {
        // Ignore.
        if(!datumToSet) {
            return;
        }

        // Filter out duplicates in datumsToSet.
        // Use already existing same-key datum, if any.
        var key = datumToSet.key;

        // Duplicate datum?
        // When isPreserveExisting, because nextDatumsByKey = existingDatumsByKey,
        //  the following also tests for duplicates with existing datums,
        //  in which case we keep the existing and discard the new one.
        if(def.hasOwnProp.call(nextDatumsByKey, key)) {
            return;
        }

        // Not in nextDatums.

        // Preserve existing datum of same key.
        if(existingDatumsByKey !== null && def.hasOwnProp.call(existingDatumsByKey, key)) {
            // Still preferable to keep/_re-add_ the old and discard the new one.
            datumToSet = existingDatumsByKey[key];
        }

        // Add to nextDatums.

        var id = datumToSet.id;

        nextDatums.push(datumToSet);
        nextDatumsByKey[key] = datumToSet;
        nextDatumsById[id] = datumToSet;

        if(preserveExistingAddedDatums !== null) {
            preserveExistingAddedDatums.push(datumToSet);
        }

        // Mark as selected/visible here.
        // If later discarded by the sliding window, cdo_removeDatumLocal un-marks them.
        if(!datumToSet.isNull) {
            if(datumToSet.isSelected) {
                selDatumsMap.set(id, datumToSet);
            }

            if(datumToSet.isVisible) {
                visDatumsMap.set(id, datumToSet);
            }
        }
    }
}

/**
 * Garbage Collection
 * ------------------
 *
 * Simply creating a Datum, interns its atoms in corresponding Dimensions of its (required) owner data.
 * If the Datum is not later actually added to the data, through `Data#load` or `Data#add`,
 * due to, for example, not passing an `isNull` or `where` filter,
 * the owner Data's Dimensions will contain atoms which have no supporting Datum in the owner data.
 *
 * Even if Datums pass the above mentioned filters, and get passed to maybeAddDatum,
 * the sliding window (`this.select`) may decide to exclude some of the new or some of the existing datums.
 * Sliding window is only used on owner data sets.
 *
 * If these "unused" atoms were left there, operations such as `Dimension#{atoms, min, max}`
 * would return incorrect results, affecting, for example, the domain of scales.
 *
 * ----
 * Essentially, this reveals a design flaw.
 * Atoms should only be interned in a Data's Dimensions,
 * when the container Datum was actually added to the Data.
 *
 * However, this would also mean that Atom instances would initially be created every time,
 * not reusing existing instances, if any, causing wasted memory and computation,
 * defeating one of the initial goals of interning.
 *
 * It's like atoms would have to be interned on a DimensionType's own table/Dimension,
 * one that is not associated with any owner Data.
 *
 * _Disposing a Datum_ would decrease the reference count of the atom,
 * eventually causing it to be discarded. Not disposing a Datum would
 * cause Atoms to be leaked in the DimensionType's global Dimension.
 * ----
 *
 * With the current design, we use a Mark and Sweep Garbage Collection method.
 *
 * Once the final set of Datums is determined, every atom these reference is marked.
 * Then, any unmarked atom that is interned in owner dimensions is removed/un-interned.
 *
 * Currently, atom Garbage Collection is only supported on owner Datas
 * (actually, an error is thrown by dim_uninternUnvisitedAtoms),
 * because un-interning is not implemented as a recursive operation... -
 * only Data#clearVirtuals implements a recursive un-interning operation
 * for the special case of virtual-only atoms.
 * Because existing real datums may be removed, due to the sliding window,
 * the dimensions of descendant data sets would have to be GC'd as well.
 *
 * In conclusion, when doing GC, every child data must have been disposed of.
 * Currently, when !isPreserveExisting, this is performed here.
 * Otherwise, when keyArgs.isAdditive, it is being performed in Chart#_initData...
 */
function cdo_doAtomGC() {
    // MARK
    var i = -1;
    var datums = this._datums;
    var L = datums.length;
    while(++i < L) {
        // No need to intern on owner dimensions.
        data_processDatumAtoms.call(this, datums[i], /* intern */false, /* markVisited */true);
    }

    // SWEEP
    var dims = this._dimensionsList;
    i = -1;
    L = dims.length;
    while(++i < L) {
        dim_uninternUnvisitedAtoms.call(dims[i]);
    }
}

/**
 * Processes the atoms of this datum.
 * If a virtual null atom is found then
 * the null atom of that dimension is interned.
 * If desired the processed atoms are marked as visited.
 *
 * @name cdo.Datum._processAtoms
 * @function
 * @param {cdo.Datum} datum The datum.
 * @param {boolean} [intern=false] If virtual nulls should be detected.
 * @param {boolean} [markVisited=false] If the atoms should be marked as visited.
 * @type undefined
 * @internal
 */
function data_processDatumAtoms(datum, intern, markVisited) {
    // Avoid using for(var dimName in datum.atoms),
    // cause it needs to traverse the whole, long scope chain

    var dims = this._dimensionsList;
    // data is still initializing and dimensions are not yet created ?
    if(!dims) intern = false;

    if(intern || markVisited) {
        var datoms = datum.atoms,
            i = 0,
            L, atom, dim;
        if(!dims) { // => markVisited
            var dimNames = this.type.dimensionsNames();
            L = dimNames.length;
            while(i < L) {
                atom = datoms[dimNames[i++]];
                if(atom) atom.visited = true;
            }
        } else {
            L = dims.length;
            while(i < L) {
                dim = dims[i++];
                atom = datoms[dim.name];
                if(atom) {
                    /*global dim_internAtom:true */
                    if(intern) dim_internAtom.call(dim, atom);

                    // Mark atom as visited
                    if(markVisited) atom.visited = true;
                }
            }
        }
    }
}


// Auxiliar function to remove datums (to avoid repeated code)
// removes datums instance from datums, datumById, datumByKey;
// remove from selected and visible if necessary
function cdo_removeDatumLocal(datum) {

    var datums = this._datums;
    var selDatums = this._selectedNotNullDatums;
    var id = datum.id;

    datums.splice(datums.indexOf(datum), 1);
    delete this._datumsById [id ];
    delete this._datumsByKey[datum.key];

    if(selDatums && datum.isSelected) {
        selDatums.rem(id);
    }

    if(datum.isVisible) {
        this._visibleNotNullDatums.rem(id);
    }
}

/**
 * Normalizes a given query specification.
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
 * @name cdo.Data#_normalizeQuerySpec
 * @function
 *
 * @param {object} querySpec A query specification to be normalized.
 * TODO: A structure with the following form: ...
 *
 * @return Array A <i>normalized</i> query of the specification.
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
function data_normalizeQuerySpec(querySpec) {
    var whereProcSpec = [];

    querySpec = def.array.as(querySpec);
    if(querySpec) querySpec.forEach(processDatumFilter, this);

    return whereProcSpec;

    function processDatumFilter(datumFilter) {
        if(datumFilter != null) {
            /*jshint expr:true */
            (typeof datumFilter === 'object') || def.fail.invalidArgument('datumFilter');

            /* Map: {dimName1: atoms1, dimName2: atoms2, ...} */
            var datumProcFilter = {},
                any = false;
            for(var dimName in datumFilter) {
                // throws if dimension doesn't exist
              var datumFilterValues = datumFilter[dimName];
              var atoms = this.dimensions(dimName)
                    .getDistinctAtoms(datumFilterValues !== null ? def.array.as(datumFilterValues) : [null]);
                if(atoms.length) {
                    any = true;
                    datumProcFilter[dimName] = atoms;
                }
            }

            if(any) whereProcSpec.push(datumProcFilter);
        }
    }
}

/**
 * Filters a datum query according to a specified predicate,
 * datum selected and visible state.
 *
 * @name cdo.Data#_whereState
 * @function
 *
 * @param {def.query} q A datum query.
 * @param {object} [keyArgs] Keyword arguments object.
 * See {@link #groupBy} for additional available keyword arguments.
 *
 * @returns {def.Query} A query object that enumerates the desired {@link cdo.Datum}.
 * @private
 * @static
 */
function data_whereState(q, keyArgs) {
    var visible  = def.get(keyArgs, 'visible'),
        isNull   = def.get(keyArgs, 'isNull'),
        selected = def.get(keyArgs, 'selected'),
        where    = def.get(keyArgs, 'where');

    if(visible  != null) q = q.where(visible  ? datum_isVisibleT  : datum_isVisibleF );
    if(isNull   != null) q = q.where(isNull   ? datum_isNullT     : datum_isNullF    );
    if(selected != null) q = q.where(selected ? datum_isSelectedT : datum_isSelectedF);
    if(where           ) q = q.where(where);

    return q;
}

function data_wherePredicate(querySpec, keyArgs) {
    var visible  = def.get(keyArgs, 'visible' ),
        isNull   = def.get(keyArgs, 'isNull'  ),
        selected = def.get(keyArgs, 'selected'),
        where    = def.get(keyArgs, 'where'   ),
        ps       = [];

    if(visible  != null) ps.unshift(visible  ? datum_isVisibleT  : datum_isVisibleF );
    if(isNull   != null) ps.unshift(isNull   ? datum_isNullT     : datum_isNullF    );
    if(selected != null) ps.unshift(selected ? datum_isSelectedT : datum_isSelectedF);
    if(where           ) ps.unshift(where);
    if(querySpec       ) ps.unshift(cdo_querySpecPredicate(querySpec));

    var P = ps.length;
    if(P) {
        if(P === 1) return ps[0];

        var wherePredicate = function(d) {
            // AND
            var i = P;
            while(i) if(!ps[--i](d)) return false;
            return true;
        };

        return wherePredicate;
    }

    return null;
}

cdo.querySpecPredicate = cdo_querySpecPredicate;

/**
 * Creates a datum predicate for a query specification.
 *
 * @name cdo.querySpecPredicate
 * @function
 *
 * @param {Array} querySpec A query specification object.
 *
 * @returns {function} A datum predicate function.
 * @static
 */
function cdo_querySpecPredicate(querySpec) {
    var L = querySpec.length;

    return datumQuerySpecPredicate;

    function datumQuerySpecPredicate(d) {
        // OR
        var datoms = d.atoms;
        for(var i = 0 ; i < L ; i++) if(datumFilterPredicate(datoms, querySpec[i])) return true;
        return false;
    }

    function datumFilterPredicate(datoms, datumFilter) {
        // AND
        for(var dimName in datumFilter) {
            // OR
            if(datumFilter[dimName].indexOf(datoms[dimName]) < 0) return false;
        }
        return true;
    }
}

// All the "Filter" and "Spec" words below should be read as if they were prepended by "Proc"
/**
 * Obtains the datums of this data filtered according to a given query specification,
 * and optionally, datum selected and visible state.
 *
 * @alias cdo.Data#_where
 *
 * @param {object} [normalizedQuerySpec] A <i>normalized</i> query specification.
 * @param {object} [keyArgs] Keyword arguments object.
 * See {@link #groupBy} for additional available keyword arguments.
 *
 * @param {string[]} [keyArgs.orderBy] An array of "order by" strings to be applied to each
 * datum filter of <i>normalizedQuerySpec</i>.
 *
 * @return {def.Query} A query object that enumerates the desired {@link cdo.Datum}.
 * @private
 */
function data_where(normalizedQuerySpec, keyArgs) {
    /*
     * e.g.
     *
     * normalizedQuerySpec = [
     *   {country: [atom1], product: [atom2,atom3]}, // <-- datumFilter
     *   {country: [atom4], product: [atom5,atom3]}
     * ]
     *
     * orderBy: [
     *   'country, product',
     *   'country, product'
     * ]
     *
     * Each datum filter can filter on a different set of dimensions.
     *
     * `orderBy` must be contain the same dimensions as those referenced in normalizedQuerySpec.
     */

    var orderBys = def.array.as(def.get(keyArgs, 'orderBy'));

    var datumKeyArgs = def.create(keyArgs || {}, {orderBy: null});

    // The result is the union of the results of filtering by individual datum filters.

    var datumResultsQuery = def.query(normalizedQuerySpec)
           .selectMany(function(normalizedDatumFilter, index) {

               if(orderBys) {
                  datumKeyArgs.orderBy = orderBys[index];
              }

              // Filter using one datum filter.
              return data_queryDatumFilter.call(this, normalizedDatumFilter, datumKeyArgs);
           }, this);

    return datumResultsQuery.distinct(def.propGet('id'));

    /*
    // NOTE: this is the brute force / unguided algorithm - no indexes are used
    function whereDatumFilter(normalizedDatumFilter, index) {
        // normalizedDatumFilter = {dimName1: [atom1, OR atom2, OR ...], AND ...}

        return def.query(this._datums).where(datumPredicate, this);

        function datumPredicate(datum) {
            if((selected === null || datum.isSelected === selected) &&
               (visible  === null || datum.isVisible  === visible)) {
                var atoms = datum.atoms;
                for(var dimName in normalizedDatumFilter) {
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
 * Obtains an enumerable of the datums satisfying <i>normalizedDatumFilter</i>,
 * by constructing and traversing indexes.
 *
 * Uses groupBy, and its cache, to answer the query.
 *
 * @alias cdo.Data#_whereDatumFilter
 *
 * @param {string} normalizedDatumFilter A <i>normalized</i> datum filter.
 *
 * @param {Object} keyArgs Keyword arguments object.
 * See {@link #groupBy} for additional available keyword arguments.
 *
 * @param {string} [keyArgs.orderBy] An "order by" string.
 * When not specified, one is determined to match the specified datum filter.
 * The "order by" string cannot contain multi-dimension levels (dimension names separated with "|").
 *
 * @return {def.Query} A query object that enumerates the matching {@link cdo.Datum} objects.
 *
 * @private
 */
function data_queryDatumFilter(normalizedDatumFilter, keyArgs) {

    /*
     * e.g.:
     *
     * normalizedDatumFilter = {
     *   country: [atom3, atom4],
     *   product: [atom1, atom2]
     * }
     *
     * orderBy = 'country,product'
     */

    var orderBySpecText = keyArgs.orderBy; // keyArgs is required
    if(!orderBySpecText) {
        // Choose the most convenient one orderBy.
        // The sort on dimension names can yield good cache reuse...

        orderBySpecText = Object.keys(normalizedDatumFilter).sort().join(',');
    } else {
        if(orderBySpecText.indexOf("|") >= 0)
            throw def.error.argumentInvalid('keyArgs.orderBy', "Multi-dimension order by is not supported.");

        // TODO: not validating that orderBySpecText actually contains the same dimensions referred in normalizedDatumFilter...
    }

    /*
     * rootData is a data set tree with one level per filtered by dimension 'country' and then 'product'.
     *
     * Each first level children will be one existing value of country, in this data.
     *
     * `normalizedDatumFilter` matches every path where it successively contains the atom of that level's data.
     */

    var rootData = this.groupBy(orderBySpecText, keyArgs);
    var H = rootData.treeHeight;

    /*
        // NOTE:
        // All of the code below is just a stack/state-based translation of
        // the following recursive code (so that it can be used lazily with a def.query),
        // where eachCallback would be called with each resulting datum:

        recursive(rootData, 0);

        function recursive(parentData, h) {
            if(h >= H) {
                // Leaf

                // Yay! Matched all of the dimensions of the normalizedDatumFilter.
                // Every datum in this data is a match.

                parentData._datums.forEach(eachCallback, ctx);
                return;
            }

            // Because only single-dimension per-level is allowed on orderBy,
            // it's always the first dimension that needs to be matched.

            var dimName = parentData.groupingLevelSpec.dimensions[0].name;

            normalizedDatumFilter[dimName].forEach(function(orAtom) {
                var childData = parentData.child(orAtom.globalKey);
                if(childData) {
                    // Yay! There is a set of datums containing orAtom.
                    recursive(childData, h + 1);
                }
            }, this);
        }
     */

     var stateStack = [];

     // Ad-hoq query
     return def.query(function(/* nextIndex */) {
         // Advance to next datum
         var state;

         // No current data means starting
         if(!this._data) {
             this._data = rootData;
             this._dimAtomsOrQuery = def.query(normalizedDatumFilter[rootData.groupingLevelSpec.dimensions[0].name]);

         // Are there still any datums of the current data to enumerate?
         } else if(this._datumsQuery) {

             // <Debug>
             /*jshint expr:true */
             this._data || def.assert("Must have a current data");
             stateStack.length || def.assert("Must have a parent data"); // cause the root node is "dummy"
             !this._dimAtomsOrQuery || def.assert();
             // </Debug>

             if(this._datumsQuery.next()) {
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
         do {
             while(this._dimAtomsOrQuery.next()) {

                 var dimAtomOr = this._dimAtomsOrQuery.item,
                     childData = this._data.child(dimAtomOr.key);

                 // Also, advance the test of a leaf child data with no datums, to avoid backtracking
                 if(childData && (depth < H - 1 || childData._datums.length)) {

                     stateStack.push({data: this._data, dimAtomsOrQuery: this._dimAtomsOrQuery});

                     this._data = childData;

                     if(depth < H - 1) {
                         // Keep going up, until a leaf datum is found. Then we stop.
                         this._dimAtomsOrQuery =
                             def.query(normalizedDatumFilter[childData.groupingLevelSpec.dimensions[0].name]);
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
             if(!depth) return 0; // finished

             // Pop parent data
             state = stateStack.pop();
             this._data = state.data;
             this._dimAtomsOrQuery = state.dimAtomsOrQuery;
             depth--;
         } while(true);

         // Never executes
         //noinspection UnreachableCodeJS
         return 0; // finished
     });
}

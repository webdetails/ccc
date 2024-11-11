/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/

// region cdo bare
/**
 * The CDO namespace.
 *
 * CDO is a acronym for <b>C</b>ommunity <b>D</b>ata <b>O</b>bjects.
 *
 * <p>
 * This namespace is aliased by {@link pvc.data}.
 * Please refer to that namespace for the actual documentation.
 * </p>
 *
 * @namespace
 */
var cdo = {};
// endregion

// region def
/**
 * The DEF namespace.
 *
 * <p>DEF is an utility library used by CCC.</p>
 *
 * @namespace
 */
var def = {};

/**
 * The <tt>Query</tt> class represents a lazy, one-time enumeration of an item sequence.
 *
 * @class
 */
def.Query = function() {};

def.Query.prototype = /** @lends def.Query# */{

    /**
     * Consumes the query and obtains the number of items.
     *
     * @returns {number} The number of items.
     */
    count: function() {
    },

    /**
     * Returns the first item that satisfies a specified predicate.
     * <p>
     * If no predicate is specified, the first item is returned.
     * </p>
     *
     * @param {function} [pred] A predicate to apply to every item.
     * The function is called with two arguments: the item and the enumeration index at which it occurs.
     * The function returns a truthy value to include the item.
     *
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     * @param {any} [dv=undefined] The value returned in case no item exists or satisfies the predicate.
     *
     * @returns {any} The first item, if any; the default value otherwise.
     */
    first: function(pred, ctx, dv) {
    },

    /**
     * Returns the last item that satisfies a specified predicate.
     * <p>
     * If no predicate is specified, the last item is returned.
     * </p>
     *
     * @param {function} [pred] A predicate to apply to every item.
     * The function is called with two arguments: the item and the enumeration index at which it occurs.
     * The function returns a truthy value to include the item.
     *
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     * @param {any} [dv=undefined] The value returned in case no item exists or satisfies the predicate.
     *
     * @returns {any} The last item, if any; the default value otherwise.
     */
    last: function(pred, ctx, dv) {
    },

    /**
     * Calls a given function for each item of the query.
     *
     * @param {function} fun - The function to call on each item.
     * The function is called with two arguments: the item and the enumeration index at which it occurs.
     * The function can return the exact value <tt>false</tt> to stop the iteration.
     *
     * @param {object} [ctx] - The JavaScript <tt>this</tt> object on which to call <tt>fun</tt>.
     *
     * @returns {boolean} <tt>true</tt> if iteration reached the end of the query; <tt>false</tt> otherwise.
     */
    each: function(fun, ctx) {
    },

    /**
     * Converts the query to an array.
     *
     * @param {Array} [to] An array to add the items to.
     * One is created and returned when unspecified.
     *
     * @returns {Array} The array.
     */
    array: function(to) {
    },

    /**
     * Gets a value that indicates if there is at least one item satisfying a specified predicate.
     *
     * <p>
     * If no predicate is specified, returns <tt>true</tt> if there is at least one item.
     * </p>
     *
     * @param {function} [pred] A predicate to apply to every item.
     * The function is called with two arguments: the item and the enumeration index at which it occurs.
     * The function returns a truthy value to include the item.
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     *
     * @returns {boolean} <tt>true</tt> if there is at least one item satisfying a predicate; <tt>false</tt>, otherwise.
     */
    any: function(pred, ctx) {
    },

    /**
     * Gets a value that indicates if all of the items satisfy a specified predicate.
     *
     * @param {function} pred A predicate to apply to every item.
     * The function is called with two arguments: the item and the enumeration index at which it occurs.
     * The function returns a truthy value to include the item.
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     *
     * @returns {boolean} <tt>true</tt> if all of the items satisfy the predicate; <tt>false</tt>, otherwise.
     */
    all: function(pred, ctx) {
    },

    /**
     * Transforms the items of a query into other items.
     *
     * @param {function} fun - The function to transform each item.
     * The function is called with two arguments: the item and the enumeration index at which it occurs.
     * The function returns the new item.
     *
     * @param {object} [ctx] - The JavaScript <tt>this</tt> object on which to call <tt>fun</tt>.
     *
     * @returns {!def.Query} A query of the new items.
     */
    select: function(fun, ctx) {
    },

    /**
     * Transforms each item of a query into a list of items and flattens the overall result.
     *
     * @param {function} fun - The function to transform each item.
     * The function is called with two arguments: the item and the enumeration index at which it occurs.
     * The function returns a new item, a new array of items or a new query of items.
     *
     * @param {object} [ctx] - The JavaScript <tt>this</tt> object on which to call <tt>fun</tt>.
     *
     * @returns {!def.Query} A flattened query.
     */
    selectMany: function(fun, ctx) {},

    /**
     * Obtains a new query with certain items filtered out.
     *
     * @param {function} pred A predicate to apply to every item.
     * The function is called with two arguments: the item and the enumeration index at which it occurs.
     * The function returns a truthy value to include the item.
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     *
     * @returns {!def.Query} A query of the included items.
     */
    where: function(pred, ctx) {
    },

    /**
     * Obtains a new query with only distinct items.
     *
     * @param {function} key A function that determines the key of each item.
     * The function is called with two arguments: the item and the enumeration index at which it occurs.
     * The function returns the key of the given item.
     * When unspecified, the key is the result of calling <tt>toString</tt> on an item.
     * Items with <i>nully</i> keys are ignored.
     *
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     *
     * @returns {!def.Query} A query of distinct items.
     */
    distinct: function(key, ctx) {
    }
};
// endregion

// region pvc.data
/**
 * The data namespace.
 *
 * <p>
 * This namespace is an alias for the exports of the <tt>cdo</tt> library.
 * </p>
 *
 * @namespace
 */
pvc.data = {};

// region Complex
/**
 * The <tt>Complex</tt> class represents a value which is structured
 * with values of several dimensions.
 *
 * @class
 */
pvc.data.Complex = function() {};

pvc.data.Complex.prototype = /** @lends pvc.data.Complex# */{
    /**
     * Gets the unique, sequential identifier of the complex value.
     *
     * @type number
     * @readonly
     */
    id: null,

    /**
     * Gets the key of the complex.
     *
     * <p>
     * The key is a unique string representation of complex value and
     * is used to index complexes in dictionaries.
     * </p>
     * <p>
     * For datums, if the complex type has any key dimensions,
     * as per {@link pvc.options.DimensionType#isKey},
     * its key is composed by the keys of the atoms of the key dimensions.
     * Otherwise, their key is the {@link #id}.
     * </p>
     * <p>
     * For data sets,
     * the key is a combination of the {@link pvc.data.Atom#key}s of contained {@link #atoms}.
     * </p>
     *
     * @type string
     * @readonly
     */
    key: null,

    // This explanation is a bit off. In Datums and when there are isKey dimension types,
    // and there is more than one key dimension, value and key actually diverge,
    // but there seems to be no reason for such...
    /**
     * Gets the value of the complex.
     *
     * <p>
     * When a complex contains a single atom, its <i>value</i> will be the typed value of that atom.
     * Otherwise, the "value" of a complex is its {@link #key}.
     * </p>
     *
     * @type any
     * @readonly
     */
    value: null,

    // This explanation is a bit vague on purpose, because currently the label determination
    // doesn't exactly mirror the determination of key, w.r.t isKey dimension types...
    /**
     * Gets the label of the complex.
     *
     * <p>
     * When a complex contains a single atom, its <i>label</i> is the label of that atom.
     * Otherwise, the "label" of the complex is determined by combining the
     * the {@link pvc.data.Atom#label}s of contained {@link #atoms}.
     * </p>
     *
     * @type any
     * @readonly
     */
    label: null,

    /**
     * Gets the atoms map of the complex value.
     *
     * The map's keys are dimension names and the values are the corresponding {@link pvc.data.Atom}.
     *
     * @type object
     * @readonly
     */
    atoms: {},

    /**
     * The owner data set of the complex value.
     *
     * The owner data set is the root data set that holds the whole extent of datums.
     *
     * @type pvc.data.Data
     * @readonly
     */
    owner: null
};
// endregion

// region Data
/**
 * The <tt>Data</tt> class represents a data set.
 *
 * <p>
 * A data set contains a list of {@link pvc.data.Datum},
 * exposed in {@link #datums}.
 * </p>
 * <p>
 * When it is the result of a group by operation,
 * it also contains a set of {@link #atoms}
 * which are known to be shared by all of the contained {@link pvc.data.Datum}.
 * </p>
 *
 * @class
 * @augments pvc.data.Complex
 */
pvc.data.Data = function() {};

pvc.data.Data.prototype = /** @lends pvc.data.Data# */{

    // TODO: linkParent
    // TODO: linkChildren
    // TODO: dimensions
    // TODO: absLabel
    // TODO: absKey
    // TODO: getSpecifiedAtom
    // TODO: dimensionNumberValue
    // TODO: dimensionPercentValue

    // region Datums
    /**
     * Gets an enumerable for the datums of this data,
     * possibly filtered according to a given query specification and datum states.
     *
     * @param {object} [querySpec] A query specification.
     *
     * <p>
     * A structure with the following form:
     * </p>
     *
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
     *
     * <p>Values of a datum filter can also directly be atoms.</p>
     *
     * <p>An example of a query specification:</p>
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
     * @return {!def.Query} A query object that enumerates the matching {@link pvc.data.Datum} objects.
     *
     * @category Datums
     */
    datums: function(querySpec, keyArgs) {},

    /**
     * Gets the number of contained datums.
     *
     * @return {number} The number of datums.
     *
     * @category Datums
     */
    count: function() {},

    /**
     * Gets a value that indicates if a given datum is contained by this data set.
     *
     * @param {!pvc.data.Datum} datum The datum to test for containment.
     *
     * @return {boolean} <tt>true</tt> if the datum is contained in this data set,
     * or <tt>false</tt>, otherwise.
     */
    contains: function(datum) {},

    /**
     * Gets the datum with the given key, if any, or `null`, if none.
     *
     * @param {string} key The datum key.
     * @return {pvc.data.Datum} A datum or `null`.
     */
    datumByKey: function(key) {},
    // endregion

    // region DOM
    /**
     * Gets the parent data set of this data set.
     *
     * <p>
     * This is <tt>null</tt> for root data sets.
     * </p>
     *
     * @type !pvc.data.Data
     * @readonly
     * @category DOM
     */
    parent: null,

    /**
     * The root data set.
     *
     * <p>
     * The root data set has itself as the value of the root property.
     * </p>
     *
     * @type !pvc.data.Data
     * @readonly
     * @category DOM
     */
    root: null,

    /**
     * Obtains an enumerable of the child data sets of this data set.
     *
     * @returns {!def.Query} An enumerable of {@link pvc.data.Data}.
     * @category DOM
     */
    children: function() {},

    /**
     * Obtains a child data set given its key.
     *
     * @param {string} key The key of the child data set.
     * @return {pvc.data.Data} The child data set with the given key or <tt>null</tt>.
     * @category DOM
     */
    child: function(key) {},

    /**
     * Obtains the number of children data sets.
     *
     * @return {number} The number of children data sets.
     * @category DOM
     */
    childCount: function() {},

    /**
     * Obtains an enumerable of the leaf data sets of this data set.
     *
     * @returns {!def.Query} An enumerable of {@link pvc.data.Data}.
     * @category DOM
     */
    leafs: function() {},

    /**
     * The first child data set.
     *
     * <p>
     * This is is <tt>null</tt> for leaf data sets.
     * </p>
     *
     * @type pvc.data.Data
     * @readonly
     * @category DOM
     */
    firstChild: null,

    /**
     * The last child data set.
     *
     * <p>
     * This is is <tt>null</tt> for leaf data sets.
     * </p>
     *
     * @type pvc.data.Data
     * @readonly
     * @category DOM
     */
    lastChild: null,

    /**
     * The previous sibling data set.
     *
     * <p>
     * This is <tt>null</tt> for the first child data set.
     * </p>
     *
     * @type pvc.data.Data
     * @readonly
     * @category DOM
     */
    previousSibling: null,

    /**
     * The next sibling data set.
     *
     * <p>
     * This is <tt>null</tt> for the last child data set.
     * </p>
     *
     * @type pvc.data.Data
     * @readonly
     * @category DOM
     */
    nextSibling: null,

    /**
     * Gets the index of this data set in relation to its sibling data sets.
     *
     * <p>This index is 0-based.</p>
     *
     * <p>When the node is a root node, <tt>-1</tt> is returned.</p>
     *
     * @returns {number} The child index.
     * @category DOM
     */
    childIndex: function() {
        return 0;
    },
    // endregion

    // region Interactivity
    /**
     * Gets the number of not-null, selected datums.
     *
     * @return {number} The number of datums.
     *
     * @see pvc.data.Datum#isSelected
     *
     * @category Interactivity
     */
    selectedCount: function() {},

    /**
     * Gets an array with the not-null, selected datums, in an unspecified order.
     *
     * @return {pvc.data.Datum[]} The selected datums.
     */
    selectedDatums: function() {},

    /**
     * Gets the number of not-null, visible datums.
     *
     * @return {number} The number of datums.
     *
     * @see pvc.data.Datum#isVisible
     *
     * @category Interactivity
     */
    visibleCount: function() {},

    /**
     * Replaces the currently selected datums with the given datums.
     *
     * @param {!pvc.data.Datum[]|!def.Query} datums The new datums to be selected.
     *
     * @returns {boolean} <tt>true</tt> if any datum changed its selected state; <tt>false</tt>, otherwise.
     *
     * @category Interactivity
     */
    replaceSelected: function(datums) {},

    /**
     * Clears the selected state of all datums.
     *
     * @returns {boolean} <tt>true</tt> if any datum changed its selected state; <tt>false</tt>, otherwise.
     *
     * @category Interactivity
     */
    clearSelected: function() {}
    // endregion
};

/**
 * Sets the selected state of the given datums to a given state.
 *
 * @param {!pvc.data.Datum[]|!def.Query} datums The datums to set.
 * @param {boolean} selected The desired selected state.
 *
 * @returns {boolean} <tt>true</tt> if any datum changed its selected state; <tt>false</tt>, otherwise.
 *
 * @category Interactivity
 */
pvc.data.Data.setSelected = function(datums, selected) {};

/**
 * Pseudo-toggles the selected state of the given datums.
 *
 * <p>
 * If all are selected, clears their selected state.
 * Otherwise, selects them all.
 * </p>
 *
 * <p>
 * If the `any` argument is <tt>true</tt>, the behavior changes to:
 * if any is selected, clears their selected state.
 * Otherwise, if none are selected, selects them all.
 * </p>
 *
 * @param {!pvc.data.Datum[]|!def.Query} datums The datums to toggle.
 * @param {boolean} [any=false] If only some must be selected to consider
 * the set currently selected or if all must be so.
 *
 * @returns {boolean} <tt>true</tt> if any datum changed its selected state; <tt>false</tt>, otherwise.
 *
 * @category Interactivity
 */
pvc.data.Data.toggleSelected = function(datums, any) {};

/**
 * Sets the visible state of the given datums to a given state.
 *
 * @param {!pvc.data.Datum[]|!def.Query} datums The datums to set.
 * @param {boolean} visible The desired visible state.
 *
 * @returns {boolean} <tt>true</tt> if any datum changed its visible state; <tt>false</tt>, otherwise.
 *
 * @category Interactivity
 */
pvc.data.Data.setVisible = function(datums, visible) {};

/**
 * Pseudo-toggles the visible state of the given datums.
 *
 * <p>If all are visible, hides them. Otherwise, shows them all.</p>
 *
 * @param {!pvc.data.Datum[]|!def.Query} datums The datums to toggle.
 *
 * @returns {boolean} <tt>true</tt> if any datum changed its visible state; <tt>false</tt>, otherwise.
 *
 * @category Interactivity
 */
pvc.data.Data.toggleVisible = function(datums) {};
// endregion

// region Datum
/**
 * The <tt>Datum</tt> class represents a "row" of data in a data set.
 *
 * @class
 * @augments pvc.data.Complex
 */
pvc.data.Datum = function() {};

pvc.data.Datum.prototype = /** @lends pvc.data.Datum# */{

    // region Interactivity
    /**
     * Gets a value that indicates if the datum is in a selected state.
     *
     * @type boolean
     * @readonly
     * @category Interactivity
     */
    isSelected: false,

    /**
     * Gets a value that indicates if the datum is in a visible state.
     *
     * @type boolean
     * @readonly
     * @category Interactivity
     */
    isVisible:  true,
    // endregion

    // region Nature
    /**
     * Gets a value that indicates if the datum considered to be <i>null</i>.
     *
     * A datum is considered <i>null</i> if the atoms of all of its
     * dimensions that are considered "measures" have a <tt>null</tt> value.
     *
     * @type boolean
     * @readonly
     * @category Nature
     */
    isNull: false,

    /**
     * Gets a value that indicates if the datum was generated by an interpolation or trending operation
     * and is not part of the data source.
     *
     * @type boolean
     * @readonly
     * @category Nature
     * @see #isTrend
     * @see #isInterpolated
     */
    isVirtual: false,

    /**
     * Gets a value that indicates if the datum was generated by a trending operation
     * and is not part of the data source.
     *
     * @type boolean
     * @readonly
     * @category Nature
     * @see #trend
     */
    isTrend: false,

    /**
     * Gets information about the trending operation that generated this datum.
     *
     * @type pvc.options.varia.PlotTrending
     * @readonly
     * @category Nature
     * @see #isTrend
     */
    trend: null,

    /**
     * Gets a value that indicates if the datum was generated by an interpolation operation
     * and is not part of the data source.
     *
     * @type boolean
     * @readonly
     * @category Nature
     * @see #interpolation
     */
    isInterpolated: false,

    /**
     * Gets the type of interpolation that generated this datum.
     *
     * @type pvc.options.varia.NullInterpolationMode
     * @readonly
     * @category Nature
     */
    interpolation: null,

    /**
     * Gets the name of the interpolated dimension of this datum.
     *
     * @type string
     * @readonly
     * @category Nature
     */
    interpDimName: null
    // endregion
};
// endregion

// region Atom
/**
 * The <tt>Atom</tt> class represents the value of a complex under a specific dimension.
 *
 * @class
 */
pvc.data.Atom = function() {};

pvc.data.Atom.prototype = /** @lends pvc.data.Atom# */{
    /**
     * Gets the unique, sequential identifier of the atom.
     *
     * @type number
     * @readonly
     */
    id: null,

    /**
     * Gets the raw value from which {@link #value} was derived.
     *
     * <p>
     * When <tt>value</tt> is the result of a conversion from the value present in the data source,
     * by application of {@link pvc.options.DimensionType#converter},
     * <tt>rawValue</tt> contains the original value.
     * Otherwise, it is equal to <tt>value</tt>.
     * </p>
     *
     * @type any
     * @readonly
     */
    rawValue: null,

    /**
     * Gets the typed value of the atom.
     *
     * @type any
     * @readonly
     */
    value: null,

    /**
     * Gets the formatted value of the atom.
     *
     * <p>
     * When not provided directly in the data source,
     * by using the <tt>{v: value, f: "formattedValue"}</tt> cell syntax,
     * it is obtained by application of {@link pvc.options.DimensionType#formatter}.
     * </p>
     *
     * @type string
     * @readonly
     */
    label: null,

    /**
     * Gets the label of a numeric atom formatted as a percentage.
     *
     * @type string
     * @readOnly
     */
    labelPercent: null,

    /**
     * Gets the key of the atom.
     *
     * <p>
     * The key is a unique string representation of a value in a dimension and
     * is used to index atoms in dictionaries.
     * </p>
     *
     * <p>
     * The key is obtained by application of {@link pvc.options.DimensionType#key}.
     * The default <i>key</i> function is the standard JavaScript {@link String} function.
     * </p>
     *
     * @type string
     * @readonly
     */
    key: null,

    /**
     * Gets a value that indicates if the atom was generated by an interpolation or trending operation
     * and is not part of the data source.
     *
     * @type boolean
     * @readonly
     */
    isVirtual: false
};
// endregion

// endregion

// region pvc.visual
/**
 * The visual namespace.
 *
 * @namespace
 */
pvc.visual = {};

// region Chart
/**
 * Creates a chart, given its specification.
 *
 * @class The <tt>BaseChart</tt> class is the abstract base class of CCC charts.
 *
 * @constructs
 * @param {!pvc.options.charts.BasicChart} optionsSpec The chart options specification.
 */
pvc.BaseChart = function(optionsSpec) {
};

pvc.BaseChart.prototype = /** @lends pvc.BaseChart# */{

    // region DOM
    /**
     * The parent chart.
     *
     * <p>
     * This is <tt>null</tt> for root charts.
     * </p>
     *
     * @type pvc.BaseChart
     * @readonly
     * @category DOM
     */
    parent: null,

    /**
     * The root chart.
     *
     * <p>
     * The root chart has itself as the value of the root property.
     * </p>
     *
     * @type !pvc.BaseChart
     * @readonly
     * @category DOM
     */
    root: null,

    /**
     * The child charts of a multi-chart root chart.
     *
     * <p>
     * This is <tt>null</tt> on a leaf chart or on a non-multi-chart root chart.
     * </p>
     *
     * @type pvc.BaseChart[]
     * @readonly
     * @category DOM
     */
    children: null,
    // endregion

    // region Data
    /**
     * Gets the main data set of the chart.
     *
     * <p>
     * This property is <tt>null</tt> while the chart is not created.
     * </p>
     *
     * @type pvc.data.Data
     * @readonly
     * @category Data
     *
     * @see #setData
     */
    data: null,

    /**
     * Sets the main data set of the chart,
     * given a data set specification in CDA format.
     *
     * <p>
     * Calling this method by itself does not update the chart.
     * You must explicitly call {@link #render} for
     * the chart to reflect the new data.
     * </p>
     *
     * <p>Example data set specification in CDA format:</p>
     *
     * <code>
     * <pre>
     * var relational_01a = {
     *   "metadata": [
     *     {"colName": "city",     "colType": "String"},
     *     {"colName": "date",     "colType": "String"},
     *     {"colName": "quantity", "colType": "Numeric"}
     *   }],
     *   "resultset": [
     *     ["London", "2011-06-05", 72],
     *     ["London", "2011-06-12", 50],
     *     ["London", "2011-06-19", 20],
     *     ["London", "2011-06-26", 23],
     *     ["London", "2011-07-03", 72],
     *     ["London", "2011-07-10", 80],
     *     ["London", "2011-07-26", 23],
     *     ["London", "2011-07-31", 72],
     *     ["London", "2011-08-07", 50],
     *     ["London", "2011-08-14", 20],
     *     ["London", "2011-08-28", 20],
     *     ["Paris",  "2011-06-05", 27],
     *     ["Paris",  "2011-06-26", 32],
     *     ["Paris",  "2011-07-03", 24],
     *     ["Paris",  "2011-07-10", 80],
     *     ["Paris",  "2011-07-17", 90],
     *     ["Paris",  "2011-07-24", 53],
     *     ["Paris",  "2011-07-31", 17],
     *     ["Paris",  "2011-08-07", 20],
     *     ["Paris",  "2011-08-21", 43],
     *     ["Lisbon", "2011-06-12", 30],
     *     ["Lisbon", "2011-07-03", 60],
     *     ["Lisbon", "2011-07-10", 80],
     *     ["Lisbon", "2011-07-17", 15]
     *   ]
     * };
     * </pre>
     * </code>
     *
     * @param {object} dataSetSpec The data set specification.
     * @param {!pvc.options.charts.BasicChart} optionsSpec The data options specification.
     * You can use this argument to conveniently specify data source related options
     * such as {@link pvc.options.charts.BasicChart#crosstabMode}.
     *
     * @returns {!pvc.BaseChart} The chart instance.
     *
     * @category Data
     * @see #data
     */
    setData: function(dataSetSpec, optionsSpec) {
    },
    // endregion

    // region Render
    /**
     * Renders the chart.
     *
     * @param {boolean} [bypassAnimation=false] Indicates that entering animations should not be performed.
     * @param {boolean} [recreate=false] When the chart has already been created, forces it to be re-created.
     * When the chart is recreated, all options are re-read and the chart is re-laid out.
     * Data may or may not be reloaded, depending on the <tt>reloadData</tt> argument.
     * When not recreated,
     * rendering simply performs a full Protovis render of the existing Protovis structure,
     * possibly performing the entering animation.
     * @param {boolean} [reloadData=true] When the chart is being created or recreated,
     * indicates that data should be reloaded.
     * It is assumed that the new data has the same metadata as that of the first chart creation.
     *
     * @returns {!pvc.BaseChart} The chart instance.
     *
     * @see #getLastRenderError
     * @see #renderResize
     * @see #renderInteractive
     *
     * @category Render
     */
    render: function(bypassAnimation, recreate, reloadData) {
    },

    /**
     * Resizes a chart given new dimensions.
     *
     * <p>
     * When both dimensions are <i>nully</i>, this method does nothing.
     * </p>
     *
     * <p>
     * If the chart's previous layout, if any, had already reached its minimum size (in both directions),
     * and the both the specified dimensions are smaller than or equal to the previous layout's
     * requested size, then this method does nothing.
     * </p>
     *
     * <p>
     * This method does not perform entering animations or reload data.
     * </p>
     *
     * @param {number} [width]  - The new width of the chart. Ignored when <i>nully</i>.
     * @param {number} [height] - The new height of the chart. Ignored when <i>nully</i>.
     *
     * @returns {!pvc.BaseChart} The chart instance.
     *
     * @see #render
     *
     * @category Render
     */
    renderResize: function(width, height) {
    },

    /**
     * Re-renders the parts of a chart that represent the state of user interaction.
     *
     * <p>
     * This method performs a Protovis render of only the marks that
     * are known to represent the state of user interaction,
     * and is thus more efficient than a full Protovis render,
     * as would be performed by calling {@link #render} like in <tt>chart.render(true)</tt>.
     * </p>
     *
     * @returns {!pvc.BaseChart} The chart instance.
     *
     * @see #render
     *
     * @category Render
     */
    renderInteractive: function() {
    },

    /**
     * Gets the error of the last render operation, if one occurred, or <tt>null</tt> if not.
     *
     * @returns {Error} The last render error or <tt>null</tt>.
     *
     * @see #render
     *
     * @category Render
     */
    getLastRenderError: function() {
    },
    // endregion

    // TODO: format

    // region Scenes
    /**
     * Gets the chart's active scene.
     *
     * @return {pvc.visual.Scene} The active scene or `null`, when none is active.
     *
     * @category Scenes
     */
    activeScene: function() {
    },
    // endregion

    // region Axes
    /**
     * The map of {@link pvc.visual.Axis} indexed by <b>axis id</b>.
     *
     * @type object
     * @readonly
     * @category Axes
     */
    axes: null,
    // endregion

    // region Panels
    /**
     * Gets the chart's base panel.
     *
     * This property is <tt>null</tt> until the chart has been created.
     *
     * If this is the {@link #root} chart,
     * then this is the root panel.
     *
     * @type pvc.BasePanel
     * @readonly
     * @category Panels
     */
    basePanel: null

    // endregion

    // TODO: plots
    // TODO: plotPanels
    // TODO: visualRole()
};
// endregion

// region Panel
/**
 * The <tt>BasePanel</tt> class is the abstract base class of CCC panels.
 *
 * @class
 */
pvc.BasePanel = function() {};

pvc.BasePanel.prototype = /** @lends pvc.BasePanel# */{

// getLayout

};


// TODO: PlotPanel
// . axes
//   . dataCells
// . plot
//   . visualRoles
//   . dataPart
//   . dataCells

// endregion

// region Variable
/**
 * The <tt>Variable</tt> class represents the domain value that is
 * encoded by a visual variable such as <i>color</i>, <i>size</i> or <i>position</i> in a rendering scene.
 *
 * @class
 */
pvc.visual.Variable = function() {};

pvc.visual.Variable.prototype = /** @lends pvc.visual.Variable# */{

    // TODO: key?

    /**
     * Gets the value of the variable.
     *
     * @type any
     * @readonly
     */
    value: null,

    /**
     * Gets the formatted value of the variable.
     *
     * @type string
     * @readonly
     */
    label: null
};
// endregion

// region Context
/**
 * The <tt>Context</tt> class exposes the CCC Visual API to extension point functions.
 * <p>
 *     It is passed as the JavaScript <tt>this</tt> context object to extension functions,
 *     such as extension point functions and action handlers.
 * </p>
 *
 * @class
 */
pvc.visual.Context = function() {};

pvc.visual.Context.prototype = /** @lends pvc.visual.Context# */{

    /**
     * Gets the immediate chart instance.
     *
     * In multi-chart scenarios,
     * this is the chart that is closest to what the context was created for.
     *
     * To be sure to get the root chart, get its {@link pvc.BaseChart#root} property.
     *
     * @type !pvc.BaseChart
     * @readonly
     * @category Visual Components
     */
    chart: null,

    /**
     * Gets the immediate panel instance.
     *
     * This is the panel that is closest to what the context was created for.
     * Ultimately, this is the root chart's base panel.
     *
     * @type !pvc.BasePanel
     * @readonly
     * @category Visual Components
     */
    panel: null,

    /**
     * Gets the Protovis mark instance, if there is one, or <tt>null</tt>, if not.
     *
     * This property has a value when the context is used for an extension point function.
     *
     * @type pv.Mark
     * @readonly
     * @category Visual Components
     * @see #sign
     */
    pvMark: null,

    /**
     * Gets the sign that wraps {@link #pvMark}, if there is one, or <tt>null</tt>, if not.
     *
     * @type pvc.visual.Sign
     * @readonly
     * @category Visual Components
     * @see #pvMark
     */
    sign: null,

    /**
     * Gets the associated scene, if there is one, or <tt>null</tt> if not.
     *
     * @type pvc.visual.Scene
     * @readonly
     * @category Scene
     */
    scene: null,

    /**
     * Gets the index of {@link #scene} in relation to its sibling scenes.
     *
     * <p>This index is 0-based.</p>
     *
     * <p>
     * When there is a scene,
     * it gets the value of its {@link pvc.visual.Scene#childIndex} method.
     * Otherwise, when there is no scene, or when it is a root scene, gets the value <tt>null</tt>.
     * </p>
     *
     * <p>
     * This property can be used to change the value of extension point properties
     * depending on the index being, for example, even or odd.
     * It should not be used for much else,
     * like for obtaining data from an external array.
     * </p>
     *
     * @type ?number
     * @readonly
     * @category Scene
     */
    index: 0,

    /**
     * Gets the associated DOM event.
     *
     * <p>
     * When the context is used in the context of click or double-click action handlers,
     * gets the corresponding DOM event.
     *
     * In IE, gets a "fixed" version of the DOM event.
     *
     * Otherwise, gets the value <tt>null</tt>.
     * </p>
     *
     * @type HTMLDOMEvent
     * @readonly
     * @category Interactivity and Delegation
     */
    event: null,

    /**
     * Informs CCC that the value returned by the <b>extension point function</b>
     * currently being evaluated should be taken as final.
     * It should not be subject to additional, automatic interactivity effects.
     *
     * <p>
     * For convenience,
     * CCC applies certain effects automatically to the values returned by
     * extension point functions.
     * For example, it might decide to use a brighter version of a returned color
     * when the corresponding mark is being hovered-over.
     * </p>
     *
     * <p>
     * This method conveniently returns the passed-in value untouched,
     * so that the following coding pattern is possible:
     * </p>
     *
     * <code>
     * <pre>
     * function() {
     *   var color = this.index % 2 ? "blue" : "red";
     *   return this.finished(color);
     * }
     * </pre>
     * </code>
     *
     * @param {any} value - The value of the extension point property.
     * @returns {any} The passed in <tt>value</tt> argument.
     *
     * @readonly
     * @category Interactivity and Delegation
     */
    finished: function(value) {
        return value;
    },

    /**
     * Calls the underlying implementation of the <b>extension point property</b> currently being evaluated.
     *
     * <p>
     * This method allows you to only handle certain cases, in an extension point function,
     * and to delegate the remaining cases to the default implementation,
     * as in the following example:
     * </p>
     *
     * <code>
     * <pre>
     * function(scene) {
     *
     *   switch(scene.getCategory()) {
     *     case "cars":   return "red";
     *     case "plains": return "green";
     *     case "boats":  return "blue";
     *   }
     *
     *   return this.delegate("orange");
     * }
     * </pre>
     * </code>
     *
     * @param {any} defaultValue The default value to return when
     * the default implementation would evaluate to <tt>undefined</tt>.
     *
     * @returns {any} The evaluated value.
     */
    delegate: function(defaultValue) {
        return null;
    },

    // region Visual Data
    /**
     * Gets the value of the <tt>color</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.color.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see pvc.visual.Scene#getColor
     */
    getColor: function() {},

    /**
     * Gets the value of the <tt>category</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.category.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see pvc.visual.Scene#getCategory
     */
    getCategory: function() {},

    /**
     * Gets the value of the <tt>series</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.series.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see pvc.visual.Scene#getSeries
     */
    getSeries: function() {},

    /**
     * Gets the value of the <tt>value</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.value.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see pvc.visual.Scene#getValue
     */
    getValue: function() {},

    /**
     * Gets the value of the <tt>tick</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.tick.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see pvc.visual.Scene#getTick
     */
    getTick: function() {},

    /**
     * Gets the value of the <tt>x</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.x.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see pvc.visual.Scene#getX
     */
    getX: function() {},

    /**
     * Gets the value of the <tt>y</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.y.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see pvc.visual.Scene#getY
     */
    getY: function() {},

    /**
     * Gets the value of the <tt>size</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.size.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see pvc.visual.Scene#getSize
     */
    getSize: function() {},

    // ---

    /**
     * Gets the label of the <tt>color</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.color.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see pvc.visual.Scene#getColorLabel
     */
    getColorLabel: function() {},

    /**
     * Gets the label of the <tt>category</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.category.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see pvc.visual.Scene#getCategoryLabel
     */
    getCategoryLabel: function() {},

    /**
     * Gets the label of the <tt>series</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.series.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see pvc.visual.Scene#getSeriesLabel
     */
    getSeriesLabel: function() {},

    /**
     * Gets the label of the <tt>value</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.value.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see pvc.visual.Scene#getValueLabel
     */
    getValueLabel: function() {},

    /**
     * Gets the label of the <tt>tick</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.tick.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see pvc.visual.Scene#getTickLabel
     */
    getTickLabel: function() {},

    /**
     * Gets the label of the <tt>x</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.x.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see pvc.visual.Scene#getXLabel
     */
    getXLabel: function() {},

    /**
     * Gets the label of the <tt>y</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.y.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see pvc.visual.Scene#getYLabel
     */
    getYLabel: function() {},

    /**
     * Gets the label of the <tt>size</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>this.scene.vars.size.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see pvc.visual.Scene#getSizeLabel
     */
    getSizeLabel: function() {}
    // endregion
};
// endregion

// region Scene
/**
 * The <tt>Scene</tt> class represents a single point rendered by Protovis marks.
 *
 * <p>
 *     However, a scene is not specific to a given mark, and may actually feed several of them
 *     (a <tt>pv.Dot</tt>, a <tt>pv.Line</tt> and an <tt>pv.Area</tt>).
 * </p>
 * <p>Scenes provide a well defined interface to CCC extension point functions.</p>
 * <p>Scenes contain participating <i>datums</i> and <i>vars</i>.</p>
 *
 * @class
 */
pvc.visual.Scene = function() {};

pvc.visual.Scene.prototype = /** @lends pvc.visual.Scene# */{

    // region Business Data
    /**
     * Gets the first data set represented by the scene,
     * when there is at least one, or <tt>null</tt>, otherwise.
     *
     * <p>
     * A scene may visually represent a single datum, a series of datums,
     * a single data set or a series of data sets.
     * </p>
     *
     * @type pvc.data.Data
     * @readonly
     * @category Business Data
     * @see #datums
     * @see #groups
     */
    group: null,

    /**
     * Gets the array of data sets represented by the scene,
     * when there is at least one, or <tt>null</tt>, otherwise.
     *
     * <p>
     * A scene may visually represent a single datum, a series of datums,
     * a single data set or a series of data sets.
     * </p>
     *
     * @type pvc.data.Data[]
     * @readonly
     * @category Business Data
     * @see #datums
     * @see #group
     */
    groups: null,

    /**
     * Gets the first datum represented by the scene,
     * when there is at least one, or <tt>null</tt>, otherwise.
     *
     * <p>
     * A scene may visually represent a single datum, a series of datums,
     * a single data set or a series of data sets.
     * In any case, this property contains the first datum.
     * </p>
     *
     * @type pvc.data.Data
     * @readonly
     * @category Business Data
     * @see #datums
     */
    datum: null,

    /**
     * Returns an enumerable of all of the represented {@link pvc.data.Datum}.
     *
     * <p>
     * When the scene represents no datums, an empty enumerable is returned.
     * </p>
     *
     * @returns {!def.Query} An enumerable of {@link pvc.data.Datum}.
     * @category Business Data
     * @see #datum
     * @see #group
     * @see #groups
     */
    datums: function() {
    },

    /**
     * Gets the atoms map of the scene's first data set or first datum.
     *
     * The map's keys are dimension names and the values are the corresponding {@link pvc.data.Atom}.
     *
     * <p>
     * When the scene represents data sets,
     * gets the {pvc.data.Complex#atoms} map of {@link #group}.
     * Otherwise, when the scene directly represents datums,
     * gets the {pvc.data.Complex#atoms} map of {@link #datum}.
     * Ultimately,
     * gets an empty map.
     * </p>
     *
     * <p>
     * Note that when the scene represents one or more data sets,
     * its <tt>atoms</tt> map will generally not contain
     * an {@link pvc.data.Atom} for each dimension,
     * but instead will only contain an atom for each dimension
     * in which all of the scene's datums have the same value
     * (ensured due to a group by operation having been performed).
     * Contrast this with {@link #firstAtoms}.
     * </p>
     *
     * <p>
     * Use <tt>atoms</tt> when you need access to
     * the business data that is common to
     * all datums that are represented in a scene.
     * You'll typically only use this for interfacing
     * with external components.
     * For internal use,
     * it's usually best to use {@link #vars},
     * which expose "visual data".
     * </p>
     *
     * <p>
     * Example {@link pvc.options.charts.BasicChart#clickAction} handler,
     * accessing the value of the "productFamily" dimension:
     * </p>
     *
     * <code>
     * <pre>
     * function(scene) {
     *   window.alert("Clicked on: " + scene.atoms.productFamily.value);
     * }
     * </pre>
     * </code>
     *
     * @type object
     * @readonly
     * @category Business Data
     * @see #datums
     * @see #vars
     * @see #firstAtoms
     */
    atoms: {},

    /**
     * Gets the atoms map of the scene's first datum.
     *
     * The map's keys are dimension names and the values are the corresponding {@link pvc.data.Atom}.
     *
     * <p>
     * When the scene represents at least one datum,
     * gets its {@link pvc.data.Complex#atoms} map.
     * Ultimately, gets an empty map.
     * </p>
     *
     * @type object
     * @readonly
     * @category Business Data
     * @see #datums
     * @see #atoms
     */
    firstAtoms: {},

    // endregion

    // region Visual Data
    /**
     * Gets the variables map of the scene.
     *
     * The map's keys are variable names and the values are the corresponding {@link pvc.visual.Variable}.
     *
     * <p>
     * Each chart and plot visual role <i>usually</i> has a corresponding scene variable with its name.
     * Just like with atoms, a scene variable contains the properties <tt>value</tt> and <tt>label</tt>.
     * </p>
     *
     * <p>
     * Use it to obtain the value of a visual role, like, for example:
     * <tt>scene.vars.series.value</tt>.
     * </p>
     *
     * <p>
     * In the scene trees of some panels,
     * such as the legend panel and the cartesian axes panels,
     * scene variables are not named after the corresponding plot visual role.
     * This is because they can show information which comes from more than one plot visual role.
     * </p>
     *
     * <p>
     * In the discrete color legend panel,
     * the main variable is named <tt>value</tt>.
     * </p>
     *
     * <p>
     * In cartesian axes panels,
     * the main variable is named <tt>tick</tt>.
     * </p>
     *
     * <p>
     * In the following example, a mark's fillStyle extension point
     * is calculated based on the value of the <tt>category</tt> variable:
     * </p>
     *
     * <code>
     * <pre>
     * function(scene) {
     *
     *   switch(scene.vars.category.value) {
     *     case "cars":   return "red";
     *     case "plains": return "green";
     *     case "boats":  return "blue";
     *   }
     *
     *   return "orange";
     * }
     * </pre>
     * </code>
     *
     * <p>
     * In the following example,
     * the {@link pvc.options.charts.BasicChart#clickAction} handler is used to
     * display to the user the <tt>category</tt> variable's label
     * of the clicked-on scene:
     * </p>
     *
     * <code>
     * <pre>
     * function(scene) {
     *   window.alert("The category is: " + scene.vars.category.label);
     * }
     * </pre>
     * </code>
     *
     * @type object
     * @readonly
     * @category Visual Data
     * @see #atoms
     * @see #getColor
     * @see #getCategory
     * @see #getSeries
     * @see #getValue
     * @see #getTick
     * @see #getX
     * @see #getY
     * @see #getSize
     */
    vars: {},

    /**
     * Gets the value of the <tt>color</tt> scene variable (defined in scenes of plots).
     *
     * <p>
     * This method is sugar for <tt>scene.vars.color.value</tt>.
     * </p>
     *
     * <p>
     * This is not a color value (like a color string or a pv.Color object), but, instead,
     * the business value that is passed to a color scale to obtain a color.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see #getColorLabel
     */
    getColor: function() {},

    /**
     * Gets the value of the <tt>category</tt> scene variable (defined in scenes of categorical and pie plots).
     *
     * <p>
     * This method is sugar for <tt>scene.vars.category.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see #getCategoryLabel
     */
    getCategory: function() {},

    /**
     * Gets the value of the <tt>series</tt> scene variable (defined in scenes of cartesian plots).
     *
     * <p>
     * This method is sugar for <tt>scene.vars.series.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see #getSeriesLabel
     */
    getSeries: function() {},

    /**
     * Gets the value of the <tt>value</tt> scene variable (defined in scenes of categorical/numeric plots and the legend panel).
     *
     * <p>
     * This method is sugar for <tt>scene.vars.value.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see #getValueLabel
     */
    getValue: function() {},

    /**
     * Gets the value of the <tt>tick</tt> scene variable (defined in scenes of the cartesian axis).
     *
     * <p>
     * This method is sugar for <tt>scene.vars.tick.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see #getTickLabel
     */
    getTick: function() {},

    /**
     * Gets the value of the <tt>x</tt> scene variable (defined in scenes of the scatter/metric-point plot).
     *
     * <p>
     * This method is sugar for <tt>scene.vars.x.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see #getXLabel
     */
    getX: function() {},

    /**
     * Gets the value of the <tt>y</tt> scene variable (defined in scenes of the scatter/metric-point plot).
     *
     * <p>
     * This method is sugar for <tt>scene.vars.y.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see #getYLabel
     */
    getY: function() {},

    /**
     * Gets the value of the <tt>size</tt> scene variable (defined in scenes of the heat-grid and the scatter/metric-point plots).
     *
     * <p>
     * This method is sugar for <tt>scene.vars.size.value</tt>.
     * </p>
     *
     * @returns {any} The variable's value.
     * @category Visual Data
     * @see #getSizeLabel
     */
    getSize: function() {},

    // ---

    /**
     * Gets the label of the <tt>color</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>scene.vars.color.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see #getColor
     */
    getColorLabel: function() {},

    /**
     * Gets the label of the <tt>category</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>scene.vars.category.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see #getCategory
     */
    getCategoryLabel: function() {},

    /**
     * Gets the label of the <tt>series</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>scene.vars.series.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see #getSeries
     */
    getSeriesLabel: function() {},

    /**
     * Gets the label of the <tt>value</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>scene.vars.value.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see #getValue
     */
    getValueLabel: function() {},

    /**
     * Gets the label of the <tt>tick</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>scene.vars.tick.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see #getTick
     */
    getTickLabel: function() {},

    /**
     * Gets the label of the <tt>x</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>scene.vars.x.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see #getX
     */
    getXLabel: function() {},

    /**
     * Gets the label of the <tt>y</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>scene.vars.y.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see #getY
     */
    getYLabel: function() {},

    /**
     * Gets the label of the <tt>size</tt> scene variable.
     *
     * <p>
     * This method is sugar for <tt>scene.vars.size.label</tt>.
     * </p>
     *
     * @returns {any} The variable's label.
     * @category Visual Data
     * @see #getSize
     */
    getSizeLabel: function() {},
    // endregion

    // region Visual Components

    /**
     * Gets the immediate chart instance.
     *
     * <p>
     * In multi-chart scenarios,
     * this is the chart that is closest to where the scene belongs.
     * </p>
     *
     * <p>
     * To be sure to get the root chart, get its {@link pvc.BaseChart#root} property.
     * </p>
     *
     * @returns {!pvc.BaseChart} The chart instance.
     * @category Visual Components
     * @see pvc.visual.Context#chart
     */
    chart: function() {},

    /**
     * Gets the immediate panel instance.
     *
     * <p>
     * This is the panel that is closest to where the scene belongs.
     * Ultimately, this is the root chart's base panel.
     * </p>
     *
     * @returns {!pvc.BasePanel} The panel instance.
     * @category Visual Components
     * @see pvc.visual.Context#panel
     */
    panel: function() {},

    // endregion

    // region DOM
    /**
     * The parent scene.
     *
     * <p>
     * This is <tt>null</tt> for root scenes.
     * </p>
     *
     * @type pvc.visual.Scene
     * @readonly
     * @category DOM
     */
    parent: null,

    /**
     * The root scene.
     *
     * @type !pvc.visual.Scene
     * @readonly
     * @category DOM
     * @see #isRoot
     */
    root: null,

    /**
     * Gets a value that indicates if this scene is a root scene.
     *
     * @returns {boolean} <tt>true</tt> if the scene is a root scene; <tt>false</tt> otherwise.
     * @category DOM
     * @see #root
     */
    isRoot: function() {},

    /**
     * The array of child scenes.
     *
     * <p>
     * This array is empty for leaf scenes.
     * An easy way to check if child scenes exist is to query {@link #firstChild}.
     * </p>
     *
     * @type !pvc.visual.Scene[]
     * @readonly
     * @category DOM
     * @see #children
     */
    childNodes: [],

    /**
     * An enumerable of the child scenes.
     *
     * @return {!def.Query} An enumerable of {@link pvc.visual.Scene}.
     * @category DOM
     * @see #childNodes
     * @see #leafs
     */
    children: function() {},

    /**
     * An enumerable of the leaf scenes.
     *
     * @return {!def.Query} An enumerable of {@link pvc.visual.Scene}.
     * @category DOM
     * @see #children
     */
    leafs: function() {},

    /**
     * The first child scene.
     *
     * <p>
     * This is is <tt>null</tt> for leaf scenes.
     * </p>
     *
     * @type pvc.visual.Scene
     * @readonly
     * @category DOM
     */
    firstChild: null,

    /**
     * The last child scene.
     *
     * <p>
     * This is is <tt>null</tt> for leaf scenes.
     * </p>
     *
     * @type pvc.visual.Scene
     * @readonly
     * @category DOM
     */
    lastChild: null,

    /**
     * The previous sibling scene.
     *
     * <p>
     * This is <tt>null</tt> for the first child scene.
     * </p>
     *
     * @type pvc.visual.Scene
     * @readonly
     * @category DOM
     */
    previousSibling: null,

    /**
     * The next sibling scene.
     *
     * <p>
     * This is <tt>null</tt> for the last child scene.
     * </p>
     *
     * @type pvc.visual.Scene
     * @readonly
     * @category DOM
     */
    nextSibling: null,

    /**
     * Gets the index of this scene in relation to its sibling scenes.
     *
     * <p>This index is 0-based.</p>
     *
     * <p>When the node is a root node, <tt>-1</tt> is returned.</p>
     *
     * @returns {number} The child index.
     * @category DOM
     */
    childIndex: function() {
        return 0;
    },
    // endregion

    // region Interactivity

    /**
     * Gets a value that indicates if the scene is in an <b>interactive</b> state.
     *
     * <p>
     * A scene is in an interactive state if it is active, {@link #isActive}
     * and/or if it represents at least one datum which is selected.
     * </p>
     *
     * @returns {boolean} <tt>true</tt> if the scene is in an interactive state; <tt>false</tt> otherwise.
     * @category Interactivity
     */
    anyInteraction: function() {},

    /**
     * Gets a value that indicates if the scene is in an <b>active</b> state.
     *
     * <p>
     * A scene becomes active while the user hovers-over any of the the visual elements
     * that represent it.
     * </p>
     *
     * @type {boolean}
     * @readonly
     * @category Interactivity - Active
     */
    isActive: false,

    /**
     * Gets a value that indicates if the tree to which this scene belongs has an active scene.
     *
     * <p>
     * A scene becomes active while the user hovers-over any of the the visual elements
     * that represent it.
     * </p>
     *
     * @returns {boolean} <tt>true</tt> if there is an active scene; <tt>false</tt> otherwise.
     * @category Interactivity - Active
     */
    anyActive: function() {
    },

    /**
     * Gets the active scene of the scene tree to which this scene belongs.
     *
     * @returns {pvc.visual.Scene} The active scene, if any; <tt>null</tt>, otherwise.
     * @category Interactivity - Active
     */
    active: function() {
    },

    /**
     * Gets the value of the <tt>series</tt> variable of the active scene,
     * if any, of the scene tree to which this scene belongs.
     *
     * @returns {any} The active series value.
     * @category Interactivity - Active
     */
    activeSeries: function() {
    },

    /**
     * Gets a value that indicates if this scene's <tt>series</tt> is active.
     *
     * <p>
     * A scene's <tt>series</tt> is said to be active
     * if it has a <tt>series</tt> variable and it has the same value
     * as that returned by {@link #activeSeries}.
     * </p>
     *
     * @returns {boolean} <tt>true</tt> if this scene's <tt>series</tt> is active; <tt>false</tt> otherwise.
     * @category Interactivity - Active
     */
    isActiveSeries: function() {
    },

    /**
     * Sets this scene as the active scene of its scene tree.
     *
     * <p>
     * When a scene is activated,
     * any previously active scene of the same scene tree is deactivated.
     * To update the chart,
     * you should also execute <tt>this.panel().renderInteractive()</tt>.
     * </p>
     *
     * @param {boolean} [active=false] The new active state of the scene.
     * @category Interactivity - Active
     */
    setActive: function(active) {
    },

    /**
     * Clears the active scene <b>of this scene's tree</b>, if any.
     *
     * <p>This scene may not be the active scene.</p>
     *
     * @return {boolean} `true` if the scene tree's active scene changed, `false`, otherwise.
     * @category Interactivity - Active
     */
    clearActive: function() {
    },

    /**
     * Gets a value that indicates if at least one of the datums represented by the scene is selected.
     *
     * @returns {boolean} <tt>true</tt> if there is one selected datum; <tt>false</tt> otherwise.
     * @category Interactivity - Selected
     * @see pvc.data.Datum#isSelected
     */
    isSelected: function() {
    },

    /**
     * Gets a value that indicates if any datum is selected.
     *
     * The selected datum does not need to be represented by a scene in this scene's tree.
     *
     * @returns {boolean} <tt>true</tt> if there is any selected datum; <tt>false</tt>, otherwise.
     * @category Interactivity - Selected
     * @see pvc.data.Datum#isSelected
     * @see #isSelected
     */
    anySelected: function() {
    }
    // endregion
};
// endregion

// region Sign
/**
 * The <tt>Sign</tt> class represents thin wrappers around Protovis marks
 * which configure them with special CCC behavior.
 *
 * @class
 */
pvc.visual.Sign = function() {};

pvc.visual.Sign.prototype = /** @lends pvc.visual.Sign# */{

    // region Color
    /**
     * Gets the color to use for a given scene according to the color scale.
     *
     * <p>
     * Usually, calling {@link pvc.visual.Context#delegate} returns the color scale's color.
     * However, in some rare cases, delegating already returns a modified version of it.
     * For these cases, this method can be used to obtain a color directly from the plot's color scale.
     * </p>
     *
     * <p>
     * When the associated panel has a <tt>color</tt> axis,
     * its scale is used to encode the value of the <tt>color</tt> scene variable.
     * If there is no <tt>color</tt> axis, the value of {@link pvc.defaultColor} is used.
     * </p>
     *
     * @param {!pvc.visual.Scene} scene The scene.
     * @returns {!pv.FillStyle} A Protovis color.
     * @category Color
     */
    scaleColor: function(scene) {
    },

    /**
     * Gets a dimmed/gray-scale version of a given color.
     *
     * @param {string|!pv.FillStyle|!pv.Color} color The color to transform.
     * @param {string} type The type of graphical element for which the color will be used.
     * Can be one of <tt>fill</tt>, <tt>stroke</tt> or <tt>text</tt>.
     * Depending on the specified type, different effects may be used.
     *
     * @returns {!pv.FillStyle} A Protovis color.
     * @category Color
     */
    dimColor: function(color, type) {
    },
    // endregion

    // region Interactivity
    /**
     * Gets a value that indicates if the sign reveals the <b>interactive</b> state of scenes.
     *
     * @returns {boolean} <tt>true</tt> if it reveals; <tt>false</tt>, otherwise.
     * @category Interactivity
     * @see #showsActivity
     * @see #showsSelection
     * @see pvc.visual.Scene#anyInteraction
     * @see pvc.options.marks.MarkExtensionPoint#ibits
     * @see pvc.options.marks.MarkExtensionPoint#imask
     */
    showsInteraction: function() {
    },

    /**
     * Gets a value that indicates if the sign reveals the <b>active</b> state of scenes.
     *
     * @returns {boolean} <tt>true</tt> if it reveals; <tt>false</tt>, otherwise.
     * @category Interactivity
     * @see #showsInteraction
     * @see #showsSelection
     * @see pvc.visual.Scene#isActive
     * @see pvc.options.marks.MarkExtensionPoint#ibits
     * @see pvc.options.marks.MarkExtensionPoint#imask
     */
    showsActivity: function() {
    },

    /**
     * Gets a value that indicates if the sign reveals the <b>selected</b> state of datums.
     *
     * @returns {boolean} <tt>true</tt> if it reveals; <tt>false</tt>, otherwise.
     * @category Interactivity
     * @see #showsInteraction
     * @see #showsActivity
     * @see pvc.data.Datum#isSelected
     * @see pvc.options.marks.MarkExtensionPoint#ibits
     * @see pvc.options.marks.MarkExtensionPoint#imask
     */
    showsSelection: function() {
    }
    // endregion
};
// endregion

// region Axis
/**
 * The <tt>Axis</tt> class represents a dimension of visual representation
 * and contains an actual {@link #scale} that encodes business values as visual variables.
 *
 * @class
 */
pvc.visual.Axis = function() {};

pvc.visual.Axis.prototype = /** @lends pvc.visual.Axis# */{

    /**
     * Gets the axis id.
     *
     * A composition of the axis's {@link #type} and {@link #index}.
     *
     * @type string
     * @readonly
     * @category Identification
     */
    id: null,

    /**
     * Gets the axis type.
     *
     * <p>
     * One of the values:
     * </p>
     * <ul>
     *     <li><tt>color</tt></li>
     *     <li><tt>size</tt></li>
     *     <li><tt>base</tt></li>
     *     <li><tt>ortho</tt></li>
     *     <li><tt>category</tt></li>
     *     <li><tt>angle</tt></li>
     * </ul>
     *
     * @type string
     * @readonly
     * @category Identification
     */
    type: null,

    /**
     * Gets the index of the axis among those of its type.
     *
     * <p>
     * This index is 0-based.
     * </p>
     *
     * @type number
     * @readonly
     * @category Identification
     */
    index: null,

    /**
     * Gets the Protovis scale of the axis.
     *
     * @type pv.Scale
     * @readonly
     * @category Scale
     */
    scale: null

    // TODO: dataCells
};
// endregion

//endregion

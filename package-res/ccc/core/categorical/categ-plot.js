/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes an abstract categorical plot.
 * 
 * @name pvc.visual.CategoricalPlot
 * @class Represents an abstract categorical plot.
 * @extends pvc.visual.CartesianPlot
 */
def('pvc.visual.CategoricalPlot', pvc.visual.CartesianPlot.extend({
    methods: /** @lends pvc.visual.CategoricalPlot# */{

        /** @override */
        createData: function(baseData, ka) {

            var ka2 = Object.create(ka);
            ka2.extensionDataSetsMap = this.boundDimensionsDataSetsMap;

            return baseData.groupBy([
                this.visualRoles.category.flattenedGrouping(),
                this.visualRoles.series.flattenedGrouping()
            ], ka2);
        },

        /** @override */
        interpolatable: function() {
            return true;
        },

        /** @override */
        _initVisualRoles: function() {

            this.base();

            this._addVisualRole('category', this._getCategoryRoleSpec());
        },

        /** @overridable */
        _getCategoryRoleSpec: function() {
            return {
                isRequired: true,
                defaultDimension: 'category*',
                autoCreateDimension: true
            };
        },

        /**
         * Obtains the extent of the specified data cell when represented in a given chart,
         * by this plot and using a given axis.
         *
         * <p>
         * Takes into account that values are shown grouped per category.
         * </p>
         *
         * <p>
         * The fact that values are stacked or not, per category,
         * is also taken into account.
         * Each data part can have its own stacking.
         * </p>
         *
         * <p>
         * When more than one datum exists per series <i>and</i> category,
         * the sum of its values is considered.
         * </p>
         *
         * @param {pvc.visual.CartesianAxis} valueAxis The value axis.
         * @param {pvc.visual.Role} valueDataCell The data cell.
         * @type object
         *
         * @override
         */
        getContinuousVisibleCellExtent: function(chart, valueAxis, valueDataCell) {
            var valueRole = valueDataCell.role;

            switch(valueRole.name) {
                case 'series':// (series throws in base)
                case 'category':
                    /* Special case.
                     * The category role's single dimension belongs to the grouping dimensions of data.
                     * As such, the default method is adequate
                     * (gets the extent of the value dim on visible data).
                     *
                     * Continuous baseScale's, like timeSeries go this way.
                     */
                    return this.base(chart, valueAxis, valueDataCell);
            }

            if(valueDataCell.plot !== this) throw def.error.operationInvalid("DataCell not of this plot.");

            var data = chart.visiblePlotData(this); // [ignoreNulls=true]
            var useAbs = valueAxis.scaleUsesAbs();
            if(valueAxis.type !== 'ortho' || !valueDataCell.isStacked) {

                // Leaf data sets either have a discriminator dimension settled or not.
                // If yes, use that dimension, if not sum all bound dimensions.
                return data.leafs()
                   .select(function(serGroup) {
                        var value = valueRole.numberValueOf(serGroup).value;
                       return useAbs && value < 0 ? -value : value;
                    })
                   .range();
            }

            // ortho axis and stacked...!

            // Data is grouped by category and then by series,
            // so direct children of data are category groups.
            // If valueRole has multiple dimensions,
            //  then there must be a discriminator dimension set,
            //  above from the leaf data sets (multiChart, category, series).

            return data.children()
                // Obtain the value extent of each category.
                .select(function(catGroup) {
                    var range = this._getStackedCategoryValueExtent(catGroup, valueRole, useAbs);
                    if(range) return {range: range, group: catGroup};
                }, this)
                .where(def.notNully)

                // Combine the value extents of all categories
                .reduce(function(result, rangeInfo) {
                    return this._reduceStackedCategoryValueExtent(
                                chart,
                                result,
                                rangeInfo.range,
                                rangeInfo.group,
                                valueAxis,
                                valueDataCell);
                }.bind(this), null);

                // The following would not work:
                //  var max = data.children()
                //     .select(function(catGroup) { return catGroup.dimensions(valueDimName).sum(); })
                //     .max();
                //
                //  return max != null ? {min: 0, max: max} : null;
        },

        /**
         * Obtains the extent of a value dimension in a given category group.
         * The default implementation determines the extent by separately
         * summing negative and positive values.
         * Supports {@link #_getContinuousVisibleExtent}.
         *
         * @overridable
         */
        _getStackedCategoryValueExtent: function(catGroup, valueRole, useAbs) {
            var posSum = null;
            var negSum = null;

            catGroup
                .children()
                // Sum all datum's values on the same leaf
                .select(function(serGroup) {

                    var value = valueRole.numberValueOf(serGroup).value;

                    // NOTE: null passes through.
                    return useAbs && value < 0 ? -value : value;
                })
                .each(function(value) {
                    // Add to positive or negative totals.

                    // Note: +null === 0
                    if(value != null) {
                        if(value >= 0) posSum += value;
                        else           negSum += value;
                    }
                });

            return posSum == null && negSum == null
                ? null
                : {max: posSum || 0, min: negSum || 0};
        },

        /**
         * Reduce operation of category ranges, into a global range.
         *
         * The default implementation performs a range "union" operation.
         *
         * Supports {@link #_getContinuousVisibleExtent}.
         * @overridable
         */
        _reduceStackedCategoryValueExtent: function(chart, result, catRange, catGroup, valueAxis, valueDataCell) {
            return pvc.unionExtents(result, catRange);
        },

        /** @override */
        _getBaseRole: function() { return this.visualRoles.category; },

        /** @override */
        _getOrthoRoles: function() { return [this.visualRoles.value]; },

        /** @override */
        interpolateDataCell: function(dataCell, baseData) {
            var InterpType = this._getNullInterpolationOperType(dataCell.nullInterpolationMode);
            if(InterpType) {
                this.chart._warnSingleContinuousValueRole(dataCell.role);

                var partValue   = dataCell.dataPartValue,
                    partData    = this.chart.partData(partValue, baseData),
                    visibleData = this.chart.visiblePlotData(this, partValue, {baseData: baseData});// [ignoreNulls=true]
                if(visibleData.childCount() > 0) {
                    new InterpType(
                        baseData,
                        partData,
                        visibleData,
                        this.visualRoles.category,
                        this.visualRoles.series,
                        /*valRole*/dataCell.role,
                        /*stretchEnds*/true) // dataCell.isStacked
                        .interpolate();
                }
            }
        },

        _getNullInterpolationOperType: function(nim) {
            switch(nim) {
                case 'linear': return cdo.LinearInterpolationOper;
                case 'zero':   return cdo.ZeroInterpolationOper;
                case 'none':   break;
                default: throw def.error.argumentInvalid('nullInterpolationMode', '' + nim);
            }
        },

        /** @override */
        generateTrendsDataCell: function(newDatums, dataCell, baseData) {
            var serRole = this.visualRoles.series,
                xRole   = this.visualRoles.category,
                yRole   = dataCell.role,
                trendOptions = dataCell.trend,
                trendInfo = trendOptions.info;

            this.chart._warnSingleContinuousValueRole(yRole);

            var yDimName = yRole.lastDimensionName(),
                xDimName,
                isXDiscrete = xRole.isDiscrete();
            if(!isXDiscrete) xDimName = xRole.lastDimensionName();

            var sumKeyArgs = {zeroIfNone: false},
                partData = this.chart.partData(dataCell.dataPartValue, baseData),
                // Visible data grouped by category and then series
                data = this.chart.visiblePlotData(this, dataCell.dataPartValue, {baseData: baseData}), // [ignoreNulls=true]
                dataPartAtom = this.chart._getTrendDataPartAtom(),
                dataPartDimName = dataPartAtom.dimension.name,
                // TODO: It is usually the case, but not certain, that the base axis'
                // dataCell(s) span "all" data parts.
                allCatDatas = xRole.flatten(baseData, {visible: true}).childNodes,
                qVisibleSeries = serRole && serRole.isBound()
                    ? serRole.flatten(partData, {visible: true}).children()
                    : def.query([null]); // null series

            qVisibleSeries.each(genSeriesTrend);

            function genSeriesTrend(serData1) {
                var funX = isXDiscrete
                        ? null  // means: "use *index* as X value"
                        : function(allCatData) { return allCatData.atoms[xDimName].value;},

                    funY = function(allCatData) {
                        var group = data.child(allCatData.key);
                        if(group && serData1) group = group.child(serData1.key);
                        // When null, the data point ends up being ignored
                        return group ? group.dimensions(yDimName).value(sumKeyArgs) : null;
                    },

                    options = def.create(trendOptions, {
                        rows: def.query(allCatDatas),
                        x: funX,
                        y: funY
                    }),
                    trendModel = trendInfo.model(options);

                if(trendModel) {
                    // At least one point...
                    // Sample the line on each x and create a datum for it
                    // on the 'trend' data part
                    allCatDatas.forEach(function(allCatData, index) {
                        var trendX = isXDiscrete ?
                                index :
                                allCatData.atoms[xDimName].value,
                            trendY = trendModel.sample(trendX, funY(allCatData), index);

                        if(trendY != null) {
                            var catData   = data.child(allCatData.key),
                                efCatData = catData || allCatData,
                                atoms;
                            if(serData1) {
                                var catSerData = catData && catData.child(serData1.key);
                                if(catSerData) {
                                    atoms = Object.create(catSerData._datums[0].atoms);
                                } else {
                                    // Missing data point
                                    atoms = Object.create(efCatData._datums[0].atoms);

                                    // Now copy series atoms
                                    def.copyOwn(atoms, serData1.atoms);
                                }
                            } else {
                                // Series is unbound
                                atoms = Object.create(efCatData._datums[0].atoms);
                            }

                            atoms[yDimName] = trendY;
                            atoms[dataPartDimName] = dataPartAtom;

                            newDatums.push(new cdo.TrendDatum(efCatData.owner, atoms, trendOptions));
                        }
                    });
                }
            }
        }
    },

    options: {
        Stacked: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   false
        }
    }
}));

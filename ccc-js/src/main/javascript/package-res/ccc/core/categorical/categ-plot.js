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

            // TODO: Assuming numeric data from here on,
            // which is only circumstantially true of the existing chart types.

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

            if(dataCell.plot !== this) throw def.error.operationInvalid("DataCell not of this plot.");

            var InterpType = this._getNullInterpolationOperType(dataCell.nullInterpolationMode);
            if(InterpType) {
                var partData = this.chart.partData(this.dataPartValue, baseData);
                var visibleData = this.chart.visiblePlotData(this, {baseData: baseData});// [ignoreNulls=true]
                if(visibleData.childCount() > 0) {
                    var valueDimNames = dataCell.role.getCompatibleBoundDimensionNames(visibleData);
                    valueDimNames.forEach(function(valueDimName) {
                        new InterpType(
                            baseData,
                            partData,
                            visibleData,
                            this.visualRoles.category,
                            this.visualRoles.series,
                            dataCell.role,
                            /*valRole*/valueDimName,
                            /*stretchEnds*/true) // dataCell.isStacked
                            .interpolate();
                    }, this);
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

            if(dataCell.plot !== this) throw def.error.operationInvalid("DataCell not of this plot.");

            // Visible data grouped by category and then series.
            // Already takes plot.dataPartValue into account.
            var data = this.chart.visiblePlotData(this, {baseData: baseData}); // [ignoreNulls=true]

            var yRole = dataCell.role;
            var yDimNames = yRole.getCompatibleBoundDimensionNames(data);
            if(yDimNames.length === 0) {
                return;
            }

            var seriesRole = this.visualRoles.series;
            var xRole = this.visualRoles.category;

            var trendOptions = dataCell.trend;
            var trendInfo = trendOptions.info;

            var xDimName;
            var isXDiscrete = xRole.isDiscrete();
            if(!isXDiscrete) {
                xDimName = xRole.grouping.singleDimensionName;
            }

            var sumKeyArgs = {zeroIfNone: false};
            var dataPartAtom = this.chart._getTrendDataPartAtom();
            var dataPartDimName = dataPartAtom.dimension.name;

            // TODO: It is usually the case, but not certain, that the base axis'
            // dataCell(s) span "all" data parts of baseData.
            var allCategDatas = xRole.flatten(baseData, {visible: true}).childNodes
                .filter(function(allCategData) {
                    // In continuous mode, exclude datums with an isNull category.
                    return isXDiscrete || allCategData.atoms[xDimName].value !== null;
                });

            var partData = this.chart.partData(dataCell.dataPartValue, baseData);
            var visibleSeriesDatas = seriesRole.flatten(partData, {visible: true}).children().array();

            var datumDimNames;

            // Generate a trend series for each series and bound measure.
            yDimNames.forEach(function(yDimName) {
                datumDimNames = null;

                visibleSeriesDatas.forEach(function(seriesData) {
                    // When the series role includes the measure discriminator
                    // we would go through invalid combinations and generate more trends than we should.
                    var yBoundDimName = yRole.getBoundDimensionName(seriesData, /* isOptional: */true);
                    if(yBoundDimName === null || yBoundDimName === yDimName) {
                        generateSeriesTrend(seriesData, yDimName);
                    }
                });
            });

            function generateSeriesTrend(seriesData, yDimName) {

                var funX = isXDiscrete
                        ? null  // means: "use *index* as X value"
                        : function(allCatData) { return allCatData.atoms[xDimName].value; };

                var funY = function(allCatData) {
                    var group = data.child(allCatData.key);
                    if(group) {
                        group = group.child(seriesData.key);
                    }

                    // When null, the data point ends up being ignored.
                    return group ? group.dimensions(yDimName).value(sumKeyArgs) : null;
                };

                var options = def.create(trendOptions, {
                    rows: def.query(allCategDatas),
                    x: funX,
                    y: funY
                });

                var trendModel = trendInfo.model(options);
                if(trendModel) {
                    // At least one point...
                    // Sample the line on each x and create a datum for it
                    // on the 'trend' data part.
                    allCategDatas.forEach(function(allCategData, categIndex) {

                        var trendX = isXDiscrete ?
                                categIndex :
                                allCategData.atoms[xDimName].value;

                        var trendY = trendModel.sample(trendX, funY(allCategData), categIndex);
                        if(trendY != null) {
                            var categData = data.child(allCategData.key);
                            var categDataEf = categData || allCategData;

                            var atoms;
                            var categAndSeriesData = categData && categData.child(seriesData.key);
                            if(categAndSeriesData) {
                                atoms = Object.create(categAndSeriesData.atoms);
                            } else {
                                // Missing data point
                                atoms = Object.create(categDataEf.atoms);

                                // Now copy series atoms
                                def.copyOwn(atoms, seriesData.atoms);
                            }

                            atoms[yDimName] = trendY;
                            atoms[dataPartDimName] = dataPartAtom;

                            // Exclude all extension dimensions.
                            // Do this only once, as the structure is the same for every datum.
                            if(!datumDimNames) {
                                datumDimNames = data.type.filterExtensionDimensionNames(def.keys(atoms));
                            }

                            newDatums.push(new cdo.TrendDatum(categDataEf.owner, atoms, datumDimNames, trendOptions));
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

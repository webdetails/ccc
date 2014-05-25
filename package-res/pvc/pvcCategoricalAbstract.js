/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */
def
.type('pvc.CategoricalAbstract', pvc.CartesianAbstract)
.init(function(options) {

    this.base(options);

    var parent = this.parent;
    if(parent) { this._catRole = parent._catRole; }
})
.add({
    _interpolatable: true,

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function() {
        this.base();

        this._catRole = this._addVisualRole('category', this._getCategoryRoleSpec());
    },

    _getCategoryRoleSpec: function() {
        return {
            isRequired: true,
            defaultDimension: 'category*',
            autoCreateDimension: true
        };
    },


    /** @override */
    _createVisibleData: function(baseData, ka) {
        var serGrouping  = this._serRole && this._serRole.flattenedGrouping();
        var catGrouping  = this._catRole.flattenedGrouping();
        return serGrouping 
            // <=> One multi-dimensional, two-levels data grouping
            ? baseData.groupBy(def.get(ka, 'inverted', false) 
                    ? [serGrouping, catGrouping] 
                    : [catGrouping, serGrouping], 
                    ka)
            : baseData.groupBy(catGrouping, ka);
    },
    
    /** @override */
    _interpolateDataCell: function(dataCell, baseData) {
        var InterpType = this._getNullInterpolationOperType(dataCell.nullInterpolationMode);
        if(InterpType) {
            this._warnSingleContinuousValueRole(dataCell.role);
            var partValue   = dataCell.dataPartValue;
            var partData    = this.partData(partValue, baseData);
            var visibleData = this.visibleData(partValue, {baseData: baseData});// [ignoreNulls=true]
            if(visibleData.childCount() > 0) {
                new InterpType(
                    baseData,
                    partData,
                    visibleData,
                    this._catRole,
                    this._serRole,
                    /*valRole*/dataCell.role,
                    /*stretchEnds*/true) // dataCell.isStacked
                .interpolate();
            }
        }
    },

    _getNullInterpolationOperType: function(nim) {
        switch(nim) {
            case 'linear': return pvc.data.LinearInterpolationOper;
            case 'zero':   return pvc.data.ZeroInterpolationOper;
            case 'none':   break;
            default: throw def.error.argumentInvalid('nullInterpolationMode', '' + nim);
        }
    },

    /** @override */
    _generateTrendsDataCell: function(newDatums, dataCell, baseData) {
        var serRole = this._serRole;
        var xRole   = this._catRole;
        var yRole   = dataCell.role;
        var trendOptions = dataCell.trend;
        var trendInfo = trendOptions.info;

        this._warnSingleContinuousValueRole(yRole);

        var yDimName = yRole.firstDimensionName();
        var xDimName;
        var isXDiscrete = xRole.isDiscrete();
        if(!isXDiscrete) { xDimName = xRole.firstDimensionName(); }

        var sumKeyArgs = {zeroIfNone: false}; 

        var partData = this.partData(dataCell.dataPartValue, baseData);

        // Visible data grouped by category and then series
        var data = this.visibleData(dataCell.dataPartValue, {baseData: baseData}); // [ignoreNulls=true]

        var dataPartAtom = this._getTrendDataPartAtom();
        var dataPartDimName = dataPartAtom.dimension.name;

        // TODO: It is usually the case, but not certain, that the base axis'
        // dataCell(s) span "all" data parts.
        var allCatDatas = xRole.flatten(baseData, {visible: true}).childNodes;
        
        var qVisibleSeries = serRole && serRole.isBound()
            ? serRole.flatten(partData, {visible: true}).children()
            : def.query([null]); // null series

        qVisibleSeries.each(genSeriesTrend, this);

        function genSeriesTrend(serData1) {
            var funX = isXDiscrete ?
                       null : // means: "use *index* as X value"
                       function(allCatData) { return allCatData.atoms[xDimName].value; };

            var funY = function(allCatData) {
                var group = data.child(allCatData.key);
                if(group && serData1) {
                    group = group.child(serData1.key);
                }

                // When null, the data point ends up being ignored
                return group ? group.dimensions(yDimName).value(sumKeyArgs) : null;
            };

            var options = def.create(trendOptions, {
                rows: def.query(allCatDatas),
                x: funX,
                y: funY
            });

            var trendModel = trendInfo.model(options);
            if(trendModel) {
                // At least one point...
                // Sample the line on each x and create a datum for it
                // on the 'trend' data part
                allCatDatas.forEach(function(allCatData, index) {
                    var trendX = isXDiscrete ?
                                 index :
                                 allCatData.atoms[xDimName].value;

                    var trendY = trendModel.sample(trendX, funY(allCatData), index);
                    if(trendY != null) {
                        var catData   = data.child(allCatData.key);
                        var efCatData = catData || allCatData;

                        var atoms;
                        if(serData1) {
                            var catSerData = catData &&
                                             catData.child(serData1.key);

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

                        newDatums.push(new pvc.data.TrendDatum(efCatData.owner, atoms, trendOptions));
                    }
                }, this);
            }
        }
    },

    /**
     * Obtains the extent of the specified value axis' role
     * and data part values.
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
    _getContinuousVisibleCellExtent: function(valueAxis, valueDataCell) {
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
                return this.base(valueAxis, valueDataCell);
        }

        this._warnSingleContinuousValueRole(valueRole);

        var dataPartValue = valueDataCell.dataPartValue;
        var valueDimName = valueRole.firstDimensionName();
        var data = this.visibleData(dataPartValue); // [ignoreNulls=true]
        var useAbs = valueAxis.scaleUsesAbs();

        if(valueAxis.type !== 'ortho' || !valueDataCell.isStacked) {
            return data.leafs()
                       .select(function(serGroup) {
                           var value = serGroup.dimensions(valueDimName).value();
                           return useAbs && value < 0 ? -value : value;
                        })
                       .range();
        }

        /*
         * data is grouped by category and then by series
         * So direct children of data are category groups
         */
        return data.children()
            /* Obtain the value extent of each category */
            .select(function(catGroup) {
                var range = this._getStackedCategoryValueExtent(catGroup, valueDimName, useAbs);
                if(range) { return {range: range, group: catGroup}; }
            }, this)
            .where(def.notNully)

            /* Combine the value extents of all categories */
            .reduce(function(result, rangeInfo) {
                return this._reduceStackedCategoryValueExtent(
                            result,
                            rangeInfo.range,
                            rangeInfo.group);
            }.bind(this), null);

            //        The following would not work:
            //        var max = data.children()
            //                    .select(function(catGroup){ return catGroup.dimensions(valueDimName).sum(); })
            //                    .max();
            //
            //        return max != null ? {min: 0, max: max} : null;
    },

    /**
     * Obtains the extent of a value dimension in a given category group.
     * The default implementation determines the extent by separately
     * summing negative and positive values.
     * Supports {@link #_getContinuousVisibleExtent}.
     */
    _getStackedCategoryValueExtent: function(catGroup, valueDimName, useAbs) {
        var posSum = null,
            negSum = null;

        catGroup
            .children()
            /* Sum all datum's values on the same leaf */
            .select(function(serGroup) {
                var value = serGroup.dimensions(valueDimName).value();
                return useAbs && value < 0 ? -value : value;
            })
            /* Add to positive or negative totals */
            .each(function(value) {
                // Note: +null === 0
                if(value != null) {
                    if(value >= 0) { posSum += value; }
                    else           { negSum += value; }
                }
            });

        if(posSum == null && negSum == null){ return null; }

        return {max: posSum || 0, min: negSum || 0};
    },

    /**
     * Reduce operation of category ranges, into a global range.
     *
     * The default implementation performs a range "union" operation.
     *
     * Supports {@link #_getContinuousVisibleExtent}.
     */
    _reduceStackedCategoryValueExtent: function(result, catRange, catGroup) {
        return pvc.unionExtents(result, catRange);
    },

    _coordinateSmallChartsLayout: function(scopesByType) {
        // TODO: optimize the case were
        // the title panels have a fixed size and
        // the x and y FixedMin and FixedMax are all specified...
        // Don't need to coordinate in that case.

        this.base(scopesByType);

        // Force layout and retrieve sizes of
        // * title panel
        // * y panel if column or global scope (column scope coordinates x scales, but then the other axis' size also affects the layout...)
        // * x panel if row    or global scope
        var titleSizeMax  = 0;
        var titleOrthoLen;

        var axisIds = null;
        var sizesMaxByAxisId = {}; // {id:  {axis: axisSizeMax, title: titleSizeMax} }

        // Calculate maximum sizes
        this.children.forEach(function(childChart) {

            childChart.basePanel.layout();

            var size;
            var panel = childChart.titlePanel;
            if(panel) {
                if(!titleOrthoLen) { titleOrthoLen = panel.anchorOrthoLength(); }

                size = panel[titleOrthoLen];
                if(size > titleSizeMax) { titleSizeMax = size; }
            }

            // ------

            var axesPanels = childChart.axesPanels;
            if(!axisIds) {
                axisIds =
                    def
                    .query(def.ownKeys(axesPanels))
                    .where(function(alias) { return alias === axesPanels[alias].axis.id; })
                    .select(function(id) {
                        // side effect
                        sizesMaxByAxisId[id] = {axis: 0, title: 0};
                        return id;
                    })
                    .array();
            }

            axisIds.forEach(function(id) {
                var axisPanel = axesPanels[id];
                var sizes = sizesMaxByAxisId[id];

                var ol = axisPanel.axis.orientation === 'x' ? 'height' : 'width';
                size = axisPanel[ol];
                if(size > sizes.axis) { sizes.axis = size; }

                var titlePanel = axisPanel.titlePanel;
                if(titlePanel) {
                    size = titlePanel[ol];
                    if(size > sizes.title){
                        sizes.title = size;
                    }
                }
            });
        }, this);

        // Apply the maximum sizes to the corresponding panels
        this.children.forEach(function(childChart) {

            if(titleSizeMax > 0) {
                var panel  = childChart.titlePanel;
                panel.size = panel.size.clone().set(titleOrthoLen, titleSizeMax);
            }

            // ------

            var axesPanels = childChart.axesPanels;
            axisIds.forEach(function(id) {
                var axisPanel = axesPanels[id];
                var sizes = sizesMaxByAxisId[id];

                var ol = axisPanel.axis.orientation === 'x' ? 'height' : 'width';
                axisPanel.size = axisPanel.size.clone().set(ol, sizes.axis);

                var titlePanel = axisPanel.titlePanel;
                if(titlePanel) {
                    titlePanel.size = titlePanel.size.clone().set(ol, sizes.title);
                }
            });

            // Invalidate their previous layout
            childChart.basePanel.invalidateLayout();
        }, this);
    }
});

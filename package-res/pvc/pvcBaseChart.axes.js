/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_CartesianAxis:true, pvc_colorScale:true, pvc_colorScales:true */

pvc.BaseChart
.add({
    /**
     * An array of colors, represented as names, codes or {@link pv.Color} objects
     * that is associated to each distinct value of the "color" visual role.
     *
     * <p>
     * The legend panel associates each distinct dimension value to a color of {@link #colors},
     * following the dimension's natural order.
     * </p>
     * <p>
     * The default dimension is the 'series' dimension.
     * </p>
     *
     * @type (string|pv.Color)[]
     */
    colors: null,

    /**
     * A map of {@link pvc.visual.Axis} by axis id.
     */
    axes: null,
    axesList: null,
    axesByType: null,

    _axisClassByType: {
        'color': pvc.visual.ColorAxis,
        'size':  pvc.visual.SizeAxis,
        'base':  pvc_CartesianAxis,
        'ortho': pvc_CartesianAxis
    },

    // 1 = root, 2 = leaf, 1|2=3 = everywhere
    _axisCreateChartLevel: {
        'color': 1,
        'size':  2,
        'base':  3,
        'ortho': 3
    },

    _axisSetScaleChartLevel: {
        'color': 1,
        'size':  2,
        'base':  2,
        'ortho': 2
    },

    _axisCreationOrder: [
        'color',
        'size',
        'base',
        'ortho'
    ],

    _axisCreateIfUnbound: {

    },

    _chartLevel: function() {
        // 1 = root, 2 = leaf, 1 | 2 = 3 = everywhere
        var level = 0;

        // Root?
        if(!this.parent) { level |= 1; }

        // Leaf?
        if(this.parent || !this.visualRoles.multiChart.isBound()) { level |= 2; }

        return level;
    },

    _initAxes: function(hasMultiRole) {
        // TODO: almost sure that some of the below loops can be merged

        this.axes = {};
        this.axesList = [];
        this.axesByType = {};

        // Clear any previous global color scales
        delete this._rolesColorScale;

        // type -> index -> [datacell array]
        // Used by sub classes.
        var dataCellsByAxisTypeThenIndex;
        if(!this.parent) {
            dataCellsByAxisTypeThenIndex = {};

            this.plotList.forEach(function(plot){
                this._collectPlotAxesDataCells(plot, dataCellsByAxisTypeThenIndex);
            }, this);

            this._dataCellsByAxisTypeThenIndex = dataCellsByAxisTypeThenIndex;
        } else {
            dataCellsByAxisTypeThenIndex = this.root._dataCellsByAxisTypeThenIndex;
        }

        /* NOTE: Cartesian axes are created even when hasMultiRole && !parent
         * because it is needed to read axis options in the root chart.
         * Also, binding occurs so that it is possible to know its scale type.
         * Yet, their scales are not setup at the root level.
         */

        // 1 = root, 2 = leaf, 1 | 2 = 3 = everywhere
        var chartLevel = this._chartLevel();

        this._axisCreationOrder.forEach(function(type) {
            // Create?
            if((this._axisCreateChartLevel[type] & chartLevel) !== 0) {
                var AxisClass;
                var dataCellsByAxisIndex = dataCellsByAxisTypeThenIndex[type];
                if(dataCellsByAxisIndex) {

                    AxisClass = this._axisClassByType[type];
                    if(AxisClass) {
                        dataCellsByAxisIndex.forEach(function(dataCells, axisIndex){

                            new AxisClass(this, type, axisIndex);

                        }, this);
                    }
                } else if(this._axisCreateIfUnbound[type]) {
                    AxisClass = this._axisClassByType[type];
                    if(AxisClass) {
                        new AxisClass(this, type, 0);
                    }
                }
            }
        }, this);

        if(this.parent) {
            // Copy axes that exist in root and not here
            this.root.axesList.forEach(function(axis){
                if(!def.hasOwn(this.axes, axis.id)) {
                    this._addAxis(axis);
                }
            }, this);
        }

        // Bind
        // Bind all axes with dataCells registered in dataCellsByAxisTypeThenIndex
        // and which were created at this level
        def.eachOwn(
            dataCellsByAxisTypeThenIndex,
            function(dataCellsByAxisIndex, type) {
                // Was created at this level?
                if((this._axisCreateChartLevel[type] & chartLevel)) {
                    dataCellsByAxisIndex.forEach(function(dataCells, index) {
                        var axis = this.axes[pvc.buildIndexedId(type, index)];
                        if(!axis.isBound()) { axis.bind(dataCells); }
                    }, this);
                }
            },
            this);
    },

    /**
     * Adds an axis to the chart.
     *
     * @param {pvc.visual.Axis} axis The axis.
     *
     * @type pvc.visual.Axis
     */
    _addAxis: function(axis) {
        this.axes[axis.id] = axis;
        if(axis.chart === this) { axis.axisIndex = this.axesList.length; }

        this.axesList.push(axis);

        var typeAxes  = def.array.lazy(this.axesByType, axis.type);
        var typeIndex = typeAxes.count || 0;
        axis.typeIndex = typeIndex;
        typeAxes[axis.index] = axis;
        if(!typeIndex) { typeAxes.first = axis; }
        typeAxes.count = typeIndex + 1;

        // For child charts, that simply copy color axes.
        if(axis.type === 'color' && axis.isBound()) {
            this._onColorAxisScaleSet(axis);
        }

        return this;
    },

    _getAxis: function(type, index) {
        var typeAxes = this.axesByType[type];
        if(typeAxes && index != null && (+index >= 0)) {
            return typeAxes[index];
        }
    },

    _setAxesScales: function(chartLevel) {
        this.axesList.forEach(function(axis) {
            if((this._axisSetScaleChartLevel[axis.type] & chartLevel) &&
               axis.isBound()) {
                this._setAxisScale(axis, chartLevel);
            }
        }, this);
    },

    /**
     * Creates and sets the scale for a given axis.
     * Only the scale's domain is set.
     *
     * @param {pvc.visual.Axis} axis The axis.
     * @param {number} chartLevel The chart level.
     */
    _setAxisScale: function(axis, chartLevel) {
        this._setAxisScaleByScaleType(axis, chartLevel);
    },

    _setAxisScaleByScaleType: function(axis, chartLevel) {
        switch(axis.scaleType) {
            case 'discrete':   this._setDiscreteAxisScale  (axis, chartLevel); break;
            case 'numeric':    this._setNumericAxisScale   (axis, chartLevel); break;
            case 'timeSeries': this._setTimeSeriesAxisScale(axis, chartLevel); break;
            default: throw def.error("Unknown axis scale type.");
        }
    },

    _describeScale: function(axis, scale) {
        if(scale.isNull && pvc.debug >= 3) {
            this._log(def.format("{0} scale for axis '{1}'- no data", [axis.scaleType, axis.id]));
        }
    },

    /**
     * Creates a discrete scale for a given axis.
     * @param {pvc.visual.Axis} axis The axis.
     * @virtual
     */
    _setDiscreteAxisScale: function(axis) {
        if(axis.type === 'color') {
            this._setDiscreteColorAxisScale(axis);
            return;
        }

        /* DOMAIN */
        var values = axis.domainValues();
        var scale = new pv.Scale.ordinal();
        if(!values.length) {
            scale.isNull = true;
        } else {
            scale.domain(values);
        }

        this._describeScale(axis, scale);

        axis.setScale(scale);
    },

    /**
     * Creates a continuous time-series scale for a given axis.
     * @param {pvc.visual.Axis} axis The axis.
     * @virtual
     */
    _setTimeSeriesAxisScale: function(axis) {
        /* DOMAIN */
        var extent = this._getContinuousVisibleExtentConstrained(axis); // null when no data...

        var scale = new pv.Scale.linear();
        if(!extent){
            scale.isNull = true;
        } else {
            var dMin = extent.min;
            var dMax = extent.max;
            var epsi = 1;

            var normalize = function() {
                var d = dMax - dMin;

                // very close to zero delta (<0 or >0)
                // is turned into 0 delta
                if(d && Math.abs(d) < epsi) {
                    dMax = dMin = new Date(Math.round((dMin + dMax) / 2));
                    d = 0;
                }

                // zero delta?
                if(!d) {
                    // Adjust *all* that are not locked, or, if all locked, max
                    // dMax = new Date(dMax.getTime() + pvc.time.intervals.h); // 1 h

                    if(!extent.minLocked)
                        dMin = new Date(dMin.getTime() - pvc.time.intervals.h);

                    // If both are locked, ignore max lock!
                    if(!extent.maxLocked || extent.minLocked)
                        dMax = new Date(dMax.getTime() + pvc.time.intervals.h);

                } else if(d < 0) {
                    // negative delta, bigger than epsi

                    // adjust max if it is not locked, or
                    // adjust min if it is not locked, or
                    // adjust max (all locked)

                    if(!extent.maxLocked || extent.minLocked)
                        dMax = new Date(dMin.getTime() + pvc.time.intervals.h);
                    else /*if(!extent.minLocked)*/
                        dMin = new Date(dMax.getTime() - pvc.time.intervals.h);
                }
            };

            normalize();

            scale.domain(dMin, dMax);
            scale.minLocked = extent.minLocked;
            scale.maxLocked = extent.maxLocked;
        }

        this._describeScale(axis, scale);
        axis.setScale(scale);
    },

    /**
     * Creates a continuous numeric scale for a given axis.
     *
     * @param {pvc.visual.Axis} axis The axis.
     * @virtual
     */
    _setNumericAxisScale: function(axis) {
        if(axis.type === 'color') {
            this._setNumericColorAxisScale(axis);
            return;
        }

        /* DOMAIN */
        var extent = this._getContinuousVisibleExtentConstrained(axis);

        var scale = new pv.Scale.linear();
        if(!extent) {
            scale.isNull = true;
        } else {
            var dMin = extent.min;
            var dMax = extent.max;
            var epsi = 1e-10;

            var normalize = function() {
                var d = dMax - dMin;

                // very close to zero delta (<0 or >0)
                // is turned into 0 delta
                if(d && Math.abs(d) <= epsi) {
                    dMin = (dMin + dMax) / 2;
                    dMin = dMax = +dMin.toFixed(10);
                    d = 0;
                }

                // zero delta?
                if(!d) {
                    // Adjust *all* that are not locked, or, if all locked, max
                    if(!extent.minLocked)
                        dMin = Math.abs(dMin) > epsi ? (dMin * 0.99) : -0.1;

                    // If both are locked, ignore max lock!
                    if(!extent.maxLocked || extent.minLocked)
                        dMax = Math.abs(dMax) > epsi ? (dMax * 1.01) : +0.1;

                } else if(d < 0) {
                    // negative delta, bigger than epsi

                    // adjust max if it is not locked, or
                    // adjust min if it is not locked, or
                    // adjust max (all locked)

                    if(!extent.maxLocked || extent.minLocked)
                        dMax = Math.abs(dMin) > epsi ? dMin * 1.01 : +0.1;
                    else /*if(!extent.minLocked)*/
                        dMin = Math.abs(dMax) > epsi ? dMax * 0.99 : -0.1;
                }
            };

            normalize();

            var originIsZero = axis.option.isDefined('OriginIsZero') &&
                               axis.option('OriginIsZero');
            if(originIsZero) {
                if(dMin === 0) {
                    extent.minLocked = true;
                } else if(dMax === 0) {
                    extent.maxLocked = true;
                } else if((dMin * dMax) > 0) {
                    /* If both negative or both positive
                     * the scale does not contain the number 0.
                     */
                    if(dMin > 0) {
                        if(!extent.minLocked) {
                            extent.minLocked = true;
                            dMin = 0;
                        }
                    } else {
                        if(!extent.maxLocked) {
                            extent.maxLocked = true;
                            dMax = 0;
                        }
                    }

                    normalize();
                }
            }

            scale.domain(dMin, dMax);
            scale.minLocked = extent.minLocked;
            scale.maxLocked = extent.maxLocked;
        }

        this._describeScale(axis, scale);
        axis.setScale(scale);
    },

    _warnSingleContinuousValueRole: function(valueRole){
        if(!valueRole.grouping.isSingleDimension)
            this._warn("A linear scale can only be obtained for a single dimension role.");

        if(valueRole.grouping.isDiscrete())
            this._warn(def.format("The single dimension of role '{0}' should be continuous.", [valueRole.name]));
    },

    /**
     * @virtual
     */
    _getContinuousVisibleExtentConstrained: function(axis, min, max) {
        var dim;
        var getDim = function() {
            return dim ||
                   (dim = this.data.owner.dimensions(axis.role.grouping.firstDimensionName()));
        };

        var minLocked = false;
        var maxLocked = false;

        // TODO: NOTE: there's the possibility that a conversion error occurs
        // and that a non-null FixedMin/Max option value is here converted into null.
        // In this case, although the min/max won't be considered here,
        // the addition of clipping/overflow logic is done anyway,
        // cause it only tests for the existence of a non-null, pre-parsed,
        // value of these options.
        if(min == null && axis.option.isDefined('FixedMin')) {
            min = axis.option('FixedMin');
            // may return null when an invalid non-null value is supplied.
            if(min != null) min = getDim.call(this).read(min);
            minLocked = (min != null);
            // Dereference atom
            if(minLocked) {
                min = min.value;
                if(min < 0 && axis.scaleUsesAbs()) { min = -min; }
            }
        }

        if(max == null && axis.option.isDefined('FixedMax')) {
            max = axis.option('FixedMax');
            // may return null when an invalid non-null value is supplied.
            if(max != null) max = getDim.call(this).read(max);
            maxLocked = (max != null);
            // Dereference atom
            if(maxLocked) {
                max = max.value;
                if(max < 0 && axis.scaleUsesAbs()) { max = -max; }
            }
        }

        if(min == null || max == null) {
            var baseExtent = this._getContinuousVisibleExtent(axis); // null when no data
            if(!baseExtent) { return null; }
            if(min == null) { min = baseExtent.min; }
            if(max == null) { max = baseExtent.max; }
        }

        return {min: min, max: max, minLocked: minLocked, maxLocked: maxLocked};
    },

    /**
     * Gets the extent of the values of the specified axis' roles
     * over all datums of the visible data.
     *
     * @param {pvc.visual.Axis} valueAxis The value axis.
     * @type object
     *
     * @protected
     * @virtual
     */
    _getContinuousVisibleExtent: function(valueAxis) {

        var dataCells = valueAxis.dataCells;
        if(dataCells.length === 1) {
            // Most common case. Faster this way.
            return this._getContinuousVisibleCellExtent(valueAxis, dataCells[0]);
        }

        // This implementation takes the union of
        // the extents of each data cell.
        // Even when a data cell has multiple data parts,
        // it is evaluated as a whole.
        return def
            .query(dataCells)
            .select(function(dataCell) {
                return this._getContinuousVisibleCellExtent(valueAxis, dataCell);
            }, this)
            .reduce(pvc.unionExtents, null);
    },

    /**
     * Gets the extent of the values of the specified role
     * over all datums of the visible data.
     *
     * @param {pvc.visual.Axis} valueAxis The value axis.
     * @param {pvc.visual.Role} valueDataCell The data cell.
     * @type object
     *
     * @protected
     * @virtual
     */
    _getContinuousVisibleCellExtent: function(valueAxis, valueDataCell) {
        var valueRole = valueDataCell.role;

        this._warnSingleContinuousValueRole(valueRole);

        if(valueRole.name === 'series') {
            /* not supported/implemented? */
            throw def.error.notImplemented();
        }

        var sumNorm = valueAxis.scaleSumNormalized();
        var data    = this.visibleData(valueDataCell.dataPartValue); // [ignoreNulls=true]
        var dimName = valueRole.firstDimensionName();
        if(sumNorm) {
            var sum = data.dimensionsSumAbs(dimName);
            if(sum) { return {min: 0, max: sum}; }
        } else {
            var useAbs = valueAxis.scaleUsesAbs();
            var extent = data.dimensions(dimName).extent({abs: useAbs});
            if(extent) {
                // TODO: aren't these Math.abs repeating work??
                var minValue = extent.min.value;
                var maxValue = extent.max.value;
                return {
                    min: (useAbs ? Math.abs(minValue) : minValue),
                    max: (useAbs ? Math.abs(maxValue) : maxValue)
                };
            }
        }
    },

    // -------------

    _setDiscreteColorAxisScale: function(axis) {
        var domainValues = axis.domainValues();

        // Call the transformed color scheme with the domain values
        //  to obtain a final scale object.
        var scale = axis.scheme()(domainValues);

        this._describeScale(axis, scale);
        axis.setScale(scale, /*noWrap*/true);
        this._onColorAxisScaleSet(axis);
    },

    _setNumericColorAxisScale: function(axis) {
        // TODO: how to handle more?
        if(axis.dataCells.length !== 1)
            throw def.error("Can't handle multiple continuous datacells in color axis.");

        // Single Continuous
        // -> Global Scope (actually as only the root chart sets the scale, it is implied)
        // -> Visible only
        // -> Any isNull
        this._warnSingleContinuousValueRole(axis.role);

        var visibleDomainData = this.visibleData(axis.dataCell.dataPartValue); // [ignoreNulls=true]
        var normByCateg = axis.option('NormByCategory');
        var scaleOptions = {
            type:        axis.option('ScaleType'),
            colors:      axis.option('Colors')().range(), // obtain the underlying colors array
            colorDomain: axis.option('Domain'),
            colorMin:    axis.option('Min'),
            colorMax:    axis.option('Max'),
            colorMissing:axis.option('Missing'), // TODO: already handled by the axis wrapping
            data:        visibleDomainData,
            colorDimension: axis.role.firstDimensionName(),
            normPerBaseCategory: normByCateg
        };

        if(!normByCateg) {
            var scale = pvc_colorScale(scaleOptions);
            this._describeScale(axis, scale);
            axis.setScale(scale);
        } else {
            axis.scalesByCateg = pvc_colorScales(scaleOptions);
            // no single scale...
        }
        this._onColorAxisScaleSet(axis);
    },

    _onColorAxisScaleSet: function(axis) {
        switch(axis.index) {
            case 0:
                this.colors = axis.scheme();
                break;

            case 1:
                if(this._allowV1SecondAxis) {
                    this.secondAxisColor = axis.scheme();
                }
                break;
        }
    },

    /**
     * Obtains an unified color scale,
     * of all the color axes with specified `Colors` option.
     *
     * This color scale is used to satisfy axes
     * for which `Colors' was not specified.
     *
     * Each color-role has a different unified color-scale,
     * so that the color keys are of the same types.
     */
    _getRoleColorScale: function(roleName){
        return def.lazy(
            def.lazy(this, '_rolesColorScale'),
            roleName,
            this._createRoleColorScale, this);
    },

    _createRoleColorScale: function(roleName) {
        var firstScale, scale;
        var valueToColorMap = {};

        this.axesByType.color.forEach(function(axis){
            // Only use color axes with specified Colors
            var axisRole = axis.role;
            var isRoleCompatible =
                (axisRole.name === roleName) ||
                (axisRole.sourceRole && axisRole.sourceRole.name === roleName);

            if(isRoleCompatible &&
               axis.scale &&
               (axis.index === 0 ||
               axis.option.isSpecified('Colors') ||
               axis.option.isSpecified('Map'))){

                scale = axis.scale;
                if(!firstScale){ firstScale = scale; }

                axis.domainValues().forEach(addDomainValue);
            }
        }, this);

        function addDomainValue(value){
            // First color wins
            var key = '' + value;
            if(!def.hasOwnProp.call(valueToColorMap, key)){
                valueToColorMap[key] = scale(value);
            }
        }

        if(!firstScale){
            return pvc.createColorScheme()();
        }

        scale = function(value){
            var key = '' + value;
            if(def.hasOwnProp.call(valueToColorMap, key)){
                return valueToColorMap[key];
            }

            // creates a new entry...
            var color = firstScale(value);
            valueToColorMap[key] = color;
            return color;
        };

        def.copy(scale, firstScale); // TODO: domain() and range() should be overriden...

        return scale;
    },

    _onLaidOut: function(){
        // NOOP
    }
});


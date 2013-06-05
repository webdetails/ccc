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
    _axisCreateWhere: {
        'color': 1,
        'size':  2,
        'base':  3,
        'ortho': 3
    },

    _axisCreationOrder: [
        'color',
        'size',
        'base',
        'ortho'
    ],

    _axisCreateIfUnbound: {

    },

    _initAxes: function(hasMultiRole){
        this.axes = {};
        this.axesList = [];
        this.axesByType = {};

        // Clear any previous global color scales
        delete this._rolesColorScale;

        // type -> index -> [datacell array]
        // Used by sub classes.
        var dataCellsByAxisTypeThenIndex;
        if(!this.parent){
            dataCellsByAxisTypeThenIndex = {};

            this.plotList.forEach(function(plot){
                this._collectPlotAxesDataCells(plot, dataCellsByAxisTypeThenIndex);
            }, this);

            this._fixTrendsLabel(dataCellsByAxisTypeThenIndex);
        } else {
            dataCellsByAxisTypeThenIndex = this.root._dataCellsByAxisTypeThenIndex;
        }

        // Used later in _bindAxes as well.
        this._dataCellsByAxisTypeThenIndex = dataCellsByAxisTypeThenIndex;

        /* NOTE: Cartesian axes are created even when hasMultiRole && !parent
         * because it is needed to read axis options in the root chart.
         * Also binding occurs to be able to know its scale type.
         * Yet, their scales are not setup at the root level.
         */

        // 1 = root, 2 = leaf, 1 | 2 = 3 = everywhere
        var here = 0;
        // Root?
        if(!this.parent){
            here |= 1;
        }
        // Leaf?
        if(this.parent || !hasMultiRole){
            here |= 2;
        }

        // Used later in _bindAxes as well.
        this._axisCreateHere = here;

        this._axisCreationOrder.forEach(function(type){
            // Create **here** ?
            if((this._axisCreateWhere[type] & here) !== 0){
                var AxisClass;
                var dataCellsByAxisIndex = dataCellsByAxisTypeThenIndex[type];
                if(dataCellsByAxisIndex){

                    AxisClass = this._axisClassByType[type];
                    if(AxisClass){
                        dataCellsByAxisIndex.forEach(function(dataCells, axisIndex){

                            new AxisClass(this, type, axisIndex);

                        }, this);
                    }
                } else if(this._axisCreateIfUnbound[type]){
                    AxisClass = this._axisClassByType[type];
                    if(AxisClass){
                        new AxisClass(this, type, 0);
                    }
                }
            }
        }, this);

        if(this.parent){
            // Copy axes that exist in root and not here
            this.root.axesList.forEach(function(axis){
                if(!def.hasOwn(this.axes, axis.id)){
                    this._addAxis(axis);
                }
            }, this);
        }
    },

    _fixTrendsLabel: function(dataCellsByAxisTypeThenIndex){
        // Pre-register the label of the first trend type
        // in the "trend" data part atom, cause in multi-charts
        // an empty label would be registered first...
        // We end up using this to
        // allow to specify an alternate label for the trend.
        var dataPartDimName = this._getDataPartDimName();
        if(dataPartDimName){
            // Find the first data cell with a trend type
            var firstDataCell = def
                .query(def.ownKeys(dataCellsByAxisTypeThenIndex))
                .selectMany(function(axisType){
                    return dataCellsByAxisTypeThenIndex[axisType];
                })
                .selectMany()
                .first (function(dataCell){ return !!dataCell.trend; })
                ;

            if(firstDataCell){
                var trendInfo = pvc.trends.get(firstDataCell.trend.type);
                var dataPartAtom = trendInfo.dataPartAtom;
                var trendLabel = firstDataCell.trend.label;
                if(trendLabel === undefined){
                    trendLabel = dataPartAtom.f;
                }

                this._firstTrendAtomProto = {
                    v: dataPartAtom.v,
                    f: trendLabel
                };
            } else {
                delete this._firstTrendAtomProto;
            }
        }
    },

    /**
     * Adds an axis to the chart.
     *
     * @param {pvc.visual.Axis} axis The axis.
     *
     * @return {pvc.visual.Axis}
     */
    _addAxis: function(axis){

        this.axes[axis.id] = axis;
        if(axis.chart === this){
            axis.axisIndex = this.axesList.length;
        }

        this.axesList.push(axis);

        var typeAxes  = def.array.lazy(this.axesByType, axis.type);
        var typeIndex = typeAxes.count || 0;
        axis.typeIndex = typeIndex;
        typeAxes[axis.index] = axis;
        if(!typeIndex){
            typeAxes.first = axis;
        }
        typeAxes.count = typeIndex + 1;

        // For child charts, that simply copy color axes
        if(axis.type === 'color' && axis.isBound()){
            this._onColorAxisScaleSet(axis);
        }

        return this;
    },

    _getAxis: function(type, index){
        var typeAxes = this.axesByType[type];
        if(typeAxes && index != null && (+index >= 0)){
            return typeAxes[index];
        }
    },

    _bindAxes: function(/*hasMultiRole*/){
        // Bind all axes with dataCells registered in #_dataCellsByAxisTypeThenIndex
        // and which were created **here**
        var here = this._axisCreateHere;

        def.eachOwn(
            this._dataCellsByAxisTypeThenIndex,
            function(dataCellsByAxisIndex, type) {
                // Should create **here** ?
                if((this._axisCreateWhere[type] & here)) {
                    dataCellsByAxisIndex.forEach(function(dataCells, index) {
                        var axis = this.axes[pvc_buildIndexedId(type, index)];
                        if(!axis.isBound()) { axis.bind(dataCells); }
                    }, this);
                }
            },
            this);
    },

    _setAxesScales: function(/*isMulti*/) {
        if(!this.parent) {
            var colorAxes = this.axesByType.color;
            if(colorAxes) {
                colorAxes.forEach(function(axis) {
                    if(axis.isBound()) {
                        this._createColorAxisScale(axis);
                        this._onColorAxisScaleSet (axis);
                    }
                }, this);
            }
        }
    },

    /**
     * Creates a scale for a given axis, with domain applied, but no range yet.
     * Assigns the scale to the axis.
     *
     * @param {pvc.visual.Axis} axis The axis.
     * @return {pv.Scale}
     */
    _createAxisScale: function(axis) {
        var scale = this._createScaleByAxis(axis);
        if(scale.isNull && pvc.debug >= 3){
            this._log(def.format("{0} scale for axis '{1}'- no data", [axis.scaleType, axis.id]));
        }

        return axis.setScale(scale).scale;
    },

    /**
     * Creates a scale for a given axis.
     * Only the scale's domain is set.
     *
     * @param {pvc.visual.Axis} axis The axis.
     * @return {pv.Scale}
     */
    _createScaleByAxis: function(axis){
        var createScale = this['_create' + def.firstUpperCase(axis.scaleType) + 'ScaleByAxis'];

        return createScale.call(this, axis);
    },

    /**
     * Creates a discrete scale for a given axis.
     *
     * @param {pvc.visual.Axis} axis The axis.
     * *virtual*
     * @return {pv.Scale}
     */
    _createDiscreteScaleByAxis: function(axis){
        /* DOMAIN */

        // With composite axis, only 'singleLevel' flattening works well
        var dataPartValues =
            axis.
            dataCells.
            map(function(dataCell){ return dataCell.dataPartValue; });

        var baseData = this.visibleData(dataPartValues, {ignoreNulls: false});
        var data = baseData && axis.role.flatten(baseData);

        var scale = new pv.Scale.ordinal();
        if(!data || !data.count()){
            scale.isNull = true;
        } else {
            var values = data.children()
                             .select(function(child){ return def.nullyTo(child.value, ""); })
                             .array();

            scale.domain(values);
        }

        return scale;
    },

    /**
     * Creates a continuous time-series scale for a given axis.
     *
     * @param {pvc.visual.Axis} axis The axis.
     * *virtual*
     * @return {pv.Scale}
     */
    _createTimeSeriesScaleByAxis: function(axis){
        /* DOMAIN */
        var extent = this._getContinuousVisibleExtent(axis); // null when no data...

        var scale = new pv.Scale.linear();
        if(!extent){
            scale.isNull = true;
        } else {
            var dMin = extent.min;
            var dMax = extent.max;

            if((dMax - dMin) === 0) {
                dMax = new Date(dMax.getTime() + 3600000); // 1 h
            }

            scale.domain(dMin, dMax);
            scale.minLocked = extent.minLocked;
            scale.maxLocked = extent.maxLocked;
        }

        return scale;
    },

    /**
     * Creates a continuous numeric scale for a given axis.
     *
     * @param {pvc.visual.Axis} axis The axis.
     * *virtual*
     * @return {pv.Scale}
     */
    _createNumericScaleByAxis: function(axis) {
        /* DOMAIN */
        var extent = this._getContinuousVisibleExtentConstrained(axis);

        var scale = new pv.Scale.linear();
        if(!extent) {
            scale.isNull = true;
        } else {
            var tmp;
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
                    if(!extent.minLocked) {
                        dMin = Math.abs(dMin) > epsi ? (dMin * 0.99) : -0.1;
                    }

                    // If both are locked, ignore max lock!
                    if(!extent.maxLocked || extent.minLocked) {
                        dMax = Math.abs(dMax) > epsi ? (dMax * 1.01) : +0.1;
                    }
                } else if(d < 0) {
                    // negative delta, bigger than epsi

                    // adjust max if it is not locked, or
                    // adjust min if it is not locked, or
                    // adjust max (all locked)

                    if(!extent.maxLocked || extent.minLocked) {
                        dMax = Math.abs(dMin) > epsi ? dMin * 1.01 : +0.1;
                    } else /*if(!extent.minLocked)*/{
                        dMin = Math.abs(dMax) > epsi ? dMax * 0.99 : -0.1;
                    }
                }
            };

            normalize();

            var originIsZero = axis.option('OriginIsZero');
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
                }
            }

            normalize();

            scale.domain(dMin, dMax);
            scale.minLocked = extent.minLocked;
            scale.maxLocked = extent.maxLocked;
        }

        return scale;
    },

    _warnSingleContinuousValueRole: function(valueRole){
        if(!valueRole.grouping.isSingleDimension) {
            this._warn("A linear scale can only be obtained for a single dimension role.");
        }

        if(valueRole.grouping.isDiscrete()) {
            this._warn(def.format("The single dimension of role '{0}' should be continuous.", [valueRole.name]));
        }
    },

    /**
     * *virtual*
     */
    _getContinuousVisibleExtentConstrained: function(axis, min, max){
        var minLocked = false;
        var maxLocked = false;

        if(min == null) {
            min = axis.option('FixedMin');
            minLocked = (min != null);
        }

        if(max == null) {
            max = axis.option('FixedMax');
            maxLocked = (max != null);
        }

        if(min == null || max == null) {
            var baseExtent = this._getContinuousVisibleExtent(axis); // null when no data
            if(!baseExtent){
                return null;
            }

            if(min == null){
                min = baseExtent.min;
            }

            if(max == null){
                max = baseExtent.max;
            }
        }

        return {min: min, max: max, minLocked: minLocked, maxLocked: maxLocked};
    },

    /**
     * Gets the extent of the values of the specified axis' roles
     * over all datums of the visible data.
     *
     * @param {pvc.visual.Axis} valueAxis The value axis.
     * @return {object}
     *
     * @protected
     * *virtual*
     */
    _getContinuousVisibleExtent: function(valueAxis){

        var dataCells = valueAxis.dataCells;
        if(dataCells.length === 1){
            // Most common case is faster
            return this._getContinuousVisibleCellExtent(valueAxis, dataCells[0]);
        }

        // This implementation takes the union of
        // the extents of each data cell.
        // Even when a data cell has multiple data parts,
        // it is evaluated as a whole.

        return def
            .query(dataCells)
            .select(function(dataCell){
                return this._getContinuousVisibleCellExtent(valueAxis, dataCell);
            }, this)
            .reduce(pvc_unionExtents, null);
    },

    /**
     * Gets the extent of the values of the specified role
     * over all datums of the visible data.
     *
     * @param {pvc.visual.Axis} valueAxis The value axis.
     * @param {pvc.visual.Role} valueDataCell The data cell.
     * @return {object}
     *
     * @protected
     * *virtual*
     */
    _getContinuousVisibleCellExtent: function(valueAxis, valueDataCell){
        var valueRole = valueDataCell.role;

        this._warnSingleContinuousValueRole(valueRole);

        if(valueRole.name === 'series') {
            /* not supported/implemented? */
            throw def.error.notImplemented();
        }

        var useAbs = valueAxis.scaleUsesAbs();
        var data  = this.visibleData(valueDataCell.dataPartValue); // [ignoreNulls=true]
        var extent = data && data
            .dimensions(valueRole.firstDimensionName())
            .extent({ abs: useAbs });

        if(extent){
            var minValue = extent.min.value;
            var maxValue = extent.max.value;
            return {
                min: (useAbs ? Math.abs(minValue) : minValue),
                max: (useAbs ? Math.abs(maxValue) : maxValue)
            };
        }
    },

    // -------------

    _createColorAxisScale: function(axis){
        var setScaleArgs;
        var dataCells = axis.dataCells;
        if(dataCells) {
            var me = this;
            if(axis.scaleType === 'discrete') {
                setScaleArgs = this._createDiscreteColorAxisScale(axis);
            } else {
                setScaleArgs = this._createContinuousColorAxisScale(axis); // may return == null
            }
        }

        return axis.setScale.apply(axis, setScaleArgs);
    },

    _createDiscreteColorAxisScale: function(axis) {
        // Discrete
        // -> Local Scope
        // -> Visible or Not
        var domainValues =
            def
            .query(axis.dataCells)
            .selectMany(function(dataCell) {
                // TODO: this does not work on trend datapart data
                // when in multicharts. DomainItemDatas are not yet created.
                return dataCell.domainItemValues();
            })
            .array();

        axis.domainValues = domainValues;

        // Call the transformed color scheme with the domain values
        //  to obtain a final scale object
        return [axis.scheme()(domainValues), /*noWrap*/ true];
    },

    _createContinuousColorAxisScale: function(axis) {
        if(axis.dataCells.length === 1){ // TODO: how to handle more?
            // Single Continuous
            // -> Global Scope
            // -> Visible only
            this._warnSingleContinuousValueRole(axis.role);

            var visibleDomainData = this.root.visibleData(axis.dataCell.dataPartValue); // [ignoreNulls=true]
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

            if(!normByCateg){
                return [pvc_colorScale(scaleOptions)];
            }

            axis.scalesByCateg = pvc_colorScales(scaleOptions);
            // no single scale...
        }

        return [];
    },

    _onColorAxisScaleSet: function(axis){
        switch(axis.index){
            case 0:
                this.colors = axis.scheme();
                break;

            case 1:
                if(this._allowV1SecondAxis){
                    this.secondAxisColor = axis.scheme();
                }
                break;
        }
    },

    /**
     * Obtains an unified color scale,
     * of all the color axes with specified colors.
     *
     * This color scale is used to satisfy axes
     * with non-specified colors.
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

    _createRoleColorScale: function(roleName){
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

                axis.domainValues.forEach(addDomainValue);
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


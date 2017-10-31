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
        'size':  pvc.visual.SizeAxis
    },

    // 1 = root, 2 = leaf, 1|2=3 = everywhere
    _axisCreateChartLevel: {
        'color': 1,
        'size':  2,
        'base':  3, // See _initAxes for an explanation.
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
        if(!this.parent) level |= 1; // Root
        if(this.parent || !this.visualRoles.multiChart.isBound()) level |= 2; // Leaf
        return level;
    },

    _initAxes: function() {

        // Get axis state
        // The state is to be kept between render calls
        var axesState,
            oldByType = this.axesByType;

        if(this.axes) {
            axesState = {};
            this.axesList.forEach(function(axis) {
                axesState[axis.id] = axis.getState();
            });
        }

        var getAxisState = function(type, axisIndex){
            if(oldByType) {
                var axes = oldByType[type];
                if(axes) {
                    var axisId = axes[axisIndex].id,
                        state  = axesState ? axesState[axisId] : undefined;

                    return state;
                }
            }
        };

        // ----
        // Filled by _addAxis
        this.axes = {};
        this.axesList = [];
        this.axesByType = {};

        // Clear any previous global color scales
        delete this._rolesColorScale;

        // ATTENTION: requires visual roles' binding to have been done before!

        // Get bound dataCells.
        var dataCellsByAxisTypeThenIndex = this._dataCellsByAxisTypeThenIndex;
        if(!this.parent) {
            // type -> index -> [datacell array]
            dataCellsByAxisTypeThenIndex = {};

            this.plotList.forEach(function(plot) {

                plot.dataCellList.forEach(function(dataCell) {

                    if(dataCell.role.isBound()) {
                        var dataCellsByAxisIndex = def.array.lazy(dataCellsByAxisTypeThenIndex, dataCell.axisType);

                        def.array.lazy(dataCellsByAxisIndex, dataCell.axisIndex).push(dataCell);
                    }
                });
            });

            this._dataCellsByAxisTypeThenIndex = dataCellsByAxisTypeThenIndex;
        }

        /* NOTE: Cartesian axes are created even when hasMultiRole && !parent
         * because it is needed to read axis options in the root chart.
         * Also, binding occurs so that it is possible to know its scale type.
         * Yet, their scales are not setup at the root level.
         *
         * This reveals a deficiency of the model,
         * in the lack of separation of the two parts: i) options and static binding to dataCells,
         * and ii) "axis scopes" which are actually bound to data.
         */

        // 1 = root, 2 = leaf, 1 | 2 = 3 = everywhere
        var chartLevel = this._chartLevel();

        this._axisCreationOrder.forEach(function(axisType) {
            // Create?
            if((this._axisCreateChartLevel[axisType] & chartLevel) !== 0) {
                var AxisClass;

                var dataCellsOfTypeByIndex = dataCellsByAxisTypeThenIndex[axisType];
                if(dataCellsOfTypeByIndex) {

                    AxisClass = this._getAxisClass(axisType);

                    dataCellsOfTypeByIndex.forEach(function(dataCells) {

                        dataCells = dataCells.filter(function(dataCell) {
                            return !dataCell.plot || !this.parent || dataCell.plot.isDataBoundOn(this.data);
                        }, this);

                        if(dataCells.length > 0) {
                            var axisIndex = dataCells[0].axisIndex;

                            // Pass the stored state in axis construction.

                            new AxisClass(this, axisType, axisIndex, {state: getAxisState(axisType, axisIndex)});
                        }

                    }, this);
                }

                // None of this type created? Should create one anyway?
                if(!this.axesByType[axisType] && this._axisCreateIfUnbound[axisType]) {

                    AxisClass = this._getAxisClass(axisType);

                    new AxisClass(this, axisType, 0);
                }
            }
        }, this);

        // Copy axes that exist in root and not here
        if(this.parent)
            this.root.axesList.forEach(function(axis) {
                if(!def.hasOwn(this.axes, axis.id)) {
                    this._addAxis(axis);
                }
            }, this);

        // Bind
        // Bind all axes with dataCells registered in dataCellsByAxisTypeThenIndex
        // and which were created at this level
        def.eachOwn(dataCellsByAxisTypeThenIndex, function(dataCellsOfTypeByIndex, type) {
            // Was created at this level?
            if((this._axisCreateChartLevel[type] & chartLevel) !== 0) {

                dataCellsOfTypeByIndex.forEach(function(dataCells) {

                    dataCells = dataCells.filter(function(dataCell) {
                        return !dataCell.plot || !this.parent || dataCell.plot.isDataBoundOn(this.data);
                    }, this);

                    if(dataCells.length > 0) {
                        var axisIndex = dataCells[0].axisIndex;
                        var axis = this.axes[def.indexedId(type, axisIndex)];
                        if(!axis.isBound()) {
                            axis.bind(dataCells);
                        }
                    }
                }, this);
            }
        }, this);
    },

    _getAxisClass: function(axisType) {
        return this._axisClassByType[axisType] || pvc.visual.Axis;
    },

        /** @virtual */
    _initAxesEnd: function() {
        // Can only be done after axes creation
        if(this.slidingWindow)
            this.slidingWindow.setAxesDefaults(this);
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
        if(axis.chart === this) axis.axisIndex = this.axesList.length;

        this.axesList.push(axis);

        var typeAxes  = def.array.lazy(this.axesByType, axis.type);
        var typeIndex = typeAxes.count || 0;
        axis.typeIndex = typeIndex;
        typeAxes[axis.index] = axis;
        if(!typeIndex) typeAxes.first = axis;
        typeAxes.count = typeIndex + 1;

        // For child charts, that simply copy color axes.
        if(axis.type === 'color' && axis.isBound()) this._onColorAxisScaleSet(axis);

        return this;
    },

    _getAxis: function(type, index) {
        var typeAxes;
        if(index != null && (+index >= 0) && (typeAxes = this.axesByType[type]))
            return typeAxes[index];
    },

    _setAxesScales: function(chartLevel) {
        this.axesList.forEach(function(axis) {
            if((this._axisSetScaleChartLevel[axis.type] & chartLevel) && axis.isBound())
                this._setAxisScale(axis, chartLevel);
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
        this._setAxisScaleByScaleType(axis);
    },

    _setAxisScaleByScaleType: function(axis) {
        switch(axis.scaleType) {
            case 'discrete':   this._setDiscreteAxisScale  (axis); break;
            case 'numeric':    this._setNumericAxisScale   (axis); break;
            case 'timeSeries': this._setTimeSeriesAxisScale(axis); break;
            default: throw def.error("Unknown axis scale type.");
        }
    },

    _describeScale: function(axis, scale) {
        if(scale.isNull && def.debug >= 3)
            this.log(def.format("{0} scale for axis '{1}'- no data", [axis.scaleType, axis.id]));
    },

    /**
     * Creates a discrete scale for a given axis.
     * @param {pvc.visual.Axis} axis The axis.
     * @virtual
     */
    _setDiscreteAxisScale: function(axis) {
        if(axis.type === 'color') return this._setDiscreteColorAxisScale(axis);

        /* DOMAIN */
        var values = axis.domainValues(),
            scale = new pv.Scale.ordinal();

        if(!values.length) scale.isNull = true; else scale.domain(values);

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
        var extent = this._getContinuousVisibleExtentConstrained(axis); // null when no data.
        var scale = new pv.Scale.linear();

        // TODO: may have no data and not return null...
        if(!extent) {
            scale.isNull = true;
        } else {
            var dMin = extent.min,
                dMax = extent.max,
                epsi = 1,
                normalize = function() {
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
        if(axis.type === 'color') return this._setNumericColorAxisScale(axis);

        /* DOMAIN */
        var extent = this._getContinuousVisibleExtentConstrained(axis),
            scale = new pv.Scale.linear();
        if(!extent) {
            scale.isNull = true;
        } else {
            var dMin = extent.min,
                dMax = extent.max,
                epsi = 1e-10,
                normalize = function() {
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

            var includeZero = !extent.lengthLocked &&
                    axis.option.isDefined('OriginIsZero') &&
                    axis.option('OriginIsZero');

            if(includeZero) {
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

    _warnSingleContinuousValueRole: function(valueRole) {
        if(!valueRole.grouping.isSingleDimension)
            this.log.warn("A linear scale can only be obtained for a single dimension role.");

        if(valueRole.grouping.isDiscrete())
            this.log.warn(def.format("The single dimension of role '{0}' should be continuous.", [valueRole.name]));
    },

    // TODO: NOTE: there's the possibility that a conversion error occurs
    // and that a non-null FixedMin/Max option value is here converted into null.
    // In this case, although the min/max won't be considered here,
    // the addition of clipping/overflow logic is done anyway,
    // cause it only tests for the existence of a non-null, pre-parsed,
    // value of these options.
    /** @virtual */
    _getContinuousVisibleExtentConstrained: function(axis) {
        var me = this;
        var opts = axis.option;

        var dim;
        var read = function(v) {
            if(!dim) {
                // Using the first dimension for reading. Its converter, if any, is used.
                dim = me.data.owner.dimensions(axis.role.grouping.firstDimension.name);
            }

            return dim.read(v).value;
        };

        var readLimit = function(name) {
            if(!opts.isDefined(name)) return null;

            var v = opts(name);
            // May still return null, in case an invalid non-null value is supplied.
            return v != null ? read(v) : v;
        };

        // Length is null or > 0.
        var length = opts.isDefined('FixedLength') ? opts('FixedLength') : null;

        var min = null;
        var max = null;
        var minLocked = false;
        var maxLocked = false;


        if((min = readLimit('FixedMin')) != null) {
            minLocked = true;

            // ignore FixedMax; imply max
            if(length) {
                max = (+min) + length;
                maxLocked = true;
            }
        }

        if(max == null && (max = readLimit('FixedMax')) != null) {
            // being here => min == null || !length

            maxLocked = true;

            // length => (min == null)
            if(length) {
                min = max - length;
                minLocked = true;
            }
        }

        if(min == null || max == null) {
            // null when no data. If no data, the limits will not be used.
            var dataExtent = this._getContinuousVisibleExtent(axis);
            if(!dataExtent)
                return null;

            if(length) {
                // assert min == null && max == null
                // cause, above, if either one is not null, the other one is implied.
                switch(opts('DomainAlign')) {
                    case 'min':
                        min = dataExtent.min;
                        max = (+min) + length;
                        break;

                    case 'max':
                        max = dataExtent.max;
                        min = max - length;
                        break;

                    default: //case 'center':
                        var center = dataExtent.max - ((dataExtent.max - dataExtent.min) / 2);
                        min = center - (length / 2);
                        max = center + (length / 2);
                        break;
                }
            } else {
                if(min == null) min = dataExtent.min;
                if(max == null) max = dataExtent.max;
            }

            // assert min != null && max != null
        }

        // ---

        if(axis.scaleUsesAbs()) {
            // This changes the length, if it were fixed...
            // Can even result in turning min > max.
            if(min < 0) min = -min;
            if(max < 0) max = -max;
        }

        // ---

        if((+min) > (+max)) {
            var temp = min;
            min = max;
            max = temp;
        }

        return {
            min: read(min),
            max: read(max),
            minLocked: minLocked,
            maxLocked: maxLocked,
            lengthLocked: length != null
        };
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

        // Most common case. Faster this way.
        if(dataCells.length === 1) {
            var valueDataCell = dataCells[0];
            return valueDataCell.plot.getContinuousVisibleCellExtent(this, valueAxis, valueDataCell);
        }

        // This implementation takes the union of
        // the extents of all data cells.
        // Even when a data cell has multiple data parts,
        // it is evaluated as a whole.
        return def.query(dataCells)
            .select(function(dataCell) {
                return dataCell.plot.getContinuousVisibleCellExtent(this, valueAxis, dataCell);
            }, this)
            .reduce(pvc.unionExtents, null);
    },

    // -------------

    _setDiscreteColorAxisScale: function(axis) {
        // Call the transformed color scheme with the domain values
        //  to obtain a final scale object.

        var scale = axis.scheme()(axis.domainValues());

        this._describeScale(axis, scale);
        axis.setScale(scale, /*noWrap*/true);
        this._onColorAxisScaleSet(axis);
    },

    _setNumericColorAxisScale: function(axis) {
        // TODO: how to handle more?
        if(axis.dataCells.length !== 1) throw def.error("Can't handle multiple continuous data cells in color axis.");

        // Single Continuous
        // -> Global Scope (actually as only the root chart sets the scale, it is implied)
        // -> Visible only
        // -> Any isNull
        this._warnSingleContinuousValueRole(axis.role);

        var visibleDomainData = this.visiblePlotData(axis.dataCell.plot), // [ignoreNulls=true]
            normByCateg = axis.option('NormByCategory'),
            scaleOptions = {
                type:        axis.option('ScaleType'),
                colors:      axis.option('Colors')().range(), // obtain the underlying colors array
                colorDomain: axis.option('Domain'),
                colorMin:    axis.option('Min'),
                colorMax:    axis.option('Max'),
                colorMissing:axis.option('Missing'), // TODO: already handled by the axis wrapping
                data:        visibleDomainData,
                colorDimension: axis.role.grouping.singleDimensionName,
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
            case 0: this.colors = axis.scheme();
                    break;
            case 1: if(this._allowV1SecondAxis){
                        this.secondAxisColor = axis.scheme();
                    }
                    break;
        }
    },

    /**
     * Obtains a unified <b>discrete</b> color scale,
     * using all the color axes with own, specified, `Colors` or `Map` option.
     *
     * This color scale is used to satisfy axes
     * for which `Colors' was not specified.
     *
     * Each distinct grouping of dimensions has a different unified color-scale,
     * so that the color keys are of the same types.
     */
    _getRoleColorScale: function(grouping) {
        return def.lazy(
            def.lazy(this, '_rolesColorScale'),
            grouping.key,
            this._createRoleColorScale,
            this);
    },

    _createRoleColorScale: function(groupingKey) {
        var firstScale, scale, valueToColorMap = {};

        this.axesByType.color.forEach(function(axis) {
            var axisRole = axis.role;
            if(axisRole && // bound
               axis.scale &&
               axis.scaleType === 'discrete' &&
               axisRole.grouping.key === groupingKey && // same grouping

               // Only use color axes with "specified Colors"
               axis.index === 0 ||
               axis.option.isSpecified('Colors') ||
               axis.option.isSpecified('Map')) {

                scale = axis.scale;
                if(!firstScale) firstScale = scale;

                axis.domainValues().forEach(addDomainValue);
            }
        }, this);

        function addDomainValue(value) {
            // First color wins
            var key = '' + value;
            if(!def.hasOwnProp.call(valueToColorMap, key)) valueToColorMap[key] = scale(value);
        }

        if(!firstScale) return pvc.createColorScheme()();

        scale = function(value) {
            var key = '' + value;
            if(def.hasOwnProp.call(valueToColorMap, key)) return valueToColorMap[key];
            return (valueToColorMap[key] = firstScale(value));
        };

        def.copy(scale, firstScale); // TODO: domain() and range() should be overriden...

        return scale;
    },

    _onLaidOut: function() {
        // NOOP
    }
});


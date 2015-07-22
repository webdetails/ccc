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
        if(!this.parent) level |= 1; // Root
        if(this.parent || !this.visualRoles.multiChart.isBound()) level |= 2; // Leaf
        return level;
    },

    _initAxes: function(hasMultiRole) {
        
        // NEW603 C
        // Get axis state 
        // The state is to be kept between render calls
        var axesState, 
            oldByType = def.copy( {}, this.axesByType );

        if(this.axes) {
            axesState = {};
            this.axesList.forEach(function(axis) {
                axesState[axis.id] = axis.getState();
            });
        }

        this.axes = {};
        this.axesList = [];
        this.axesByType = {};

        // Clear any previous global color scales
        delete this._rolesColorScale;

        // Filter only bound dataCells.
        // ATTENTION: the splicing here performed breaks the correspondence between array index and axisIndex.
        // So the indexing on axisIndex is no longer valid after this!!
        // However, in each entry, all dataCells will still have the same axisIndex.
        var dataCellsByAxisTypeThenIndex = this._dataCellsByAxisTypeThenIndex;
        if(!this.parent) def.eachOwn(dataCellsByAxisTypeThenIndex, function(dataCellsByAxisIndex, type) {
            var i = 0, I = dataCellsByAxisIndex.length;
            while(i < I) {
                var dataCells = dataCellsByAxisIndex[i];
                if(dataCells) {
                    dataCells = dataCells.filter(function (dataCell) {
                        return dataCell.role.isBound();
                    });

                    if(dataCells.length) {
                        dataCellsByAxisIndex[i] = dataCells;
                        i++;
                    } else {
                        dataCellsByAxisIndex.splice(i, 1);
                        I--;
                    }
                } else {
                    i++;
                }
            }

            if(!dataCellsByAxisIndex.length) delete dataCellsByAxisTypeThenIndex[type];
        });

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

        this._axisCreationOrder.forEach(function(type) {
            // Create?
            if((this._axisCreateChartLevel[type] & chartLevel) !== 0) {
                var AxisClass,
                    dataCellsOfTypeByIndex = dataCellsByAxisTypeThenIndex[type];
                if(dataCellsOfTypeByIndex) {

                    AxisClass = this._axisClassByType[type] || pvc.visual.Axis;
                    dataCellsOfTypeByIndex.forEach(function(dataCells) {
                        // NEW603 C
                        // Pass the stored state in axis construction
                        var axisIndex = dataCells[0].axisIndex,
                            ka = {};
                        if(oldByType){
                            var axes = oldByType[type];
                            if(axes){ 
                                var axisId = axes[axisIndex].id;
                                ka = {state: axesState && axesState[axisId]};
                            }
                        }
                        new AxisClass(this, type, axisIndex, ka);
                    }, this, oldByType);
                    
                } else if(this._axisCreateIfUnbound[type]) {
                    AxisClass = this._axisClassByType[type] || pvc.visual.Axis;
                    if(AxisClass) new AxisClass(this, type, 0);
                }
            }
        }, this, oldByType);

        // Copy axes that exist in root and not here
        if(this.parent)
            this.root.axesList.forEach(function(axis) {
                if(!def.hasOwn(this.axes, axis.id)) this._addAxis(axis);
            }, this);

        // Bind
        // Bind all axes with dataCells registered in dataCellsByAxisTypeThenIndex
        // and which were created at this level
        def.eachOwn(
            dataCellsByAxisTypeThenIndex,
            function(dataCellsOfTypeByIndex, type) {
                // Was created at this level?
                if((this._axisCreateChartLevel[type] & chartLevel)) {
                    dataCellsOfTypeByIndex.forEach(function(dataCells) {
                        var axisIndex = dataCells[0].axisIndex,
                            axis = this.axes[def.indexedId(type, axisIndex)];
                        if(!axis.isBound()) axis.bind(dataCells);
                    }, this);
                }
            },
            this);

        // NEW603 C removed _initAxesEnd (see _createPhase1)
        // this._initAxesEnd();
    },

    /** @virtual */
    _initAxesEnd: function() {
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
        var extent = this._getContinuousVisibleExtentConstrained(axis), // null when no data...
            scale = new pv.Scale.linear();

        if(!extent) {
            scale.isNull = true;
        } else {
            var dMin = extent.min,
                dMax = extent.max,
                epsi = 1;
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
                        if(!extent.minLocked) extent.minLocked = true, dMin = 0;
                    } else {
                        if(!extent.maxLocked) extent.maxLocked = true, dMax = 0;
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

    /** @virtual */
    _getContinuousVisibleExtentConstrained: function(axis, min, max) {
        var dim,
            getDim = function() {
                return dim || (dim = this.data.owner.dimensions(axis.role.grouping.lastDimensionName()));
            },
            minLocked = false,
            maxLocked = false;

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
                if(min < 0 && axis.scaleUsesAbs()) min = -min;
            }
        }

        // NEW603 C
        // Length should always be an absolute value
        var width;
        if(axis.option.isDefined('FixedLength')) {
            width = axis.option('FixedLength');
            //if(width != null) width = getDim.call(this).read(width);
            //if(width != null) width = width.value;
            if(width < 0) width = -width; 
        }

        // NEW603 C
        // If FixedMin + FixedLength specified, max is directly set
        // using both and FixedMax is ignored
        // if width is not null then FixedLength was defined
        if(min   != null && axis.option.isDefined('FixedMin') && 
           width != null && max == null) {
            max = min - (0-width);
            maxLocked = (max != null);
            if(maxLocked) {
                // this shouldn't be necessary since width is always 
                // greater than 0 and if scaleUsesAbs returns true,
                // so is min
                if(max < 0 && axis.scaleUsesAbs()) max = -max;
            }
        } 

        // Get max from option
        if(max == null && axis.option.isDefined('FixedMax')) {
            max = axis.option('FixedMax');
            // may return null when an invalid non-null value is supplied.
            if(max != null) max = getDim.call(this).read(max);
            maxLocked = (max != null);
            // Dereference atom
            if(maxLocked) {
                max = max.value;
                if(max < 0 && axis.scaleUsesAbs()) max = -max;
            }
        }

        // NEW603 C
        // If min is null, but FixedMax and FixedLength were defined 
        // the minimum can be set using both
        if(min == null && width != null && 
           max != null && axis.option.isDefined('FixedMax') ) {
            min = max - width;
            minLocked = (min != null);
            if(minLocked) {
                // this can and will change the length if 
                // width > max
                if(min < 0 && axis.scaleUsesAbs()) min = -min;
            }
        } 

        // NEW603 C
        // If min and max are null, but FixedLength was defined 
        // the maximum and minimum are set according to the specified 
        // or default alignment
        if(min == null && max==null && width != null) {
            var baseExtent = this._getContinuousVisibleExtent(axis); // null when no data
            if(!baseExtent) return null;
            if(axis.option('DomainAlign')=='max') {
                max = baseExtent.max;
                min = max - width;

            } else if(axis.option('DomainAlign')=='center') {
                var center = baseExtent.max - ((baseExtent.max - baseExtent.min)/2);
                min = center - width/2;
                max = center - (0 - width/2);

            } else {
                min = baseExtent.min;
                max = min - (0 - width);
            }

            min = getDim.call(this).read(min);
            if(min < 0  &&  axis.scaleUsesAbs()) min = -min;
            max = getDim.call(this).read(max);
            if( max < 0  &&  axis.scaleUsesAbs()) max = -max;

            // maxLocked = (max != null);
            // minLocked = (min != null);
            if(min != null) min = min.value;
            if(max != null) max = max.value;

        } 
            
        if(min == null || max == null) {
            var baseExtent = this._getContinuousVisibleExtent(axis); // null when no data
            if(!baseExtent) return null;
            if(min == null) min = baseExtent.min;
            if(max == null) max = baseExtent.max;
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

        // Most common case. Faster this way.
        if(dataCells.length === 1) {
            var valueDataCell = dataCells[0];
            return valueDataCell.plot.getContinuousVisibleCellExtent(this, valueAxis, valueDataCell);
        }

        // This implementation takes the union of
        // the extents of each data cell.
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
        if(axis.dataCells.length !== 1) throw def.error("Can't handle multiple continuous datacells in color axis.");

        // Single Continuous
        // -> Global Scope (actually as only the root chart sets the scale, it is implied)
        // -> Visible only
        // -> Any isNull
        this._warnSingleContinuousValueRole(axis.role);

        var visibleDomainData = this.visiblePlotData(axis.dataCell.plot, axis.dataCell.dataPartValue), // [ignoreNulls=true]
            normByCateg = axis.option('NormByCategory'),
            scaleOptions = {
                type:        axis.option('ScaleType'),
                colors:      axis.option('Colors')().range(), // obtain the underlying colors array
                colorDomain: axis.option('Domain'),
                colorMin:    axis.option('Min'),
                colorMax:    axis.option('Max'),
                colorMissing:axis.option('Missing'), // TODO: already handled by the axis wrapping
                data:        visibleDomainData,
                colorDimension: axis.role.lastDimensionName(),
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
                    if(axis.option('PreserveMap')) axis.preserveColorMap(); //NEW603 C
                    break;
            case 1: if(this._allowV1SecondAxis){ 
                        this.secondAxisColor = axis.scheme();
                        if(axis.option('PreserveMap')) axis.preserveColorMap(); //NEW603 C
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
            grouping.id,
            this._createRoleColorScale, 
            this);
    },

    _createRoleColorScale: function(groupingId) {
        var firstScale, scale, valueToColorMap = {};

        this.axesByType.color.forEach(function(axis) {
            var axisRole = axis.role;
            if(axisRole && // bound
               axis.scale &&
               axis.scaleType === 'discrete' &&
               axisRole.grouping.id === groupingId && // same grouping

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


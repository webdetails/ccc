/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Axis:true */

/**
 * Initializes a color axis.
 *
 * @name pvc.visual.ColorAxis
 *
 * @class Represents an axis that maps colors to the values of a role.
 *
 * @extends pvc.visual.Axis
 */

def('pvc.visual.ColorAxis', pvc_Axis.extend({
    methods: /** @lends pvc.visual.ColorAxis# */{

        /** @override */scaleNullRangeValue: function() { return this.option('Missing') || null; },
        /** @override */scaleUsesAbs:        function() { return this.option('UseAbs'); },
        /** @override */domainVisibleOnly:   function() { return this.scaleType !== 'discrete'; },

        // region Bind
        /** @override */
        bind: function(dataCells) {

            this.base(dataCells);

            this._legendGroupScene = null;

            // -- collect distinct plots
            // Transform depends on this
            // Colors depends on Transform
            this._plotList =
                def
                .query(dataCells)
                .select(function(dataCell) { return dataCell.plot; })
                .distinct(function(plot) { return plot && plot.id; })
                .array();

            return this;
        },
        // endregion

        // region State
        // @override
        _buildState: function() {
            return {'preservedMap': this._calcPreservedMap()};
        },

        // Saves the current map of colors, for a discrete axis.
        _calcPreservedMap: function() {
            var scale = this.scale;
            if(scale && this.scaleType === 'discrete') {
                var map = this._state.preservedMap || {};

                scale.domain().forEach(function(key) {
                    if(!def.hasOwn(map, key)) map[key] = scale(key);
                });

                return map;
            }
        },
        // endregion

        // region Scale
        // Called from within setScale
        /** @override */
        _wrapScale: function(scale) {
            // Check if there is a color transform set
            // and if so, transform the color scheme.
            // If the user specified the colors,
            // do not apply default color transforms...

            // If there is a preserved map
            // do not apply default color transforms
            var optSpecified = this.option.isSpecified,
                applyTransf = (this.scaleType !== 'discrete') ||
                    optSpecified('Transform')      ||
                    !optSpecified('Colors') ;

            if(applyTransf) {
                var colorTransf = this.option('Transform');
                if(colorTransf) scale = scale.transform(colorTransf);
            }

            return this.base(scale);
        },
        // endregion

        // region Scale / Scheme
        scheme: function() {
            return def.lazy(this, '_scheme', this._createScheme, this);
        },

        _createColorMapFilter: function(colorMap, baseScheme) {
            // Fixed Color Values (map of color.key -> first domain value of that color)
            var fixedColors = def.uniqueIndex(colorMap, function(c) { return c.key; });

            return {
                domain: function(k) { return !def.hasOwn(colorMap, k);        },
                color:  function(c) { return !def.hasOwn(fixedColors, c.key); }
            };
        },

        // Override to be able to add colors,
        // derived from the base colors,
        // before mapping, transform and null handling.
        /** @overridable */
        _getBaseScheme: function() {
            return this.option('Colors');
        },

        _createScheme: function() {
            var me = this,
                baseScheme = me._getBaseScheme();

            if(me.scaleType !== 'discrete') {
                // TODO: this implementation doesn't support NormByCategory...
                return function(/*domainAsArrayOrArgs*/) {
                    // Create a fresh baseScale, from the baseColorScheme
                    // Use baseScale directly
                    var scale = baseScheme.apply(null, arguments);

                    // Apply Transforms, nulls, etc, according to the axis' rules
                    return me._wrapScale(scale);
                };
            }

            var colorMap = this._getPreservedMap() || me.option('Map'); // map domain key -> pv.Color
            if(!colorMap) {
                return function(/*domainAsArrayOrArgs*/) {
                    // Create a fresh baseScale, from the baseColorScheme
                    // Use baseScale directly
                    var scale = baseScheme.apply(null, arguments);

                    // Apply Transforms, nulls, etc, according to the axis' rules
                    return me._wrapScale(scale);
                };
            }

            var filter = this._createColorMapFilter(colorMap, baseScheme);

            return function(d/*domainAsArrayOrArgs*/) {

                // Create a fresh baseScale, from the baseColorScheme
                var scale;
                if(!(d instanceof Array)) d = def.array.copy(arguments);

                // Filter the domain before creating the scale
                d = d.filter(filter.domain);

                var baseScale = baseScheme(d),

                    // Remove fixed colors from the baseScale
                    r = baseScale.range().filter(filter.color);

                baseScale.range(r);

                // Intercept so that the fixed color is tested first
                scale = function(k) {
                    var c = def.getOwn(colorMap, k);
                    return c || baseScale(k);
                };

                def.copy(scale, baseScale);

                // Override domain and range methods
                var dx, rx;
                scale.domain = function() {
                    if(arguments.length) throw def.error.operationInvalid("The scale cannot be modified.");
                    if(!dx) dx = def.array.append(def.ownKeys(colorMap), d);
                    return dx;
                };

                scale.range = function() {
                    if(arguments.length) throw def.error.operationInvalid("The scale cannot be modified.");
                    if(!rx) rx = def.array.append(def.own(colorMap), r);
                    return rx;
                };

                // At last, apply Transforms, nulls, etc, according to the axis' rules
                return me._wrapScale(scale);
            };
        },

        // returns the stored Map if it is supposed to be
        // preserved and if it exists
        _getPreservedMap: function() {
            return this.option('PreserveMap') ? this._state.preservedMap : null;
        },
        // endregion

        // region Options
        /** @override */
        sceneScale: function(keyArgs) {
            var varName = def.get(keyArgs, 'sceneVarName') || this.role.name,
                fillColorScaleByColKey = this.scalesByCateg;

            if(fillColorScaleByColKey) {
                var colorMissing = this.option('Missing');

                return function(scene) {
                    var colorValue = scene.vars[varName].value;
                    if(colorValue == null) return colorMissing;

                    var catAbsKey = scene.group.parent.absKey;
                    return fillColorScaleByColKey[catAbsKey](colorValue);
                };
            }

            return this.scale.by1(function(scene) {
                return scene && scene.vars[varName].value;
            });
        },

        /** @override */
        _registerResolversNormal: function(rs, keyArgs) {
            if(this.chart.compatVersion() <= 1) rs.push(this._resolveByV1OnlyLogic);

            rs.push(this._resolveByOptionId, this._resolveByScaleType, this._resolveByCommonId);

            if(!this.index) rs.push(this._resolveByNaked);
        },

        // numericColorAxisColors
        /** @override */
        _resolveByScaleType: pvc.options.specify(function(optionInfo) {
            // this.scaleType
            // * discrete
            // * numeric    | continuous
            // * timeSeries | continuous
            var st = this.scaleType;
            if(st) {
                var name  = optionInfo.name,
                    value = this._chartOption(st + 'ColorAxis' + name);
                if(value === undefined && st !== 'discrete')
                    value = this._chartOption('continuousColorAxis' + name);

                return value;
            }
        }),

        // colorAxesColors
        /** @override */
        _resolveByCommonId: pvc.options.specify(function(optionInfo) {
            return this._chartOption('colorAxes' + optionInfo.name);
        }),

        /**
         * Not really naked...
         * Only for index = 0, allows options prefixed by "color"...
         * For really naked resolution, see below use of resolveDefault for "legend*" and the "color" options.
         * Ouch...
         *
         * Ways to specify colors:
         *
         * colorAxisColors, color2AxisColors
         * {timeSeries, numeric, discrete}ColorAxisColors
         * continuousColorAxisColors
         * colorAxesColors
         * colorColors (this one, for index 0)
         * colors      (really naked, default, for index 0)
         *
         * @override
         */
        _resolveByNaked: pvc.options.specify(function(optionInfo) {
            return this._chartOption(this.id + def.firstUpperCase(optionInfo.name));
        }),

        /** @override */
        _specifyV1ChartOption: function(optionInfo, asName) {
            if(!this.index &&
                this.chart.compatVersion() <= 1 &&
                this._specifyChartOption(optionInfo, asName)) {
                return true;
            }
        }

        // endregion
    }
}));

/* PRIVATE STUFF */
function colorAxis_castColorMap(colorMap) {
    var resultMap;
    if(colorMap) {
        var any;
        def.eachOwn(colorMap, function(v, k) {
            any = true;
            colorMap[k] = pv.fillStyle(v);
        });

        if(any) resultMap = colorMap;
    }

    return resultMap;
}

var colorAxis_legendDataSpec = {
    resolveDefault: function(optionInfo) {
        // Naked
        if(!this.index &&
           this._specifyChartOption(optionInfo, def.firstLowerCase(optionInfo.name))) {
            return true;
        }
    }
};

var colorAxis_defContColors;

function colorAxis_getDefaultColors(/*optionInfo*/) {
    var colors;
    var scaleType = this.scaleType;
    if(!scaleType) {
        // Axis is unbound
        colors = pvc.createColorScheme();
    } else if(scaleType === 'discrete') {
        if(this.index === 0) {
            // Assumes default pvc scale
            colors = pvc.createColorScheme();
        } else {
            // Use colors of axes with own colors.
            // Use a color scheme that always returns
            // the global color scale of the role
            // The following fun ignores passed domain values.
            var me = this;
            colors = function() { return me.chart._getRoleColorScale(me.role.grouping); };
        }
    } else {
        if(!colorAxis_defContColors) colorAxis_defContColors = ['red', 'yellow','green'].map(pv.color);
        colors = colorAxis_defContColors.slice();
    }

    return colors;
}

pvc.visual.ColorAxis.options({
    /*
     * colors (special case)
     * colorAxisColors
     * color2AxisColors
     * color3AxisColors
     *
     * -----
     * secondAxisColor (V1 compatibility)
     */
    Colors: {
        resolve:    '_resolveFull',
        getDefault: colorAxis_getDefaultColors,
        data: {
            resolveV1: function(optionInfo) {
                if(this.scaleType === 'discrete') {
                    if(this.index === 0)
                        this._specifyChartOption(optionInfo, 'colors');
                    else if(this.index === 1 && this.chart._allowV1SecondAxis)
                        this._specifyChartOption(optionInfo, 'secondAxisColor');
                } else {
                    this._specifyChartOption(optionInfo, 'colorRange');
                }
                return true;
            },
            resolveDefault: function(optionInfo) { // after normal resolution
                // Handle naming exceptions
                if(this.index === 0) this._specifyChartOption(optionInfo, 'colors');
            }
        },
        cast: pvc.colorScheme
    },

    /**
     * For ordinal color scales, a map of keys and their fixed colors.
     *
     * @example
     * <pre>
     *  {
     *      'Lisbon': 'red',
     *      'London': 'blue'
     *  }
     * </pre>
     */
    Map: {
        resolve: '_resolveFull',
        cast:    colorAxis_castColorMap
    },

    /**
     * A Boolean that indicates if map
     * preservation should be applied
     * between render calls
     */
    PreserveMap: {
        resolve: '_resolveFull',
        cast:    Boolean,
        value:   false
    },

    /*
     * A function that transforms the colors
     * of the color scheme:
     * pv.Color -> pv.Color
     */
    Transform: {
        resolve: '_resolveFull',
        data: {
            resolveDefault: function(optionInfo) {
                var plotList = this._plotList;
                if(plotList.length) {
                    var notMainAndAnyOfTrendAndPlot2 = false;

                    def.query(plotList).each(function(plot) {
                        // Set to false and break out.
                        if(plot.isMain) return (notMainAndAnyOfTrendAndPlot2 = false);

                        var name = plot.name;
                        if(name === 'plot2' || name === 'trend') notMainAndAnyOfTrendAndPlot2 = true;
                    });

                    if(notMainAndAnyOfTrendAndPlot2) return optionInfo.defaultValue(pvc.brighterColorTransform), true;
                }
            }
        },
        cast: def.fun.to
    },

    NormByCategory: {
        resolve: function(optionInfo) {
            return this.chart._allowColorPerCategory
                ? this._resolveFull(optionInfo)
                : (optionInfo.specify(false), true);
        },
        data: {
            resolveV1: function(optionInfo) {
                return this._specifyV1ChartOption(optionInfo, 'normPerBaseCategory'), true;
            }
        },
        cast:    Boolean,
        value:   false
    },

    // ------------
    // Continuous color scale
    ScaleType: {
        resolve: '_resolveFull',
        data: {
            resolveV1: function(optionInfo) {
                return this._specifyV1ChartOption(optionInfo, 'scalingType'), true;
            }
        },
        cast:    pvc.parseContinuousColorScaleType,
        value:   'linear'
    },

    UseAbs: {
        resolve: '_resolveFull',
        cast:    Boolean,
        value:   false
    },

    Domain: {
        resolve: '_resolveFull',
        data: {
            resolveV1: function(optionInfo) {
                return this._specifyV1ChartOption(optionInfo, 'colorRangeInterval'), true;
            }
        },
        cast: def.array.to
    },

    Min: {
        resolve: '_resolveFull',
        data: {
            resolveV1: function(optionInfo) {
                return this._specifyV1ChartOption(optionInfo, 'minColor'), true;
            }
        },
        cast: pv.color
    },

    Max: {
        resolve: '_resolveFull',
        data: {
            resolveV1: function(optionInfo) {
                return this._specifyV1ChartOption(optionInfo, 'maxColor'), true;
            }
        },
        cast: pv.color
    },

    Missing: { // Null, in lower case is reserved in JS...
        resolve: '_resolveFull',
        data: {
            resolveV1: function(optionInfo) {
                return this._specifyV1ChartOption(optionInfo, 'nullColor'), true;
            }
        },
        cast:  pv.color,
        value: pv.color('lightgray')
    },

    Unbound: { // Color to use when color role is unbound (only applies to optional color roles)
        resolve: '_resolveFull',
        getDefault: function(optionInfo) {
            var scheme = this.option('Colors');
            return scheme().range()[0] || pvc.defaultColor; // J.I.C.?
        },
        cast:  pv.color
    },

    // ------------

    LegendVisible: {
        resolve: '_resolveFull',
        data:    colorAxis_legendDataSpec,
        cast:    Boolean,
        value:   true
    },

    LegendClickMode: {
        resolve: '_resolveFull',
        data:    colorAxis_legendDataSpec,
        cast:    pvc.parseLegendClickMode,
        value:   'togglevisible'
    },

    LegendDrawLine: {
        resolve: '_resolveFull',
        data:    colorAxis_legendDataSpec,
        cast:    Boolean,
        value:   false
    },

    LegendDrawMarker: {
        resolve: '_resolveFull',
        data:    colorAxis_legendDataSpec,
        cast:    Boolean,
        value:   true
    },

    LegendShape: {
        resolve: '_resolveFull',
        data:    colorAxis_legendDataSpec,
        cast:    pvc.parseShape
    }
});

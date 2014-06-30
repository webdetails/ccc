/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Sides:true, pvc_Size:true, pvc_Axis:true */

/**
 * Initializes a cartesian axis.
 *
 * @name pvc.visual.CartesianAxis
 *
 * @class Represents an axis for a role in a cartesian chart.
 * <p>
 * The main properties of an axis: {@link #type}, {@link #orientation} and relevant chart's properties
 * are related as follows:
 * </p>
 * <pre>
 * axisType={base, ortho} = f(axisOrientation={x,y})
 *
 *          Vertical   Horizontal   (chart orientation)
 *         +---------+-----------+
 *       x | base    |   ortho   |
 *         +---------+-----------+
 *       y | ortho   |   base    |
 *         +---------+-----------+
 * (axis orientation)
 * </pre>
 *
 * @extends pvc.visual.Axis
 *
 * @property {pvc.CartesianAbstract} chart The associated cartesian chart.
 * @property {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @property {string} orientation The orientation of the axis.
 * One of the values: 'x' or 'y', for horizontal and vertical axis orientations, respectively.
 * @property {string} orientedId The id of the axis with respect to the orientation and the index of the axis ("").
 *
 * @constructor
 * @param {pvc.CartesianAbstract} chart The associated cartesian chart.
 * @param {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @param {number} [index=0] The index of the axis within its type.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Axis} for supported keyword arguments.
 */

var pvc_CartesianAxis =
def
.type('pvc.visual.CartesianAxis', pvc_Axis)
.init(function(chart, type, index, keyArgs) {

    var options = chart.options;

    // x, y
    this.orientation = pvc_CartesianAxis.getOrientation(type, options.orientation);

    // x, y, x2, y2, x3, y3, ...
    this.orientedId = pvc_CartesianAxis.getOrientedId(this.orientation, index);

    // secondX, secondY
    if(chart._allowV1SecondAxis && index === 1)
        this.v1SecondOrientedId = 'second' + this.orientation.toUpperCase();

    // id
    // base, ortho, base2, ortho2, ...

    // scaleType
    // discrete, continuous, numeric, timeSeries

    // common
    // axis

    this.base(chart, type, index, keyArgs);

    chart.axes[this.orientedId] = this;
    if(this.v1SecondOrientedId) chart.axes[this.v1SecondOrientedId] = this;

    // For now scale type is left off,
    // cause it is yet unknown.
    // In bind, prefixes are recalculated (see _syncExtensionPrefixes)
    var extensions = this.extensionPrefixes = [
        this.id + 'Axis',
        this.orientedId + 'Axis'
    ];

    if(this.v1SecondOrientedId) extensions.push(this.v1SecondOrientedId + 'Axis');

    this._extPrefAxisPosition = extensions.length;

    extensions.push('axis');
})
.add(/** @lends pvc.visual.CartesianAxis# */{

    bind: function(dataCells) {

        this.base(dataCells);

        this._syncExtensionPrefixes();

        return this;
    },

    _syncExtensionPrefixes: function() {
        var extensions = this.extensionPrefixes;

        // remove until 'axis' (inclusive)
        extensions.length = this._extPrefAxisPosition;

        var st = this.scaleType;
        if(st) {
            extensions.push(st + 'Axis'); // specific
            if(st !== 'discrete') extensions.push('continuousAxis'); // generic
        }

        // Common
        extensions.push('axis');
    },

    setScale: function(scale) {
        var oldScale = this.scale;

        this.base(scale);

        if(oldScale) {
            // If any
            delete this.domain;
            delete this.ticks;
            delete this._roundingPaddings;
        }

        if(scale) {
            if(!scale.isNull && this.scaleType !== 'discrete') {
                // Original data domain, before nice or tick rounding
                this.domain = scale.domain();
                this.domain.minLocked = !!scale.minLocked;
                this.domain.maxLocked = !!scale.maxLocked;

                var roundMode = this.option('DomainRoundMode');
                if(roundMode === 'nice') scale.nice();

                var tickFormatter = this.option('TickFormatter');
                if(tickFormatter) scale.tickFormatter(tickFormatter);
            }
        }

        return this;
    },

    setTicks: function(ticks) {
        var scale = this.scale;

        /*jshint expr:true */
        (scale && !scale.isNull) || def.fail.operationInvalid("Scale must be set and non-null.");

        this.ticks = ticks;

        if(scale.type !== 'discrete' && this.option('DomainRoundMode') === 'tick') {

            delete this._roundingPaddings;

            // Commit calculated ticks to scale's domain
            var tickCount = ticks && ticks.length;
            if(tickCount)
                this.scale.domain(ticks[0], ticks[tickCount - 1]);
            else
                // Reset scale domain
                this.scale.domain(this.domain[0], this.domain[1]);
        }
    },

    setScaleRange: function(size) {
        var scale  = this.scale;
        scale.min  = 0;
        scale.max  = size;
        scale.size = size; // original size // TODO: remove this...

        // -------------

        if(scale.type === 'discrete') {
            if(scale.domain().length > 0) { // Has domain? At least one point is required to split.
                var bandRatio = this.chart.options.panelSizeRatio || 0.8;
                scale.splitBandedCenter(scale.min, scale.max, bandRatio);
            }
        } else {
            scale.range(scale.min, scale.max);
        }

        return scale;
    },

    getScaleRoundingPaddings: function() {
        var roundingPaddings = this._roundingPaddings;
        if(!roundingPaddings) {
            roundingPaddings = {
                begin: 0,
                end:   0,
                beginLocked: false,
                endLocked:   false
            };

            var scale = this.scale;
            if(scale && !scale.isNull && scale.type !== 'discrete') {
                var originalDomain = this.domain;

                roundingPaddings.beginLocked = originalDomain.minLocked;
                roundingPaddings.endLocked   = originalDomain.maxLocked;

                if(scale.type === 'numeric' && this.option('DomainRoundMode') !== 'none') {
                    var currDomain = scale.domain(),
                        origDomain = this.domain || def.assert("Original domain must be set"),
                        currLength = currDomain[1] - currDomain[0];
                    if(currLength) {
                        // begin diff
                        var diff = origDomain[0] - currDomain[0];
                        if(diff > 0) roundingPaddings.begin = diff / currLength;

                        // end diff
                        diff = currDomain[1] - origDomain[1];
                        if(diff > 0) roundingPaddings.end = diff / currLength;
                    }
                }
            }

            this._roundingPaddings = roundingPaddings;
        }

        return roundingPaddings;
    },

    calcContinuousTicks: function(desiredTickCount) {
        if(desiredTickCount == null) desiredTickCount = this.option('DesiredTickCount');

        return this.scale.ticks(desiredTickCount, {
                roundInside:       this.option('DomainRoundMode') !== 'tick',
                numberExponentMin: this.option('TickExponentMin'),
                numberExponentMax: this.option('TickExponentMax')
            });
    },

    _getOptionsDefinition: function() {
        return cartAxis_optionsDef;
    },

    _registerResolversNormal: function(rs, keyArgs) {
        // II - By V1 Only Logic
        if(this.chart.compatVersion() <= 1) rs.push(this._resolveByV1OnlyLogic);

        // IV - By OptionId
        rs.push(this._resolveByOptionId, this._resolveByOrientedId);

        if(this.index === 1) rs.push(this._resolveByV1OptionId);

        rs.push(this._resolveByScaleType, this._resolveByCommonId);

    },

    // xAxisOffset, yAxisOffset, x2AxisOffset
    _resolveByOrientedId: pvc.options.specify(function(optionInfo) {
        return this._chartOption(this.orientedId + "Axis" + optionInfo.name);
    }),

    // secondAxisOffset
    _resolveByV1OptionId: pvc.options.specify(function(optionInfo) {
        return this._chartOption('secondAxis' + optionInfo.name);
    }),

    // numericAxisLabelSpacingMin
    _resolveByScaleType: pvc.options.specify(function(optionInfo) {
        // this.scaleType
        // * discrete
        // * numeric    | continuous
        // * timeSeries | continuous
        var st = this.scaleType;
        if(st) {
            var name  = optionInfo.name,
                value = this._chartOption(st + 'Axis' + name);
            if(value === undefined && st !== 'discrete')
                value = this._chartOption('continuousAxis' + name);

            return value;
        }
    }),

    // axisOffset
    _resolveByCommonId: pvc.options.specify(function(optionInfo) {
        return this._chartOption('axis' + optionInfo.name);
    })
});

/**
 * Obtains the orientation of the axis given an axis type and a chart orientation.
 *
 * @param {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @param {string} chartOrientation The orientation of the chart. One of the values: 'horizontal' or 'vertical'.
 *
 * @type string
 */
pvc_CartesianAxis.getOrientation = function(type, chartOrientation) {
    return ((type === 'base') === (chartOrientation === 'vertical')) ? 'x' : 'y';  // NXOR
};

/**
 * Calculates the oriented id of an axis given its orientation and index.
 * @param {string} orientation The orientation of the axis.
 * @param {number} index The index of the axis within its type.
 * @type string
 */
pvc_CartesianAxis.getOrientedId = function(orientation, index) {
    return (index === 0)
        ? orientation // x, y
        : (orientation + (index + 1)); // x2, y3, x4,...
};

/* PRIVATE STUFF */
var cartAxis_fixedMinMaxSpec = {
    resolve: '_resolveFull',
    data: {
        /* orthoFixedMin, orthoFixedMax */
        resolveV1: function(optionInfo) {
            if(!this.index && this.type === 'ortho')
                // Bare Id (no "Axis")
                this._specifyChartOption(optionInfo, this.id + optionInfo.name);

            return true;
        }
    }
    // Allow any value
    // to be parsed by axis' main role's first dimension's parser
    //cast: pvc.castNumber
};

function pvc_castDomainScope(scope, axis) {
    return pvc.parseDomainScope(scope, axis.orientation);
}

function pvc_castAxisPosition(side) {
    if(side) {
        if(def.hasOwn(pvc_Sides.namesSet, side)) {
            var mapAlign = pvc.BasePanel[this.orientation === 'y' ? 'horizontalAlign' : 'verticalAlign2'];
            return mapAlign[side];
        }

        if(pvc.debug >= 2) pvc.log(def.format("Invalid axis position value '{0}'.", [side]));
    }

    // Ensure a proper value
    return this.orientation === 'x' ? 'bottom' : 'left';
}

var cartAxis_normalV1Data = {
    resolveV1: function(optionInfo) {
        if(!this.index) {
            if(this._resolveByOrientedId(optionInfo)) return true;
        } else if(this._resolveByV1OptionId(optionInfo)) { // secondAxis...
            return true;
        }

        this._resolveDefault(optionInfo);

        return true;
    }
};

var defaultPosition = pvc.options.defaultValue(function(optionInfo) {
    if(!this.typeIndex) return this.orientation === 'x' ? 'bottom' : 'left';

    // Use the position opposite to that of the first axis
    // of same orientation (the same as type)
    var firstAxis = this.chart.axesByType[this.type].first,
        position  = firstAxis.option('Position');

    return pvc.BasePanel.oppositeAnchor[position];
});

function cartAxis_castSize(value) {
    var position = this.option('Position');
    return pvc_Size.toOrtho(value, position);
}

function cartAxis_castTitleSize(value) {
    var position = this.option('Position');

    return pvc_Size.to(value, {singleProp: pvc.BasePanel.orthogonalLength[position]});
}

/*global axis_optionsDef:true*/
var cartAxis_optionsDef = def.create(axis_optionsDef, {
    Visible: {
        resolve: '_resolveFull',
        data: {
            /* showXScale, showYScale, showSecondScale */
            resolveV1: function(optionInfo) {
                if(this.index <= 1) {
                    var v1OptionId = this.index === 0 ?
                            def.firstUpperCase(this.orientation) :
                            'Second';

                    this._specifyChartOption(optionInfo, 'show' + v1OptionId + 'Scale');
                }
                return true;
            }
        },
        cast:  Boolean,
        value: true
    },

    /*
     * 1     <- useCompositeAxis
     * >= 2  <- false
     */
    Composite: {
        resolve: function(optionInfo) {
            // Only first axis can be composite?
            return (this.index > 0)
                ? (optionInfo.specify(false), true)
                : this._resolveFull(optionInfo);
        },
        data: {
            resolveV1: function(optionInfo) {
                return this._specifyChartOption(optionInfo, 'useCompositeAxis'), true;
            }
        },
        cast:  Boolean,
        value: false
    },

    /* xAxisSize,
     * secondAxisSize || xAxisSize
     */
    Size: {
        resolve: '_resolveFull',
        data:    cartAxis_normalV1Data,
        cast:    cartAxis_castSize
    },

    SizeMax: {
        resolve: '_resolveFull',
        cast:    cartAxis_castSize
    },

    /* xAxisPosition,
     * secondAxisPosition <- opposite(xAxisPosition)
     */
    Position: {
        resolve: '_resolveFull',
        data: {
            resolveV1: cartAxis_normalV1Data.resolveV1,
            resolveDefault: defaultPosition
        },
        cast: pvc_castAxisPosition
    },

    FixedMin: cartAxis_fixedMinMaxSpec,
    FixedMax: cartAxis_fixedMinMaxSpec,

    /* 1 <- originIsZero (v1)
     * 2 <- secondAxisOriginIsZero (v1 && bar)
     */
    OriginIsZero: {
        resolve: '_resolveFull',
        data: {
            resolveV1: function(optionInfo) {
                switch(this.index) {
                    case 0:
                        this._specifyChartOption(optionInfo, 'originIsZero');
                        break;
                    case 1:
                        if(this.chart._allowV1SecondAxis)
                            this._specifyChartOption(optionInfo, 'secondAxisOriginIsZero');
                        break;
                }
                return true;
            }
        },
        cast:  Boolean,
        value: true
    },

    DomainScope: {
        resolve: '_resolveFull',
        cast:    pvc_castDomainScope,
        value:   'global'
    },

    /* 1 <- axisOffset,
     * 2 <- secondAxisOffset (V1 && bar)
     */
    Offset: {
        resolve: '_resolveFull',
        data: {
            resolveV1: function(optionInfo) {
                switch(this.index) {
                    case 0:
                        this._specifyChartOption(optionInfo, 'axisOffset');
                        break;

                    case 1:
                        if(this.chart._allowV1SecondAxis)
                            this._specifyChartOption(optionInfo, 'secondAxisOffset');
                        break;
                }

                return true;
            }
        },
        cast: pvc.castNumber
    },

    // em
    LabelSpacingMin: {
        resolve: '_resolveFull',
        cast:    pvc.castNumber
    },

    OverlappedLabelsMode: {
        resolve: '_resolveFull',
        cast:    pvc.parseOverlappedLabelsMode,
        value:   'rotatethenhide'
    },

    /* RULES */
    Grid: {
        resolve: '_resolveFull',
        data: {
            resolveV1: function(optionInfo) {
                if(!this.index) this._specifyChartOption(optionInfo, this.orientation + 'AxisFullGrid');
                return true;
            }
        },
        cast:    Boolean,
        value:   false
    },

    GridCrossesMargin: { // experimental
        resolve: '_resolveFull',
        cast:    Boolean,
        value:   true
    },

    EndLine:  { // deprecated
        resolve: '_resolveFull',
        cast:    Boolean
    },

    ZeroLine: {
        resolve: '_resolveFull',
        cast:    Boolean,
        value:   true
    },
    RuleCrossesMargin: { // experimental
        resolve: '_resolveFull',
        cast:    Boolean,
        value:   true
    },

    /* TICKS */
    Ticks: {
        resolve: '_resolveFull',
        cast:    Boolean
    },
    DesiredTickCount: { // secondAxisDesiredTickCount (v1 && bar)
        resolve: '_resolveFull',
        data: {
            resolveV1: cartAxis_normalV1Data.resolveV1,
            resolveDefault: function(optionInfo) {
                if(this.chart.compatVersion() <= 1) return optionInfo.defaultValue(5), true;
            }
        },
        cast: pvc.castNumber
    },
    MinorTicks: {
        resolve: '_resolveFull',
        data:    cartAxis_normalV1Data,
        cast:    Boolean,
        value:   true
    },
    TickFormatter: {
        resolve: '_resolveFull',
        cast:    def.fun.as
    },
    DomainRoundMode: { // secondAxisRoundDomain (bug && v1 && bar), secondAxisDomainRoundMode (v1 && bar)
        resolve: '_resolveFull',
        data: {
            resolveV1: cartAxis_normalV1Data.resolveV1,
            resolveDefault: function(optionInfo) {
                if(this.chart.compatVersion() <= 1) return optionInfo.defaultValue('none'), true;
            }
        },

        cast:    pvc.parseDomainRoundingMode,
        value:   'tick'
    },
    TickExponentMin: {
        resolve: '_resolveFull',
        cast:    pvc.castNumber
    },
    TickExponentMax: {
        resolve: '_resolveFull',
        cast:    pvc.castNumber
    },

    /* TITLE */
    Title: {
        resolve: '_resolveFull',
        cast:    String
    },
    TitleSize: {
        resolve: '_resolveFull',
        cast:    cartAxis_castTitleSize
    },
    TitleSizeMax: {
        resolve: '_resolveFull',
        cast:    cartAxis_castTitleSize
    },
    TitleFont: {
        resolve: '_resolveFull',
        cast:    String
    },
    TitleMargins:  {
        resolve: '_resolveFull',
        cast:    pvc_Sides.as
    },
    TitlePaddings: {
        resolve: '_resolveFull',
        cast:    pvc_Sides.as
    },
    TitleAlign: {
        resolve: '_resolveFull',
        cast: function castAlign(align) {
            var position = this.option('Position');
            return pvc.parseAlign(position, align);
        }
    },

    Font: { // axisLabelFont (v1 && index == 0 && HeatGrid)
        resolve: '_resolveFull',
        cast:    String
    },

    ClickAction: {
        resolve: '_resolveFull',
        data: cartAxis_normalV1Data
    }, // (v1 && index === 0)

    DoubleClickAction: {
        resolve: '_resolveFull',
        data: cartAxis_normalV1Data
    }, // idem

    /* TOOLTIP */
    TooltipEnabled: {
        resolve: '_resolveFull',
        cast:    Boolean,
        value:  true
    },

    TooltipFormat: {
        resolve: '_resolveFull',
        cast:   def.fun.as,
        value:  null
    },

    TooltipAutoContent: {
        resolve: '_resolveFull',
        cast:   pvc.parseTooltipAutoContent,
        value:  'value'
    }
});
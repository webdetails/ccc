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
def('pvc.visual.CartesianAxis', pvc_Axis.extend({
    init: function(chart, type, index, keyArgs) {

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
        this.extensionPrefixes = getExtensionPrefixes.call(this);
    },

    methods: /** @lends pvc.visual.CartesianAxis# */{

        bind: function(dataCells) {

            this.base(dataCells);

            this._syncExtensionPrefixes();

            return this;
        },

        _syncExtensionPrefixes: function() {
            this.extensionPrefixes = getExtensionPrefixes.call(this);
        },

        // CDF603
        /* Specify a default FixedLength 
           Eg. used when imposing ratio through sliding window */
        setInitialLength: function(fixedLength){
            this.option.defaults({ 'FixedLength': fixedLength });
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

            // TODO: Should this be using `this.scale` instead of `scale`?
            // The base method wraps the given scale...
            if(scale && !scale.isNull && this.scaleType !== 'discrete') {
                // Original data domain, before nice or tick rounding
                this.domain = scale.domain();
                this.domain.minLocked = !!scale.minLocked;
                this.domain.maxLocked = !!scale.maxLocked;

                // CDF603
                var oldMin = this.domain[0],
                    oldMax = this.domain[1];

                var roundMode = this.option('DomainRoundMode');
                if(roundMode === 'nice') scale.nice();
                 
                var tickFormatter = this.option('TickFormatter');
                if(tickFormatter) scale.tickFormatter(tickFormatter);

                // CDF603
                // Starting point for ratio adjustments
                // Necessary to avoid accumulation of error
                this.domainBeforeAdjust = scale.domain();

                // CDF603
                // Adjust scale after nice rounding
                this.adjustDomain(scale, oldMin, oldMax);



            }

            return this;
        },


        removeTicks: function(ticks) {
            var tickCount = ticks ? ticks.length : 0,
                ti = ticks[0],
                tf = ticks[tickCount - 1];

                //CDF603
            if(  this.ratio                                      ||
                 this.option.isSpecified('Ratio')                ||
                    (this.option('PreserveRatio') && this.option('FixedLength'))) {
                var currDomain = this.scale.domain(),
                    tickRem    = [],
                    align      = this.option('DomainAlign');

                if(align == 'min'){
                    if( (+tf) > (+currDomain[1])) tickRem.push(tf); 
                } else if(align == 'max') {
                    if( (+ti) < (+currDomain[0])) tickRem.push(ti); 
                } else{ 
                    if( (+ti) < (+currDomain[0])) tickRem.push(ti);     
                    if( (+tf) > (+currDomain[1])) tickRem.push(tf);       
                }

                tickRem.forEach(function(tick) {
                    var id    = this.id,
                        panel = this.chart.axesPanels ? this.chart.axesPanels[id] : undefined,
                        index = ticks.indexOf(tick);

                    panel._layoutInfo.ticks.splice(index, 1);
                    panel._layoutInfo.ticksText.splice(index, 1);
                    ticks = panel._layoutInfo.ticks;
                    delete tick;
                }, this);

            }

            return ticks;
        },

        setTicks: function(ticks) {
            var scale = this.scale;

            /*jshint expr:true */
            (scale && !scale.isNull) || def.fail.operationInvalid("Scale must be set and non-null.");

            this.ticks = ticks;
         
            if(scale.type !== 'discrete' &&  this.option('DomainRoundMode') === 'tick') {

                delete this._roundingPaddings;
                // Commit calculated ticks to scale's domain
                // Need at least two ticks, for domain round mode.
                var tickCount = ticks ? ticks.length : 0;
                if(tickCount >= 2){
                    var ti = ticks[0],
                        tf = ticks[tickCount - 1];
                    // CDF603
                    this.adjustDomain(scale, ti, tf);  
                    this.ticks = this.removeTicks(ticks);
                    ticks = this.ticks;
        
                } else{
                    // CDF603
                    this.adjustDomain(scale);
                }

            }

        },

        // CDF603
        /* adjusts the domain if necessary:
        
         if newMin, newMax specified, it will try to set the new domain as the largest of 
         all possible combinations with the previous domain and newMin , newMax
    
         if none are specified, it will keep the old minimum and maximum

         if ratio is specified, it imposes the domain length that corresponds to the 
         current  ratio, keeping the maximum or minimum according to the specified alignment
        */
        adjustDomain: function(scale, newMin, newMax) {
            
            var dim =  this.chart.data.owner.dimensions(this.role.grouping.lastDimensionName());
                domainAfterRatio = this.domainBeforeAdjust;
                currDomain = this.scale.domain();
                di  =  (+ domainAfterRatio[0]),
                df  =  (+ domainAfterRatio[1]),
                min =  (+ (newMin ? Math.min(di, newMin) : di)), 
                max =  (+ (newMax ? Math.max(df, newMax) : df));

                if(di == null || df == null) return; //scale has no domain to adjust?

            // adjust domain according to ratio and range
            if(this.option.isSpecified('Ratio') || (this.option('PreserveRatio') && this.option('FixedLength'))){
                var ratio      = this.option('Ratio') || this.ratio,
                    align      = this.option('DomainAlign'),
                    rangeSize  = scale.size,
                    domainSize;

                if(rangeSize && ratio){

                    domainSize=rangeSize/ratio;
                    // align max -> keep the maximum and clip on the other side
                    // align min -> keep the minimum and clip on the other side
                    // align center -> clipping will be done on both sides      
                    if(align == 'min') max = min + domainSize;
                    else if(align == 'max') min = max - domainSize;
                    else if(align == 'center') {  
                        var center = max - ((max-min) / 2);
                        max  = center + (domainSize / 2);
                        min  = center - (domainSize / 2);
                    }

                } 
        
            } 

            min  =  dim.read(min),
            max  =  dim.read(max);
            if(min!=null) min=min.value;
            if(max!=null) max=max.value;
            if(min==null || max==null) return; 

            scale.domain(min, max);
            this.scale=scale;

            return this;
        },

        setScaleRange: function(size) {
            var rangeInfo = this.getScaleRangeInfo();

            if(rangeInfo) {
                if(rangeInfo.value != null)
                    size = rangeInfo.value;
                else if(rangeInfo.min != null)
                    size = Math.max(Math.min(size, rangeInfo.max), rangeInfo.min);
            }

            var scale  = this.scale;
            scale.min  = 0;    // begin
            scale.max  = size; // end
            scale.size = size; // original size // TODO: remove this...

            // -------------

            if(scale.type === 'discrete') {
                if(rangeInfo) {
                    if(rangeInfo.mode === 'abs')
                        scale.splitBandedCenterAbs(scale.min, scale.max, rangeInfo.band, rangeInfo.space);
                    else // 'rel'
                        scale.splitBandedCenter(scale.min, scale.max, rangeInfo.ratio);
                }
            } else {
                //CDF603
                scale.range(scale.min, scale.max);
                this.forceRatio(scale);
                //if(this.ticks) this.ticks = this.removeTicks(this.ticks);

            }
            return scale;
        },

        // CDF603
        /* if the ratio is not set, sets the ratio according to the priorities
           and then adjusts the domain according to the defined ratio
        */
        forceRatio: function(scale) {

            if(this.option.isSpecified('Ratio')         ||
               this.option.isSpecified('PreserveRatio')   ) {    

                if(!this.domain) return;

                var origDom    = this.domain,
                    prevMinDom = origDom[0],  
                    prevMaxDom = origDom[1],  
                    rangeSize  = scale.size,
                    domainSize = this.option('FixedLength') || prevMaxDom-prevMinDom;

                    if(rangeSize){
                        var initRatio  = rangeSize/domainSize;
                        // Gets the ratio
                        var ratio = this.option('Ratio') || // if specified
                                    this.ratio           || // if preserved
                                    initRatio;              // default (imposed by domain length)

                        // set ratio to preserve only on the first round / render
                        if(this.option('PreserveRatio')) this.setState({ratio:ratio});

                        this.adjustDomain(scale);

                    } 

            }
            return this;
        },


        getScaleRangeInfo: function() {
            if(!this.isDiscrete()) return null;

            var layoutInfo = pvc.visual.discreteBandsLayout(
                this.domainItemCount(),
                this.option('BandSize'),
                this.option('BandSizeMin') || 0,
                this.option('BandSizeMax'),
                this.option('BandSpacing'),
                this.option('BandSpacingMin') || 0,
                this.option('BandSpacingMax'),
                this.option('BandSizeRatio'));

            if(!layoutInfo) return layoutInfo;

            // Multi-charts do not support Fixed/Min/Max restrictions.
            if(this.chart.parent) return {mode: 'rel', min: 0, max: Infinity };

            return layoutInfo;

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

        calcContinuousTicks: function(tickCountMax) {
            return this.scale.ticks(this.desiredTickCount(), {
                roundInside:  this.option('DomainRoundMode') !== 'tick',
                tickCountMax: tickCountMax,
                precision:    this.option('TickUnit'),
                precisionMin: this.tickUnitMinEf(),
                precisionMax: this.tickUnitMaxEf()
            });
        },

        desiredTickCount: function() {
            
            var desiredTickCount = this.option('DesiredTickCount'),
                isDate = this.scaleType === 'timeSeries';

            if(desiredTickCount == null)
                return isDate
                    ? null      // protovis default (=5)
                    : Infinity; // as many as possible, for numbers

            return (isDate && isFinite(desiredTickCount) && desiredTickCount > 10)
                    ? 10
                    : desiredTickCount;
        },

        tickUnitMinEf: function() {
            var unitMin = this.option('TickUnitMin'),
                expoMin = this.option('TickExponentMin');

            if(unitMin == null) unitMin = 0;
            if(expoMin != null && isFinite(expoMin))
                unitMin = Math.max(unitMin, Math.pow(10, Math.floor(expoMin)));

            return unitMin;
        },

        tickUnitMaxEf: function() {
            var unitMax = this.option('TickUnitMax'),
                expoMax = this.option('TickExponentMax');

            if(unitMax == null) unitMax = Infinity;
            if(expoMax != null && isFinite(expoMax))
                unitMax = Math.min(unitMax, 9.999 * Math.pow(10, Math.floor(expoMax)));

            return unitMax;
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
    }
}));

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
    //cast: def.number.to
};


function pvc_castDomainScope(scope) {
    return pvc.parseDomainScope(scope, this.orientation);
}

function pvc_castAxisPosition(side) {
    if(side) {
        if(def.hasOwn(pvc_Sides.namesSet, side)) {
            var mapAlign = pvc.BasePanel[this.orientation === 'y' ? 'horizontalAlign' : 'verticalAlign2'];
            return mapAlign[side];
        }

        if(def.debug >= 2) def.log(def.format("Invalid axis position value '{0}'.", [side]));
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

function getExtensionPrefixes() {
    var extensions = ['axis']; //more generic

    var st = this.scaleType;
    if(st) {
        if(st !== 'discrete') extensions.push('continuousAxis');
        extensions.push(st + 'Axis');
    }

    if(this.v1SecondOrientedId) extensions.push(this.v1SecondOrientedId + 'Axis');

    extensions.push(this.orientedId + 'Axis');
    extensions.push(this.id + 'Axis'); //more specific

    return extensions;
}

pvc_CartesianAxis.options({
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
    FixedLength: {
        resolve: '_resolveFull',
        cast: pvc.cartAxis_parseFixedLength
    },

    Ratio: {
        resolve: '_resolveFull',
        cast: pvc.cartAxis_parseRatio   //change cast to add parser
    },

    DomainAlign: {
        resolve: '_resolveFull',
        cast: pvc.parseDomainAlign,
        value: 'center'
    },


    PreserveRatio: {
        resolve: '_resolveFull',
        cast: Boolean,
        value: false
    },

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
        cast: def.number.to
    },

    // (margins, default) mBMBm, (margins-collapsed) MBMBM, or (flush) BMB
    // Ticks are always centered in band (B).
    // BandMode: {},

    BandSizeRatio: {
        resolve: function(optionInfo) {
            return this._resolveFull(optionInfo) ||
                   this._specifyChartOption(optionInfo, 'panelSizeRatio');
        },
        cast: function(v) {
            v = def.number.toNonNegative(v);
            if(v != null && v > 1) v = null;
            return v;
        },
        getDefault: function() {
            return this.chart._defaultAxisBandSizeRatio;
        }
    },

    BandSize: {
        resolve: '_resolveFull',
        cast:    def.number.toNonNegative
    },

    BandSpacing: {
        resolve: '_resolveFull',
        cast:    def.number.toNonNegative
    },

    BandSizeMin: {
        resolve: '_resolveFull',
        cast:    def.number.toNonNegative
    },

    BandSpacingMin: {
        resolve: '_resolveFull',
        cast:    def.number.toNonNegative
    },

    BandSizeMax: {
        resolve: '_resolveFull',
        cast:    def.number.toNonNegative
    },

    BandSpacingMax: {
        resolve: '_resolveFull',
        cast:    def.number.toNonNegative
    },

    // em
    LabelSpacingMin: {
        resolve: '_resolveFull',
        cast:    def.number.to
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
        cast:  def.number.toPositive
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
        cast:    def.number.to
    },

    TickExponentMax: {
        resolve: '_resolveFull',
        cast:    def.number.to
    },

    TickUnit: { // string or number
        resolve: '_resolveFull'
    },

    TickUnitMin: { // string or number
        resolve: '_resolveFull'
    },

    TickUnitMax: { // string or number
        resolve: '_resolveFull'
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

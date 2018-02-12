/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true */

/**
 * AxisPanel panel.
 */
def
.type('pvc.AxisPanel', pvc.BasePanel)
.init(function(chart, parent, axis, options) {

    // TODO: refactor this initialization code.

    options = def.create(options, {
        anchor: axis.option('Position')
    });

    var anchor = options.anchor || this.anchor;

    // Respect if layout is fixed.
    if(options.paddings == null) {
        options.paddings = pvc_Sides.filterAnchor(anchor, chart._axisOffsetPct);
    }

    // Prevent the border from affecting the box model,
    // providing a static 0 value, independently of the actual drawn value...
    // this.borderWidth = 0;

    this.axis = axis; // must be set before calling base, because of log id

    this.base(chart, parent, options);

    this.roleName = axis.role.name;
    this.isDiscrete = axis.role.isDiscrete();
    this._extensionPrefix = axis.extensionPrefixes;

    if(this.labelSpacingMin == null)
        // The user tolerance for "missing" stuff is much smaller with discrete data
        this.labelSpacingMin = this.isDiscrete ? 0.25 : 1.1; // em

    if(this.showTicks == null) this.showTicks = !this.isDiscrete;

    if(options.font === undefined) {
        var extFont = this._getConstantExtension('label', 'font');
        if(extFont) this.font = extFont;
    }

    if(options.tickLength === undefined) {
        // height or width
        // TODO: Document the use of width/height for finding the tick length.
        var tickLength = +this._getConstantExtension('ticks', this.anchorOrthoLength(anchor));
        if(!isNaN(tickLength) && isFinite(tickLength)) this.tickLength = tickLength;
    }

    var showLabels = this._getConstantExtension("label", "visible");
    if(showLabels != null && !showLabels) {
        this.showLabels = false;
    }
})
.add({
    pvRule:     null,
    pvTicks:    null,
    pvLabel:    null,
    pvRuleGrid: null,
    pvScale:    null,

    isDiscrete: false,
    roleName: null,
    axis: null,
    anchor: "bottom",
    tickLength: 6,

    scale: null,
    ruleCrossesMargin: true,
    font: '9px sans-serif', // label font
    labelSpacingMin: null,

    showMinorTicks:   true,
    showTicks:        null,

    showLabels: true,

    // bullet:       "\u2022"
    // middle-point: "\u00B7"
    // this.isAnchorTopOrBottom() ? ".." : ":"
    hiddenLabelText: "\u00B7",

    _isScaleSetup: false,

    _createLogId: function() {
        return this.base() + " - " + this.axis.id;
    },

    getTicks: function() {
        return this._layoutInfo && this._layoutInfo.ticks;
    },

    _calcLayout: function(layoutInfo) {
        var scale = this.axis.scale,
            clientSize = layoutInfo.clientSize;

        // First time setup
        if(!this._isScaleSetup) {
            this.pvScale = scale;
            this.scale   = scale; // TODO: At least HeatGrid depends on this. Maybe Remove?

            this.extend(scale, "scale");

            this._isScaleSetup = true;
        }

        if(scale.isNull) {
            layoutInfo.axisSize = layoutInfo.restrictions.clientSize[this.anchorOrthoLength()] || 0;
        } else {
            // Ensure minimum length before anything else.
            var a_length  = this.anchorLength(),
                rangeInfo = this.axis.getScaleRangeInfo();

            if(rangeInfo) {
                if(rangeInfo.value != null)
                    clientSize[a_length] = rangeInfo.value;
                else if(rangeInfo.min != null)
                    clientSize[a_length] = Math.max(Math.min(clientSize[a_length], rangeInfo.max), rangeInfo.min);
            }

            // For continuous scale:
            // The scale range is relevant for applying scale ratio calculations.
            // Also, if the scale has a fixed/preserved ratio,
            // setting the range also affects the scale's domain;
            // and the domain should be affected before calculating ticks, if possible.
            // Later, when ticks are determined, axis.setTicks is called.
            // When domainRoundMode is tick, the domain is extended to surely include the ticks.
            this.axis.setScaleRange(clientSize[a_length]);

            this._calcLayoutCore(layoutInfo);
        }

        return this.createAnchoredSize(layoutInfo.axisSize, clientSize);
    },

    _calcLayoutCore: function(layoutInfo) {
        // Fixed axis size?
        var axisSize = layoutInfo.restrictions.clientSize[this.anchorOrthoLength()];

        layoutInfo.axisSize = axisSize; // may be undefined

        if(this.isDiscrete && this.useCompositeAxis) {
            // TODO: composite axis auto axisSize determination
            if(layoutInfo.axisSize == null) layoutInfo.axisSize = 50;
        } else {
            this._readTextProperties(layoutInfo);

            /* I  - Calculate ticks
             * --> layoutInfo.{ ticks, ticksText, maxTextWidth }
             */
            this._calcTicks();

            if(this.scale.type === 'discrete') {
                var overlappedLabelsMode = this.axis.option('OverlappedLabelsMode');
                var labelRotationDirection = this.axis.option('LabelRotationDirection') === "counterclockwise" ? -1 : 1;
                var labelDesiredAngles = this.axis.option('LabelDesiredAngles');

                // How much are label anchors separated from each other
                // (in the axis direction)
                var distanceBetweenTicks = this.scale.range().step; // don't use .band, cause it does not include margins...
                var labelSpacingMin = this.labelSpacingMin;

                var fontPxWidth = pv.Text.measureWidth('x', this.font);

                var anchor = this.anchor;

                pvc.AxisPanel._calcDiscreteOverlapSettings(
                    overlappedLabelsMode, labelRotationDirection, labelDesiredAngles,
                    distanceBetweenTicks, labelSpacingMin, fontPxWidth, anchor,
                    layoutInfo
                );
            }

            /* II - Calculate NEEDED axisSize so that all tick's labels fit */
            this._calcAxisSizeFromLabelBBox(layoutInfo); // -> layoutInfo.requiredAxisSize, layoutInfo.maxLabelBBox

            if(layoutInfo.axisSize == null) layoutInfo.axisSize = layoutInfo.requiredAxisSize;

            /* III - Calculate Trimming Length if: FIXED/NEEDED > AVAILABLE */
            this._calcMaxTextLengthThatFits(); // -> layoutInfo.maxTextWidth, layoutInfo.maxLabelBBox

            /* IV - Calculate overflow paddings */
            this._calcContentOverflowOptional();
        }
    },

    _readTextProperties: function(layoutInfo) {
        var textAngle = this._getExtension('label', 'textAngle');
        layoutInfo.textAngle  = def.number.to(textAngle, 0);
        layoutInfo.textMargin = def.number.to(this._getExtension('label', 'textMargin'), 3);

        var align = this._getExtension('label', 'textAlign');
        if(typeof align !== 'string')
            align = this.isAnchorTopOrBottom() ?
                    "center" :
                    (this.anchor == "left") ? "right" : "left";

        layoutInfo.textAlign = align;

        var baseline = this._getExtension('label', 'textBaseline');
        if(typeof baseline !== 'string') {
            switch (this.anchor) {
                case "right": case "left": case "center":
                    baseline = "middle";
                    break;
                case "bottom":
                    baseline = "top";
                    break;
                //case "top":
                default: baseline = "bottom";
            }
        }
        layoutInfo.textBaseline = baseline;
    },

    _calcAxisSizeFromLabelBBox: function(layoutInfo) {
        var maxLabelBBox = this.showLabels ? this._calcMaxLabelBBox() : null;

        // The length not over the plot area
        var length = maxLabelBBox ? this._getLabelBBoxQuadrantLength(maxLabelBBox, this.anchor) : 0;

        var axisSize = (this.showTicks || this.showLabels ? this.tickLength : 0) + length;

        // Add equal margin on both sides?
        var angle = maxLabelBBox ? maxLabelBBox.sourceAngle : 0;

        if(this.showLabels && !(angle === 0 && this.isAnchorTopOrBottom()))
            // Text height already has some free space in that case so no need to add more.
            axisSize += this.tickLength;

        layoutInfo.requiredAxisSize = Math.max(
            1,
            axisSize,
            def.number.as(this._getConstantExtension("rule", "linewidth"), 1) / 2);
    },

    _getLabelBBoxQuadrantLength: function(labelBBox, quadrantSide) {
        // labelBBox coordinates are relative to the anchor point
        // x points to the right, y points downwards
        //        T
        //        ^
        //        |
        // L  <---0--->  R
        //        |
        //        v
        //        B
        //
        //  +--> xx
        //  |
        //  v yy
        //
        //  x1 <= x2
        //  y1 <= y2
        //
        //  p1 +-------+
        //     |       |
        //     +-------+ p2

        var length;
        switch(quadrantSide) {
            case 'left':   length = -labelBBox.x;  break;
            case 'right':  length =  labelBBox.x2; break;
            case 'top':    length = -labelBBox.y;  break;
            case 'bottom': length =  labelBBox.y2; break;
        }

        return Math.max(length, 0);
    },

    _calcContentOverflowOptional: function() {
        if(!this._layoutInfo.restrictions.canChange) {
            if(def.debug >= 2) this.log.warn("Layout cannot change. Skipping calculation of optional content overflow.");
            return;
        }

        if(this.showLabels)
            this._calcContentOverflowOptionalFromLabelBBox();
    },

    _calcContentOverflowOptionalFromLabelBBox: function() {
        var contentOverflowOptional = null,
            me = this,
            li = me._layoutInfo,
            ticks = li.ticks;

        // Only determine optional overflow if there is no normal overflow...
        if(ticks.length) {
            var ticksBBoxes   = li.ticksBBoxes || this._calcTicksLabelBBoxes(li),
                isTopOrBottom = me.isAnchorTopOrBottom(),
                begSide       = isTopOrBottom ? 'left'  : 'bottom',
                endSide       = isTopOrBottom ? 'right' : 'top',
                scale         = me.scale,
                isDiscrete    = scale.type === 'discrete',
                includeModulo = isDiscrete? li.tickVisibilityStep : 1,
                clientLength  = li.clientSize[me.anchorLength()];

            var evalLabelSideOverflow = function(labelBBox, side, isBegin, index) {
                // Will label be visible?
                if(includeModulo > 1 && (index % includeModulo) !== 0) return;

                var sideLength = me._getLabelBBoxQuadrantLength(labelBBox, side);
                if(sideLength > 1) {// small delta to avoid frequent re-layouts... (the reported font height often causes this kind of "error" in BBox calculation)
                    var anchorPosition = scale(isDiscrete ? ticks[index].value : ticks[index]),
                        sidePosition = isBegin ? (anchorPosition - sideLength) : (anchorPosition + sideLength),
                        sideOverflow = Math.max(0, isBegin ? -sidePosition : (sidePosition - clientLength));
                    if(sideOverflow > 1) {
                        // Discount this panels' paddings
                        // cause they're, in principle, empty space that can be occupied.
                        sideOverflow -= (li.paddings[side] || 0);
                        if(sideOverflow > 1) {
                            // reduction of space causes reduction of band width
                            // which in turn usually causes the overflowPadding to increase,
                            // as the size of the text usually does not change.
                            // Ask a little bit more to hit the target faster.
                            if(isDiscrete) sideOverflow *= 1.05;

                            if(!contentOverflowOptional) {
                                contentOverflowOptional = def.set({}, side, sideOverflow);
                            } else {
                                var currrOverflowPadding = contentOverflowOptional[side];
                                if(currrOverflowPadding == null || (currrOverflowPadding < sideOverflow))
                                    contentOverflowOptional[side] = sideOverflow;
                            }
                        }
                    }
                }
            };

            ticksBBoxes.forEach(function(labelBBox, index) {
                evalLabelSideOverflow(labelBBox, begSide, true,  index);
                evalLabelSideOverflow(labelBBox, endSide, false, index);
            });

            if(def.debug >= 6 && contentOverflowOptional)
                me.log("ContentOverflowOptional = " + def.describe(contentOverflowOptional));
        }

        li.contentOverflowOptional = contentOverflowOptional;
    },

    _calcMaxTextLengthThatFits: function() {
        var layoutInfo = this._layoutInfo;

        if(!this.showLabels || this.compatVersion() <= 1) {
            layoutInfo.maxTextWidth = null;
            return;
        }

        var availableClientLength = layoutInfo.clientSize[this.anchorOrthoLength()];

        var efSize = Math.min(layoutInfo.axisSize, availableClientLength);
        if(efSize >= (layoutInfo.requiredAxisSize - this.tickLength)) { // let overflow by at most tickLength
            // Labels fit
            // Clear to avoid any unnecessary trimming
            layoutInfo.maxTextWidth = null;
        } else {
            // Text may not fit.
            // Calculate maxTextWidth where text is to be trimmed.
            var maxLabelBBox = layoutInfo.maxLabelBBox,

                // Now move backwards, to the max text width...
                maxOrthoLength = efSize - this.tickLength,// ignore the outside margin of `tickLength`.

                // A point at the maximum orthogonal distance from the anchor
                // Points in the outwards orthogonal direction.
                mostOrthoDistantPoint, parallelDirection;

            switch(this.anchor) {
                case 'left':
                    parallelDirection = pv.vector(0, 1);
                    mostOrthoDistantPoint = pv.vector(-maxOrthoLength, 0);
                    break;

                case 'right':
                    parallelDirection = pv.vector(0, 1);
                    mostOrthoDistantPoint = pv.vector(maxOrthoLength, 0);
                    break;

                case 'top':
                    parallelDirection = pv.vector(1, 0);
                    mostOrthoDistantPoint = pv.vector(0, -maxOrthoLength);
                    break;

                case 'bottom':
                    parallelDirection = pv.vector(1, 0);
                    mostOrthoDistantPoint = pv.vector(0, maxOrthoLength);
                    break;
            }

            var orthoOutwardsDir = mostOrthoDistantPoint.norm();

            // Intersect the line that passes through mostOrthoDistantPoint,
            // and has the direction parallelDirection with
            // the top side and with the bottom side of the *original* label box.
            var corners = maxLabelBBox.source.points(),
                botL = corners[0],
                botR = corners[1],
                topR = corners[2],
                topL = corners[3],
                topLRSideDir = topR.minus(topL),
                botLRSideDir = botR.minus(botL),
                intersect = pv.SvgScene.lineIntersect,
                botI = intersect(mostOrthoDistantPoint, parallelDirection, botL, botLRSideDir),
                topI = intersect(mostOrthoDistantPoint, parallelDirection, topL, topLRSideDir);

            // botI and topI will replace two of the original BBox corners
            // The original corners that are at the side of the
            // the line that passes at mostOrthoDistantPoint and has direction parallelDirection (dividing line)
            // further away to the axis, are to be replaced.

            var sideLRWidth  = maxLabelBBox.sourceTextWidth,
                maxTextWidth = sideLRWidth,
                botLI = botI.minus(botL),
                botLILen = botLI.length();
            if(botLILen <= sideLRWidth && botLI.dot(topLRSideDir) >= 0) {
                // botI is between botL and botR
                // One of botL and botR is in one side and
                // the other at the other side of the dividing line.
                // On of the sides will be cut-off.
                // The cut-off side is the one whose points have the biggest
                // distance measured relative to orthoOutwardsDir

                if(botL.dot(orthoOutwardsDir) < botR.dot(orthoOutwardsDir))
                    // botR is farther, so is on the cut-off side
                    maxTextWidth = botLILen; // surely, botLILen < maxTextWidth
                else
                    maxTextWidth = botI.minus(botR).length(); // idem
            }

            var topLI = topI.minus(topL),
                topLILen = topLI.length();
            if(topLILen <= sideLRWidth && topLI.dot(topLRSideDir) >= 0) {
                // topI is between topL and topR

                if(topL.dot(orthoOutwardsDir) < topR.dot(orthoOutwardsDir))
                    // topR is farther, so is on the cut-off side
                    maxTextWidth = Math.min(maxTextWidth, topLILen);
                else
                    maxTextWidth = Math.min(maxTextWidth, topI.minus(topR).length());
            }

            // One other detail.
            // When align (anchor) is center,
            // just cutting on one side of the label original box
            // won't do, because when text is centered, the cut we make in length
            // ends up distributed by both sides...
            if(maxLabelBBox.sourceAlign === 'center') {
                var cutWidth = sideLRWidth - maxTextWidth;

                // Cut same width on the opposite side.
                maxTextWidth -= cutWidth;
            }

            layoutInfo.maxTextWidth = maxTextWidth;
            layoutInfo.maxLabelBBox = this._calcLabelBBox(maxTextWidth);

            if(def.debug >= 3)
                this.log("Trimming labels' text at length " + maxTextWidth.toFixed(2) +
                    "px maxOrthoLength=" + maxOrthoLength.toFixed(2) + "px");
        }
    },

    // ----------------

    _calcTicks: function() {
        var layoutInfo = this._layoutInfo;

        /**
         * The bbox's width is usually very close to the width of the text.
         * The bbox's height is usually about 1/3 bigger than the height of the text,
         * because it includes space for both the descent and the ascent of the font.
         * We'll compensate this by reducing the height of text.
         */
        layoutInfo.textHeight = pv.Text.fontHeight(this.font) * 4/5;
        layoutInfo.maxTextWidth = null;

        // Reset scale to original un-rounded domain
        this.axis.setTicks(null);

        // update maxTextWidth, ticks and ticksText
        switch(this.scale.type) {
            case 'discrete':   this._calcDiscreteTicks(); break;
            case 'timeSeries':
            case 'numeric':    this._calcContinuousTicks(); break;
            default: throw def.error.operationInvalid("Undefined axis scale type");
        }

        this.axis.setTicks(this._layoutInfo.ticks);

        if(layoutInfo.maxTextWidth == null) this._calcTicksTextLength(layoutInfo);
    },

    _calcDiscreteTicks: function() {
        var axis = this.axis;
        var layoutInfo = this._layoutInfo;

        layoutInfo.ticks = axis.domainItems();

        // If the discrete data is of a single Date value type,
        // we want to format the category values with an appropriate precision,
        // instead of showing the default label.
        var format;
        var grouping = axis.role.grouping;
        var tickFormatter = axis.option('TickFormatter');

        if(this.getCompatFlag("discreteTimeSeriesTickFormat") &&
           grouping.isSingleDimension &&
           grouping.singleDimensionType.valueType === Date) {

            // Calculate precision from values' extent.
            var domainValues = axis.domainValues();
            var extent = def.query(domainValues).range();

            // At least two atoms are required.
            if(extent && extent.min !== extent.max) {

                var scale = new pv.Scale.linear(extent.min, extent.max),
                    ticks = scale.ticks();

                if(!tickFormatter) {
                    format = function(child, index) {
                        return ticks.format(domainValues[index]);
                    };
                } else {
                    // Mimic the way in that scale#tickFormat calls tickFormatter.
                    def.copyProps(domainValues, ticks, ['step', 'base', 'mult', 'format']);

                    format = function(child, index) {
                        return tickFormatter.call(
                            domainValues,
                            domainValues[index],
                            domainValues.step,
                            index);
                    };
                }
            } else if(tickFormatter) {
                var dimFormatter = grouping.singleDimensionType.formatter();
                domainValues.step =
                domainValues.base = pvc.time.intervals.d;
                domainValues.mult = 1;
                domainValues.format = function(value) { return dimFormatter(value); };

                format = function(child, index) {
                    return tickFormatter.call(
                        domainValues,
                        domainValues[index],
                        domainValues.step,
                        index);
                };
            }
        } else if(tickFormatter) {

            var domainValueProp = axis.domainItemValueProp();

            format = function(child) {

                var value = child[domainValueProp];

                return tickFormatter(value, child.absLabel);
            };
        }

        if(!format) format = function(child) { return child.absLabel; };

        layoutInfo.ticksText = layoutInfo.ticks.map(format);

        this._clearTicksTextDeps(layoutInfo);
    },

    _clearTicksTextDeps: function(ticksInfo) {
        ticksInfo.maxTextWidth =
        ticksInfo.ticksTextLength =
        ticksInfo.ticksBBoxes = null;
    },

    // --------------

    _calcContinuousTicks: function() {
        var doLog = (def.debug >= 7);
        if(doLog) this.log.group("_calcContinuousTicks");

        var layoutInfo = this._layoutInfo;

        // This allows being sure that we do not need to recalculate ticks/ticksText,
        // in case _calcContinuousBandSizeMin does it for us.
        layoutInfo.ticks = layoutInfo.ticksText = null;

        var bandSizeMin  = this._calcContinuousBandSizeMin(),
            clientLength = layoutInfo.clientSize[this.anchorLength()],
            tickCountMax = this._calcContinuousTickCountMax(bandSizeMin, clientLength),
            ticks        = layoutInfo.ticks,
            roundOutside = this.axis.option('DomainRoundMode') === 'tick';

        if(!ticks || (ticks.length > (roundOutside ? 3 : 1) && ticks.length > tickCountMax)) {
            this._calcContinuousTicksValue(layoutInfo, tickCountMax);
            this._calcContinuousTicksText(layoutInfo);
            ticks = layoutInfo.ticks;
        }

        // Hide 2/3 ticks only if they actually overlap (spacing = 0).
        // Keep at least two ticks until they overlap.
        if(roundOutside) {
            var L = ticks.length;
            if(L > tickCountMax && tickCountMax <= 2 && L <= 3 && ((L-1) * bandSizeMin > clientLength)) {

                // Minimum 3 ticks. When number, usually 0 at center. Hide end ticks.
                if(L === 3) {
                    layoutInfo.ticksText[0] = '';
                    layoutInfo.ticksText[2] = '';
                    layoutInfo.maxTextWidth = null;
                } else if(L === 2) {
                    // Minimum 2 ticks. Maybe 0 in one end. Hide non-zero tick, preferably.
                    layoutInfo.ticksText[(!ticks[1]) ? 0 : 1] = '';
                    layoutInfo.maxTextWidth = null;
                }
            }
        }

        if(def.debug >= 5)
            this.log.info("RESULT count=" + ticks.length + " step="  + ticks.step);

        if(doLog) this.log.groupEnd();
    },

    _calcContinuousTicksValue: function(ticksInfo, tickCountMax) {
        ticksInfo.ticks = this.axis.calcContinuousTicks(tickCountMax);

        if(def.debug > 4) {
            this.log("DOMAIN: " + def.describe(this.scale.domain()));
            this.log("TICKS:  " + def.describe(ticksInfo.ticks));
        }
    },

    _calcContinuousTicksText: function(ticksInfo) {
        var ticksText = ticksInfo.ticksText = ticksInfo.ticks.map(function(tick, index) {
            return this.scale.tickFormat(tick, index);
        }, this);

        this._clearTicksTextDeps(ticksInfo);

        return ticksText;
    },

    _calcContinuousTickCountMax: function(Bmin, TS) {
        if(!Bmin && this.showLabels) return 1;

        // Only account for half label width on the ends.
        // b = B/2
        // B = avgTextLength
        // E = Spacing
        // N = Number of ticks
        //
        // 0              - 1 tick, no inner space. There's always space for 1 tick. Overflows not accounted for.
        // b E b          - 2 ticks
        // b E B E b      - 3 ticks
        // (b E b) (b E b)
        //
        // TB = (N-1) * B
        // TE = (N-1) * E
        // S  = B + E
        // TS = (N-1) * S
        // N - 1 = TS/S
        // N = 1 + TS/S
        // TS <= clientLength

        var li = this._layoutInfo,
            E  = li.textHeight * Math.max(0, this.labelSpacingMin/*em*/);

        return 1 + Math.floor(TS / (Bmin + E)); // >= 1
    },

    _calcContinuousBandSizeMin: function() {
        var domain = this.scale.domain(),
            span = Math.abs(domain[1] - domain[0]);
        if(span < 1e-10 || !isFinite(span)) return 0;

        var li = this._layoutInfo;

        if(this.isAnchorTopOrBottom()) {
            this._calcContinuousTicksValue(li);
            this._calcTicksTextLength(li);
            return Math.max(li.maxTextWidth, li.textHeight);
        }

        // Vertical
        return li.textHeight;
    },

    _calcTicksTextLength: function(ticksInfo) {
        var max  = 0,
            font = this.font,
            ticksText = ticksInfo.ticksText || this._calcContinuousTicksText(ticksInfo),
            ticksTextLength = ticksInfo.ticksTextLength = ticksText.map(function(text) {
                var len = pv.Text.measureWidth(text, font);
                if(len > max) max = len;
                return len;
            });

        ticksInfo.maxTextWidth = ticksInfo.maxTextWidthReal = max;
        ticksInfo.ticksBBoxes  = null;
        ticksInfo.maxLabelBBox = null;

        return ticksTextLength;
    },

    _calcTicksLabelBBoxes: function(ticksInfo) {
        var me = this,
            li = me._layoutInfo,
            ticksTextLength = ticksInfo.ticksTextLength || me._calcTicksTextLength(ticksInfo),
            maxLen = li.maxTextWidth || li.maxTextWidthReal,
            maxBBox = null;

        ticksInfo.ticksBBoxes = ticksTextLength.map(function(len) {
            var labelBBox = me._calcLabelBBox(Math.min(len, maxLen));
            if(!maxBBox && len === maxLen) maxBBox = labelBBox;
            return labelBBox;
        }, me);

        li.maxLabelBBox = maxBBox;

        return ticksInfo.ticksBBoxes;
    },

    _calcMaxLabelBBox: function() {
        var li = this._layoutInfo;

        if(!li.ticksTextLength) this._calcTicksTextLength(li);

        return (li.maxLabelBBox = this._calcLabelBBox(li.maxTextWidth));
    },

    _calcLabelBBox: function(textWidth) {
        var li = this._layoutInfo;
        return pvc.text.getLabelBBox(
                    textWidth,
                    li.textHeight,  // shared stuff
                    li.textAlign,
                    li.textBaseline,
                    li.textAngle,
                    li.textMargin);
    },

    // --------------

    /* # For textAngles we're only interested in the [0, pi/2] range.
         Taking the absolute value of the following two expressions, guarantees:
         * asin from [0, 1] --> [0, pi/2]
         * acos from [0, 1] --> [pi/2, 0]

       # textAngle will assume values from [-pi/2, 0] (<=> [vertical, horizontal])

         var sinOrCos = Math.abs((sMin + h) / bEf);
         var cosOrSin = Math.abs((sMin + w) / bEf);

         var aBase  = Math.asin(sinOrCosVal);
         var aOrtho = Math.acos(cosOrSinVal);
    */

    _createCore: function() {
        if(this.scale.isNull) return;

        // Range
        var clientSize = this._layoutInfo.clientSize,
            paddings   = this._layoutInfo.paddings,
            begin_a = this.anchorOrtho(),
            end_a   = this.anchorOpposite(begin_a),
            size_a  = this.anchorOrthoLength(begin_a),
            rMin = this.ruleCrossesMargin ? -paddings[begin_a] : 0,
            rMax = clientSize[size_a] + (this.ruleCrossesMargin ? paddings[end_a] : 0),
            rSize = rMax - rMin;

        this._rSize = rSize;

        var rootScene = this._getRootScene();

        this.pvRule = new pvc.visual.Rule(this, this.pvPanel, {
                extensionId: 'rule'
            })
            .lock('data', [rootScene])
            .override('defaultColor', def.fun.constant("#666666"))
            // ex: anchor = bottom
            .lock(this.anchorOpposite(), 0) // top (of the axis panel)
            .lock(begin_a, rMin ) // left
            .lock(size_a,  rSize) // width
            .pvMark
            .zOrder(30)
            .strokeDasharray(null) // don't inherit from parent panel
            .lineCap('square');    // So that begin/end ticks better join with the rule

        if(this.isDiscrete) {
            if(this.useCompositeAxis)
                this.renderCompositeOrdinalAxis();
            else
                this.renderOrdinalAxis();
        } else {
            this.renderLinearAxis();
        }
    },

    _getExtensionId: function() {
        return ''; // NOTE: this is different from specifying null
    },

    _getRootScene: function() {
        if(!this._rootScene) {
            var rootScene = this._rootScene =
                    new pvc.visual.CartesianAxisRootScene(null, {
                        panel:  this,
                        source: this._getRootData()
                    }),
                layoutInfo = this._layoutInfo,
                ticks      = layoutInfo.ticks,
                ticksText  = layoutInfo.ticksText;
            if(this.isDiscrete) {
                if(this.useCompositeAxis) {
                    this._buildCompositeScene(rootScene);
                } else {
                    var includeModulo   = layoutInfo.tickVisibilityStep,
                        hiddenLabelText = this.hiddenLabelText,
                        hiddenDatas, hiddenTexts, createHiddenScene, hiddenIndex, keySep;

                    rootScene.vars.tickIncludeModulo = includeModulo;
                    rootScene.vars.hiddenLabelText   = hiddenLabelText;

                    if(includeModulo > 2) {
                        if(def.debug >= 3) this.log.info("Showing only one in every " + includeModulo + " tick labels");

                        keySep = rootScene.group.owner.keySep;

                        createHiddenScene = function() {
                            var k = hiddenDatas.map(function(d) { return d.key; }).join(keySep),
                                l = hiddenTexts.slice(0, 10).join(', ') + (hiddenTexts.length > 10 ? ', ...' : ''),
                                scene = new pvc.visual.CartesianAxisTickScene(rootScene, {
                                        source:    hiddenDatas,
                                        tick:      k,
                                        tickRaw:   k,
                                        tickLabel: l,
                                        isHidden:  true
                                    });

                            scene.dataIndex = hiddenIndex;
                            hiddenDatas = hiddenTexts = hiddenIndex = null;
                        };
                    }

                    ticks.forEach(function(tickData, index) {
                        var isHidden = (index % includeModulo) !== 0;
                        if(isHidden && includeModulo > 2) {
                            if(hiddenIndex == null) hiddenIndex = index;
                            (hiddenDatas || (hiddenDatas = [])).push(tickData);
                            (hiddenTexts || (hiddenTexts = [])).push(ticksText[index]);
                        } else {
                            if(hiddenDatas) createHiddenScene();
                            var scene = new pvc.visual.CartesianAxisTickScene(rootScene, {
                                source:    tickData,
                                tick:      tickData.value,
                                tickRaw:   tickData.rawValue,
                                tickLabel: ticksText[index],
                                isHidden:  isHidden
                            });
                            scene.dataIndex = index;
                        }
                    });

                    if(hiddenDatas) createHiddenScene();
                }
            } else {
                ticks.forEach(function(majorTick, index) {
                    var scene = new pvc.visual.CartesianAxisTickScene(rootScene, {
                                        tick:      majorTick,
                                        tickRaw:   majorTick,
                                        tickLabel: ticksText[index]
                                    });
                    scene.dataIndex = index;
                }, this);
            }
        }
        return this._rootScene;
    },

    _buildCompositeScene: function(rootScene) {

        var isV1Compat = this.compatVersion() <= 1,
            tickFormatter = this.axis.option('TickFormatter');

        // Need this for code below not to throw when drawing the root
        rootScene.vars.tick = new pvc_ValueLabelVar('', "");

        recursive(rootScene);

        function recursive(scene) {
            var data = scene.group;
            if(isV1Compat) {
                // depending on the specific version the
                // properties nodeLabel and label existed as well
                var tickVar = scene.vars.tick;
                scene.nodeValue = scene.value = tickVar.rawValue;
                scene.nodeLabel = scene.label = tickVar.label;
            }

            if(data.childCount()) {
                data
                    .children()
                    .each(function(childData) {
                        var label = tickFormatter
                                ? tickFormatter(childData.value, childData.label)
                                : childData.label,

                            childScene = new pvc.visual.CartesianAxisTickScene(scene, {
                                source:    childData,
                                tick:      childData.value,
                                tickRaw:   childData.rawValue,
                                tickLabel: label
                            });
                        childScene.dataIndex = childData.childIndex();
                        recursive(childScene);
                    });
            }
        }
    },

    _getRootData: function() {
        var data;
        if(this.isDiscrete && this.useCompositeAxis) {
            // This is very similar to Axis#_createDomainData.
            // However, if we'd change the axis' `domainGroupOperator`, `domainReverse`
            // and `_selectDomainItems` to match this, then, the axis' scale would also be reversed.
            // Yet, here, we're only reversing because the composite axis has a weird rendering order.
            //
            // data = this.axis.domainData()

            var orient = this.anchor,
                ka = {
                    visible: this.axis.domainVisibleOnly() ? true  : null,
                    isNull:  this.chart.options.ignoreNulls || this.axis.domainIgnoreNulls() ? false : null,
                    reverse: orient == 'bottom' || orient == 'left',
                    extensionDataSetsMap: this.axis.boundDimensionsDataSetsMap
                };

            data = this.axis.role.select(this.data, ka);
        } else {
            data = this.data;
        }

        return data;
    },

    renderOrdinalAxis: function() {
        var scale = this.scale,
            hiddenLabelText   = this.hiddenLabelText,
            includeModulo     = this._layoutInfo.tickVisibilityStep,
            hiddenStep2       = includeModulo * scale.range().step / 2,
            anchorOpposite    = this.anchorOpposite(),
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            pvRule            = this.pvRule,
            rootScene         = this._getRootScene(),
            layoutInfo        = this._layoutInfo,
            isV1Compat        = this.compatVersion() <= 1,
            wrapper;

        if(isV1Compat) {
            // For use in child marks of pvTicksPanel
            var DataElement = function(tickVar) {
                this.value =
                this.absValue = tickVar.rawValue;
                this.nodeName = '' + (this.value || '');
                this.path = this.nodeName ? [this.nodeName] : [];
                this.label =
                this.absLabel = tickVar.label;
            };

            DataElement.prototype.toString = function() {
                return ''+this.value;
            };

            wrapper = function(v1f) {
                return function(tickScene) {
                    // Fix index due to the introduction of
                    // pvTicksPanel panel.
                    var markWrapped = Object.create(this);
                    markWrapped.index = this.parent.index;

                    return v1f.call(markWrapped, new DataElement(tickScene.vars.tick));
                };
            };
        }

        // Ticks correspond to each data in datas.
        // Ticks are drawn at the center of each band.

        var pvTicksPanel = new pvc.visual.Panel(this, this.pvPanel, {
                extensionId: 'ticksPanel'
            })
            .lock('data', rootScene.childNodes)
            .lock(anchorOpposite, 0) // top (of the axis panel)
            .lockMark(anchorOrtho, function(tickScene) {
                return tickScene.isHidden ?
                       scale(tickScene.previousSibling.vars.tick.value) + hiddenStep2 :
                       scale(tickScene.vars.tick.value);
            })
            .lock('strokeDasharray', null)
            .lock('strokeStyle', null)
            .lock('fillStyle',   null)
            .lock('lineWidth',   0)
            .pvMark
            .zOrder(20); // below axis rule

        if(isV1Compat || this.showTicks) {
            this.pvTicks = new pvc.visual.Rule(this, pvTicksPanel, {
                    extensionId: 'ticks',
                    wrapper:  wrapper
                })
                .lock('data') // Inherited
                .intercept('visible', function(scene) {
                    return !scene.isHidden && this.delegateExtension(true);
                })
                .optional('lineWidth', 1)
                .lock(anchorOpposite,  0) // top
                .lock(anchorOrtho,     0) // left
                .lock(anchorLength,    null)
                .optional(anchorOrthoLength, this.tickLength * 2/3) // slightly smaller than continuous ticks
                .override('defaultColor', function() {
                    if(isV1Compat) return pv.Color.names.transparent;

                    // Inherit ticks color from rule
                    // Control visibility through .visible or lineWidth
                    return pvRule.scene ?
                           pvRule.scene[0].strokeStyle :
                           "#666666";
                })
                .pvMark;
        }

        var font = this.font,
            maxTextWidth = this._layoutInfo.maxTextWidth;

        if(!isFinite(maxTextWidth)) maxTextWidth = 0;

        // An pv anchor on pvTick is not used, on purpose,
        // cause if it were, hidding the tick with .visible,
        // would mess the positioning of the label...
        this.pvLabel = new pvc.visual.Label(
            this,
            pvTicksPanel,
            {
                extensionId:  'label',
                showsInteraction: true,
                noClick:       false,
                noDoubleClick: false,
                noSelect:      false,
                noTooltip:     false,
                noHover:       false, // TODO: to work, scenes would need a common root
                wrapper:       wrapper
            })
            .intercept('visible', function(tickScene) {
                return !tickScene.isHidden
                    ? this.delegateExtension(true)
                    : !!tickScene.vars.hiddenLabelText;
            })
            .intercept('text', function(tickScene) {
                // Allow late overriding (does not affect layout..)
                var text;
                if(tickScene.isHidden) {
                    text = hiddenLabelText;
                } else {
                    text = this.delegateExtension();
                    if(text === undefined) text = tickScene.vars.tick.label;
                    if(maxTextWidth && (!this.showsInteraction() || !tickScene.isActive))
                        text = pvc.text.trimToWidthB(maxTextWidth, text, font, "..", false);
                }
                return text;
             })
            .pvMark
            .zOrder(40) // above axis rule
            .lock(anchorOpposite, this.tickLength)
            .lock(anchorOrtho,    0)
            .font(font)
            .textStyle("#666666");

        if(layoutInfo.textAngleLocked) {
            this.pvLabel.lock('textAngle', layoutInfo.textAngle);
        } else {
            this.pvLabel.textAngle(layoutInfo.textAngle);
        }

        if(layoutInfo.textAlignLocked) {
            this.pvLabel.lock('textAlign', layoutInfo.textAlign);
        } else {
            this.pvLabel.textAlign(layoutInfo.textAlign);
        }

        if(layoutInfo.textBaselineLocked) {
            this.pvLabel.lock('textBaseline', layoutInfo.textBaseline);
        } else {
            this.pvLabel.textBaseline(layoutInfo.textBaseline);
        }

        this._debugTicksPanel(pvTicksPanel);
    },

    /** @override */
    _getTooltipFormatter: function(tipOptions) {
        if(this.axis.option('TooltipEnabled')) {

            tipOptions.gravity = this._calcTipsyGravity();

            var tooltipFormat = this.axis.option('TooltipFormat');
            if(tooltipFormat) return function(context) {
                return tooltipFormat.call(context, context.scene);
            };

            var autoContent = this.axis.option('TooltipAutoContent');
            if(autoContent === 'summary') return this._summaryTooltipFormatter.bind(this);

            if(autoContent === 'value') {
                tipOptions.isLazy = false;
                // Show the label if:
                // 1. the angle is not 0
                // 2. it has been trimmed or grouped with several
                return function(context) {
                    var pvMark = context.pvMark,
                        label  = context.scene.vars.tick.label;

                    return pvMark.textAngle() || (pvMark.text() !== label) ? label : "";
                };
            }
        }
    },

    /** @override */
    _getTooltipPanelClasses: function() {
        return ['cart-axis'];
    },

    _debugTicksPanel: function(pvTicksPanel) {
        if(def.debug >= 16 && this.showLabels) { // one more than general debug box model
            var li = this._layoutInfo,
                ticksBBoxes = li.ticksBBoxes || this._calcTicksLabelBBoxes(li);

            pvTicksPanel
                // Single-point panel (w=h=0)
                .add(pv.Panel)
                    [this.anchorOpposite()](this.tickLength)
                    [this.anchorOrtho()](0)
                    [this.anchorLength()](0)
                    [this.anchorOrthoLength()](0)
                    .fillStyle(null)
                    .strokeStyle(null)
                    .lineWidth(0)
                    .visible(function(tickScene) { return !tickScene.isHidden; })
                .add(pv.Line)
                    .data(function(scene) {
                        var labelBBox = ticksBBoxes[scene.dataIndex],
                            corners   = labelBBox.source.points();
                        // Close the path (not changing corners on purpose)
                        if(corners.length > 1) corners = corners.concat(corners[0]);
                        return corners;
                    })
                    .left(function(p) { return p.x; })
                    .top (function(p) { return p.y; })
                    .strokeStyle('red')
                    .lineWidth(0.5)
                    .strokeDasharray('-');
        }
    },

    renderLinearAxis: function() {
        // NOTE: Includes time series,
        // so "tickScene.vars.tick.value" may be a number or a Date object...

        var scale  = this.scale,
            pvRule = this.pvRule,
            anchorOpposite    = this.anchorOpposite(),
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            rootScene         = this._getRootScene(),
            wrapper;

        if(this.compatVersion() <= 1) {
            wrapper = function(v1f) {
                return function(tickScene) {
                    // Fix index due to the introduction of
                    // pvTicksPanel panel.
                    var markWrapped = Object.create(this);
                    markWrapped.index = this.parent.index;
                    return v1f.call(markWrapped, tickScene.vars.tick.rawValue);
                };
            };
        }

        var pvTicksPanel = new pvc.visual.Panel(this, this.pvPanel, {
                extensionId: 'ticksPanel'
            })
            .lock('data', rootScene.childNodes)
            .lock(anchorOpposite, 0) // top (of the axis panel)
            .lockMark(anchorOrtho, function(tickScene) {
                return scale(tickScene.vars.tick.value);
            })
            .lock('strokeStyle', null)
            .lock('fillStyle',   null)
            .lock('lineWidth',   0)
            .pvMark
            .zOrder(20); // below axis rule

        if(this.showTicks) {
            // (MAJOR) ticks
            var pvTicks = this.pvTicks = new pvc.visual.Rule(this, pvTicksPanel, {
                    extensionId: 'ticks',
                    wrapper: wrapper
                })
                .lock('data') // Inherited
                .override('defaultColor', function() {
                    // Inherit axis color
                    // Control visibility through color or through .visible
                    // NOTE: the rule only has one scene/instance
                    return pvRule.scene
                        ? pvRule.scene[0].strokeStyle
                        : "#666666";
                })
                .lock(anchorOpposite, 0) // top
                .lock(anchorOrtho,    0) // left
                .lock(anchorLength,   null)
                .optional(anchorOrthoLength, this.tickLength)
                .pvMark;

            // MINOR ticks are between major scale ticks
            if(this.showMinorTicks) {
                var layoutInfo = this._layoutInfo,
                    ticks      = layoutInfo.ticks,
                    tickCount  = ticks.length,
                    // Assume a linear scale
                    minorTickOffset = tickCount > 1
                        ? Math.abs(scale(ticks[1]) - scale(ticks[0])) / 2
                        : 0;

                this.pvMinorTicks = new pvc.visual.Rule(this, this.pvTicks, {
                        extensionId: 'minorTicks',
                        wrapper: wrapper
                    })
                    .lock('data') // Inherited
                    .intercept('visible', function(scene) {
                        // The last minor tick isn't visible - only show between major ticks.
                        // Hide if the previous major tick is hidden.
                        var visible = (scene.childIndex() < tickCount - 1) &&
                                      (!pvTicks.scene || pvTicks.scene[0].visible);

                        return visible && this.delegateExtension(true);
                    })
                    .override('defaultColor', function() {
                        // Inherit ticks color
                        // Control visibility through color or through .visible
                        return pvTicks.scene
                            ? pvTicks.scene[0].strokeStyle
                            : "#666666";
                    })
                    .lock(anchorOpposite, 0) // top
                    .lock(anchorLength,   null)
                    .optional(anchorOrthoLength, this.tickLength / 2)
                    .lockMark(anchorOrtho, minorTickOffset)
                    .pvMark;
            }
        }

        this.renderLinearAxisLabel(pvTicksPanel, wrapper);

        this._debugTicksPanel(pvTicksPanel);
    },

    renderLinearAxisLabel: function(pvTicksPanel, wrapper) {
        // Labels are visible (only) on MAJOR ticks,
        // On first and last tick care is taken
        // with their H/V alignment so that
        // the label is not drawn off the chart.

        var anchorOpposite = this.anchorOpposite(),
            anchorOrtho    = this.anchorOrtho(),
            font = this.font,
            maxTextWidth = this._layoutInfo.maxTextWidth;

        if(!isFinite(maxTextWidth)) maxTextWidth = 0;

        var pvLabel = this.pvLabel = new pvc.visual.Label(this, pvTicksPanel, {
                extensionId: 'label',
                noHover: false,
                showsInteraction: true,
                wrapper: wrapper
            })
            .lock('data') // inherited
            .optional('text', function(tickScene) {
                var text = tickScene.vars.tick.label;
                if(maxTextWidth && (!this.showsInteraction() || !tickScene.isActive))
                    text = pvc.text.trimToWidthB(maxTextWidth, text, font, '..', false);
                return text;
             })
            .pvMark
            .lock(anchorOpposite, this.tickLength)
            .lock(anchorOrtho,    0)
            .zOrder(40) // above axis rule
            .font(this.font)
            .textStyle("#666666");

        // Label alignment
        var rootPanel = this.pvPanel.root;
        if(this.isAnchorTopOrBottom()) {
            pvLabel
                .textBaseline(anchorOpposite)
                .textAlign(function(tickScene) {
                    var absLeft;
                    if(this.index === 0) {
                        absLeft = pvLabel.toScreenTransform().transformHPosition(pvLabel.left());
                        // the "left" of the text is anchored to the tick's anchor
                        if(absLeft <= 0) return 'left';
                    } else if(this.index === tickScene.parent.childNodes.length - 1) {
                        absLeft = pvLabel.toScreenTransform().transformHPosition(pvLabel.left());
                        // the "right" of the text is anchored to the tick's anchor
                        if(absLeft >= rootPanel.width()) return 'right';
                    }
                    return 'center';
                });
        } else {
            pvLabel
                .textAlign(anchorOpposite)
                .textBaseline(function(tickScene) {
                    var absTop;
                    if(this.index === 0) {
                        absTop = pvLabel.toScreenTransform().transformVPosition(pvLabel.top());
                        // the "bottom" of the text is anchored to the tick's anchor// the "bottom" of the text is anchored to the tick's anchor
                        if(absTop >= rootPanel.height()) return 'bottom';
                    } else if(this.index === tickScene.parent.childNodes.length - 1) {
                        absTop = pvLabel.toScreenTransform().transformVPosition(pvLabel.top());
                        // the "top" of the text is anchored to the tick's anchor
                        if(absTop <= 0) return 'top';
                    }
                    return 'middle';
                });
        }
    },

    // ----------------------------
    // Click / Double-click
    _onV1Click: function(context, handler) {
        if(this.isDiscrete && this.useCompositeAxis)
            handler.call(context.pvMark, context.scene, context.event);
    },

    _onV1DoubleClick: function(context, handler) {
        if(this.isDiscrete && this.useCompositeAxis)
            handler.call(context.pvMark, context.scene, context.event);
    },

    /** @override */
    _getSelectableMarks: function() {
        if(this.isDiscrete && this.isVisible && this.pvLabel) return this.base();
    },

    /////////////////////////////////////////////////
    //begin: composite axis
    renderCompositeOrdinalAxis: function() {
        var isTopOrBottom = this.isAnchorTopOrBottom(),
            axisDirection = isTopOrBottom ? 'h' : 'v',
            //cutoffs -> snap to vertical/horizontal
            H_CUTOFF_ANG = 0.30,
            V_CUTOFF_ANG = 1.27,
            diagDepthCutoff = 2, // depth in [-1/(n+1), 1]
            vertDepthCutoff = 2,
            font = this.font,
            diagMargin = pv.Text.fontHeight(font) / 2,
            layout = this._pvLayout = this._getCompositeLayoutSingleCluster(),
            align = isTopOrBottom           ? "center" :
                    (this.anchor == "left") ? "right"  : "left",
            wrapper;

        // See what will fit so we get consistent rotation
        layout.node
            .def("fitInfo", null)
            .height(function(tickScene, e, f) {
                // Just iterate and get cutoff
                var fitInfo = pvc.text.getFitInfo(tickScene.dx, tickScene.dy, tickScene.vars.tick.label, font, diagMargin);
                if(!fitInfo.h) {
                    if(axisDirection === 'v' && fitInfo.v) // prefer vertical
                        vertDepthCutoff = Math.min(diagDepthCutoff, tickScene.depth);
                    else
                        diagDepthCutoff = Math.min(diagDepthCutoff, tickScene.depth);
                }
                this.fitInfo(fitInfo);
                return tickScene.dy;
            });

        // label space (left transparent)
        // var lblBar =
        layout.node.add(pv.Bar)
            .fillStyle('rgba(127,127,127,.001)')
            .strokeStyle(function(tickScene) {
                return (tickScene.maxDepth === 1 || !tickScene.maxDepth)
                    ? null // 0, 0.5, 1
                    : "rgba(127,127,127,0.3)"; // Non-terminal items, so grouping is visible
            })
            .lineWidth(function(tickScene) {
                return (tickScene.maxDepth === 1 || !tickScene.maxDepth)
                    ? 0
                    : 0.5; //non-terminal items, so grouping is visible
            })
            .text(function(tickScene) {
                return tickScene.vars.tick.label;
            });

        if(this.compatVersion() <= 1) wrapper = function(v1f) {
            return function(tickScene) { return v1f.call(this, tickScene); };
        };

        // draw labels and make them fit
        this.pvLabel = new pvc.visual.Label(this, layout.label, {
                extensionId:  'label',
                noClick:       false,
                noDoubleClick: false,
                noSelect:      false,
                noTooltip:     false,
                noHover:       false, // TODO: to work, scenes would need a common root
                showsInteraction: true,
                wrapper:       wrapper,
                tooltipArgs:   {
                    options: {offset: diagMargin * 2}
                }
            })
            .pvMark
            .def('lblDirection', 'h')
            .textAngle(function(tickScene) {
                if(tickScene.depth >= vertDepthCutoff && tickScene.depth < diagDepthCutoff)
                    return this.lblDirection('v'), -Math.PI/2;

                if(tickScene.depth >= diagDepthCutoff) {
                    var tan = tickScene.dy/tickScene.dx,
                        angle = Math.atan(tan);
                        //hip = Math.sqrt(tickScene.dy*tickScene.dy + tickScene.dx*tickScene.dx);

                    if(angle > V_CUTOFF_ANG) return this.lblDirection('v'), -Math.PI/2;
                    if(angle > H_CUTOFF_ANG) return this.lblDirection('d'), -angle;
                }
                //horizontal
                return this.lblDirection('h'), 0;
            })
            .textMargin(1)
            //override central alignment for horizontal text in vertical axis
            .textAlign(function(tickScene) {
                return (axisDirection != 'v' || tickScene.depth >= vertDepthCutoff || tickScene.depth >= diagDepthCutoff)
                    ? 'center'
                    : align;
            })
            .left(function(tickScene) {
                return (axisDirection != 'v' || tickScene.depth >= vertDepthCutoff || tickScene.depth >= diagDepthCutoff)
                    ? tickScene.x + tickScene.dx/2
                    : ((align == 'right')? tickScene.x + tickScene.dx : tickScene.x);
            })
            .font(font)
            .textStyle("#666666")
            .text(function(tickScene) {
                var label = tickScene.vars.tick.label;
                if(!tickScene.isActive || !this.sign.showsInteraction()) {
                    var fitInfo = this.fitInfo();
                    switch(this.lblDirection()) {
                        case 'h':
                            if(!fitInfo.h) return pvc.text.trimToWidthB(tickScene.dx, label, font, '..');
                            break;
                        case 'v':
                            if(!fitInfo.v) return pvc.text.trimToWidthB(tickScene.dy, label, font, '..');
                            break;
                        case 'd':
                           if(!fitInfo.d) {
                              //var ang = Math.atan(tickScene.dy/tickScene.dx);
                              var diagonalLength = Math.sqrt(def.sqr(tickScene.dy) + def.sqr(tickScene.dx));
                              return pvc.text.trimToWidthB(diagonalLength - diagMargin, label, font, '..');
                            }
                            break;
                    }
                }
                return label;
            })
            // Hide the root level to avoid selection [BACKLOG-15967]
            .visible(function(tickScene) {
                return tickScene.depth > 0;
            });
    },

    _getCompositeLayoutSingleCluster: function() {
        var rootScene   = this._getRootScene(),
            orientation = this.anchor,
            // + 1 -> Displace to take out bogus-root
            maxDepth    = rootScene.group.treeHeight + 1,
            depthLength = this._layoutInfo.axisSize,
            margin = maxDepth > 2 ? ((1/12) * depthLength) : 0, // heuristic compensation
            baseDisplacement = depthLength / maxDepth - margin,
            scaleFactor = maxDepth / (maxDepth - 1),
            orthoLength = pvc.BasePanel.orthogonalLength[orientation],
            displacement = (orthoLength == 'width')
                ? (orientation === 'left' ? [-baseDisplacement, 0] : [baseDisplacement, 0])
                : (orientation === 'top'  ? [0, -baseDisplacement] : [0, baseDisplacement]);

        this.pvRule
            .sign
            .override('defaultColor',       def.fun.constant(null))
            .override('defaultStrokeWidth', def.fun.constant(0)   );

        var panel = this.pvRule
            .add(pv.Panel)
                [orthoLength](depthLength)
                .strokeStyle(null)
                .lineWidth(0) //cropping panel
            .add(pv.Panel)
                [orthoLength](depthLength * scaleFactor)
                .strokeStyle(null)
                .lineWidth(0);// panel resized and shifted to make bogus root disappear

        panel.transform(pv.Transform.identity.translate(displacement[0], displacement[1]));

        // Create with bogus-root
        // pv.Hierarchy must always have exactly one root and
        //  at least one element besides the root
        return panel.add(pv.Layout.Cluster.Fill)
            .nodes(rootScene.nodes())
            .orient(orientation);
    },

    _calcTipsyGravity: function() {
        switch(this.anchor) {
            case 'bottom': return 's';
            case 'top':    return 'n';
            case 'left':   return 'w';
            case 'right':  return 'e';
        }
        return 's';
    }
    // end: composite axis
    /////////////////////////////////////////////////
});

/**
 * Processes and applies the label overlap settings for discrete axis, modifying the layoutInfo parameter.
 *
 * @param {String} overlappedLabelsMode How labels are laid out when they overlap. Possible values:
 *                                       leave          Allow labels to overlap.
 *                                       hide           Hide labels that overlap (default).
 *                                       rotate         Rotate the labels so they don't overlap. If not possible,
 *                                                      lets labels overlap.
 *                                       rotatethenhide Rotate the labels so they don't overlap. If not possible,
 *                                                      hides the labels that still overlap.
 *
 * @param {int} labelRotationDirection  Controls the rotation direction of the labels. Possible values:
 *                                        1             Clockwise rotation (default).
 *                                       -1             Counterclockwise rotation. Inverts the signal of the
 *                                                      rotation angle.
 *
 * @param {array} labelDesiredAngles    List of angles to try when overlappedLabelsMode is 'rotate' or 'rotatethenhide'.
 *                                      The nearest above the minimum non-overlapping angle is chosen, or just the
 *                                      nearest if none is bigger.
 *
 * @param {Number} distanceBetweenTicks The amount of separation between the label anchors.
 *
 * @param {Number} labelSpacingMin      Minimum separation space that the user wants between the closest edges of the
 *                                      bounding boxes of two consecutive labels, measured perpendicularly to the label
 *                                      text direction. Value in em.
 *
 * @param {Number} fontPxWidth          Additional minimum horizontal space between labels, derived from the font's
 *                                      'x' character width.
 *
 * @param {String} axisAnchor           The axis position. Possible values:
 *                                       top, bottom, left, right.
 *
 * @param {Object} layoutInfo           In/out parameter with the current layout info.
 *
 *                                      The following properties are read:
 *                                       textHeight:         The height of the labels.
 *                                       maxTextWidth:       The maximum label width.
 *                                       textAngle:          The label rotation angle (when overlappedLabelsMode isn't
 *                                                           'rotate' or 'rotatethenhide').
 *                                       ticks.length:       The axis total number of ticks.
 *
 *                                      This function always adds these properties:
 *                                       tickVisibilityStep: The visibility step of the labels.
 *                                       textAngle:          The text angle to apply to the labels.
 *                                       textAngleLocked:    Flag disallowing fruther textAngle changes.
 *
 *                                      Additionally, if overlappedLabelsMode is 'rotate' or 'rotatethenhide', these
 *                                      properties are also defined:
 *                                       textAlign:          The horizontal label anchor.
 *                                       textAlignLocked:    Flag disallowing fruther textAlign changes.
 *                                       textBaseline:       The vertical label anchor.
 *                                       textBaselineLocked: Flag disallowing fruther textBaselineLocked changes.
 *
 * @description
 *
 *  Horizontal axis:
 *
 *             |      D     |
 *     ┌──────⦫⦪────────────⦫⦪──────────┐
 *     │    ⟋   ⟍α       ⟋   ⟍        │
 *     │  ⟋       ⟍    ⟋ h     ⟍      │
 *     │⟋           ⟍⟋           ⟍    │
 *      ⟍             ⟍             ⟍  │
 *        ⟍             ⟍             ⟍│
 *
 *   w = label width
 *   h = label height
 *
 *   D = distanceBetweenTicks
 *
 *   α = label rotation
 *
 *  If the label width is larger than the distance between ticks, then the minimum non-overlapping angle (α') will be
 * the angle of the right triangle formed by two adjacent, parallel and non-overlapping labels, so that:
 *
 *                 oposite side (h)
 *      sin α' = ────────────────────
 *                  hypotenuse (D)
 *
 *                        h
 *          α' = arcsin( ─── )
 *                        D
 *
 *  Inversely, when given an angle α, the minimum required distance between ticks is:
 *                 h
 *          D' = ──────
 *               sin α
 *
 *  Ticks must be hidden if D' > D. The round up of D'/D gives the minimum tick visibility step avoiding overlap.
 *
 *  Additional separating spaces are also considered in calculations.
 *
 * Vertical axis:
 *
 *  In the vertical axis, and because of the assumption that the label height is always smaller than maximum label width,
 * the minimum non-overlapping angle is always 0, with a corresponding minimum required distance between ticks equal
 * to the label height.
 *
 *  Automatic rotation will, therefore, never occur, but if 'rotate' or 'rotatethenhide' overlap modes are used, it will
 * respect the desired angles parameter (always choosing the first) and automatic label anchoring.
 *
 *  The maximum non-overlapping angle is also calculated, from which point onwards the labels will start to overlap:
 *
 *                  oposite side (h)
 *      cos α'' = ────────────────────
 *                   hypotenuse (D)
 *
 *                         h
 *          α'' = arccos( ─── )
 *                         D
 *
 *  For a given angle α, the minimum required distance between ticks is:
 *
 *                 h
 *          D' = ──────
 *               cos α
 *
 *  Apart from these, the same calculations for the horizontal axis apply.
 *
 **/
pvc.AxisPanel._calcDiscreteOverlapSettings = function(overlappedLabelsMode, labelRotationDirection, labelDesiredAngles,
                                                      distanceBetweenTicks, labelSpacingMin, fontPxWidth, axisAnchor,
                                                      layoutInfo) {
    // useful constants
    var FLAT_ANGLE = Math.PI;
    var RIGHT_ANGLE = FLAT_ANGLE / 2;
    var FULL_ANGLE = FLAT_ANGLE * 2;

    // by default, show them all
    layoutInfo.tickVisibilityStep = 1;

    var canHide = false;
    var canRotate = false;
    switch(overlappedLabelsMode) {
        case 'hide':
            canHide = true;
            break;

        case 'rotate':
            canRotate = true;
            break;

        case 'rotatethenhide':
            canHide = true;
            canRotate = true;
            break;

        default:
            // Let them lay in the wild
            return;
    }

    if(labelRotationDirection == null) {
        labelRotationDirection = 1;
    }

    // slice for not changing original array
    labelDesiredAngles = !labelDesiredAngles ? [] : labelDesiredAngles.slice().sort(function(v1, v2) {
        return Math.abs(v1) - Math.abs(v2);
    });

    var h = layoutInfo.textHeight;
    var w = layoutInfo.maxTextWidth;

    var sMin = h * labelSpacingMin, /* parameter in em */
        sMinH = sMin, // Between baselines
        sMinW  = fontPxWidth + sMin; // Between sides (orthogonal to baseline)

    var onBottom = axisAnchor === "bottom";
    var onLeft = axisAnchor === "left";

    var isHorizontal = onBottom || axisAnchor === "top";

    var min_angle = 0;
    var max_angle = FULL_ANGLE;

    // if the label height is smaller than distanceBetweenTicks there isn't
    // any non-overlapping angle, i.e. all angles overlap
    var all_angles_overlap = h + sMinH > distanceBetweenTicks;

    if(!all_angles_overlap && w + sMinW > distanceBetweenTicks) {
        if (isHorizontal) {
            min_angle = pvc.normAngle(Math.asin(h / (distanceBetweenTicks - sMinH)));
        } else {
            max_angle = pvc.normAngle(Math.acos(h / (distanceBetweenTicks - sMinH)));
        }
    }

    // The angle that the text makes to the x axis (clockwise, y points downwards)
    // it is normalized to the interval [0, 2π[
    var a;
    if(canRotate) {
        if(labelDesiredAngles.length > 0) {
            // choose the first angle above the minimum non-overlapping angle
            // if none, chooses to the last desired angle
            for (var i = 0; i !== labelDesiredAngles.length; ++i) {
                a = pvc.normAngle(labelDesiredAngles[i] * labelRotationDirection);

                // angular distance to the closest axis
                var abs_angle = a > FLAT_ANGLE ? Math.abs(a - FULL_ANGLE) : a;
                var angle_to_axis = abs_angle < RIGHT_ANGLE ? abs_angle : abs_angle - FLAT_ANGLE;
                if(!all_angles_overlap && angle_to_axis >= min_angle) {
                    // no need for hiding only if between min and max angle, as it will never overlap
                    canHide = canHide && (all_angles_overlap || angle_to_axis > max_angle);

                    break;
                }
            }
        } else {
            // if no desired angles are provided...
            if(!all_angles_overlap) {
                // choose the minimum non-overlapping angle
                a = pvc.normAngle(min_angle * labelRotationDirection);

                // no need for hiding, it will never overlap
                canHide = false;
            } else {
                // choose the less overlapping angle
                a = isHorizontal ? RIGHT_ANGLE : 0;
            }
        }

        layoutInfo.textAngle = a;
        layoutInfo.textAngleLocked = true;

        var align = "center";
        var baseline = "middle";

        if (isHorizontal) {
            if(a > 0 && a < FLAT_ANGLE) {
                align = onBottom ? "left" : "right";
            } else if(a > FLAT_ANGLE && a < FULL_ANGLE) {
                align = onBottom ? "right" : "left";
            }

            if(a >= 0 && a < RIGHT_ANGLE || a > FLAT_ANGLE + RIGHT_ANGLE && a < FULL_ANGLE) {
                baseline = onBottom ? "top" : "bottom";
            } else if(a > RIGHT_ANGLE && a < FULL_ANGLE - RIGHT_ANGLE) {
                baseline = onBottom ? "bottom" : "top";
            }
        } else {
            if(a >= 0 && a < RIGHT_ANGLE || a > FLAT_ANGLE + RIGHT_ANGLE && a < FULL_ANGLE) {
                align = onLeft ? "right" : "left";
            } else if(a > RIGHT_ANGLE && a < FULL_ANGLE - RIGHT_ANGLE) {
                align = onLeft ? "left" : "right";
            }

            if(a > 0 && a < FLAT_ANGLE) {
                baseline = onLeft ? "top" : "bottom";
            } else if(a > FLAT_ANGLE && a < FULL_ANGLE) {
                baseline = onLeft ? "bottom" : "top";
            }
        }

        layoutInfo.textAlign = align;
        layoutInfo.textAlignLocked = true;

        layoutInfo.textBaseline = baseline;
        layoutInfo.textBaselineLocked = true;
    } else {
        a = layoutInfo.textAngle ? pvc.normAngle(layoutInfo.textAngle * labelRotationDirection) : 0;

        layoutInfo.textAngle = a;
        // Must lock because of labelRotationDirection
        layoutInfo.textAngleLocked = true;
    }

    var tickCount = layoutInfo.ticks.length;

    if(canHide && tickCount > 2) {
        var projected_size;
        if(isHorizontal) {
            projected_size = Math.min(w, Math.abs(h / Math.sin(a))) + (all_angles_overlap || a < min_angle ? sMinW : sMinH);
        } else {
            projected_size = Math.min(w, Math.abs(h / Math.cos(a))) + (all_angles_overlap || a > max_angle ? sMinW : sMinH);
        }

        if(projected_size > distanceBetweenTicks) {
            var tim = Math.ceil(projected_size / distanceBetweenTicks);
            if(!isFinite(tim) || tim < 1 || Math.ceil(tickCount / tim) < 2) {
                tim = 1;
            }

            layoutInfo.tickVisibilityStep = tim;
        }
    }
};

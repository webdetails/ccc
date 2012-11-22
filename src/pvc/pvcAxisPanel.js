
/**
 * AxisPanel panel.
 */
def
.type('pvc.AxisPanel', pvc.BasePanel)
.init(function(chart, parent, axis, options) {
    
    options = def.create(options, {
        anchor: axis.option('Position')
    });
    
    var anchor = options.anchor || this.anchor;
    
    function readSize(prop){
        var value = options[prop];
        if(value == null){
            value = options['axis' + def.firstUpperCase(prop)];
        }
        
        if(value != null){
            // Single size (a number or a string with only one number)
            // should be interpreted as meaning the orthogonal length.
            var aol = this.anchorOrthoLength(anchor);
            value = pvc.Size.to(value, {singleProp: aol});
            
            delete value[this.anchorLength(anchor)];
        }
        
        return value;
    }
    
    // size && sizeMax
    options.size    = readSize.call(this, 'size');
    options.sizeMax = readSize.call(this, 'sizeMax');
    
    // Prevent the border from affecting the box model,
    // providing a static 0 value, independently of the actual drawn value...
    //this.borderWidth = 0;
    
    this.base(chart, parent, options);
    
    this.axis = axis;
    this.roleName = axis.role.name;
    this.isDiscrete = axis.role.isDiscrete();
    this._extensionPrefix = axis.extensionPrefixes;
    
    if(this.labelSpacingMin == null){
        // The user tolerance for "missing" stuff is much smaller with discrete stuff
        this.labelSpacingMin = this.isDiscrete ? 0.1 : 1.5; // em
    }
    
    if(this.showTicks == null){
        this.showTicks = !this.isDiscrete;
    }

    if(options.font === undefined){
        var extFont = this._getConstantExtension('label', 'font');
        if(extFont){
            this.font = extFont;
        }
    }
    
    if(options.tickLength === undefined){
        // height or width
        var tickLength = +this._getConstantExtension('ticks', this.anchorOrthoLength(anchor)); 
        if(!isNaN(tickLength) && isFinite(tickLength)){
            this.tickLength = tickLength;
        }
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
    axisSize: undefined,
    tickLength: 6,
    
    scale: null,
    ruleCrossesMargin: true,
    font: '9px sans-serif', // label font
    labelSpacingMin: null,
    // To be used in linear scales
    domainRoundMode: 'none',
    desiredTickCount: null,
    tickExponentMin:  null,
    tickExponentMax:  null,
    showMinorTicks:   true,
    showTicks:        null,
    
    // bullet:       "\u2022"
    // middle-point: "\u00B7"
    // this.isAnchorTopOrBottom() ? ".." : ":"
    hiddenLabelText: "\u00B7",
    
    _isScaleSetup: false,
    
    _createLogInstanceId: function(){
        return this.base() + " - " + this.axis.id;
    },
    
    getTicks: function(){
        return this._layoutInfo && this._layoutInfo.ticks;
    },
    
    _calcLayout: function(layoutInfo){
        
        var scale = this.axis.scale;
        
        if(!this._isScaleSetup){
            this.pvScale = scale;
            this.scale   = scale; // TODO: At least HeatGrid depends on this. Maybe Remove?
            
            this.extend(scale, "scale"); // TODO - review extension interface
            
            this._isScaleSetup = true;
        }
        
        if(scale.isNull){
            layoutInfo.axisSize = 0;
        } else {
            this._calcLayoutCore(layoutInfo);
        }
        
        return this.createAnchoredSize(layoutInfo.axisSize, layoutInfo.clientSize);
    },
    
    _calcLayoutCore: function(layoutInfo){
        // Fixed axis size?
        var axisSize = layoutInfo.desiredClientSize[this.anchorOrthoLength()];
        
        layoutInfo.axisSize = axisSize; // may be undefined
        
        if (this.isDiscrete && this.useCompositeAxis){
            if(layoutInfo.axisSize == null){
                layoutInfo.axisSize = 50;
            }
        } else {
            layoutInfo.textAngle  = def.number.as(this._getExtension('label', 'textAngle'),  0);
            layoutInfo.textMargin = def.number.as(this._getExtension('label', 'textMargin'), 3);
            
            /* I  - Calculate ticks
             * --> layoutInfo.{ ticks, ticksText, maxTextWidth } 
             */
            this._calcTicks();
            
            if(this.scale.type === 'discrete'){
                this._calcDiscreteTicksHidden();
            }
            
            /* II - Calculate NEEDED axisSize so that all tick's labels fit */
            this._calcAxisSizeFromLabel(); // -> layoutInfo.requiredAxisSize, layoutInfo.labelBBox
            
            if(layoutInfo.axisSize == null){
                layoutInfo.axisSize = layoutInfo.requiredAxisSize;
            }
            
            /* III - Calculate Trimming Length if: FIXED/NEEDED > AVAILABLE */
            this._calcMaxTextLengthThatFits();
            
            
            /* IV - Calculate overflow paddings */
            this._calcOverflowPaddings();
            
            // Release memory.
            if(pvc.debug > 16){
                layoutInfo.labelBBox = null;
            } // else keep this to draw the debug paths around the labels
        }
    },
    
    _calcAxisSizeFromLabel: function(){
        this._calcLabelBBox();
        this._calcAxisSizeFromLabelBBox();
    },

    // --> layoutInfo.labelBBox
    _calcLabelBBox: function(){
        var layoutInfo = this._layoutInfo;
        
        var align = this._getExtension('label', 'textAlign');
        if(typeof align !== 'string'){
            align = this.isAnchorTopOrBottom() ? 
                    "center" : 
                    (this.anchor == "left") ? "right" : "left";
        }
        
        var baseline = this._getExtension('label', 'textBaseline');
        if(typeof baseline !== 'string'){
            switch (this.anchor) {
                case "right":
                case "left":
                case "center":
                    baseline = "middle";
                    break;
                    
                case "bottom": 
                    baseline = "top";
                    break;
                  
                default:
                //case "top": 
                    baseline = "bottom";
                    //break;
            }
        } 
        
        layoutInfo.labelBBox = pvc.text.getLabelBBox(
                        layoutInfo.maxTextWidth, 
                        layoutInfo.textHeight, 
                        align, 
                        baseline, 
                        layoutInfo.textAngle, 
                        layoutInfo.textMargin);
    },
    
    _calcAxisSizeFromLabelBBox: function(){
        var layoutInfo = this._layoutInfo;
        var labelBBox = layoutInfo.labelBBox;
        
        // The length not over the plot area
        var length = this._getLabelBBoxQuadrantLength(labelBBox, this.anchor);

        // --------------
        
        var axisSize = this.tickLength + length; 
        
        // Add equal margin on both sides?
        var angle = labelBBox.sourceAngle;
        if(!(angle === 0 && this.isAnchorTopOrBottom())){
            // Text height already has some free space in that case
            // so no need to add more.
            axisSize += this.tickLength;
        }
        
        layoutInfo.requiredAxisSize = axisSize;
    },
    
    _getLabelBBoxQuadrantLength: function(labelBBox, quadrantSide){
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
        switch(quadrantSide){
            case 'left':   length = -labelBBox.x;  break;
            case 'right':  length =  labelBBox.x2; break;
            case 'top':    length = -labelBBox.y;  break;
            case 'bottom': length =  labelBBox.y2; break;
        }
        
        return Math.max(length, 0);
    },
    
    _calcOverflowPaddings: function(){
        if(!this._layoutInfo.canChange){
            if(pvc.debug >= 2){
                this._log("[WARNING] Layout cannot change. Skipping calculation of overflow paddings.");
            }
            return;
        }

        if(!this._layoutInfo.labelBBox){
            this._calcLabelBBox();
        }
        
        this._calcOverflowPaddingsFromLabelBBox();
    },
    
    _calcOverflowPaddingsFromLabelBBox: function(){
        var overflowPaddings = null;
        
        var layoutInfo = this._layoutInfo;
        var ticks = layoutInfo.ticks;
        var tickCount = ticks.length;
        if(tickCount){
            var paddings   = layoutInfo.paddings;
            var labelBBox  = layoutInfo.labelBBox;
            var isTopOrBottom = this.isAnchorTopOrBottom();
            var begSide    = isTopOrBottom ? 'left'  : 'top'   ;
            var endSide    = isTopOrBottom ? 'right' : 'bottom';
            var isDiscrete = this.scale.type === 'discrete';
            
            var clientLength = layoutInfo.clientSize[this.anchorLength()];
            this.axis.setScaleRange(clientLength);
            
            var sideTickOffset;
            if(isDiscrete){
                var halfBand = this.scale.range().step / 2; // don't use .band, cause it does not include margins... 
                sideTickOffset = def.set({}, 
                        begSide, halfBand,
                        endSide, halfBand);
            } else {
                sideTickOffset = def.set({}, 
                        begSide, this.scale(ticks[0]),
                        endSide, clientLength - this.scale(ticks[tickCount - 1]));
            }
            
            [begSide, endSide].forEach(function(side){
                var overflowPadding  = this._getLabelBBoxQuadrantLength(labelBBox, side);
                if(overflowPadding > 0){
                    // Discount real paddings that this panel already has
                    // cause they're, in principle, empty space that can be occupied.
                    overflowPadding -= (paddings[side] || 0);
                    if(overflowPadding > 0){
                        // On discrete axes, half of the band width is not yet overflow.
                        overflowPadding -= sideTickOffset[side];
                        if(overflowPadding > 1){ // small delta to avoid frequent relayouts... (the reported font height often causes this kind of "error" in BBox calculation)
                            if(isDiscrete){
                                // reduction of space causes reduction of band width
                                // which in turn usually causes the overflowPadding to increase,
                                // as the size of the text usually does not change.
                                // Ask a little bit more to hit the target faster.
                                overflowPadding *= 1.05;
                            }
                            
                            if(!overflowPaddings){ 
                                overflowPaddings= {}; 
                            }
                            overflowPaddings[side] = overflowPadding;
                        }
                    }
                }
            }, this);
            
            if(pvc.debug >= 6 && overflowPaddings){
                this._log("OverflowPaddings = " + pvc.stringify(overflowPaddings));
            }
        }
        
        layoutInfo.overflowPaddings = overflowPaddings;
    },
    
    _calcMaxTextLengthThatFits: function(){
        var layoutInfo = this._layoutInfo;
        
        if(this.compatVersion() <= 1){
            layoutInfo.maxTextWidth = null;
            return;
        }
        
        var availableClientLength = layoutInfo.clientSize[this.anchorOrthoLength()];
        
        var efSize = Math.min(layoutInfo.axisSize, availableClientLength);
        if(efSize >= (layoutInfo.requiredAxisSize - this.tickLength)){ // let overflow by at most tickLength
            // Labels fit
            // Clear to avoid any unnecessary trimming
            layoutInfo.maxTextWidth = null;
        } else {
            // Text may not fit. 
            // Calculate maxTextWidth where text is to be trimmed.
            var labelBBox = layoutInfo.labelBBox;
            
            // Now move backwards, to the max text width...
            var maxOrthoLength = efSize - 2 * this.tickLength;
            
            // A point at the maximum orthogonal distance from the anchor
            // Points in the outwards orthogonal direction.
            var mostOrthoDistantPoint;
            var parallelDirection;
            switch(this.anchor){
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
            var corners = labelBBox.sourceCorners;
            var botL = corners[0];
            var botR = corners[1];
            var topR = corners[2];
            var topL = corners[3];
            
            var topLRSideDir = topR.minus(topL);
            var botLRSideDir = botR.minus(botL);
            var intersect = pv.SvgScene.lineIntersect;
            var botI = intersect(mostOrthoDistantPoint, parallelDirection, botL, botLRSideDir);
            var topI = intersect(mostOrthoDistantPoint, parallelDirection, topL, topLRSideDir);
            
            // botI and topI will replace two of the original BBox corners
            // The original corners that are at the side of the 
            // the line that passes at mostOrthoDistantPoint and has direction parallelDirection (dividing line)
            // further away to the axis, are to be replaced.
            
            var sideLRWidth  = labelBBox.sourceTextWidth;
            var maxTextWidth = sideLRWidth;
            
            var botLI = botI.minus(botL);
            var botLILen = botLI.length();
            if(botLILen <= sideLRWidth && botLI.dot(topLRSideDir) >= 0){
                // botI is between botL and botR
                // One of botL and botR is in one side and 
                // the other at the other side of the dividing line.
                // On of the sides will be cut-off.
                // The cut-off side is the one whose points have the biggest
                // distance measured relative to orthoOutwardsDir
                
                if(botL.dot(orthoOutwardsDir) < botR.dot(orthoOutwardsDir)){
                    // botR is farther, so is on the cut-off side
                    maxTextWidth = botLILen; // surely, botLILen < maxTextWidth
                } else {
                    maxTextWidth = botI.minus(botR).length(); // idem
                }
            }
            
            var topLI = topI.minus(topL);
            var topLILen = topLI.length();
            if(topLILen <= sideLRWidth && topLI.dot(topLRSideDir) >= 0){
                // topI is between topL and topR
                
                if(topL.dot(orthoOutwardsDir) < topR.dot(orthoOutwardsDir)){
                    // topR is farther, so is on the cut-off side
                    maxTextWidth = Math.min(maxTextWidth, topLILen);
                } else {
                    maxTextWidth = Math.min(maxTextWidth, topI.minus(topR).length());
                }
            }
            
            // One other detail.
            // When align (anchor) is center,
            // just cutting on one side of the label original box
            // won't do, because when text is centered, the cut we make in length
            // ends up distributed by both sides...
            if(labelBBox.sourceAlign === 'center'){
                var cutWidth = sideLRWidth - maxTextWidth;
                
                // Cut same width on the opposite side. 
                maxTextWidth -= cutWidth;
            }
            
            layoutInfo.maxTextWidth = maxTextWidth;
            
            if(pvc.debug >= 3){
                this._log("Trimming labels' text at length " + maxTextWidth.toFixed(2) + "px maxOrthoLength=" + maxOrthoLength.toFixed(2) + "px");
            }
        }
    },
    
    // ----------------
    
    _calcTicks: function(){
        var layoutInfo = this._layoutInfo;
        
        layoutInfo.textHeight = pvc.text.getTextHeight("m", this.font);
        layoutInfo.maxTextWidth = null;
        
        // Reset scale to original unrounded domain
        this.axis.setTicks(null);
        
        // update maxTextWidth, ticks and ticksText
        switch(this.scale.type){
            case 'discrete':   this._calcDiscreteTicks();   break;
            case 'timeSeries': this._calcTimeSeriesTicks(); break;
            case 'numeric':    this._calcNumberTicks(layoutInfo); break;
            default: throw def.error.operationInvalid("Undefined axis scale type"); 
        }
        
        this.axis.setTicks(layoutInfo.ticks);
        
        var clientLength = layoutInfo.clientSize[this.anchorLength()];
        this.axis.setScaleRange(clientLength);
        
        if(layoutInfo.maxTextWidth == null){
            layoutInfo.maxTextWidth = 
                def.query(layoutInfo.ticksText)
                    .select(function(text){ return pvc.text.getTextLength(text, this.font); }, this)
                    .max();
        }
    },
    
    _calcDiscreteTicks: function(){
        var layoutInfo = this._layoutInfo;
        var data = this.chart.visualRoles(this.roleName)
                        .flatten(this.chart.data, {visible: true});
         
        layoutInfo.data  = data;
        layoutInfo.ticks = data._children;
         
        layoutInfo.ticksText = def.query(data._children)
                            .select(function(child){ return child.absLabel; })
                            .array();
    },
    
    _calcTimeSeriesTicks: function(){
        this._calcContinuousTicks(this._layoutInfo/*, this.desiredTickCount */); // not used
    },
    
    _calcNumberTicks: function(layoutInfo){
        var desiredTickCount = this.desiredTickCount;
        if(desiredTickCount == null){
            if(this.isAnchorTopOrBottom()){
                this._calcNumberHTicks();
                return;
            }
            
            desiredTickCount = this._calcNumberVDesiredTickCount();
        }
        
        this._calcContinuousTicks(this._layoutInfo, desiredTickCount);
    },
    
    // --------------
    
    _calcContinuousTicks: function(ticksInfo, desiredTickCount){
        this._calcContinuousTicksValue(ticksInfo, desiredTickCount);
        this._calcContinuousTicksText(ticksInfo);
    },
    
    _calcContinuousTicksValue: function(ticksInfo, desiredTickCount){
        ticksInfo.ticks = this.scale.ticks(
                                desiredTickCount, {
                                    roundInside:       this.domainRoundMode !== 'tick',
                                    numberExponentMin: this.tickExponentMin,
                                    numberExponentMax: this.tickExponentMax
                                });
    },
    
    _calcContinuousTicksText: function(ticksInfo){
        
        ticksInfo.ticksText = def.query(ticksInfo.ticks)
                               .select(function(tick){ return this.scale.tickFormat(tick); }, this)
                               .array();
    },
    
    // --------------
    
    _calcDiscreteTicksHidden: function(){
        return this._tickIncludeModulo = this._calcDiscreteTicksHiddenCore();
    },
    
    _calcDiscreteTicksHiddenCore: function(){
        var mode = this.axis.option('OverlappedLabelsMode');
        if(mode !== 'hide'){
            return 1;
        }
        
        var layoutInfo = this._layoutInfo;
        var ticks = layoutInfo.ticks;
        var tickCount = ticks.length;
        if(tickCount <= 1) {
            return 1;
        }
        
        // Calculate includeModulo depending on labelSpacingMin
            
        // scale is already setup
        
        // How much label anchors are separated from each other
        // (in the direction of the axis)
        var b = this.scale.range().step; // don't use .band, cause it does not include margins...
        
        // Height of label box
        var h = layoutInfo.textHeight;
        
        // Width of label box
        var w = layoutInfo.maxTextWidth;  // Should use the average value?
        
        if(!(w > 0 && h > 0 && b > 0)){
            return 1;
        }
        
        // Minimum space that the user wants separating 
        // the closest edges of the bounding boxes of two consecutive labels, 
        // measured perpendicularly to the label text direction.
        var sMin = h * this.labelSpacingMin /* parameter in em */;
        
        // The angle that the text makes to the x axis (clockwise,y points downwards) 
        var a = layoutInfo.textAngle;
        
        var isTopOrBottom = this.isAnchorTopOrBottom();
        var sinOrCos =  isTopOrBottom ? 'sin' : 'cos';
        var cosOrSin = !isTopOrBottom ? 'sin' : 'cos';
        
        var tickIncludeModulo = 1;
        do{
            // Effective distance between anchors,
            // that results from showing only 
            // one in every 'tickIncludeModulo' ticks.
            var bEf = tickIncludeModulo * b;
            
            // The space that separates the closest edges, 
            // that are parallel to the text direction,
            // of the bounding boxes of 
            // two consecutive (not skipped) labels. 
            var sBase  = bEf * Math.abs(Math[sinOrCos](a)) - h;
            
            // The same, for the edges orthogonal to the text direction
            var sOrtho = bEf * Math.abs(Math[cosOrSin](a)) - w;
            
            // At least one of this distances must respect sMin
            if(sBase >= sMin || sOrtho >= sMin){
                break;
            }
            
            // Hide one more tick
            tickIncludeModulo++;
            
            // Are there still at least two ticks left?
        } while(Math.ceil(tickCount / tickIncludeModulo) > 1);
        
        if(tickIncludeModulo > 1 && pvc.debug >= 3){
            this._log("Showing only one in every " + tickIncludeModulo + " tick labels");
        }
        
        return tickIncludeModulo;
    },
    
    // --------------
    
    _calcNumberVDesiredTickCount: function(){
        var layoutInfo = this._layoutInfo;
        var lineHeight = layoutInfo.textHeight * (1 + Math.max(0, this.labelSpacingMin /*em*/)); 
        var clientLength = layoutInfo.clientSize[this.anchorLength()];
        
        return Math.max(1, ~~(clientLength / lineHeight));
    },
    
    _calcNumberHTicks: function(){
        var layoutInfo = this._layoutInfo;
        var clientLength = layoutInfo.clientSize[this.anchorLength()];
        var spacing = layoutInfo.textHeight * Math.max(0, this.labelSpacingMin/*em*/);
        var desiredTickCount = this._calcNumberHDesiredTickCount(spacing);
        
        var doLog = (pvc.debug >= 7);
        var dir, prevResultTickCount;
        var ticksInfo, lastBelow, lastAbove;
        do {
            if(doLog){ this._log("calculateNumberHTicks TickCount IN desired = " + desiredTickCount); }
            
            ticksInfo = {};
            
            this._calcContinuousTicksValue(ticksInfo, desiredTickCount);
            
            var ticks = ticksInfo.ticks;
            
            var resultTickCount = ticks.length;
            
            if(ticks.exponentOverflow){
                // TODO: Check if this part of the algorithm is working ok
                
                // Cannot go anymore in the current direction, if any
                if(dir == null){
                    if(ticks.exponent === this.exponentMin){
                        lastBelow = ticksInfo;
                        dir =  1;
                    } else {
                        lastAbove = ticksInfo;
                        dir = -1;
                    }
                } else if(dir === 1){
                    if(lastBelow){
                        ticksInfo = lastBelow;
                    }
                    break;
                } else { // dir === -1
                    if(lastAbove){
                        ticksInfo = lastAbove;
                    }
                    break;
                }
                
            } else if(prevResultTickCount == null || resultTickCount !== prevResultTickCount){
                
                if(doLog){ 
                    this._log("calculateNumberHTicks TickCount desired/resulting = " + desiredTickCount + " -> " + resultTickCount); 
                }
                
                prevResultTickCount = resultTickCount;
                
                this._calcContinuousTicksText(ticksInfo);
                
                var length = this._calcNumberHLength(ticksInfo, spacing);
                var excessLength = ticksInfo.excessLength = length - clientLength;
                var pctError = ticksInfo.error = Math.abs(excessLength / clientLength);
                
                if(doLog){
                    this._log("calculateNumberHTicks error=" + (excessLength >= 0 ? "+" : "-") + (ticksInfo.error * 100).toFixed(0) + "% count=" + resultTickCount + " step=" + ticks.step);
                    this._log("calculateNumberHTicks Length client/resulting = " + clientLength + " / " + length + " spacing = " + spacing);
                }
                
                if(excessLength > 0){
                    // More ticks than can fit
                    if(desiredTickCount === 1){
                        // Edge case
                        // Cannot make dir = -1 ...
                        if(resultTickCount === 3 && pctError <= 1){
                         // remove the middle tick
                            ticksInfo.ticks.splice(1,1);
                            ticksInfo.ticksText.splice(1,1);
                            ticksInfo.ticks.step *= 2;
                        } else {
                         // keep only the first tick
                            ticksInfo.ticks.length = 1;
                            ticksInfo.ticksText.length = 1;
                        }
                        delete ticksInfo.maxTextWidth;
                        break;
                    }
                    
                    if(lastBelow){
                        // We were below max length and then overshot...
                        // Choose the best conforming one
                        // Always choose the one that conforms to MinSpacing
                        //if(pctError > lastBelow.error){
                            ticksInfo = lastBelow;
                        //}
                        break;
                    }
                    
                    // Backup last *above* calculation
                    lastAbove = ticksInfo;
                    
                    dir = -1;
                } else {
                    // Less ticks than could fit
                    
                    if(pctError <= 0.05 || dir === -1){
                        // Acceptable
                        // or
                        // Already had exceeded the length and had decided to go down
//                        if(lastAbove && pctError > lastAbove.error){
//                            ticksInfo = lastAbove;
//                        }
                        
                        break;
                    }
                    
                    // Backup last *below* calculation
                    lastBelow = ticksInfo;
                                            
                    dir = +1;
                }
            }
            
            desiredTickCount += dir;
        } while(true);
        
        if(ticksInfo){
            layoutInfo.ticks = ticksInfo.ticks;
            layoutInfo.ticksText = ticksInfo.ticksText;
            layoutInfo.maxTextWidth = ticksInfo.maxTextWidth;
            
            if(pvc.debug >= 5){
                this._log("calculateNumberHTicks RESULT error=" + (ticksInfo.excessLength >= 0 ? "+" : "-") + (ticksInfo.error * 100).toFixed(0) + "% count=" + ticksInfo.ticks.length + " step=" + ticksInfo.ticks.step);
            }
        }
        
        if(doLog){ this._log("calculateNumberHTicks END"); }
    },
    
    _calcNumberHDesiredTickCount: function(spacing){
        // The initial tick count is determined 
        // from the formatted min and max values of the domain.
        var layoutInfo = this._layoutInfo;
        var domainTextLength = this.scale.domain().map(function(tick){
                tick = +tick.toFixed(2); // crop some decimal places...
                var text = this.scale.tickFormat(tick);
                return pvc.text.getTextLength(text, this.font);
            }, this);
        
        var avgTextLength = Math.max((domainTextLength[1] + domainTextLength[0]) / 2, layoutInfo.textHeight);
        
        var clientLength = layoutInfo.clientSize[this.anchorLength()];
        
        return Math.max(1, ~~(clientLength / (avgTextLength + spacing)));
    },
    
    _calcNumberHLength: function(ticksInfo, spacing){
        // Measure full width, with spacing
        var ticksText = ticksInfo.ticksText;
        var maxTextWidth = 
            def.query(ticksText)
                .select(function(text){ 
                    return pvc.text.getTextLength(text, this.font); 
                }, this)
                .max();
        
        /*
         * Include only half the text width on edge labels, 
         * cause centered labels are the most common scenario.
         * 
         * |w s ww s ww s w|
         * 
         */
        return Math.max(maxTextWidth, (ticksText.length - 1) * (maxTextWidth + spacing));
    },
    
    _createCore: function() {
        if(this.scale.isNull){
            return;
        }
        
        // Range
        var clientSize = this._layoutInfo.clientSize;
        var paddings   = this._layoutInfo.paddings;
        
        var begin_a = this.anchorOrtho();
        var end_a   = this.anchorOpposite(begin_a);
        var size_a  = this.anchorOrthoLength(begin_a);
        
        var rMin = this.ruleCrossesMargin ? -paddings[begin_a] : 0;
        var rMax = clientSize[size_a] + (this.ruleCrossesMargin ? paddings[end_a] : 0);
        var rSize = rMax - rMin;
        
        var ruleParentPanel = this.pvPanel;

        this._rSize = rSize;
        
        var rootScene = this._getRootScene();
        
        this.pvRule = new pvc.visual.Rule(this, this.pvPanel, {
                extensionId: 'rule'
            })
            .lock('data', [rootScene])
            .override('defaultColor', def.fun.constant(pv.Color.names.black))
            // ex: anchor = bottom
            .lock(this.anchorOpposite(), 0) // top (of the axis panel)
            .lock(begin_a, rMin )  // left
            .lock(size_a,  rSize) // width
            .pvMark
            .zOrder(30)
            .strokeDasharray(null) // don't inherit from parent panel
            .lineCap('square')     // So that begin/end ticks better join with the rule
            ;

        if (this.isDiscrete){
            if(this.useCompositeAxis){
                this.renderCompositeOrdinalAxis();
            } else {
                this.renderOrdinalAxis();
            }
        } else {
            this.renderLinearAxis();
        }
    },
  
    _getExtensionId: function(){
        return ''; // NOTE: this is different from specifying null
    },
    
    _getRootScene: function(){
        if(!this._rootScene){
            var rootScene = 
                this._rootScene = 
                new pvc.visual.CartesianAxisRootScene(null, {
                    panel: this, 
                    group: this._getRootData()
                });
            
            var layoutInfo = this._layoutInfo;
            if (this.isDiscrete){
                if(this.useCompositeAxis){
                    this._buildCompositeScene(rootScene);
                } else {
                    layoutInfo.ticks.forEach(function(tickData){
                        new pvc.visual.CartesianAxisTickScene(rootScene, {
                            group:     tickData,
                            tick:      tickData.value,
                            tickRaw:   tickData.rawValue,
                            tickLabel: tickData.absLabel
                        });
                    });
                }
            } else {
                var ticksText = layoutInfo.ticksText;
                layoutInfo.ticks.forEach(function(majorTick, index){
                    new pvc.visual.CartesianAxisTickScene(rootScene, {
                        tick:      majorTick,
                        tickRaw:   majorTick,
                        tickLabel: ticksText[index]
                    });
                }, this);
            }
        }
        
        return this._rootScene;
    },
    
    _buildCompositeScene: function(rootScene){
        
        var isV1Compat = this.compatVersion() <= 1;
         
        // Need this for code below not to throw when drawing the root
        rootScene.vars.tick = new pvc.visual.ValueLabelVar('', "");
        
        recursive(rootScene);
        
        function recursive(scene){
            var data = scene.group;
            if(isV1Compat){
                // depending on the specific version the
                // properties nodeLabel and label existed as well
                var tickVar = scene.vars.tick;
                scene.nodeValue = scene.value = tickVar.rawValue;
                scene.nodeLabel = scene.label = tickVar.label;
            }
            
            if(data.childCount()){
                data
                    .children()
                    .each(function(childData){
                        var childScene = new pvc.visual.CartesianAxisTickScene(scene, {
                            group:     childData,
                            tick:      childData.value,
                            tickRaw:   childData.rawValue,
                            tickLabel: childData.label
                        });
                        
                        recursive(childScene);
                    });
            }
        }
    },
    
    _getRootData: function(){
        var chart = this.chart;
        var data  = chart.data;
        
        if (this.isDiscrete && this.useCompositeAxis){
            var orientation = this.anchor;
            var reverse     = orientation == 'bottom' || orientation == 'left';
            data  = chart.visualRoles(this.roleName)
                         .select(data, {visible: true, reverse: reverse});
        }
        
        return data;
    },
    
    _getOrthoScale: function(){
        var orthoType = this.axis.type === 'base' ? 'ortho' : 'base';
        return this.chart.axes[orthoType].scale; // index 0
    },

    _getOrthoAxis: function(){
        var orthoType = this.axis.type === 'base' ? 'ortho' : 'base';
        return this.chart.axes[orthoType]; // index 0
    },

    renderOrdinalAxis: function(){
        var myself = this,
            scale = this.scale,
            hiddenLabelText   = this.hiddenLabelText,
            anchorOpposite    = this.anchorOpposite(),
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            layoutInfo        = this._layoutInfo,
            pvRule            = this.pvRule,
            ticks             = layoutInfo.ticks,
            data              = layoutInfo.data,
            itemCount         = layoutInfo.ticks.length,
            rootScene         = this._getRootScene(),
            includeModulo     = this._tickIncludeModulo;

        rootScene.vars.tickIncludeModulo = includeModulo;
        rootScene.vars.hiddenLabelText   = hiddenLabelText;
        
        var wrapper;
        if(this.compatVersion() <= 1){
            // For use in child marks of pvTicksPanel
            wrapper = function(v1f){
                return function(tickScene){
                    // Fix index due to the introduction of 
                    // pvTicksPanel panel.
                    var markWrapped = Object.create(this);
                    markWrapped.index = this.parent.index;
                    
                    return v1f.call(markWrapped, tickScene.vars.tick.rawValue);
                };
            };
        }
        
        // Ticks correspond to each data in datas.
        // Ticks are drawn at the center of each band.
        
        var pvTicksPanel = new pvc.visual.Panel(this, this.pvPanel, {
                extensionId: 'ticksPanel'
            })
            .lock('data', rootScene.childNodes)
            // This non-extendable property stores
            //  if the tick would be hidden by
            //  virtue of the includeModulo effect.
            .localProperty('hidden')
            .lockMark('hidden', function(){ // for use by
                return (this.index % includeModulo) !== 0;
            })
            .lock(anchorOpposite, 0) // top (of the axis panel)
            .lockMark(anchorOrtho, function(tickScene){
                return scale(tickScene.vars.tick.value);
            })
            .lock('strokeDasharray', null)
            .lock('strokeStyle', null)
            .lock('fillStyle',   null)
            .lock('lineWidth',   0)
            .pvMark
            .zOrder(20) // below axis rule
            ;
        
        if(this.showTicks){
            var pvTicks = this.pvTicks = new pvc.visual.Rule(this, pvTicksPanel, {
                    extensionId: 'ticks',
                    wrapper:  wrapper
                })
                .lock('data')            // Inherited    
                // By default is visible unless the includeModulo hides it
                .intercept('visible', function(){
                    var visible = this.delegateExtension();
                    if(visible === undefined){
                        visible = !this.pvMark.parent.hidden();
                    }
                    return visible;
                })
                .optional('lineWidth', 1)
                .lock(anchorOpposite,  0) // top
                .lock(anchorOrtho,     0) // left
                .lock(anchorLength,    null)
                .optional(anchorOrthoLength, this.tickLength * 2/3) // slightly smaller than continuous ticks
                .override('defaultColor', function(type){
                    // Inherit ticks color
                    // Control visibility through .visible or lineWidth
                    return pvRule.scene ? 
                           pvRule.scene[0].strokeStyle : 
                           pv.Color.names.black;
                })
                .pvMark
                ;
        }
        
        // Determine anchored text properties
        var baseline;
        var align;
        switch(this.anchor){
            case 'top':
                align = 'center';
                baseline = 'bottom';
                break;
                
            case 'bottom':
                align = 'center';
                baseline = 'top';
                break;
                
            case 'left': 
                align = 'right';
                baseline = 'middle';
                break;
            
            case 'right': 
                align = 'left';
                baseline = 'middle';
                break;
        }
        
        var font = this.font;
        
        var maxTextWidth = this._layoutInfo.maxTextWidth;
        if(!isFinite(maxTextWidth)){
            maxTextWidth = 0;
        }
        
        // An pv anchor on pvTick is not used, on purpose,
        // cause if it were, hidding the tick with .visible,
        // would mess the positioning of the label...
        this.pvLabel = new pvc.visual.Label(
            this,
            pvTicksPanel,
            {
                extensionId: 'label',
                noClick:       false,
                noDoubleClick: false,
                noSelect:      false,
                noTooltip:    false,
                noHover:       false, // TODO: to work, scenes would need a common root
                wrapper:       wrapper,
                tooltipArgs:   {
                    // TODO: should be an option whether a data tooltip is desired
                    buildTooltip: function(context){ return context.scene.vars.tick.label; },
                    isLazy: false,
                    
                    options: {
                        gravity: this._calcTipsyGravity()
                    }
                }
            })
            .pvMark
            .zOrder(40) // above axis rule
            
            .lock(anchorOpposite, this.tickLength)
            .lock(anchorOrtho,    0)
            
            .font(font)
            
            .textAlign(align)
            .textBaseline(baseline)
            
            .text(function(tickScene){
                var text;
                if(this.parent.hidden()){
                    text = tickScene.vars.hiddenLabelText;
                } else {
                    text = tickScene.vars.tick.label;
                    if(maxTextWidth){
                        text = pvc.text.trimToWidthB(maxTextWidth, text, font, "..", false);
                    }
                }
                
                return text;
             })
            ;
        
        this._debugTicksPanel(pvTicksPanel);
    },
    
    _debugTicksPanel: function(pvTicksPanel){
        if(pvc.debug >= 16){ // one more than general debug box model
            var corners = this._layoutInfo.labelBBox.sourceCorners;
            // Close the path
            if(corners.length > 1){
                // not changing corners on purpose
                corners = corners.concat(corners[0]);
            }
            
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
                 .add(pv.Line)
                    .visible(function(){
                        var gp = this.parent.parent;
                        return !gp.hidden || !gp.hidden(); 
                     })
                    .data(corners)
                    .left(function(p){ return p.x; })
                    .top (function(p){ return p.y; })
                    .strokeStyle('red')
                    .lineWidth(0.5)
                    .strokeDasharray('-')
                    ;
        }
    },
    
    renderLinearAxis: function(){
        // NOTE: Includes time series, 
        // so "tickScene.vars.tick.value" may be a number or a Date object...
        
        var scale  = this.scale,
            orthoAxis  = this._getOrthoAxis(),
            orthoScale = orthoAxis.scale,
            pvRule     = this.pvRule,
            anchorOpposite    = this.anchorOpposite(),
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            rootScene         = this._getRootScene();
        
        var wrapper;
        if(this.compatVersion() <= 1){
            wrapper = function(v1f){
                return function(tickScene){
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
            .lockMark(anchorOrtho, function(tickScene){
                return scale(tickScene.vars.tick.value);
            })
            .lock('strokeStyle', null)
            .lock('fillStyle',   null)
            .lock('lineWidth',   0)
            .pvMark
            .zOrder(20) // below axis rule
            ;
        
        if(this.showTicks){
            // (MAJOR) ticks
            var pvTicks = this.pvTicks = new pvc.visual.Rule(this, pvTicksPanel, {
                    extensionId: 'ticks',
                    wrapper: wrapper
                })
                .lock('data') // Inherited
                .override('defaultColor', function(){
                    // Inherit axis color
                    // Control visibility through color or through .visible
                    // NOTE: the rule only has one scene/instance
                    return pvRule.scene ? 
                           pvRule.scene[0].strokeStyle :
                           pv.Color.names.black;
                })
                .lock(anchorOpposite, 0) // top
                .lock(anchorOrtho,    0) // left
                .lock(anchorLength,   null)
                .optional(anchorOrthoLength, this.tickLength)
                .pvMark
                ;
            
            // MINOR ticks are between major scale ticks
            if(this.showMinorTicks){
                var layoutInfo = this._layoutInfo;
                var ticks      = layoutInfo.ticks;
                var tickCount  = ticks.length;
                // Assume a linear scale
                var minorTickOffset = tickCount > 1 ? 
                        Math.abs(scale(ticks[1]) - scale(ticks[0])) / 2 : 
                        0;
                        
                this.pvMinorTicks = new pvc.visual.Rule(this, this.pvTicks, {
                        extensionId: 'minorTicks',
                        wrapper: wrapper
                    })
                    .lock('data') // Inherited
                    .intercept('visible', function(){
                        // The last minor tick isn't visible - only show between major ticks.
                        // Hide if the previous major tick is hidden.
                        var visible = (this.index < tickCount - 1) && 
                                      (!pvTicks.scene || pvTicks.scene[0].visible);
                        
                        return visible && this.delegateExtension(true);
                    })    
                    .override('defaultColor', function(){
                        // Inherit ticks color
                        // Control visibility through color or through .visible
                        return pvTicks.scene ? 
                               pvTicks.scene[0].strokeStyle : 
                               pv.Color.names.black;
                    })
                    .lock(anchorOpposite, 0) // top
                    .lock(anchorLength,   null)
                    .optional(anchorOrthoLength, this.tickLength / 2)
                    .lockMark(anchorOrtho, minorTickOffset)
                    .pvMark
                    ;
            }
        }
        
        this.renderLinearAxisLabel(pvTicksPanel, wrapper);
        
        this._debugTicksPanel(pvTicksPanel);
    },
    
    renderLinearAxisLabel: function(pvTicksPanel, wrapper){
        // Labels are visible (only) on MAJOR ticks,
        // On first and last tick care is taken
        //  with their H/V alignment so that
        //  the label is not drawn off the chart.

        // Use this margin instead of textMargin, 
        // which affects all margins (left, right, top and bottom).
        // Exception is the small 0.5 textMargin set below...
        var pvTicks = this.pvTicks;
        var anchorOpposite = this.anchorOpposite();
        var anchorOrtho    = this.anchorOrtho();
        
//        var pvLabelAnchor = pvTicks
//            .anchor(this.anchor)
//            .addMargin(this.anchorOpposite(), 2);
        
        var scale = this.scale;
        var font  = this.font;
        
        var maxTextWidth = this._layoutInfo.maxTextWidth;
        if(!isFinite(maxTextWidth)){
            maxTextWidth = 0;
        }
        
        var label = this.pvLabel = new pvc.visual.Label(this, pvTicksPanel, {
                extensionId: 'label',
                wrapper: wrapper
            })
            .lock('data') // inherited
            .pvMark

            .lock(anchorOpposite, this.tickLength)
            .lock(anchorOrtho,    0)
            .zOrder(40) // above axis rule
            .text(function(tickScene){
                var text = tickScene.vars.tick.label;
                if(maxTextWidth){
                    text = pvc.text.trimToWidthB(maxTextWidth, text, font, '..', false);
                }
                return text;
             })
            .font(this.font)
            //.textMargin(0.5) // Just enough for some labels not to be cut (vertical)
            ;
        
        // Label alignment
        var rootPanel = this.pvPanel.root;
        if(this.isAnchorTopOrBottom()){
            label
                .textBaseline(anchorOpposite)
                .textAlign(function(tickScene){
                    var absLeft;
                    if(this.index === 0){
                        absLeft = label.toScreenTransform().transformHPosition(label.left());
                        if(absLeft <= 0){
                            return 'left'; // the "left" of the text is anchored to the tick's anchor
                        }
                    } else if(this.index === tickScene.parent.childNodes.length - 1) { 
                        absLeft = label.toScreenTransform().transformHPosition(label.left());
                        if(absLeft >= rootPanel.width()){
                            return 'right'; // the "right" of the text is anchored to the tick's anchor
                        }
                    }
                    
                    return 'center';
                });
        } else {
            label
                .textAlign(anchorOpposite)
                .textBaseline(function(tickScene){
                    var absTop;
                    if(this.index === 0){
                        absTop = label.toScreenTransform().transformVPosition(label.top());
                        if(absTop >= rootPanel.height()){
                            return 'bottom'; // the "bottom" of the text is anchored to the tick's anchor
                        }
                    } else if(this.index === tickScene.parent.childNodes.length - 1) { 
                        absTop = label.toScreenTransform().transformVPosition(label.top());
                        if(absTop <= 0){
                            return 'top'; // the "top" of the text is anchored to the tick's anchor
                        }
                    }
                    
                    return 'middle';
                });
        }
    },

    // ----------------------------
    // Click / Double-click
    _onV1Click: function(context, handler){
        if(this.isDiscrete && this.useCompositeAxis){
            handler.call(context.pvMark, context.scene, context.event);
        }
    },
    
    _onV1DoubleClick: function(context, handler){
        if(this.isDiscrete && this.useCompositeAxis){
            handler.call(context.pvMark, context.scene, context.event);
        }
    },
    
    /**
     * Prevents the axis panel from reacting directly to rubber band selections.
     * 
     * The panel participates in rubber band selection through 
     * the mediator {@link pvc.CartesianAbstractPanel}, which calls
     * each axes' {@link #_detectDatumsUnderRubberBand} directly.
     *   
     * @override
     */
    _dispatchRubberBandSelection: function(ev){
        /* NOOP */
    },
    
    /** @override */
    _getSelectableMarks: function(){
        if(this.isDiscrete && this.isVisible && this.pvLabel){
            return [this.pvLabel];
        }
    },

    /////////////////////////////////////////////////
    //begin: composite axis
    renderCompositeOrdinalAxis: function(){
        var myself = this,
            isTopOrBottom = this.isAnchorTopOrBottom(),
            axisDirection = isTopOrBottom ? 'h' : 'v',
            diagDepthCutoff = 2, // depth in [-1/(n+1), 1]
            vertDepthCutoff = 2,
            font = this.font;
        
        var diagMargin = pvc.text.getFontSize(font) / 2;
        
        var layout = this._pvLayout = this.getLayoutSingleCluster();

        // See what will fit so we get consistent rotation
        layout.node
            .def("fitInfo", null)
            .height(function(tickScene, e, f){
                // Just iterate and get cutoff
                var fitInfo = pvc.text.getFitInfo(tickScene.dx, tickScene.dy, tickScene.vars.tick.label, font, diagMargin);
                if(!fitInfo.h){
                    if(axisDirection === 'v' && fitInfo.v){ // prefer vertical
                        vertDepthCutoff = Math.min(diagDepthCutoff, tickScene.depth);
                    } else {
                        diagDepthCutoff = Math.min(diagDepthCutoff, tickScene.depth);
                    }
                }

                this.fitInfo(fitInfo);

                return tickScene.dy;
            });

        // label space (left transparent)
        // var lblBar =
        layout.node.add(pv.Bar)
            .fillStyle('rgba(127,127,127,.001)')
            .strokeStyle(function(tickScene){
                if(tickScene.maxDepth === 1 || !tickScene.maxDepth) { // 0, 0.5, 1
                    return null;
                }

                return "rgba(127,127,127,0.3)"; //non-terminal items, so grouping is visible
            })
            .lineWidth( function(tickScene){
                if(tickScene.maxDepth === 1 || !tickScene.maxDepth) {
                    return 0;
                }
                return 0.5; //non-terminal items, so grouping is visible
            })
            .text(function(tickScene){
                return tickScene.vars.tick.label;
            });

        //cutoffs -> snap to vertical/horizontal
        var H_CUTOFF_ANG = 0.30,
            V_CUTOFF_ANG = 1.27;
        
        var align = isTopOrBottom ?
                    "center" :
                    (this.anchor == "left") ? "right" : "left";
        
        var wrapper;
        if(this.compatVersion() <= 1){
            wrapper = function(v1f){
                return function(tickScene){
                    return v1f.call(this, tickScene);
                };
            };
        }
        
        // draw labels and make them fit
        this.pvLabel = new pvc.visual.Label(this, layout.label, {
                extensionId: 'label',
                noClick:       false,
                noDoubleClick: false,
                noSelect:      false,
                noTooltip:    false,
                noHover:       false, // TODO: to work, scenes would need a common root
                wrapper:       wrapper,
                tooltipArgs:   {
                    // TODO: should be an option whether a data tooltip is desired
                    isLazy: false,
                    buildTooltip: function(context){ return context.scene.vars.tick.label; },
                    
                    options: {
                        gravity: this._calcTipsyGravity(),
                        offset:  diagMargin * 2
                    }
                }
            })
            .pvMark
            .def('lblDirection','h')
            .textAngle(function(tickScene){
                if(tickScene.depth >= vertDepthCutoff && tickScene.depth < diagDepthCutoff){
                    this.lblDirection('v');
                    return -Math.PI/2;
                }

                if(tickScene.depth >= diagDepthCutoff){
                    var tan = tickScene.dy/tickScene.dx;
                    var angle = Math.atan(tan);
                    //var hip = Math.sqrt(tickScene.dy*tickScene.dy + tickScene.dx*tickScene.dx);

                    if(angle > V_CUTOFF_ANG){
                        this.lblDirection('v');
                        return -Math.PI/2;
                    }

                    if(angle > H_CUTOFF_ANG) {
                        this.lblDirection('d');
                        return -angle;
                    }
                }

                this.lblDirection('h');
                return 0;//horizontal
            })
            .textMargin(1)
            //override central alignment for horizontal text in vertical axis
            .textAlign(function(tickScene){
                return (axisDirection != 'v' || tickScene.depth >= vertDepthCutoff || tickScene.depth >= diagDepthCutoff)? 'center' : align;
            })
            .left(function(tickScene) {
                return (axisDirection != 'v' || tickScene.depth >= vertDepthCutoff || tickScene.depth >= diagDepthCutoff)?
                     tickScene.x + tickScene.dx/2 :
                     ((align == 'right')? tickScene.x + tickScene.dx : tickScene.x);
            })
            .font(font)
            .text(function(tickScene){
                var fitInfo = this.fitInfo();
                var label = tickScene.vars.tick.label;
                switch(this.lblDirection()){
                    case 'h':
                        if(!fitInfo.h){//TODO: fallback option for no svg
                            return pvc.text.trimToWidth(tickScene.dx, label, font, '..');
                        }
                        break;
                    case 'v':
                        if(!fitInfo.v){
                            return pvc.text.trimToWidth(tickScene.dy, label, font, '..');
                        }
                        break;
                    case 'd':
                       if(!fitInfo.d){
                          //var ang = Math.atan(tickScene.dy/tickScene.dx);
                          var diagonalLength = Math.sqrt(tickScene.dy*tickScene.dy + tickScene.dx*tickScene.dx) ;
                          return pvc.text.trimToWidth(diagonalLength - diagMargin, label, font,'..');
                        }
                        break;
                }
                
                return label;
            })
            ;
    },
    
    getLayoutSingleCluster: function(){
        var rootScene   = this._getRootScene(),
            orientation = this.anchor,
            maxDepth    = rootScene.group.treeHeight,
            depthLength = this._layoutInfo.axisSize;
        
        // displace to take out bogus-root
        maxDepth++;
        
        var baseDisplacement = depthLength / maxDepth,
            margin = maxDepth > 2 ? ((1/12) * depthLength) : 0; // heuristic compensation
        
        baseDisplacement -= margin;
        
        var scaleFactor = maxDepth / (maxDepth - 1),
            orthoLength = pvc.BasePanel.orthogonalLength[orientation];
        
        var displacement = (orthoLength == 'width') ?
                (orientation === 'left' ? [-baseDisplacement, 0] : [baseDisplacement, 0]) :
                (orientation === 'top'  ? [0, -baseDisplacement] : [0, baseDisplacement]);

        this.pvRule
            .strokeStyle(null)
            .lineWidth(0);

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
    
    _calcTipsyGravity: function(){
        switch(this.anchor){
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
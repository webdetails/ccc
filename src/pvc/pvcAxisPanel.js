
/**
 * AxisPanel panel.
 */
pvc.AxisPanel = pvc.BasePanel.extend({
    showAllTimeseries: false, // TODO: ??
    
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
    
    panelName: "axis", // override
    scale: null,
    ruleCrossesMargin: true,
    font: '9px sans-serif', // label font
    labelSpacingMin: 1,
    // To be used in linear scales
    domainRoundMode: 'none',
    desiredTickCount: null,
    tickExponentMin:  null,
    tickExponentMax:  null,
    minorTicks:       true,
    
    _isScaleSetup: false,
    
    constructor: function(chart, parent, axis, options) {
        
        options = def.create(options, {
            anchor: axis.option('Position')
        });
        
        // sizeMax
        if(options.sizeMax == null){
            var sizeMax = options.axisSizeMax;
            if(sizeMax != null){
                // Single size (a number or a string with only one number)
                // should be interpreted as meaning the orthogonal length.
                var anchor = options.anchor || this.anchor;
                
                options.sizeMax = new pvc.Size()
                                    .setSize(sizeMax, {singleProp: this.anchorOrthoLength(anchor)});
            }
        }
        
        this.base(chart, parent, options);
        
        this.axis = axis;
        this.roleName = axis.role.name;
        this.isDiscrete = axis.role.grouping.isDiscrete();
        
        if(options.font === undefined){
            var extFont = this._getConstantExtension('label', 'font');
            if(extFont){
                this.font = extFont;
            }
        }
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
        //var layoutInfo = this._layoutInfo;
        
        // Fixed axis size?
        layoutInfo.axisSize = this.axisSize;
        
        if (this.isDiscrete && this.useCompositeAxis){
            if(layoutInfo.axisSize == null){
                layoutInfo.axisSize = 50;
            }
        } else {
            /* I  - Calculate ticks
             * --> layoutInfo.{ ticks, ticksText, maxTextWidth } 
             */
            this._calcTicks();
            
            /* II - Calculate NEEDED axisSize so that all tick's labels fit */
            if(layoutInfo.axisSize == null){
                this._calcAxisSizeFromLabel(); // -> layoutInfo.axisSize and layoutInfo.labelBBox
            }
            
            /* III - Calculate Trimming Length if: FIXED/NEEDED > AVAILABLE */
            this._calcMaxTextLengthThatFits();
            
            
            /* IV - Calculate overflow paddings */
            this._calcOverflowPaddings();
            
            // Release memory.
            layoutInfo.labelBBox = null;
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
        
        var angle  = def.number.as(this._getExtension('label', 'textAngle'),  0);
        var margin = def.number.as(this._getExtension('label', 'textMargin'), 3);
        
        layoutInfo.labelBBox = pvc.text.getLabelBBox(
                        layoutInfo.maxTextWidth, 
                        layoutInfo.textHeight, 
                        align, 
                        baseline, 
                        angle, 
                        margin);
    },
    
    _calcAxisSizeFromLabelBBox: function(){
        var layoutInfo = this._layoutInfo;
        var labelBBox = layoutInfo.labelBBox;
        
        // The length not over the plot area
        var length = this._getLabelBBoxQuadrantLength(labelBBox, this.anchor);

        // --------------
        
        layoutInfo.axisSize = this.tickLength + length; 
        
        // Add equal margin on both sides?
        var angle = labelBBox.sourceAngle;
        if(!(angle === 0 && this.isAnchorTopOrBottom())){
            // Text height already has some free space in that case
            // so no need to add more.
            layoutInfo.axisSize += this.tickLength;
        }
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
            var isDiscrete = this.scale.type === 'Discrete';
            
            var clientLength = layoutInfo.clientSize[this.anchorLength()];
            this.axis.setScaleRange(clientLength);
            
            var sideTickOffset;
            if(isDiscrete){
                var halfBand = this.scale.range().band / 2;
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
                pvc.log("[OverflowPaddings] " +  this.panelName + " " + JSON.stringify(overflowPaddings));
            }
        }
        
        layoutInfo.overflowPaddings = overflowPaddings;
    },
    
    _calcMaxTextLengthThatFits: function(){
        var layoutInfo = this._layoutInfo;
        var availableClientLength = layoutInfo.clientSize[this.anchorOrthoLength()];
        if(layoutInfo.axisSize <= availableClientLength){
            // Labels fit
            // Clear to avoid unnecessary trimming
            layoutInfo.maxTextWidth = null;
        } else {
            // Text may not fit. 
            // Calculate maxTextWidth where text is to be trimmed.
            
            var labelBBox = layoutInfo.labelBBox;
            if(!labelBBox){
                // NOTE: requires previously calculated layoutInfo.maxTextWidth...
                this._calcAxisSizeFromLabel();
            }
            
            // Now move backwards, to the max text width...
            var maxOrthoLength = availableClientLength - 2 * this.tickLength;
            
            // A point at the maximum orthogonal distance from the anchor
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
            
            // Intersect the line that passes through mostOrthoDistantPoint,
            // and has the direction parallelDirection with 
            // the top side and with the bottom side of the *original* label box.
            var corners = labelBBox.sourceCorners;
            var botL = corners[0];
            var botR = corners[1];
            var topL = corners[2];
            var topR = corners[3];
            
            var topRLSideDir = topR.minus(topL);
            var botRLSideDir = botR.minus(botL);
            var intersect = pv.SvgScene.lineIntersect;
            var botI = intersect(mostOrthoDistantPoint, parallelDirection, botL, botRLSideDir);
            var topI = intersect(mostOrthoDistantPoint, parallelDirection, topL, topRLSideDir);
            
            // Two cases
            // A) If the angle is between -90 and 90, the text does not get upside down
            // In that case, we're always interested in topI -> topR and botI -> botR
            // B) Otherwise the relevant new segments are topI -> topL and botI -> botL
            
            var maxTextWidth;
            if(Math.cos(labelBBox.sourceAngle) >= 0){
                // A) [-90, 90]
                maxTextWidth = Math.min(
                                    topR.minus(topI).length(), 
                                    botR.minus(botI).length());
            } else {
                maxTextWidth = Math.min(
                        topL.minus(topI).length(), 
                        botL.minus(botI).length());
            }
            
            // One other detail.
            // When align (anchor) is center,
            // just cutting on one side of the label original box
            // won't do, because when text is centered, the cut we make in length
            // ends up distributed by both sides...
            if(labelBBox.sourceAlign === 'center'){
                var cutWidth = labelBBox.sourceTextWidth - maxTextWidth;
                
                // Cut same width on the opposite side. 
                maxTextWidth -= cutWidth;
            }
            
            layoutInfo.maxTextWidth = maxTextWidth; 
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
            case 'Discrete'  : this._calcDiscreteTicks();   break;
            case 'Timeseries': this._calcTimeseriesTicks(); break;
            case 'Continuous': this._calcNumberTicks(layoutInfo); break;
            default: throw def.error.operationInvalid("Undefined axis scale type"); 
        }
        
        this.axis.setTicks(layoutInfo.ticks);
        
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
    
    _calcTimeseriesTicks: function(){
        this._calcContinuousTicks(this._layoutInfo, this.desiredTickCount);
    },
    
    _calcNumberTicks: function(layoutInfo){
        var desiredTickCount;
        
        var previousLayout;
        if(!layoutInfo.canChange && (previousLayout = layoutInfo.previous)){
            desiredTickCount = previousLayout.ticks.length;
        } else {
            desiredTickCount = this.desiredTickCount;
        }
         
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
    
    _calcNumberVDesiredTickCount: function(){
        var layoutInfo = this._layoutInfo;
        var lineHeight = layoutInfo.textHeight * (1 + Math.max(0, this.labelSpacingMin /*em*/)); 
        var clientLength = layoutInfo.clientSize[this.anchorLength()];
        
        return Math.max(1, ~~(clientLength / lineHeight));
    },
    
    _calcNumberHTicks: function(){
        var layoutInfo = this._layoutInfo;
        var clientLength = layoutInfo.clientSize[this.anchorLength()];
        var spacing = layoutInfo.textHeight * (1 + Math.max(0, this.labelSpacingMin/*em*/));
        var desiredTickCount = this._calcNumberHDesiredTickCount(this, spacing);
        
        var doLog = (pvc.debug >= 7);
        var dir, prevResultTickCount;
        var ticksInfo, lastBelow, lastAbove;
        do {
            if(doLog){ pvc.log("calculateNumberHTicks TickCount IN desired = " + desiredTickCount); }
            
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
                    pvc.log("calculateNumberHTicks TickCount desired/resulting = " + desiredTickCount + " -> " + resultTickCount); 
                }
                
                prevResultTickCount = resultTickCount;
                
                this._calcContinuousTicksText(ticksInfo);
                
                var length = this._calcNumberHLength(ticksInfo, spacing);
                var excessLength  = length - clientLength;
                var pctError = ticksInfo.error = Math.abs(excessLength / clientLength);
                
                if(doLog){
                    pvc.log("calculateNumberHTicks error=" + (ticksInfo.error * 100).toFixed(0) + "% count=" + resultTickCount + " step=" + ticks.step);
                    pvc.log("calculateNumberHTicks Length client/resulting = " + clientLength + " / " + length + " spacing = " + spacing);
                }
                
                if(excessLength > 0){
                    // More ticks than can fit
                    if(desiredTickCount === 1){
                        break;
                    }
                    
                    if(lastBelow){
                        // We were below max length and then overshot...
                        // Choose the best conforming one
                        if(pctError > lastBelow.error){
                            ticksInfo = lastBelow;
                        }
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
                        
                        if(lastAbove && pctError > lastAbove.error){
                            ticksInfo = lastAbove;
                        }
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
                pvc.log("calculateNumberHTicks RESULT error=" + (ticksInfo.error * 100).toFixed(0) + "% count=" + ticksInfo.ticks.length + " step=" + ticksInfo.ticks.step);
            }
        }
        
        if(doLog){ pvc.log("calculateNumberHTicks END"); }
    },
    
    _calcNumberHDesiredTickCount: function(spacing){
        // The initial tick count is determined 
        // from the formatted min and max values of the domain.
        var layoutInfo = this._layoutInfo;
        var domainTextLength = this.scale.domain().map(function(tick){
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
        var tickCount = ticksText.length;
        var length = 0;
        var maxLength = -Infinity;
        for(var t = 0 ; t < tickCount ; t++){
            var textLength = pvc.text.getTextLength(ticksText[t], this.font);
            if(textLength > maxLength){
                maxLength = textLength;
            }
            
            if(t){
                length += spacing;
            }
            
            if(!t ||  t === tickCount - 1) {
                // Include half the text size only, as centered labels are the most common scenario
                length += textLength / 2;
            } else {
                // Middle tick
                length += textLength;
            }
        }
        
        ticksInfo.maxTextWidth = maxLength;
        
        return length;
    },
    
    _createCore: function() {
        if(this.scale.isNull){
            return;
        }
        
        //this.pvPanel.strokeStyle('orange');
        
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
    
    _getExtensionPrefix: function(){
        return this.panelName;
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
            anchorOpposite    = this.anchorOpposite(),
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            layoutInfo        = this._layoutInfo,
            ticks             = layoutInfo.ticks,
            data              = layoutInfo.data,
            itemCount         = layoutInfo.ticks.length,
            rootScene         = this._getRootScene(),
            includeModulo;
        
        if(this.axis.option('OverlappedLabelsHide') && itemCount > 0 && this._rSize > 0) {
            var overlapFactor = def.between(this.axis.option('OverlappedLabelsMaxPct'), 0, 0.9);
            var textHeight    = pvc.text.getTextHeight("m", this.font) * (1 - overlapFactor);
            includeModulo = Math.max(1, Math.ceil((itemCount * textHeight) / this._rSize));

            if(pvc.debug >= 4){
                pvc.log({overlapFactor: overlapFactor, itemCount: itemCount, textHeight: textHeight, Size: this._rSize, modulo: (itemCount * textHeight) / this._rSize, itemSpan: itemCount * textHeight, itemAvailSpace: this._rSize / itemCount});
            }
            
            if(pvc.debug >= 3 && includeModulo > 1) {
                pvc.log("Hiding every " + includeModulo + " labels in axis " + this.panelName);
            }
        } else {
            includeModulo = 1;
        }
        
        var wrapper;
        if(this.compatVersion() <= 1){
            wrapper = function(v1f){
                return function(tickScene){
                    return v1f.call(this, tickScene.vars.tick.rawValue);
                };
            };
        }
        
        // Ticks correspond to each data in datas.
        // Ticks are drawn at the center of each band.
        var pvTicks = this.pvTicks = new pvc.visual.Rule(this, this.pvRule, {
                extensionId: 'ticks',
                wrapper:  wrapper
            })
            .lock('data', rootScene.childNodes)
            .lock(anchorOpposite, 0) // top (of the axis panel)
            .lock(anchorLength,   null)
            .lockMark(anchorOrtho, function(tickScene){
                return scale(tickScene.vars.tick.value);
            })
            // Transparent by default, but changeable with extension point)
            .override('defaultColor', function(type){
                return pv.Color.names.transparent;
            })
            .pvMark
            .zOrder(20)
            [anchorOrthoLength](this.tickLength)
            ;
        
        var align = this.isAnchorTopOrBottom() ? 
                    "center" : 
                    (this.anchor == "left") ? "right" : "left";
        
        var font = this.font;
        
        var maxTextWidth = this._layoutInfo.maxTextWidth;
        if(!isFinite(maxTextWidth)){
            maxTextWidth = 0;
        }
        
        // All ordinal labels are relevant and must be visible
        var pvLabelAnchor = this.pvTicks.anchor(this.anchor);
        
        this.pvLabel = new pvc.visual.Label(this, pvLabelAnchor, {
                extensionId: 'label',
                noClick:       false,
                noDoubleClick: false,
                noSelect:      false,
                noTooltips:    false,
                noHover:       false, // TODO: to work, scenes would need a common root
                wrapper:       wrapper,
                tooltipArgs:   {
                    // TODO: should be an option whether a data tooltip is desired
                    buildTooltip: function(context){ return context.scene.vars.tick.label; },
                    isLazy: false,
                    
                    tipsySettings: {
                        gravity: this._calcTipsyGravity()
                    }
                }
            })
            .intercept('visible', function(){
                var index  = this.index;
                return ((index % includeModulo) === 0) && 
                       (!pvTicks.scene || pvTicks.scene[index].visible) &&
                       this.delegateExtension(true)
                       ;
            })
            .pvMark
            .zOrder(40)
            .textAlign(align)
            .text(function(tickScene){
                var text = tickScene.vars.tick.label;
                if(maxTextWidth){
                    text = pvc.text.trimToWidthB(maxTextWidth, text, font, '..', true);
                }
                return text;
             })
            .font(font)
            ;
    },

    renderLinearAxis: function(){
        // NOTE: Includes time series, 
        // so "tickScene.vars.tick.value" may be a number or a Date object...
        
        var scale  = this.scale,
            orthoAxis  = this._getOrthoAxis(),
            orthoScale = orthoAxis.scale,
            layoutInfo = this._layoutInfo,
            ticks      = layoutInfo.ticks,
            tickCount  = ticks.length,
            tickStep   = tickCount > 1 ? Math.abs(ticks[1] - ticks[0]) : 0,
            anchorOpposite    = this.anchorOpposite(),
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            rootScene         = this._getRootScene();
        
        var wrapper;
        if(this.compatVersion() <= 1){
            wrapper = function(v1f){
                return function(tickScene){
                    return v1f.call(this, tickScene.vars.tick.value);
                };
            };
        }
        
        // (MAJOR) ticks
        var pvTicks = this.pvTicks = new pvc.visual.Rule(this, this.pvRule, {
                extensionId: 'ticks',
                wrapper: wrapper
            })
            .lock('data', rootScene.childNodes)
            .override('defaultColor', function(scene){
                // Inherit axis color
                // Control visibility through color or through .visible
                // NOTE: the rule only has one scene/instance
                return this.pvMark.proto.instance(0).strokeStyle;
            })
            .lock(anchorOpposite, 0) // top (of the axis panel)
            .lock(anchorLength, null)
            .lockMark(anchorOrtho, function(tickScene){
                return scale(tickScene.vars.tick.value);
            })
            .pvMark
            [anchorOrthoLength](this.tickLength)
            .zOrder(20)
            ;
        
        // MINOR ticks are between major scale ticks
        if(this.minorTicks){
            this.pvMinorTicks = new pvc.visual.Rule(this, this.pvTicks, {
                    extensionId: 'minorTicks',
                    wrapper: wrapper
                })
                .override('defaultColor', function(scene){
                    // Inherit ticks color
                    // Control visibility through color or through .visible
                    return pvTicks.scene ? 
                                pvTicks.scene[this.pvMark.index].strokeStyle : 
                                pv.Color.names.black;
                })
                .lock('data')              // Inherited
                .lock(anchorOpposite, 0)   // top (of the axis panel)
                .lock(anchorLength, null)
                .lockMark(anchorOrtho, function(tickScene){
                    var value = +tickScene.vars.tick.value; // NOTE: +value converts Dates to numbers, just like tickScene.vars.tick.value.getTime()
                    return scale(value + tickStep/2); 
                })
                .lock(anchorOrthoLength, this.tickLength/2)
                .intercept('visible', function(){
                    var index = this.pvMark.index;
                    var visible = (!pvTicks.scene || pvTicks.scene[index].visible) &&
                                  (index < tickCount - 1);
                    
                    return visible && this.delegateExtension(true);
                })
                .pvMark
                .zOrder(20)
                ;
        }

        this.renderLinearAxisLabel(wrapper);
    },
    
    renderLinearAxisLabel: function(wrapper){
        // Labels are visible (only) on MAJOR ticks,
        // On first and last tick care is taken
        //  with their H/V alignment so that
        //  the label is not drawn off the chart.

        // Use this margin instead of textMargin, 
        // which affects all margins (left, right, top and bottom).
        // Exception is the small 0.5 textMargin set below...
        var pvTicks = this.pvTicks;
        var pvLabelAnchor = pvTicks.anchor(this.anchor)
                                 .addMargin(this.anchorOpposite(), 2);
        
        var scale = this.scale;
        var font  = this.font;
        
        var maxTextWidth = this._layoutInfo.maxTextWidth;
        if(!isFinite(maxTextWidth)){
            maxTextWidth = 0;
        }
        
        var label = this.pvLabel = new pvc.visual.Label(this, pvLabelAnchor, {
                extensionId: 'label',
                wrapper: wrapper
            })
            .intercept('visible', function(){
                var index  = this.pvMark.index;
                var visible = !pvTicks.scene || pvTicks.scene[index].visible;
                return visible && this.delegateExtension(true);
            })
            .pvMark
            .zOrder(40)
            .text(function(tickScene){
                var text = tickScene.vars.tick.label;
                if(maxTextWidth){
                    text = pvc.text.trimToWidthB(maxTextWidth, text, font, '..', true);
                }
                return text;
             })
            .font(this.font)
            .textMargin(0.5) // Just enough for some labels not to be cut (vertical)
            ;
        
        // Label alignment
        var rootPanel = this.pvPanel.root;
        if(this.isAnchorTopOrBottom()){
            label.textAlign(function(tickScene){
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
            label.textBaseline(function(tickScene){
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
                noTooltips:    false,
                noHover:       false, // TODO: to work, scenes would need a common root
                wrapper:       wrapper,
                tooltipArgs:   {
                    // TODO: should be an option whether a data tooltip is desired
                    isLazy: false,
                    buildTooltip: function(context){ return context.scene.vars.tick.label; },
                    
                    tipsySettings: {
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

pvc.AxisPanel.create = function(chart, parentPanel, cartAxis, options){
    var PanelClass = pvc[def.firstUpperCase(cartAxis.orientedId) + 'AxisPanel'] || 
        def.fail.argumentInvalid('cartAxis', "Unsupported cartesian axis");
    
    return new PanelClass(chart, parentPanel, cartAxis, options);
};

pvc.XAxisPanel = pvc.AxisPanel.extend({
    anchor: "bottom",
    panelName: "xAxis"
});

pvc.SecondXAxisPanel = pvc.XAxisPanel.extend({
    panelName: "secondXAxis"
});

pvc.YAxisPanel = pvc.AxisPanel.extend({
    anchor: "left",
    panelName: "yAxis"
});

pvc.SecondYAxisPanel = pvc.YAxisPanel.extend({
    panelName: "secondYAxis"
});


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
    tickColor: "#aaa",
    panelName: "axis", // override
    scale: null,
    fullGrid: false,
    fullGridCrossesMargin: true,
    ruleCrossesMargin: true,
    zeroLine: false, // continuous axis
    font: '9px sans-serif', // label font

    // To be used in linear scales
    domainRoundMode: 'none',
    desiredTickCount: null,
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
    },
    
    _calcLayout: function(layoutInfo){
        
        var scale = this.axis.scale;
        
        if(!this._isScaleSetup){
            this.pvScale = scale;
            this.scale   = scale; // TODO: At least HeatGrid depends on this. Maybe Remove?
            
            this.extend(scale, this.panelName + "Scale_");
            
            this._isScaleSetup = true;
        }
        
        var labelBBox;
        
        function labelLayout(){
            var labelExtId = this.panelName + 'Label';
            
            var font = this.font;
                
            var align = this._getExtension(labelExtId, 'textAlign');
            if(typeof align !== 'string'){
                align = this.isAnchorTopOrBottom() ? 
                        "center" : 
                        (this.anchor == "left") ? "right" : "left";
            }
            
            var baseline = this._getExtension(labelExtId, 'textBaseline');
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
            
            var angle  = def.number(this._getExtension(labelExtId, 'textAngle'),  0);
            var margin = def.number(this._getExtension(labelExtId, 'textMargin'), 3);
            
            var textHeight = pvc.text.getTextHeight("m", font);
            
            var textItems;
            if(this.isDiscrete){
                var data = this.chart.visualRoles(this.roleName)
                               .flatten(this.chart.data, {visible: true});
                
                textItems = def.query(data._children)
                               .select(function(child){ return child.absLabel; });
            } else {
                var ticks = pvc.scaleTicks(
                                scale,
                                this.domainRoundMode === 'tick',
                                this.desiredTickCount);
                
                textItems = def.query(ticks)
                                .select(function(tick){ return scale.tickFormat(tick); });
            }
            
            var textWidth = textItems
                                .select(function(text){ return 1.0 * pvc.text.getTextLength(text, font); })
                                .max();
            
            labelBBox = pvc.text.getLabelBBox(textWidth, textHeight, align, baseline, angle, margin);
            
            // The length not over the plot area
            var length;
            switch(this.anchor){
                case 'left':
                    length = -labelBBox.x;
                    break;
                
                case 'right':
                    length = labelBBox.x2;
                    break;
                    
                case 'top':
                    length = -labelBBox.y;
                    break;
                
                case 'bottom':
                    length = labelBBox.y2;
                    break;
            }
            
            length = Math.max(length, 0);
            
            // --------------
            
            this.axisSize = this.tickLength + length; 
            
            // Add equal margin on both sides?
            if(!(angle === 0 && this.isAnchorTopOrBottom())){
                // Text height already has some free space in that case
                // so no need to add more.
                this.axisSize += this.tickLength;
            }
        }
        
        layoutInfo.maxTextWidth = Infinity;
        
        if (this.isDiscrete && this.useCompositeAxis){
            if(this.axisSize == null){
                this.axisSize = 50;
            }
        } else {
            if(this.axisSize == null){
                labelLayout.call(this);
            }
            
            var maxClientLength = layoutInfo.clientSize[this.anchorOrthoLength()];
            if(this.axisSize > maxClientLength){
                // Text may not fit. Calculate maxTextWidth.
                if(!labelBBox){
                    labelLayout.call(this);
                }
                
                // Now move backwards, to the max text width...
                var maxOrthoLength = maxClientLength - 2 * this.tickLength;
                
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
        }
        
        return this.createAnchoredSize(this.axisSize, layoutInfo.clientSize);
    },
    
    _createCore: function() {
        this.renderAxis();
    },

    /**
     * @override
     */
    applyExtensions: function(){
        
        this.base();

        this.extend(this.pvPanel,      this.panelName + "_"     );
        this.extend(this.pvRule,       this.panelName + "Rule_" );
        this.extend(this.pvTicks,      this.panelName + "Ticks_");
        this.extend(this.pvLabel,      this.panelName + "Label_");
        this.extend(this.pvRuleGrid,   this.panelName + "Grid_" );
        this.extend(this.pvMinorTicks, this.panelName + "MinorTicks_");
        this.extend(this.pvZeroLine,   this.panelName + "ZeroLine_");
    },

    /**
     * Initializes a new layer panel.
     * @override
     */
    initLayerPanel: function(pvPanel, layer){
        if(layer === 'gridLines'){
            pvPanel.zOrder(-12);
        }
    },

    renderAxis: function(){
        // Z-Order
        // ==============
        // -10 - grid lines   (on 'gridLines' background panel)
        //   0 - content (specific chart types should render content on this zOrder)
        //  10 - end line     (on main foreground panel)
        //  20 - ticks        (on main foreground panel)
        //  30 - ruler (begin line) (on main foreground panel)
        //  40 - labels       (on main foreground panel)
        
        // Range
        var rMin  = this.ruleCrossesMargin ?  0 : this.pvScale.min,
            rMax  = this.ruleCrossesMargin ?  this.pvScale.size : this.pvScale.max,
            rSize = rMax - rMin,
            ruleParentPanel = this.pvPanel;

        this._rSize = rSize;
        
//        if(this.title){
//           this.pvTitlePanel = this.pvPanel.add(pv.Panel)
//                [this.anchor             ](0)     // bottom (of the axis panel)
//                [this.anchorOrthoLength()](this.titleSize) // height
//                [this.anchorOrtho()      ](rMin)  // left
//                [this.anchorLength()     ](rSize) // width
//                ;
//
//            this.pvTitle = this.pvTitlePanel.anchor('center').add(pv.Label)
//                .lock('text', this.title)
//                .lock('font', this.titleFont)
//
//                // Rotate text over center point
//                .lock('textAngle',
//                    this.anchor === 'left'  ? -Math.PI/2 :
//                    this.anchor === 'right' ?  Math.PI/2 :
//                    null)
//                ;
//
//            // Create a container panel to draw the remaining axis components
//            ruleParentPanel = this.pvPanel.add(pv.Panel)
//                [this.anchorOpposite()   ](0) // top (of the axis panel)
//                [this.anchorOrthoLength()](this.axisSize - this.titleSize) // height
//                [this.anchorOrtho()      ](0)     // left
//                [this.anchorLength()     ](rSize) // width
//                ;
//        }

        this.pvRule = ruleParentPanel.add(pv.Rule)
            .zOrder(30) // see pvc.js
            .strokeStyle('black')
            // ex: anchor = bottom
            [this.anchorOpposite()](0)     // top    (of the axis panel)
            [this.anchorLength()  ](rSize) // width  
            [this.anchorOrtho()   ](rMin)  // left
            .svg({ 'stroke-linecap': 'square' })
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
            scale = this.pvScale,
            anchorOpposite    = this.anchorOpposite(),
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            data              = this.chart.visualRoles(this.roleName)
                                    .flatten(this.chart.data, {visible: true}),
            itemCount         = data._children.length,
            includeModulo;
        
        if(this.axis.option('OverlappedLabelsHide') && itemCount > 0 && this._rSize > 0) {
            var overlapFactor = def.within(this.axis.option('OverlappedLabelsMaxPct'), 0, 0.9);
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
        
        // Ticks correspond to each data in datas.
        // Ticks are drawn at the center of each band.
        this.pvTicks = this.pvRule.add(pv.Rule)
            .zOrder(20) // see pvc.js
            .data(data._children)
            .localProperty('group')
            .group(function(child){ return child; })
            //[anchorOpposite   ](0)
            [anchorLength     ](null)
            [anchorOrtho      ](function(child){ return scale(child.value); })
            [anchorOrthoLength](this.tickLength)
            //.strokeStyle('black')
            .strokeStyle('rgba(0,0,0,0)') // Transparent by default, but extensible
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
        this.pvLabel = this.pvTicks.anchor(this.anchor).add(pv.Label)
            .intercept(
                'visible',
                labelVisibleInterceptor,
                this._getExtension(this.panelName + "Label", 'visible'))
            .zOrder(40) // see pvc.js
            .textAlign(align)
            .text(function(child){
                var text = child.absLabel;
                if(maxTextWidth){
                    text = pvc.text.trimToWidthB(maxTextWidth, text, font, '..', true);
                }
                return text; 
             })
            .font(font)
            .localProperty('group')
            .group(function(child){ return child; })
            ;
        
        function labelVisibleInterceptor(getVisible, args) {
            var visible = getVisible ? getVisible.apply(this, args) : true;
            return visible && ((this.index % includeModulo) === 0);
        }
        
        if(this._shouldHandleClick()){
            this.pvLabel
                .cursor("pointer")
                .events('all') //labels don't have events by default
                .event('click', function(child){
                    var ev = arguments[arguments.length - 1];
                    return myself._handleClick(child, ev);
                });
        }

        if(this.doubleClickAction){
            this.pvLabel
                .cursor("pointer")
                .events('all') //labels don't have events by default
                .event("dblclick", function(child){
                    var ev = arguments[arguments.length - 1];
                    myself._handleDoubleClick(child, ev);
                });
        }
        
        if(this.fullGrid){
            var fullGridRootScene = this._buildDiscreteFullGridScene(data),
                orthoAxis  = this._getOrthoAxis(),
                orthoScale = orthoAxis.scale,
                orthoFullGridCrossesMargin = orthoAxis.option('FullGridCrossesMargin'),
                ruleLength = orthoFullGridCrossesMargin ?
                                    orthoScale.size :
                                    (orthoScale.max - orthoScale.min),
                             // this.parent[anchorOrthoLength] - this[anchorOrthoLength],
                halfStep = scale.range().step / 2,
                count = fullGridRootScene.childNodes.length;
            
            this.pvRuleGrid = this.getPvPanel('gridLines').add(pv.Rule)
                .extend(this.pvRule)
                .data(fullGridRootScene.childNodes)
                .strokeStyle("#f0f0f0")
                [anchorOpposite   ](orthoFullGridCrossesMargin ? -ruleLength : -orthoScale.max)
                [anchorOrthoLength](ruleLength)
                [anchorLength     ](null)
                [anchorOrtho      ](function(scene){
                    var value = scale(scene.acts.value.value);
                    if(this.index +  1 < count){
                        return value - halfStep;
                    }

                    // end line
                    return value + halfStep;
                })
                ;
        }
    },

    _buildDiscreteFullGridScene: function(data){
        var rootScene = new pvc.visual.Scene(null, {panel: this, group: data});
        
        data.children()
            .each(function(childData){
                var childScene = new pvc.visual.Scene(rootScene, {group: childData});
                childScene.acts.value = {
                    value: childData.value,
                    label: childData.label,
                    absLabel: childData.absLabel
            };
        });

        /* Add a last scene, with the same data group */
        var lastScene  = rootScene.lastChild;
        if(lastScene){
            var endScene = new pvc.visual.Scene(rootScene, {group: lastScene.group});
            endScene.acts.value = lastScene.acts.value;
        }

        return rootScene;
    },

    renderLinearAxis: function(){
        // NOTE: Includes time series, 
        // so "d" may be a number or a Date object...
        
        var scale  = this.pvScale,
            orthoAxis  = this._getOrthoAxis(),
            orthoScale = orthoAxis.scale,
            ticks  = pvc.scaleTicks(
                        scale, 
                        this.domainRoundMode === 'tick',
                        this.desiredTickCount),
            anchorOpposite    = this.anchorOpposite(),
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            
            tickStep = Math.abs(ticks[1] - ticks[0]); // ticks.length >= 2
                
        // (MAJOR) ticks
        var pvTicks = this.pvTicks = this.pvRule.add(pv.Rule)
            .zOrder(20)
            .data(ticks)
            // [anchorOpposite ](0) // Inherited from pvRule
            [anchorLength     ](null)
            [anchorOrtho      ](scale)
            [anchorOrthoLength](this.tickLength);
            // Inherit axis color
            //.strokeStyle('black'); // control visibility through color or through .visible
        
        // MINOR ticks are between major scale ticks
        if(this.minorTicks){
            this.pvMinorTicks = this.pvTicks.add(pv.Rule)
                .zOrder(20) // not inherited
                //.data(ticks)  // ~ inherited
                //[anchorOpposite   ](0)   // Inherited from pvRule
                //[anchorLength     ](null)  // Inherited from pvTicks
                [anchorOrtho      ](function(d){ 
                    return scale((+d) + (tickStep / 2)); // NOTE: (+d) converts Dates to numbers, just like d.getTime()
                })
                [anchorOrthoLength](this.tickLength / 2)
                .intercept(
                    'visible',
                    minorTicksVisibleInterceptor,
                    this._getExtension(this.panelName + "MinorTicks", 'visible'))
                ;
        }

        function minorTicksVisibleInterceptor(getVisible, args){
            var visible = (!pvTicks.scene || pvTicks.scene[this.index].visible) &&
                          (this.index < ticks.length - 1);

            return visible && (getVisible ? getVisible.apply(this, args) : true);
        }

        this.renderLinearAxisLabel(ticks);

        // Now do the full grid lines
        if(this.fullGrid) {
            var orthoFullGridCrossesMargin = orthoAxis.option('FullGridCrossesMargin'),
                ruleLength = orthoFullGridCrossesMargin ? orthoScale.size : orthoScale.offsetSize;

            // Grid rules are visible (only) on MAJOR ticks.
            this.pvRuleGrid = this.getPvPanel('gridLines').add(pv.Rule)
                    .extend(this.pvRule)
                    .data(ticks)
                    .strokeStyle("#f0f0f0")
                    [anchorOpposite   ](orthoFullGridCrossesMargin ? -ruleLength : -orthoScale.max)
                    [anchorOrthoLength](ruleLength)
                    [anchorLength     ](null)
                    [anchorOrtho      ](scale)
                    ;
        }
    },
    
    renderLinearAxisLabel: function(ticks){
        // Labels are visible (only) on MAJOR ticks,
        // On first and last tick care is taken
        //  with their H/V alignment so that
        //  the label is not drawn off the chart.

        // Use this margin instead of textMargin, 
        // which affects all margins (left, right, top and bottom).
        // Exception is the small 0.5 textMargin set below....
        var labelAnchor = this.pvTicks.anchor(this.anchor)
                                .addMargin(this.anchorOpposite(), 2);
        
        var scale = this.scale;
        var font = this.font;
        
        var maxTextWidth = this._layoutInfo.maxTextWidth;
        if(!isFinite(maxTextWidth)){
            maxTextWidth = 0;
        }
        
        var label = this.pvLabel = labelAnchor.add(pv.Label)
            .zOrder(40)
            .text(function(d){
                var text = scale.tickFormat(d);
                if(maxTextWidth){
                    text = pvc.text.trimToWidthB(maxTextWidth, text, font, '..', true);
                }
                return text;
             })
            .font(this.font)
            .textMargin(0.5) // Just enough for some labels not to be cut (vertical)
            .visible(true);
        
        // Label alignment
        var rootPanel = this.pvPanel.root;
        if(this.isAnchorTopOrBottom()){
            label.textAlign(function(){
                var absLeft;
                if(this.index === 0){
                    absLeft = label.toScreenTransform().transformHPosition(label.left());
                    if(absLeft <= 0){
                        return 'left'; // the "left" of the text is anchored to the tick's anchor
                    }
                } else if(this.index === ticks.length - 1) { 
                    absLeft = label.toScreenTransform().transformHPosition(label.left());
                    if(absLeft >= rootPanel.width()){
                        return 'right'; // the "right" of the text is anchored to the tick's anchor
                    }
                }
                return 'center';
            });
        } else {
            label.textBaseline(function(){
                var absTop;
                if(this.index === 0){
                    absTop = label.toScreenTransform().transformVPosition(label.top());
                    if(absTop >= rootPanel.height()){
                        return 'bottom'; // the "bottom" of the text is anchored to the tick's anchor
                    }
                } else if(this.index === ticks.length - 1) { 
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
    // TODO: unify this with base panel's code
    _handleDoubleClick: function(d, ev){
        if(!d){
            return;
        }
        
        var action = this.doubleClickAction;
        if(action){
            this._ignoreClicks = 2;

            action.call(null, d, ev);
        }
    },

    _shouldHandleClick: function(){
        var options = this.chart.options;
        return options.selectable || (options.clickable && this.clickAction);
    },

    _handleClick: function(data, ev){
        if(!data || !this._shouldHandleClick()){
            return;
        }

        // Selection
        
        if(!this.doubleClickAction){
            this._handleClickCore(data, ev);
        } else {
            // Delay click evaluation so that
            // it may be canceled if double click meanwhile
            // fires.
            var myself  = this,
                options = this.chart.options;
            window.setTimeout(
                function(){
                    myself._handleClickCore.call(myself, data, ev);
                },
                options.doubleClickMaxDelay || 300);
        }
    },

    _handleClickCore: function(data, ev){
        if(this._ignoreClicks) {
            this._ignoreClicks--;
            return;
        }

        // Classic clickAction
        var action = this.clickAction;
        if(action){
            action.call(null, data, ev);
        }

        // TODO: should this be cancellable by the click action?
        var options = this.chart.options;
        if(options.selectable && this.isDiscrete){
            var toggle = options.ctrlSelectMode && !ev.ctrlKey;
            this._selectOrdinalElement(data, toggle);
        }
    },

    _selectOrdinalElement: function(data, toggle){
        var selectedDatums = data.datums().array();
        
        selectedDatums = this._onUserSelection(selectedDatums);
        
        if(toggle){
            this.chart.data.owner.clearSelected();
        }

        pvc.data.Data.toggleSelected(selectedDatums);
        
        this._onSelectionChanged();
    },
    
    /**
     * Prevents the axis panel from reacting directly to rubber band selections.
     * 
     * The panel participates in rubber band selection through 
     * the mediator {@link pvc.CartesianAbstractPanel}.
     *   
     * @override
     */
    _dispatchRubberBandSelection: function(ev){
        /* NOOP */
    },
    
    /**
     * @override
     */
    _detectDatumsUnderRubberBand: function(datumsByKey, rb){
        if(!this.isDiscrete) {
            return false;
        }
        
        var any = false;
        
        function addData(data) {
            data.datums().each(function(datum){
                datumsByKey[datum.key] = datum;
                any = true;
            });
        }
        
        if(!this.useCompositeAxis){
            var mark = this.pvLabel;
            
            mark.forEachInstance(function(instance, t){
                if(!instance.isBreak) { 
                    var data = instance.group;
                    if(data) {
                        var shape = mark.getInstanceShape(instance).apply(t);
                        if (shape.intersectsRect(rb)){
                            addData(data);
                        }
                    }
                }
            }, this);
            
        } else {
            var t = this._pvLayout.toScreenTransform();
            this._rootElement.visitBefore(function(data, i){
                if(i > 0){
                    var centerX = t.transformHPosition(data.x + data.dx /2),
                        centerY = t.transformVPosition(data.y + data.dy /2);
                    if(rb.containsPoint(centerX, centerY)){
                       addData(data);
                    }
                }
            });
        }
        
        return any;
    },
    
    /////////////////////////////////////////////////
    //begin: composite axis
    renderCompositeOrdinalAxis: function(){
        var myself = this,
            isTopOrBottom = this.isAnchorTopOrBottom(),
            axisDirection = isTopOrBottom ? 'h' : 'v',
            tipsyGravity  = this._calcTipsyGravity(),
            diagDepthCutoff = 2, // depth in [-1/(n+1), 1]
            vertDepthCutoff = 2;
        
        var layout = this._pvLayout = this.getLayoutSingleCluster();

        // See what will fit so we get consistent rotation
        layout.node
            .def("fitInfo", null)
            .height(function(d, e, f){
                // Just iterate and get cutoff
                var fitInfo = pvc.text.getFitInfo(d.dx, d.dy, d.label, myself.font, diagMargin);
                if(!fitInfo.h){
                    if(axisDirection == 'v' && fitInfo.v){ // prefer vertical
                        vertDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                    } else {
                        diagDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                    }
                }

                this.fitInfo(fitInfo);

                return d.dy;
            });

        // label space (left transparent)
        // var lblBar =
        layout.node.add(pv.Bar)
            .fillStyle('rgba(127,127,127,.001)')
            .strokeStyle(function(d){
                if(d.maxDepth === 1 || !d.maxDepth) { // 0, 0.5, 1
                    return null;
                }

                return "rgba(127,127,127,0.3)"; //non-terminal items, so grouping is visible
            })
            .lineWidth( function(d){
                if(d.maxDepth === 1 || !d.maxDepth) {
                    return 0;
                }
                return 0.5; //non-terminal items, so grouping is visible
            })
            .text(function(d){
                return d.label;
            });

        //cutoffs -> snap to vertical/horizontal
        var H_CUTOFF_ANG = 0.30,
            V_CUTOFF_ANG = 1.27;
        
        var diagMargin = pvc.text.getFontSize(this.font) / 2;

        var align = isTopOrBottom ?
                    "center" :
                    (this.anchor == "left") ? "right" : "left";

        //draw labels and make them fit
        this.pvLabel = layout.label.add(pv.Label)
            .def('lblDirection','h')
            .textAngle(function(d){
                if(d.depth >= vertDepthCutoff && d.depth < diagDepthCutoff){
                    this.lblDirection('v');
                    return -Math.PI/2;
                }

                if(d.depth >= diagDepthCutoff){
                    var tan = d.dy/d.dx;
                    var angle = Math.atan(tan);
                    //var hip = Math.sqrt(d.dy*d.dy + d.dx*d.dx);

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
            .textAlign(function(d){
                return (axisDirection != 'v' || d.depth >= vertDepthCutoff || d.depth >= diagDepthCutoff)? 'center' : align;
            })
            .left(function(d) {
                return (axisDirection != 'v' || d.depth >= vertDepthCutoff || d.depth >= diagDepthCutoff)?
                     d.x + d.dx/2 :
                     ((align == 'right')? d.x + d.dx : d.x);
            })
            .font(this.font)
            .text(function(d){
                var fitInfo = this.fitInfo();
                switch(this.lblDirection()){
                    case 'h':
                        if(!fitInfo.h){//TODO: fallback option for no svg
                            return pvc.text.trimToWidth(d.dx, d.label, myself.font, '..');
                        }
                        break;
                    case 'v':
                        if(!fitInfo.v){
                            return pvc.text.trimToWidth(d.dy, d.label, myself.font, '..');
                        }
                        break;
                    case 'd':
                       if(!fitInfo.d){
                          //var ang = Math.atan(d.dy/d.dx);
                          var diagonalLength = Math.sqrt(d.dy*d.dy + d.dx*d.dx) ;
                          return pvc.text.trimToWidth(diagonalLength - diagMargin, d.label, myself.font,'..');
                        }
                        break;
                }
                return d.label;
            })
            .cursor('default')
            .events('all'); //labels don't have events by default

        if(this._shouldHandleClick()){
            this.pvLabel
                .cursor("pointer")
                .event('click', function(data){
                    var ev = arguments[arguments.length - 1];
                    return myself._handleClick(data, ev);
                });
        }

        if(this.doubleClickAction){
            this.pvLabel
                .cursor("pointer")
                .event("dblclick", function(data){
                    var ev = arguments[arguments.length - 1];
                    myself._handleDoubleClick(data, ev);
                });
        }

        // tooltip
        this.pvLabel
            .title(function(d){
                this.instance().tooltip = d.label;
                return '';
            })
            .event("mouseover", pv.Behavior.tipsy({
                exclusionGroup: 'chart',
                gravity: tipsyGravity,
                fade: true,
                offset: diagMargin * 2,
                opacity:1
            }));
    },
    
    getLayoutSingleCluster: function(){
        // TODO: extend this to work with chart.orientation?
        var orientation = this.anchor,
            reverse   = orientation == 'bottom' || orientation == 'left',
            data      = this.chart.visualRoles(this.roleName)
                            .select(this.chart.data, {visible: true, reverse: reverse}),
            
            maxDepth  = data.treeHeight,
            elements  = data.nodes(),
            
            depthLength = this.axisSize;
        
        this._rootElement = elements[0]; // lasso
            
        // displace to take out bogus-root
        maxDepth++;
        
        var baseDisplacement = depthLength / maxDepth,
            margin = maxDepth > 2 ? ((1/12) * depthLength) : 0;//heuristic compensation
        
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
                    .nodes(elements)
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
    var PanelClass = pvc[cartAxis.upperOrientedId + 'AxisPanel'] || 
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

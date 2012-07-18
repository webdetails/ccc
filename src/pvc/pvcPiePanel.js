
/*
 * Pie chart panel. Generates a pie chart. 
 * 
 * Specific options are: 
 * 
 * <i>showValues</i> - Show or hide slice value. Default: false 
 * 
 * <i>explodedSliceIndex</i> - Index of the slice which is <i>always</i> exploded, or null to explode every slice. Default: null.
 * 
 * <i>explodedOffsetRadius</i> - The radius by which an exploded slice is offset from the center of the pie (in pixels).
 * If one wants a pie with an exploded effect, specify a value in pixels here.
 * If above argument is specified, explodes only one slice, else explodes all. 
 * Default: 0
 * 
 * <i>activeOffsetRadius</i> - Percentage of slice radius to (additionally) explode an active slice.
 * Only used if the chart has option hoverable equal to true.
 * 
 * <i>innerGap</i> - The percentage of (the smallest of) the panel width or height used by the pie. 
 * Default: 0.9 (90%)
 * 
 * Deprecated in favor of options <i>contentMargins</i> and <i>contentPaddings</i>.
 * 
 * Has the following protovis extension points: 
 * <i>chart_</i> - for the main chart Panel 
 * <i>pie_</i> - for the main pie wedge 
 * <i>pieLabel_</i> - for the main pie label
 * <i>pieLinkLine_</i> - for the link lines, for when labelStyle = 'linked'
 * 
 * Example Category Scene extension:
 * pie: {
 *     scenes: {
 *         category: {
 *             sliceLabelMask: "{value} ({value.percent})"
 *         }
 *     }
 * }
 */
pvc.PieChartPanel = pvc.BasePanel.extend({
    anchor: 'fill',
    
    pvPie: null,
    pvPieLabel: null,
    
    // Always exploded slices
    explodedOffsetRadius: 0,
    explodedSliceIndex:  null,
    
    // Explode when active (hoverable)
    activeOffsetRadius: new pvc.PercentValue(0.05),
    
    valueRoleName: 'value',
    
    showValues: true,
    
    // Examples:
    // "{value} ({value.percent}) {category}"
    // "{value}"
    // "{value} ({value.percent})"
    // "{#productId}" // Atom name
    valuesMask: null, 
    
    labelStyle: 'linked', // 'linked' or 'inside'
    /*
     *                                         
     *     (| elbowX)                         (| anchorX)
     *      +----------------------------------+          (<-- baseY)
     *      |                                    \
     *      |   (link outset)                      \ (targetX,Y)
     *      |                                        +----+ label
     *    -----  <-- current outer radius      |<-------->|<------------>            
     *      |   (link inset)                     (margin)   (label size)
     *      
     */
    
    labelFont: 'default',
    
    linkedLabel: {
        /**
         * Percentage of the client radius that the 
         * link is inset in a slice.
         */
        linkInsetRadius:  new pvc.PercentValue(0.05),
        
        /**
         * Percentage of the client radius that the 
         * link extends outwards from the slice, 
         * until it reaches the link "elbow".
         */
        linkOutsetRadius: new pvc.PercentValue(0.025),
        
        /**
         * Percentage of the client width that separates 
         * a link label from the link's anchor point.
         * <p>
         * Determines the width of the link segment that 
         * connects the "anchor" point with the "target" point.
         * Includes the space for the small handle at the end.
         * </p>
         */
        linkMargin: new pvc.PercentValue(0.025),
        
        /**
         * Link handle width.
         */
        linkHandleWidth: 0.5, // em
        
        /**
         * Percentage of the client width that is reserved 
         * for labels on each of the sides.
         */
        labelSize: new pvc.PercentValue(0.15),
        
        /**
         * Minimum vertical space that separates consecutive link labels, in em units.
         */
        labelSpacingMin: 0.5 // em
    },
    
    constructor: function(chart, parent, options){
        if(!options){
            options = {};
        }
        
        var isV1Compat = chart.options.compatVersion <= 1;
        if(isV1Compat){
            if(options.labelStyle == null){
                options.labelStyle = 'inside';
            }
        }
        
        // innerGap translation to paddings
        if(options.paddings == null){
            var innerGap = options.innerGap || 0.95;
            delete options.innerGap;
            if(innerGap > 0 && innerGap < 1){
                options.paddings = Math.round((1 - innerGap) * 100 / 2 ) + "%";
            }
        }
        
        // Cast
        ['explodedOffsetRadius', 'activeOffsetRadius']
        .forEach(function(name){
            var value = options[name];
            if(value != null){
                options[name] = pvc.PercentValue.parse(value);
            }
        });
        
        var labelStyle = options.labelStyle || this.labelStyle;
        var isLinked = labelStyle === 'linked';
        var valuesMask = options.valuesMask;
        if(valuesMask == null){
            options.valuesMask = isLinked ? "{value} ({value.percent})" : "{value}";
        }
       
        if(isLinked){
            var sourceLinkedLabel = options.linkedLabel;
            if(sourceLinkedLabel){
                // Inherit from default settings
                var linkedLabel = options.linkedLabel = Object.create(this.linkedLabel);
                def.copy(linkedLabel, sourceLinkedLabel);
                
                // Cast
                ['linkInsetRadius', 'linkOutsetRadius', 'linkMargin', 'labelSize']
                .forEach(function(name){
                    var value = linkedLabel[name];
                    if(value != null){
                        linkedLabel[name] = pvc.PercentValue.parse(value);
                    }
                });
            }
        }
        
        this.base(chart, parent, options);
    },
    
    /* Layout independent and required by layout stuff only! */
    _getCoreInfo: function(){
        if(!this._coreInfo){
            this._coreInfo = {
               rootScene: this._buildScene()
            };
        }
        
        return this._coreInfo;
    },
    
    /**
     * @override
     */
    _calcLayout: function(layoutInfo){
        var clientSize   = layoutInfo.clientSize;
        var clientWidth = clientSize.width;
        var clientRadius = Math.min(clientWidth, clientSize.height) / 2;
        if(!clientRadius){
            return new pvc.Size(0,0);
        }
        
        var center = pv.vector(clientSize.width / 2, clientSize.height / 2);
        
        function resolvePercentRadius(radius){
            return def.within(pvc.PercentValue.resolve(radius, clientRadius), 0, clientRadius);
        }
        
        function resolvePercentWidth(width){
            return def.within(pvc.PercentValue.resolve(width, clientWidth), 0, clientWidth);
        }
        
        // ---------------------
        
        var labelFont = def.number.to(this._getExtension('pieLabel', 'font'));
        if(!def.string.is(labelFont)){
            labelFont = this.labelFont;
        }
        
        var maxPieRadius = clientRadius;
        
        if(this.showValues && this.labelStyle === 'linked'){
            // Reserve space for labels and links
            var linkedLabel = this.linkedLabel;
            var linkInsetRadius  = resolvePercentRadius(linkedLabel.linkInsetRadius);
            var linkOutsetRadius = resolvePercentRadius(linkedLabel.linkOutsetRadius);
            var linkMargin       = resolvePercentWidth(linkedLabel.linkMargin);
            var linkLabelSize    = resolvePercentWidth(linkedLabel.labelSize);
            
            var textMargin = def.number.to(this._getExtension('pieLabel', 'textMargin'), 3);
            var textHeight = pvc.text.getTextHeight('m', labelFont);
            
            var linkHandleWidth = linkedLabel.linkHandleWidth * textHeight; // em
            linkMargin += linkHandleWidth;
            
            var linkLabelSpacingMin = linkedLabel.labelSpacingMin * textHeight; // em
            
            var freeWidthSpace = Math.max(0, clientWidth / 2 - clientRadius);
            
            // Radius stolen to pie by link and label
            var spaceH = Math.max(0, linkOutsetRadius + linkMargin + linkLabelSize - freeWidthSpace);
            var spaceV = linkOutsetRadius + textHeight; // at least one line of text (should be half line, but this way there's a small margin...)
            
            var linkAndLabelRadius = Math.max(0, spaceV, spaceH);
            
            // Use the extra width on the label
            //linkLabelSize += freeWidthSpace / 2;
            
            if(linkAndLabelRadius >= maxPieRadius){
                this.showValues = false;
                if(pvc.debug >= 2){
                    pvc.log("Hiding linked labels due to insufficient space.");
                }
            } else {
                
                maxPieRadius -= linkAndLabelRadius;
                
                layoutInfo.link = {
                    insetRadius:   linkInsetRadius,
                    outsetRadius:  linkOutsetRadius,
                    elbowRadius:   maxPieRadius + linkOutsetRadius,
                    linkMargin:    linkMargin,
                    handleWidth:     linkHandleWidth,
                    labelSize:     linkLabelSize,
                    maxTextWidth:  linkLabelSize - textMargin,
                    labelSpacingMin: linkLabelSpacingMin,
                    textMargin:    textMargin,
                    lineHeight:    textHeight
                };
            }
        } 
        
        // ---------------------
        
        var explodedOffsetRadius = resolvePercentRadius(this.explodedOffsetRadius);
        
        var activeOffsetRadius = 0;
        if(this.chart.options.hoverable){
            activeOffsetRadius = resolvePercentRadius(this.activeOffsetRadius);
        }
        
        var effectOffsetRadius = explodedOffsetRadius + activeOffsetRadius;
        
        var normalPieRadius = maxPieRadius - effectOffsetRadius;
        if(normalPieRadius < 0){
            return new pvc.Size(0,0);
        }
        
        // ---------------------
        
        layoutInfo.center = center;
        layoutInfo.clientRadius = clientRadius;
        layoutInfo.normalRadius = normalPieRadius;
        layoutInfo.explodedOffsetRadius = explodedOffsetRadius;
        layoutInfo.activeOffsetRadius = activeOffsetRadius;
        layoutInfo.labelFont = labelFont;
    },
    
    /**
     * @override
     */
    _createCore: function(layoutInfo) {
        var myself = this;
        var chart = this.chart;
        var options = chart.options;
        var visibleKeyArgs = {visible: true};
        
        var coreInfo  = this._getCoreInfo();
        var rootScene = coreInfo.rootScene;
        
        var center    = layoutInfo.center;
        var normalRadius = layoutInfo.normalRadius;
        
        // ------------
        
        this.pvPie = new pvc.visual.PieSlice(this, this.pvPanel, {
                extensionId: 'pie',
                center: layoutInfo.center,
                activeOffsetRadius: layoutInfo.activeOffsetRadius
            })
            
            .lockValue('data', rootScene.childNodes)
            
            .override('angle', function(scene){ return scene.vars.value.angle;  })
            
            .override('baseOffsetRadius', function(){
                var explodeIndex = myself.explodedSliceIndex;
                if (explodeIndex == null || explodeIndex == this.pvMark.index) {
                    return layoutInfo.explodedOffsetRadius;
                }
                
                return this.base();
            })
            
            .lock('outerRadius', function(){ return chart.animate(0, normalRadius); })
            
            // In case the inner radius is specified, we better animate it as well
            .intercept('innerRadius', function(scene){
                var innerRadius = pvc.PercentValue.parse(this.delegate());
                if(innerRadius instanceof pvc.PercentValue){
                    innerRadius = innerRadius.resolve(this.pvMark.outerRadius());
                }
                
                return innerRadius > 0 ? chart.animate(0, innerRadius) : 0;
            }, 
            /*noCast*/ true)
            .pvMark;
        
        if(this.showValues){
            if(this.labelStyle === 'inside'){
                
                this.pvPieLabel = this.pvPie.anchor("outer").add(pv.Label)
                    .intercept('visible', function(getVisible, args){
                        var scene = args[0];
                        var angle = scene.vars.value.angle;
                        if(angle < 0.001){
                            return false;
                        }
                        
                        return !getVisible ||  getVisible.apply(null, args);
                    }, this._getExtension('pieLabel', 'visible'))
                    .localProperty('group') // for rubber band selection
                    .group(function(scene){ return scene.group; })
                    .text(function(scene) { return scene.vars.value.sliceLabel; })
                    .textMargin(10);
                
            } else if(this.labelStyle === 'linked') {
                var linkLayout = layoutInfo.link;
                
                rootScene.layoutLinkLabels(layoutInfo);
                
                this.pvLinkPanel = this.pvPanel.add(pv.Panel)
                                        .data(rootScene.childNodes)
                                        .localProperty('pieSlice')
                                        .pieSlice(function(scene){
                                            return myself.pvPie.scene[this.index];  
                                         })
                                        ;
                
                this.pvLinkLine = this.pvLinkPanel.add(pv.Line)
                                        .data(function(scene){
                                            // Calculate the dynamic dot at the 
                                            // slice's middle angle and outer radius...
                                            var pieSlice = this.parent.pieSlice();
                                            var midAngle = pieSlice.startAngle + pieSlice.angle / 2;
                                            var outerRadius = pieSlice.outerRadius - linkLayout.insetRadius;
                                            
                                            var dot = pv.vector(
                                                pieSlice.left + outerRadius * Math.cos(midAngle),
                                                pieSlice.top  + outerRadius * Math.sin(midAngle));
                                            
                                            return def.array.append([dot], scene.vars.link.dots);
                                        })
                                        .lock('visible')
                                        .top (function(dot){ return dot.y; })
                                        .left(function(dot){ return dot.x; })
                                        .strokeStyle('black')
                                        .lineWidth(0.5)
                                        ;
                
                this.pvPieLabel = this.pvLinkPanel.add(pv.Label)
                                        .data(function(scene){ return scene.vars.link.labelLines; })
                                        .lock('visible')
                                        .localProperty('group') // for rubber band selection
                                        .group(function(textLine, scene){ return scene.group; })
                                        .left(function(textLine, scene){ return scene.vars.link.labelX; })
                                        .top( function(textLine, scene){ return scene.vars.link.labelY + ((this.index + 1) * linkLayout.lineHeight); })
                                        .textAlign(function(textLine, scene){ return scene.vars.link.labelAnchor; })
                                        .textBaseline('bottom')
                                        .textMargin(linkLayout.textMargin)
                                        .text(def.identity)
                                        .fillStyle('red')
                                        ;
                
                if(this._shouldHandleClick()){
                    this.pvPieLabel
                        .events('all');
                    
                    this._addPropClick(this.pvPieLabel);
                }
                
                // <Debug>
                if(pvc.debug >= 20){
                    this.pvPanel.add(pv.Panel)
                        .zOrder(-10)
                        .left(layoutInfo.center.x - layoutInfo.clientRadius)
                        .top(layoutInfo.center.y - layoutInfo.clientRadius)
                        .width(layoutInfo.clientRadius * 2)
                        .height(layoutInfo.clientRadius * 2)
                        .strokeStyle('red')
                    ;
                    
                    // Client Area
                    this.pvPanel
                        .strokeStyle('green');
                    
                    var linkColors = pv.Colors.category10();
                    this.pvLinkLine
                        .segmented(true)
                        .strokeStyle(function(){ return linkColors(this.index); });
                }
                // </Debug>
            }
            
            this.pvPieLabel
                .font(layoutInfo.labelFont);
        }
    },
    
    applyExtensions: function(){
        this.extend(this.pvPie, "pie_");
        this.extend(this.pvPieLabel, "pieLabel_");
        this.extend(this.pvLinkLine, "pieLinkLine_");
        
        this.extend(this.pvPanel, "chart_");
    },
    
    /**
     * Renders this.pvBarPanel - the parent of the marks that are affected by selection changes.
     * @override
     */
    _renderInteractive: function(){
        this.pvPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @override
     */
    _getSignums: function(){
        var signums = [this.pvPie];
        if(this.pvPieLabel){
            signums.push(this.pvPieLabel);
        }
        
        return signums;
    },
    
    _buildScene: function(){
        var rootScene  = new pvc.visual.PieRootScene(this);
        
        // legacy property
        this.sum = rootScene.vars.sumAbs.value;
        
        return rootScene;
    }
});

def
.type('pvc.visual.PieRootScene', pvc.visual.Scene)
.init(function(panel){
    var chart = panel.chart;
    var data = chart.visualRoles('category').flatten(chart.data, pvc.data.visibleKeyArgs);
    
    this.base(null, {panel: panel, group: data});
    
    // ---------------
    
    var valueRoleName = panel.valueRoleName;
    var valueDimName  = chart.visualRoles(valueRoleName).firstDimensionName();
    var valueDim      = data.dimensions(valueDimName);
    
    var options = chart.options;
    var percentValueFormat = options.percentValueFormat;
    
    var rootScene = this;
    var sumAbs = 0;
    
    /* Create category scene subclass */
    var CategSceneClass = def.type(null, pvc.visual.PieCategoryScene)
        .init(function(categData, value){
            
            // Adds to parent scene...
            this.base(rootScene, {group: categData});
            
            this.vars.category = new pvc.visual.ValueLabelVar(
                    categData.value, 
                    categData.label);

            sumAbs += Math.abs(value);
            
            this.vars.value = new pvc.visual.ValueLabelVar(
                            value,
                            formatValue(value, categData));
        });
    
    /* Extend with any user extensions */
    panel._extendScene('category', CategSceneClass, ['sliceLabel', 'sliceLabelMask']);
    
    /* Create child category scenes */
    data.children().each(function(categData){
        // Value may be negative
        // Don't create 0-value scenes
        var value = categData.dimensions(valueDimName).sum(pvc.data.visibleKeyArgs);
        if(value !== 0){
            new CategSceneClass(categData, value);
        }
    });
    
    // -----------
    
    // TODO: should this be in something like: chart.axes.angle.scale ?
    this.angleScale = pv.Scale
                        .linear(0, sumAbs)
                        .range(0, 2 * Math.PI)
                        .by(Math.abs);
    
    this.vars.sumAbs = new pvc.visual.ValueLabelVar(sumAbs, formatValue(sumAbs));
    
    this.childNodes.forEach(function(categScene){
        completeBuildCategScene.call(categScene);
    });
    
    function formatValue(value, categData){
        if(categData){
            var datums = categData._datums;
            if(datums.length === 1){
                // Prefer to return the already formatted/provided label
                return datums[0].atoms[valueDimName].label;
            }
        }
        
        return valueDim.format(value);
    }
    
    /** 
     * @private 
     * @instance pvc.visual.PieCategoryScene
     */
    function completeBuildCategScene(){
        var valueVar = this.vars.value;
        
        // Calculate angle (span)
        valueVar.angle = this.parent.angleScale(valueVar.value);
        
        // Create percent sub-var of the value var
        var percent = Math.abs(valueVar.value) / sumAbs;
        
        valueVar.percent = new pvc.visual.ValueLabelVar(
                percent,
                percentValueFormat(percent));
        
        // Calculate slice label
        valueVar.sliceLabel = this.sliceLabel();
    }
})
.add({
    layoutLinkLabels: function(layoutInfo){
        var startAngle = -Math.PI / 2;
        
        var leftScenes  = [];
        var rightScenes = [];
        
        this.childNodes.forEach(function(categScene){
            startAngle = categScene.layoutI(layoutInfo, startAngle);
            
            (categScene.vars.link.dir > 0 ? rightScenes : leftScenes)
            .push(categScene);
        });
        
        // Distribute left and right labels and finish their layout
        this._distributeLabels(-1, leftScenes,  layoutInfo);
        this._distributeLabels(+1, rightScenes, layoutInfo);
    },
    
    _distributeLabels: function(dir, scenes, layoutInfo){
        // Initially, for each category scene, 
        //   targetY = elbowY
        // Taking additionally labelHeight into account,
        //  if this position causes overlapping, find a != targetY
        //  that does not cause overlap.
        
        // Sort scenes by Y position
        scenes.sort(function(sceneA, sceneB){
            return def.compare(sceneA.vars.link.targetY, sceneB.vars.link.targetY);
        });
        
        /*jshint expr:true */
        this._distributeLabelsDownwards(scenes, layoutInfo) &&
        this._distributeLabelsUpwards  (scenes, layoutInfo) &&
        this._distributeLabelsEvenly   (scenes, layoutInfo);
        
        scenes.forEach(function(categScene){
            categScene.layoutII(layoutInfo);
        });
    },
    
    _distributeLabelsDownwards: function(scenes, layoutInfo){
        var linkLayout = layoutInfo.link;
        var labelSpacingMin = linkLayout.labelSpacingMin;
        var yMax = layoutInfo.clientSize.height;
        var overlapping = false;
        for(var i = 0, J = scenes.length - 1 ; i < J ; i++){
            var linkVar0 = scenes[i].vars.link;
            
            if(!i && linkVar0.labelTop() < 0){
                overlapping = true;
            }
            
            var linkVar1 = scenes[i + 1].vars.link;
            var labelTopMin1 = linkVar0.labelBottom() + labelSpacingMin;
            if (linkVar1.labelTop() < labelTopMin1) {
                
                var halfLabelHeight1 = linkVar1.labelHeight / 2;
                var targetY1 = labelTopMin1 + halfLabelHeight1;
                var targetYMax = yMax - halfLabelHeight1;
                if(targetY1 > targetYMax){
                    overlapping = true;
                    linkVar1.targetY = targetYMax;
                } else {
                    linkVar1.targetY = targetY1;
                }
            }
        }
        
        return overlapping;
    },
    
    _distributeLabelsUpwards: function(scenes, layoutInfo){
        var linkLayout = layoutInfo.link;
        var labelSpacingMin = linkLayout.labelSpacingMin;
        
        var overlapping = false;
        for(var i = scenes.length - 1 ; i > 0 ; i--){
            var linkVar1 = scenes[i - 1].vars.link;
            var linkVar0 = scenes[i].vars.link;
            if(i === 1 && linkVar1.labelTop() < 0){
                overlapping = true;
            }
            
            var labelBottomMax1 = linkVar0.labelTop() - labelSpacingMin;
            if (linkVar1.labelBottom() > labelBottomMax1) {
                var halfLabelHeight1 = linkVar1.labelHeight / 2;
                var targetY1   = labelBottomMax1 - halfLabelHeight1;
                var targetYMin = halfLabelHeight1;
                if(targetY1 < targetYMin){
                    overlapping = true;
                    linkVar1.targetY = targetYMin;
                } else {
                    linkVar1.targetY = targetY1;                    
                }
            }
        }
        
        return overlapping;
    },
    
    _distributeLabelsEvenly: function(scenes, layoutInfo){
        var linkLayout = layoutInfo.link;
        var labelSpacingMin = linkLayout.labelSpacingMin;
        
        var totalHeight = 0;
        scenes.forEach(function(categScene){
            totalHeight += categScene.vars.link.labelHeight;
        });
        
        var freeSpace = layoutInfo.clientSize.height - totalHeight; // may be < 0
        var labelSpacing = freeSpace;
        if(scenes.length > 1){
            labelSpacing /= (scenes.length - 1);
        }
        
        var y = 0;
        scenes.forEach(function(scene){
            var linkVar = scene.vars.link;
            var halfLabelHeight = linkVar.labelHeight / 2;
            y += halfLabelHeight;
            linkVar.targetY = y;
            y += halfLabelHeight + labelSpacing;
        });
        
        return true;
    }
});

def
.type('pvc.visual.PieLinkLabelVar')
.add({
    labelTop: function(){
        return this.targetY - this.labelHeight / 2;
    },
    
    labelBottom: function(){
        return this.targetY + this.labelHeight / 2;
    }
});

def
.type('pvc.visual.PieCategoryScene', pvc.visual.Scene)
.add({
    // extendable
    sliceLabelMask: function(){
        return this.panel().valuesMask;
    },
    
    // extendable
    sliceLabel: function(){
        return this.format(this.sliceLabelMask());
    },
    
    layoutI: function(layoutInfo, startAngle){
        var valueVar = this.vars.value;
        var endAngle = startAngle + valueVar.angle;
        var midAngle = (startAngle + endAngle) / 2;
        
        // Overwrite existing link var, if any.
        var linkVar = (this.vars.link = new pvc.visual.PieLinkLabelVar());
        
        var linkLayout = layoutInfo.link;
        
        var labelLines = pvc.text.justify(valueVar.sliceLabel, linkLayout.maxTextWidth, layoutInfo.labelFont);
        linkVar.labelLines  = labelLines;
        linkVar.labelHeight = labelLines.length * linkLayout.lineHeight;
        
        var cosMid = Math.cos(midAngle);
        var sinMid = Math.sin(midAngle);
        
        var isAtRight = cosMid >= 0;
        var dir = isAtRight ? 1 : -1;
        
        // Label anchor is at the side with opposite name to the side of the pie where it is placed.
        linkVar.labelAnchor = isAtRight ?  'left' : 'right'; 
        
        var center = layoutInfo.center;
        var elbowRadius = linkLayout.elbowRadius;
        var elbowX = center.x + elbowRadius * cosMid;
        var elbowY = center.y + elbowRadius * sinMid; // baseY
        
        var anchorX = center.x + dir * elbowRadius;
        var targetX = anchorX + dir * linkLayout.linkMargin;
        
        linkVar.dots = [
            pv.vector(elbowX,  elbowY),
            pv.vector(anchorX, elbowY)
        ];
        
        linkVar.elbowY  = elbowY;
        linkVar.targetY = elbowY + 0;
        linkVar.targetX = targetX;
        linkVar.dir = dir;
        
        return endAngle;
    },
    
    layoutII: function(layoutInfo){
        var linkVar = this.vars.link;
        
        var targetY = linkVar.targetY;
        var targetX = linkVar.targetX;
        var dots = linkVar.dots;
        var handleWidth = layoutInfo.link.handleWidth;
        if(handleWidth > 0){
            dots.push(pv.vector(targetX - linkVar.dir * handleWidth, targetY));
        }
        
        dots.push(pv.vector(targetX, targetY));
        
        linkVar.labelX = targetX;
        linkVar.labelY = targetY - linkVar.labelHeight/2;
    }
});

/*
 * Pie chart panel. Generates a pie chart. 
 * 
 * Specific options are: 
 * 
 * <i>valuesVisible</i> - Show or hide slice value. Default: false 
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
 * Deprecated in favor of options <i>leafContentMargins</i> and <i>leafContentPaddings</i>.
 * 
 * Has the following protovis extension points: 
 * <i>chart_</i> - for the main chart Panel 
 * <i>slice_</i> - for the main pie wedge 
 * <i>sliceLabel_</i> - for the main pie label
 * <i>sliceLinkLine_</i> - for the link lines, for when labelStyle = 'linked'
 * 
 * Example Pie Category Scene extension:
 * pie: {
 *     scenes: {
 *         category: {
 *             sliceLabelMask: "{value} ({value.percent})"
 *         }
 *     }
 * }
 */
def
.type('pvc.PieChartPanel', pvc.PlotPanel)
.init(function(chart, parent, plot, options){
    
    // Before base, just to bring to attention that ValuesMask depends on it
    var labelStyle = plot.option('ValuesLabelStyle');
    
    this.base(chart, parent, plot, options);
    
    this.explodedOffsetRadius = plot.option('ExplodedSliceRadius');
    this.explodedSliceIndex   = plot.option('ExplodedSliceIndex' );
    this.activeOffsetRadius   = plot.option('ActiveSliceRadius'  );
    this.labelStyle           = labelStyle;
    if(labelStyle === 'linked'){
        this.linkInsetRadius     = plot.option('LinkInsetRadius'    );
        this.linkOutsetRadius    = plot.option('LinkOutsetRadius'   );
        this.linkMargin          = plot.option('LinkMargin'         );
        this.linkHandleWidth     = plot.option('LinkHandleWidth'    );
        this.linkLabelSize       = plot.option('LinkLabelSize'      );
        this.linkLabelSpacingMin = plot.option('LinkLabelSpacingMin');
    }
})
.add({
    pvPie: null,
    pvPieLabel: null,
    
    valueRoleName: 'value',
    
    _getV1Datum: function(scene){
        // Ensure V1 tooltip function compatibility 
        var datum = scene.datum;
        if(datum){
            var datumEx = Object.create(datum);
            datumEx.percent = scene.vars.value.percent;
            datum = datumEx;
        }
        
        return datum;
    },
    
    /**
     * @override
     */
    _calcLayout: function(layoutInfo){
        var clientSize   = layoutInfo.clientSize;
        var clientWidth  = clientSize.width;
        var clientRadius = Math.min(clientWidth, clientSize.height) / 2;
        if(!clientRadius){
            return new pvc.Size(0,0);
        }
        
        var center = pv.vector(clientSize.width / 2, clientSize.height / 2);
        
        function resolvePercentRadius(radius){
            return def.between(pvc.PercentValue.resolve(radius, clientRadius), 0, clientRadius);
        }
        
        function resolvePercentWidth(width){
            return def.between(pvc.PercentValue.resolve(width, clientWidth), 0, clientWidth);
        }
        
        // ---------------------
        
        var labelFont = this._getConstantExtension('label', 'font');
        if(!def.string.is(labelFont)){
            labelFont = this.valuesFont;
        }
        
        var maxPieRadius = clientRadius;
        
        if(this.valuesVisible && this.labelStyle === 'linked'){
            // Reserve space for labels and links
            var linkInsetRadius  = resolvePercentRadius(this.linkInsetRadius );
            var linkOutsetRadius = resolvePercentRadius(this.linkOutsetRadius);
            var linkMargin       = resolvePercentWidth (this.linkMargin      );
            var linkLabelSize    = resolvePercentWidth (this.linkLabelSize   );
            
            var textMargin = def.number.to(this._getConstantExtension('label', 'textMargin'), 3);
            var textHeight = pv.Text.fontHeight(labelFont);
            
            var linkHandleWidth = this.linkHandleWidth * textHeight; // em
            linkMargin += linkHandleWidth;
            
            var linkLabelSpacingMin = this.linkLabelSpacingMin * textHeight; // em
            
            var freeWidthSpace = Math.max(0, clientWidth / 2 - clientRadius);
            
            // Radius stolen to pie by link and label
            var spaceH = Math.max(0, linkOutsetRadius + linkMargin + linkLabelSize - freeWidthSpace);
            var spaceV = linkOutsetRadius + textHeight; // at least one line of text (should be half line, but this way there's a small margin...)
            
            var linkAndLabelRadius = Math.max(0, spaceV, spaceH);
            
            // Use the extra width on the label
            //linkLabelSize += freeWidthSpace / 2;
            
            if(linkAndLabelRadius >= maxPieRadius){
                this.valuesVisible = false;
                if(pvc.debug >= 2){
                    this._log("Hiding linked labels due to insufficient space.");
                }
            } else {
                
                maxPieRadius -= linkAndLabelRadius;
                
                layoutInfo.link = {
                    insetRadius:     linkInsetRadius,
                    outsetRadius:    linkOutsetRadius,
                    elbowRadius:     maxPieRadius + linkOutsetRadius,
                    linkMargin:      linkMargin,
                    handleWidth:     linkHandleWidth,
                    labelSize:       linkLabelSize,
                    maxTextWidth:    linkLabelSize - textMargin,
                    labelSpacingMin: linkLabelSpacingMin,
                    textMargin:      textMargin,
                    lineHeight:      textHeight
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
        
        var rootScene = this._buildScene();
        var center = layoutInfo.center;
        var normalRadius = layoutInfo.normalRadius;
        
        // ------------
        
        var wrapper;
        var extensionIds = ['slice'];
        if(this.compatVersion() <= 1){
            extensionIds.push(''); // let access as "pie_"
            wrapper = function(v1f){
                return function(pieCatScene){
                    return v1f.call(this, pieCatScene.vars.value.value);
                };
            };
        }
        
        this.pvPie = new pvc.visual.PieSlice(this, this.pvPanel, {
                extensionId: extensionIds,
                center: center,
                activeOffsetRadius: layoutInfo.activeOffsetRadius,
                wrapper: wrapper,
                tooltipArgs:   {
                    options: {
                        useCorners: true,
                        gravity: function(){
                            var isRightPlane = Math.cos(this.midAngle()) >= 0;
                            var isTopPlane   = Math.sin(this.midAngle()) >= 0;
                            return  isRightPlane ?
                                    (isTopPlane ? 'nw' : 'sw') :
                                    (isTopPlane ? 'ne' : 'se')
                                    ;
                        }
                    }
                }
            })
            
            .lock('data', rootScene.childNodes)
            
            .override('angle', function(){ return this.scene.vars.value.angle;  })
            
            .override('baseOffsetRadius', function(){
                var explodeIndex = myself.explodedSliceIndex;
                if (explodeIndex == null || explodeIndex == this.pvMark.index) {
                    return layoutInfo.explodedOffsetRadius;
                }
                
                return this.base();
            })
            
            .lock('outerRadius', function(){ return chart.animate(0, normalRadius); })
            
            .localProperty('innerRadiusEx', pvc.PercentValue.parse)
            
            // In case the inner radius is specified, we better animate it as well
            .intercept('innerRadius', function(scene){
                var innerRadius = this.delegateExtension();
                if(innerRadius == null){
                    var innerRadiusPct = this.pvMark.innerRadiusEx();
                    if(innerRadiusPct != null){
                        innerRadius = pvc.PercentValue.resolve(
                                    innerRadiusPct, 
                                    this.pvMark.outerRadius()) || 0;
                    } else {
                        innerRadius = 0;
                    }
                }
                
                return innerRadius > 0 ? chart.animate(0, innerRadius) : 0;
            })
            .pvMark
            ;
        
        if(this.valuesVisible){
            if(this.labelStyle === 'inside'){
                
                this.pvPieLabel = new pvc.visual.Label(this, this.pvPie.anchor(this.valuesAnchor), {
                        extensionId: 'label',
                        wrapper:     wrapper
                    })
                    .intercept('visible', function(scene){
                        var angle = scene.vars.value.angle;
                        if(angle < 0.001){
                            return false;
                        }
                        
                        return this.delegateExtension(true);
                    })
                    .pvMark
                    .text(function(scene){ return scene.vars.value.sliceLabel; })
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
                
                this.pvLinkLine = new pvc.visual.Line(
                    this, 
                    this.pvLinkPanel, 
                    {
                        extensionId:  'linkLine',
                        freePosition:  true,
                        noClick:       true,
                        noDoubleClick: true,
                        noSelect:      true,
                        noTooltip:    true,
                        noHover:       true 
                    })
                    .lockMark('data', function(scene){
                        // Calculate the dynamic dot at the 
                        // slice's middle angle and outer radius...
                        var pieSlice = this.parent.pieSlice();
                        var midAngle = pieSlice.startAngle + pieSlice.angle / 2;
                        var outerRadius = pieSlice.outerRadius - linkLayout.insetRadius;
                        var x = pieSlice.left + outerRadius * Math.cos(midAngle);
                        var y = pieSlice.top  + outerRadius * Math.sin(midAngle);
                        
                        var firstDotScene = scene.childNodes[0];
                        if(!firstDotScene || !firstDotScene._isFirstDynamicScene){
                            firstDotScene = new pvc.visual.PieLinkLineScene(
                                scene, x, y, /* index */ 0);
                            
                            firstDotScene._isFirstDynamicScene = true;
                        } else {
                            firstDotScene.x = x;
                            firstDotScene.y = y;
                        }
                        
                        return scene.childNodes;
                    })
                    .override('defaultColor', function(type){
                        if(type === 'stroke'){
                            return 'black';
                        }
                        return this.base(type);
                    })
                    .override('defaultStrokeWidth', def.fun.constant(0.5))
                    .pvMark
                    .lock('visible')
                    .lock('top',  function(dot){ return dot.y; })
                    .lock('left', function(dot){ return dot.x; })
                    ;
                
                this.pvPieLabel = new pvc.visual.Label(
                    this, 
                    this.pvLinkPanel, 
                    {
                        extensionId:   'label',
                        noClick:       false,
                        noDoubleClick: false,
                        noSelect:      false,
                        noHover:       false
                    })
                    .lockMark('data', function(scene){
                        // Repeat the scene, once for each line
                        return scene.lineScenes; 
                    })
                    .pvMark
                    .lock('visible')
                    .left     (function(scene){ return scene.vars.link.labelX; })
                    .top      (function(scene){ return scene.vars.link.labelY + ((this.index + 1) * linkLayout.lineHeight); }) // must be mark.index because of repeating scene...
                    .textAlign(function(scene){ return scene.vars.link.labelAnchor; })
                    .textMargin(linkLayout.textMargin)
                    .textBaseline('bottom')
                    .text     (function(scene){ return scene.vars.link.labelLines[this.index]; })
                    .fillStyle('red')
                    ;
                
                // <Debug>
                if(pvc.debug >= 20){
                    this.pvPanel.add(pv.Panel)
                        .zOrder(-10)
                        .left  (center.x - layoutInfo.clientRadius)
                        .top   (center.y - layoutInfo.clientRadius)
                        .width (layoutInfo.clientRadius * 2)
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
    
    _getExtensionId: function(){
        // chart is deprecated
        // content coincides, visually in this chart type
        // - actually it shares the same panel...
        
        var extensionIds = [{abs: 'content'}];
        if(this.chart.parent){ 
            extensionIds.push({abs: 'smallContent'});
        }
        
        return extensionIds.concat(this.base());
    },
    
    /**
     * Renders this.pvBarPanel - the parent of the marks that are affected by selection changes.
     * @override
     */
    renderInteractive: function(){
        this.pvPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @override
     */
    _getSelectableMarks: function(){
        var marks = [this.pvPie];
        if(this.pvPieLabel){
            marks.push(this.pvPieLabel);
        }
        
        return marks;
    },
    
    _buildScene: function(){
        var rootScene  = new pvc.visual.PieRootScene(this);
        
        // v1 property
        this.sum = rootScene.vars.sumAbs.value;
        
        return rootScene;
    }
});

def
.type('pvc.visual.PieRootScene', pvc.visual.Scene)
.init(function(panel){
    var chart = panel.chart;
    var data = chart.visualRoles('category').flatten(chart.data, pvc.data.visibleKeyArgs);
    var colorVarHelper = new pvc.visual.ColorVarHelper(chart, chart._colorRole);
    
    this.base(null, {panel: panel, group: data});
    
    // ---------------
    
    var valueRoleName = panel.valueRoleName;
    var valueDimName  = chart.visualRoles(valueRoleName).firstDimensionName();
    var valueDim      = data.dimensions(valueDimName);
    
    var options = chart.options;
    var percentValueFormat = options.percentValueFormat;
    
    var rootScene = this;
    var sumAbs = 0;
    
    /* Create category scene sub-class */
    var CategSceneClass = def.type(pvc.visual.PieCategoryScene)
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
            
            colorVarHelper.onNewScene(this, /* isLeaf */ true);
        });
    
    /* Extend with any user extensions */
    panel._extendSceneType('category', CategSceneClass, ['sliceLabel', 'sliceLabelMask']);
    
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
                        .by1(Math.abs);
    
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
.type('pvc.visual.PieLinkLabelVar') // TODO : Var base class
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
        var lineCount = labelLines.length;
        linkVar.labelLines  = labelLines;
        linkVar.labelHeight = lineCount * linkLayout.lineHeight;
        
        this.lineScenes = def.array.create(lineCount, this);
        
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
        
        new pvc.visual.PieLinkLineScene(this, elbowX,  elbowY);
        new pvc.visual.PieLinkLineScene(this, anchorX, elbowY);
        
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
        
        var handleWidth = layoutInfo.link.handleWidth;
        if(handleWidth > 0){
            new pvc.visual.PieLinkLineScene(this, targetX - linkVar.dir * handleWidth, targetY);
        }
        
        new pvc.visual.PieLinkLineScene(this, targetX, targetY);
                
        linkVar.labelX = targetX;
        linkVar.labelY = targetY - linkVar.labelHeight/2;
    }
});

def
.type('pvc.visual.PieLinkLineScene', pvc.visual.Scene)
.init(function(catScene, x, y, index){
    this.base(catScene, { group: catScene.group, index: index });
    
    this.x = x;
    this.y = y;
})
.add(pv.Vector)
;
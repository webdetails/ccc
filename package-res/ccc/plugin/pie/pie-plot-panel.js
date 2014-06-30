/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Size:true, pvc_PercentValue:true, pvc_ValueLabelVar:true */

/*
 * Pie chart panel. Generates a pie chart.
 *
 * Specific options are:
 *
 * <i>valuesVisible</i> - Show or hide slice value. Default: false
 *
 * <i>explodedSliceIndex</i> - Index of the slice which is <i>always</i> exploded, or null to explode every slice.
 * Default: null.
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
.type('pvc.PiePanel', pvc.PlotPanel)
.init(function(chart, parent, plot, options) {

    // Before base, just to bring to attention that ValuesMask depends on it
    var labelStyle = plot.option('ValuesLabelStyle');

    this.base(chart, parent, plot, options);

    this.explodedOffsetRadius = plot.option('ExplodedSliceRadius');
    this.explodedSliceIndex   = plot.option('ExplodedSliceIndex' );
    this.activeOffsetRadius   = plot.option('ActiveSliceRadius'  );
    this.labelStyle           = labelStyle;
    if(labelStyle === 'linked') {
        this.linkInsetRadius     = plot.option('LinkInsetRadius'    );
        this.linkOutsetRadius    = plot.option('LinkOutsetRadius'   );
        this.linkMargin          = plot.option('LinkMargin'         );
        this.linkHandleWidth     = plot.option('LinkHandleWidth'    );
        this.linkLabelSize       = plot.option('LinkLabelSize'      );
        this.linkLabelSpacingMin = plot.option('LinkLabelSpacingMin');
    }

    // Legacy name
    if(!chart.pieChartPanel) chart.pieChartPanel = this;
})
.add({
    plotType: 'pie',
    _ibits: -1, // reset

    pvPie: null,
    pvPieLabel: null,

    valueRoleName: 'value',

    _getV1Datum: function(scene) {
        // Ensure V1 tooltip function compatibility
        var datum = scene.datum;
        if(datum) {
            var datumEx = Object.create(datum);
            datumEx.percent = scene.vars.value.percent;
            datum = datumEx;
        }

        return datum;
    },

    /**
     * @override
     */
    _calcLayout: function(layoutInfo) {
        var clientSize   = layoutInfo.clientSize,
            clientWidth  = clientSize.width,
            clientRadius = Math.min(clientWidth, clientSize.height) / 2;

        if(!clientRadius) return new pvc_Size(0, 0);

        var center = pv.vector(clientSize.width / 2, clientSize.height / 2);

        function resolvePercentRadius(radius) {
            return def.between(pvc_PercentValue.resolve(radius, clientRadius), 0, clientRadius);
        }

        function resolvePercentWidth(width) {
            return def.between(pvc_PercentValue.resolve(width, clientWidth), 0, clientWidth);
        }

        // ---------------------

        var labelFont = this._getConstantExtension('label', 'font');
        if(!def.string.is(labelFont)) labelFont = this.valuesFont;

        var maxPieRadius = clientRadius;

        if(this.valuesVisible && this.labelStyle === 'linked') {
            // Reserve space for labels and links
            var textMargin = def.number.to(this._getConstantExtension('label', 'textMargin'), 3),
                textHeight = pv.Text.fontHeight(labelFont) * 2/ 3,
                linkHandleWidth = this.linkHandleWidth * textHeight, // em

                linkInsetRadius  = resolvePercentRadius(this.linkInsetRadius),
                linkOutsetRadius = resolvePercentRadius(this.linkOutsetRadius),
                linkMargin       = resolvePercentWidth (this.linkMargin      ) + linkHandleWidth,
                linkLabelSize    = resolvePercentWidth (this.linkLabelSize   ),

                linkLabelSpacingMin = this.linkLabelSpacingMin * textHeight, // em
                freeWidthSpace = Math.max(0, clientWidth / 2 - clientRadius),
                // Radius stolen to pie by link and label
                spaceH = Math.max(0, linkOutsetRadius + linkMargin + linkLabelSize - freeWidthSpace),
                spaceV = linkOutsetRadius + textHeight, // at least one line of text (should be half line, but this way there's a small margin...)
                linkAndLabelRadius = Math.max(0, spaceV, spaceH);

            // Use the extra width on the label
            //linkLabelSize += freeWidthSpace / 2;

            if(linkAndLabelRadius >= maxPieRadius) {
                this.valuesVisible = false;
                if(pvc.debug >= 2) this._log("Hiding linked labels due to insufficient space.");
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

        var explodedOffsetRadius = resolvePercentRadius(this.explodedOffsetRadius),
            activeOffsetRadius = 0;
        if(this.hoverable()) activeOffsetRadius = resolvePercentRadius(this.activeOffsetRadius);

        var maxOffsetRadius = explodedOffsetRadius + activeOffsetRadius;

        var normalPieRadius = maxPieRadius - maxOffsetRadius;
        if(normalPieRadius < 0) return new pvc_Size(0,0);

        // ---------------------

        layoutInfo.resolvePctRadius = resolvePercentRadius;
        layoutInfo.center = center;
        layoutInfo.clientRadius = clientRadius;
        layoutInfo.normalRadius = normalPieRadius;
        layoutInfo.explodedOffsetRadius = explodedOffsetRadius;
        layoutInfo.activeOffsetRadius = activeOffsetRadius;
        layoutInfo.maxOffsetRadius = maxOffsetRadius;
        layoutInfo.labelFont = labelFont;
    },

    /**
     * @override
     */
    _createCore: function(layoutInfo) {
        var me = this,
            chart = me.chart,
            rootScene = this._buildScene(),
            center = layoutInfo.center,
            normalRadius = layoutInfo.normalRadius,
            wrapper,
            extensionIds = ['slice'];

        if(this.compatVersion() <= 1) {
            extensionIds.push(''); // let access as "pie_"
            wrapper = function(v1f) {
                return function(pieCatScene) {
                    return v1f.call(this, pieCatScene.vars.value.value);
                };
            };
        }

        this.pvPie = new pvc.visual.PieSlice(this, this.pvPanel, {
                extensionId: extensionIds,
                center: center,
                activeOffsetRadius: layoutInfo.activeOffsetRadius,
                maxOffsetRadius:    layoutInfo.maxOffsetRadius,
                resolvePctRadius:   layoutInfo.resolvePctRadius,
                wrapper: wrapper,
                tooltipArgs: {
                    options: {
                        useCorners: true,
                        gravity: function() {
                            var ma = this.midAngle(),
                                isRightPlane = Math.cos(ma) >= 0,
                                isTopPlane   = Math.sin(ma) >= 0;
                            return  isRightPlane ?
                                    (isTopPlane ? 'nw' : 'sw') :
                                    (isTopPlane ? 'ne' : 'se');
                        }
                    }
                }
            })
            .lock('data', rootScene.childNodes)
            .override('angle', function(scene) { return scene.vars.value.angle;  })
            .override('defaultOffsetRadius', function() {
                var explodeIndex = me.explodedSliceIndex;
                return (explodeIndex == null || explodeIndex == this.pvMark.index)
                    ? layoutInfo.explodedOffsetRadius
                    : 0;
            })
            .lockMark('outerRadius', function() { return chart.animate(0, normalRadius); })
            .localProperty('innerRadiusEx', pvc_PercentValue.parse)
            // In case the inner radius is specified, we better animate it as well
            .intercept('innerRadius', function(scene) {
                var innerRadius = this.delegateExtension();
                if(innerRadius == null) {
                    var innerRadiusPct = this.pvMark.innerRadiusEx();
                    innerRadius =  (innerRadiusPct != null)
                        ? (pvc_PercentValue.resolve(innerRadiusPct, this.pvMark.outerRadius()) || 0)
                        : 0;
                }
                return innerRadius > 0 ? chart.animate(0, innerRadius) : 0;
            })
            .pvMark;

        if(this.valuesVisible) {
            this.valuesFont = layoutInfo.labelFont;

            if(this.labelStyle === 'inside') {
                this.pvPieLabel = pvc.visual.ValueLabel.maybeCreate(this, this.pvPie, {
                        wrapper: wrapper
                    })
                    .override('defaultText', function(scene) {
                        return scene.vars.value.sliceLabel;
                    })
                    .override('calcTextFitInfo', function(scene, text) {
                        // We only know how to handle certain cases:
                        // -> valuesAnchor === 'outer'
                        // -> textBaseline === 'middle'
                        // -> text whose angle is the same (or +PI) of
                        //    the midAngle of the slice.
                        // -> textAlign === 'right' or 'left', depending on same or opposite angle.
                        // -> non-negative text margins
                        var pvLabel = this.pvMark,
                            tm = pvLabel.textMargin();

                        if(tm < -1e-6) return;

                        var tb = pvLabel.textBaseline();
                        if(tb !== 'middle') return;

                        var sa = pvc.normAngle(me.pvPie.midAngle()),
                            la = pvc.normAngle(pvLabel.textAngle()),
                            sameAngle = Math.abs(sa - la) < 1e-6,
                            oppoAngle = false;

                        if(!sameAngle) {
                            var la2 = pvc.normAngle(la + Math.PI);
                            oppoAngle = Math.abs(sa - la2) < 1e-6;
                        }

                        if(!sameAngle && !oppoAngle) return;

                        // the name of the anchor gets evaluated in the anchored mark;
                        var va = pvLabel.name(),
                            ta = pvLabel.textAlign(),
                            canHandle =
                                //va === 'center' ? ta === 'center' :
                                va === 'outer'
                                    ? (ta === (sameAngle ? 'right' : 'left'))
                                    : false;

                        if(!canHandle) return;

                        var hide = false, 
                            m = pv.Text.measure(text, pvLabel.font()),
                            th = m.height * 0.85, // tight text bounding box
                            or = me.pvPie.outerRadius(),
                            ir = me.pvPie.innerRadius(),
                            a  = scene.vars.value.angle, // angle span!
                            // Minimum inner radius whose straight-arc has a length `th`
                            thEf = th + tm/2, // On purpose, only including a quarter textMargin on each side.
                            irmin = a < Math.PI
                                ? Math.max(ir, thEf / (2 * Math.tan(a / 2)))
                                : ir,
                            // Here, on purpose, we're not including two `tm`, for left and right,
                            // cause we don't want that the clipping by height, the <= 0 test below,
                            // takes into account the inner margin. I.e., text is allowed to be shorter,
                            // in the inner margin zone, which, after all, is supposed to not have any text!
                            twMax = (or - tm) - irmin;

                        // If with this angle-span only at a very far 
                        // radius would `thEf` be achieved, then text will never fit,
                        // not even trimmed.
                        hide |= (twMax <= 0);

                        // But now, we subtract it cause we want the text width to respect the inner margin.
                        twMax -= tm;

                        hide |= (this.hideOverflowed && m.width > twMax);
                        
                        return {
                            hide: hide,
                            widthMax: twMax
                        };
                    })
                    .pvMark
                    .textMargin(10);

            } else if(this.labelStyle === 'linked') {
                var linkLayout = layoutInfo.link;

                rootScene.layoutLinkLabels(layoutInfo);

                this.pvLinkPanel = this.pvPanel.add(pv.Panel)
                    .data(rootScene.childNodes)
                    .localProperty('pieSlice')
                    .pieSlice(function() { return me.pvPie.scene[this.index]; });

                var f = false, t = true;
                this.pvLinkLine = new pvc.visual.Line(
                    this,
                    this.pvLinkPanel,
                    {
                        extensionId:  'linkLine',
                        freePosition:  t,
                        noClick:       t,
                        noDoubleClick: t,
                        noSelect:      t,
                        noTooltip:     t,
                        noHover:       t,
                        showsActivity: f
                    })
                    .lockMark('data', function(scene) {
                        // Calculate the dynamic dot at the
                        // slice's middle angle and outer radius...
                        var pieSlice = this.parent.pieSlice(),
                            midAngle = pieSlice.startAngle + pieSlice.angle / 2,
                            outerRadius = pieSlice.outerRadius - linkLayout.insetRadius,
                            x = pieSlice.left + outerRadius * Math.cos(midAngle),
                            y = pieSlice.top  + outerRadius * Math.sin(midAngle),
                            firstDotScene = scene.childNodes[0];

                        if(!firstDotScene || !firstDotScene._isFirstDynamicScene) {
                            firstDotScene = new pvc.visual.PieLinkLineScene(scene, x, y, /* index */ 0);

                            firstDotScene._isFirstDynamicScene = t;
                        } else {
                            firstDotScene.x = x;
                            firstDotScene.y = y;
                        }

                        return scene.childNodes;
                    })
                    .override('defaultColor', function(scene, type) {
                        return type === 'stroke' ? 'black' : this.base(scene, type);
                    })
                    .override('defaultStrokeWidth', def.fun.constant(0.5))
                    .pvMark
                    .lock('visible')
                    .lock('top',  function(dot) { return dot.y; })
                    .lock('left', function(dot) { return dot.x; });

                this.pvPieLabel = new pvc.visual.Label(
                    this,
                    this.pvLinkPanel,
                    {
                        extensionId:   'label',
                        noClick:       f,
                        noDoubleClick: f,
                        noSelect:      f,
                        noHover:       f,
                        showsInteraction: t
                    })
                    .lockMark('data', function(scene) {
                        // Repeat the scene, once for each line
                        return scene.lineScenes;
                    })
                    .intercept('textStyle', function(scene) {
                        this._finished = f;
                        var style = this.delegate();
                        if(style &&
                           !this._finished &&
                           !this.mayShowActive(scene) &&
                            this.mayShowNotAmongSelected(scene)) {
                            style = this.dimColor(style, 'text');
                        }

                        return style;
                    })
                    .pvMark
                    .lock('visible')
                    .left     (function(scene) { return scene.vars.link.labelX; })
                    .top      (function(scene) { return scene.vars.link.labelY + ((this.index + 1) * linkLayout.lineHeight); }) // must be mark.index because of repeating scene...
                    .textAlign(function(scene) { return scene.vars.link.labelAnchor; })
                    .textMargin(linkLayout.textMargin)
                    .textBaseline('bottom')
                    .text     (function(scene) { return scene.vars.link.labelLines[this.index]; });

                // <Debug>
                if(pvc.debug >= 20) {
                    this.pvPanel.add(pv.Panel)
                        .zOrder(-10)
                        .left  (center.x - layoutInfo.clientRadius)
                        .top   (center.y - layoutInfo.clientRadius)
                        .width (layoutInfo.clientRadius * 2)
                        .height(layoutInfo.clientRadius * 2)
                        .strokeStyle('red');

                    // Client Area
                    this.pvPanel
                        .strokeStyle('green');

                    var linkColors = pv.Colors.category10();
                    this.pvLinkLine
                        .segmented(t)
                        .strokeStyle(function() { return linkColors(this.index); });
                }
                // </Debug>
            }

            this.pvPieLabel
                .font(layoutInfo.labelFont);
        }
    },

    _getExtensionId: function() {
        // 'chart' is deprecated
        // 'content' coincides, visually, with 'plot', in this chart type
        // - actually it shares the same panel...

        var extensionIds = [{abs: 'content'}];
        if(this.chart.parent) extensionIds.push({abs: 'smallContent'});

        return extensionIds.concat(this.base());
    },

    /**
     * Renders this.pvBarPanel - the parent of the marks that are affected by selection changes.
     * @override
     */
    renderInteractive: function() {
        this.pvPanel.render();
    },

    _buildScene: function() {
        var rootScene  = new pvc.visual.PieRootScene(this);

        // v1 property
        this.sum = rootScene.vars.sumAbs.value;

        return rootScene;
    }
});

pvc.PlotPanel.registerClass(pvc.PiePanel);

def
.type('pvc.visual.PieRootScene', pvc.visual.Scene)
.init(function(panel) {
    var categAxis     = panel.axes.category,
        categRootData = categAxis.domainData();

    this.base(null, {panel: panel, source: categRootData});

    var colorVarHelper = new pvc.visual.RoleVarHelper(this, 'color', panel.visualRoles.color),
        valueDimName = panel.visualRoles[panel.valueRoleName].lastDimensionName(),
        valueDim     = categRootData.dimensions(valueDimName),
        pctValueFormat = panel.chart.options.percentValueFormat,
        angleScale = panel.axes.angle.scale,
        sumAbs     = angleScale.isNull ? 0 : angleScale.domain()[1],
        rootScene = this;

    this.vars.sumAbs = new pvc_ValueLabelVar(sumAbs, formatValue(sumAbs));

    // Create category scene sub-class
    var CategSceneClass = def.type(pvc.visual.PieCategoryScene)
        .init(function(categData, value) {
            // Adds to parent scene...
            this.base(rootScene, {source: categData});

            this.vars.category = pvc_ValueLabelVar.fromComplex(categData);

            var valueVar = new pvc_ValueLabelVar(
                value,
                formatValue(value, categData));

            // Calculate angle (span)
            valueVar.angle = angleScale(value);

            // Create percent sub-var of the value var
            var percent = Math.abs(value) / sumAbs;
            valueVar.percent = new pvc_ValueLabelVar(
                    percent,
                    pctValueFormat(percent));

            this.vars.value = valueVar;

            // Calculate slice label
            // NOTE: must be done AFTER setting this.vars.value above,
            // because of call to this.format.
            valueVar.sliceLabel = this.sliceLabel();

            colorVarHelper.onNewScene(this, /*isLeaf*/true);
        });

    // Extend with any user extensions
    panel._extendSceneType('category', CategSceneClass, ['sliceLabel', 'sliceLabelMask']);

    // Create child category scenes
    var categDatas = categAxis.domainItems();
    if(categDatas.length) {
        categDatas.forEach(function(categData) {
            // Value may be negative.
            // Don't create 0-value scenes.
            // null is returned as 0.
            var value = categData.dimensions(valueDimName).value();
            if(value !== 0) { new CategSceneClass(categData, value); }
        });

        // Not possible to represent as pie if sumAbs = 0.
        // If this is a small chart, don't show message, which results in a pie with no slices..., a blank plot.
        if(!rootScene.childNodes.length && !panel.chart.visualRoles.multiChart.isBound())
           throw new InvalidDataException("Unable to create a pie chart, please check the data values.");
    }

    function formatValue(value, categData) {
        if(categData) {
            var datums = categData._datums;
            // Prefer to return the already formatted/provided label
            if(datums.length === 1) return datums[0].atoms[valueDimName].label;
        }
        return valueDim.format(value);
    }
})
.add({
    layoutLinkLabels: function(layoutInfo) {
        var startAngle = -Math.PI / 2,
            leftScenes  = [],
            rightScenes = [];

        this.childNodes.forEach(function(categScene) {
            startAngle = categScene.layoutI(layoutInfo, startAngle);

            (categScene.vars.link.dir > 0 ? rightScenes : leftScenes).push(categScene);
        });

        // Distribute left and right labels and finish their layout
        this._distributeLabels(-1, leftScenes,  layoutInfo);
        this._distributeLabels(+1, rightScenes, layoutInfo);
    },

    _distributeLabels: function(dir, scenes, layoutInfo) {
        // Initially, for each category scene,
        //   targetY = elbowY
        // Taking additionally labelHeight into account,
        //  if this position causes overlapping, find a != targetY
        //  that does not cause overlap.

        // Sort scenes by Y position
        scenes.sort(function(sceneA, sceneB) {
            return def.compare(sceneA.vars.link.targetY, sceneB.vars.link.targetY);
        });

        /*jshint expr:true */
        this._distributeLabelsDownwards(scenes, layoutInfo) &&
        this._distributeLabelsUpwards  (scenes, layoutInfo) &&
        this._distributeLabelsEvenly   (scenes, layoutInfo);

        scenes.forEach(function(categScene) { categScene.layoutII(layoutInfo); });
    },

    _distributeLabelsDownwards: function(scenes, layoutInfo) {
        var linkLayout = layoutInfo.link,
            labelSpacingMin = linkLayout.labelSpacingMin,
            yMax = layoutInfo.clientSize.height,
            overlapping = false;

        for(var i = 0, J = scenes.length - 1 ; i < J ; i++) {
            var linkVar0 = scenes[i].vars.link;

            if(!i && linkVar0.labelTop() < 0) overlapping = true;

            var linkVar1 = scenes[i + 1].vars.link,
                labelTopMin1 = linkVar0.labelBottom() + labelSpacingMin;
            if(linkVar1.labelTop() < labelTopMin1) {
                var halfLabelHeight1 = linkVar1.labelHeight / 2,
                    targetY1 = labelTopMin1 + halfLabelHeight1,
                    targetYMax = yMax - halfLabelHeight1;

                if(targetY1 > targetYMax) {
                    overlapping = true;
                    linkVar1.targetY = targetYMax;
                } else {
                    linkVar1.targetY = targetY1;
                }
            }
        }

        return overlapping;
    },

    _distributeLabelsUpwards: function(scenes, layoutInfo) {
        var linkLayout = layoutInfo.link,
            labelSpacingMin = linkLayout.labelSpacingMin,
            overlapping = false;

        for(var i = scenes.length - 1 ; i > 0 ; i--) {
            var linkVar1 = scenes[i - 1].vars.link,
                linkVar0 = scenes[i].vars.link;

            if(i === 1 && linkVar1.labelTop() < 0) overlapping = true;

            var labelBottomMax1 = linkVar0.labelTop() - labelSpacingMin;
            if(linkVar1.labelBottom() > labelBottomMax1) {
                var halfLabelHeight1 = linkVar1.labelHeight / 2,
                    targetY1   = labelBottomMax1 - halfLabelHeight1,
                    targetYMin = halfLabelHeight1;
                if(targetY1 < targetYMin) {
                    overlapping = true;
                    linkVar1.targetY = targetYMin;
                } else {
                    linkVar1.targetY = targetY1;
                }
            }
        }

        return overlapping;
    },

    _distributeLabelsEvenly: function(scenes, layoutInfo) {
        var totalHeight = 0;
        scenes.forEach(function(categScene) {
            totalHeight += categScene.vars.link.labelHeight;
        });

        var freeSpace = layoutInfo.clientSize.height - totalHeight, // may be < 0
            labelSpacing = freeSpace;
        if(scenes.length > 1) labelSpacing /= (scenes.length - 1);

        var y = 0;
        scenes.forEach(function(scene) {
            var linkVar = scene.vars.link,
                halfLabelHeight = linkVar.labelHeight / 2;
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
    labelTop:    function() { return this.targetY - this.labelHeight / 2; },
    labelBottom: function() { return this.targetY + this.labelHeight / 2; }
});

def
.type('pvc.visual.PieCategoryScene', pvc.visual.Scene)
.add({
    // extendable
    sliceLabelMask: function() { return this.panel().valuesMask; },

    // extendable
    sliceLabel: function() { return this.format(this.sliceLabelMask()); },

    layoutI: function(layoutInfo, startAngle) {
        var valueVar = this.vars.value,
            endAngle = startAngle + valueVar.angle,
            midAngle = (startAngle + endAngle) / 2,
            // Overwrite existing link var, if any.
            linkVar = (this.vars.link = new pvc.visual.PieLinkLabelVar()),
            linkLayout = layoutInfo.link,
            labelLines = pvc.text.justify(valueVar.sliceLabel, linkLayout.maxTextWidth, layoutInfo.labelFont),
            lineCount = labelLines.length;

        linkVar.labelLines  = labelLines;
        linkVar.labelHeight = lineCount * linkLayout.lineHeight;

        this.lineScenes = def.array.create(lineCount, this);

        var cosMid = Math.cos(midAngle),
            sinMid = Math.sin(midAngle),
            isAtRight = cosMid >= 0,
            dir = isAtRight ? 1 : -1;

        // Label anchor is at the side with opposite name to the side of the pie where it is placed.
        linkVar.labelAnchor = isAtRight ?  'left' : 'right';

        var center = layoutInfo.center,
            elbowRadius = linkLayout.elbowRadius,
            elbowX = center.x + elbowRadius * cosMid,
            elbowY = center.y + elbowRadius * sinMid, // baseY
            anchorX = center.x + dir * elbowRadius,
            targetX = anchorX + dir * linkLayout.linkMargin;

        new pvc.visual.PieLinkLineScene(this, elbowX,  elbowY);
        new pvc.visual.PieLinkLineScene(this, anchorX, elbowY);

        linkVar.elbowY  = elbowY;
        linkVar.targetY = elbowY + 0;
        linkVar.targetX = targetX;
        linkVar.dir = dir;

        return endAngle;
    },

    layoutII: function(layoutInfo) {
        var linkVar = this.vars.link,
            targetY = linkVar.targetY,
            targetX = linkVar.targetX,
            handleWidth = layoutInfo.link.handleWidth;

        if(handleWidth > 0)
            new pvc.visual.PieLinkLineScene(this, targetX - linkVar.dir * handleWidth, targetY);

        new pvc.visual.PieLinkLineScene(this, targetX, targetY);

        linkVar.labelX = targetX;
        linkVar.labelY = targetY - linkVar.labelHeight/2;
    }
});

def
.type('pvc.visual.PieLinkLineScene', pvc.visual.Scene)
.init(function(catScene, x, y, index) {
    this.base(catScene, {source: catScene.group, index: index});

    this.x = x;
    this.y = y;
})
.add(pv.Vector);

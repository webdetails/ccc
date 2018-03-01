/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true */

def
.type('pvc.SunburstPanel', pvc.PlotPanel)
.init(function(chart, parent, plot, options) {

    this.base(chart, parent, plot, options);

    this.axes.size = chart._getAxis('size', (plot.option('SizeAxis') || 0) - 1); // may be undefined

    this.sliceOrder = plot.option('SliceOrder');

    this.emptySlicesVisible = plot.option('EmptySlicesVisible');

    this.emptySlicesLabel = this.emptySlicesVisible ? plot.option('EmptySlicesLabel') : "";
})
.add({
    plotType: 'sunburst',

    _createCore: function() {
        var labelFont = this._getConstantExtension('label', 'font');
        if(def.string.is(labelFont)) this.valuesFont = labelFont;

        var me = this,
            rootScene = me._buildScene();

        // Every datum is hidden
        if(!rootScene) return;

        // Not possible to represent a sunburst if rootScene.vars.size.value = 0.
        // If this is a small chart, don't show message, which results in a blank plot.
        if(!rootScene.childNodes.length && !this.chart.visualRoles.multiChart.isBound())
           throw new pvc.InvalidDataException("Unable to create a sunburst chart, please check the data values.", "all-zero-data");

        // Does not use sceneScale on purpose because of the 'nullToZero'
        // code not calling the base scale when null.
        // The base scale already handles the null case, translating it to the minimum value.
        var sizeProp = me.visualRoles.size.isBound()
                ? me.axes.size.scale.by1(function(scene) { return scene.vars.size.value; })
                : def.fun.constant(100),

            panel = me.pvSunburstPanel = new pvc.visual.Panel(me, me.pvPanel, {
                    panelType:   pv.Layout.Partition.Fill,
                    extensionId: 'panel'
                })
                .pvMark
                .lock('visible', true)
                .lock('nodes',   rootScene.nodes())
                .lock('size',    sizeProp)
                .lock('orient',  'radial'),

            slice = new pvc.visual.SunburstSlice(this, panel.node, {
                    extensionId : 'slice',
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
                }),

            label = pvc.visual.ValueLabel.maybeCreate(me, panel.label, {noAnchor: true});

        if(label) {
            label
                .override('defaultText', function(scene) {
                    return scene.isRoot() ? "" : this.base(scene);
                })
                .override('calcTextFitInfo', function(scene, text) {
                    // We only know how to handle certain cases:
                    // -> textAlign: 'center'
                    // -> textBaseline: 'middle', 'bottom' or 'top'
                    // -> text whose angle is the same (or +PI) of
                    //    the midAngle of the slice.
                    // -> non-negative text margins

                    var pvLabel = this.pvMark,
                        tm = pvLabel.textMargin();

                    if(tm < -1e-6) return;
                    if(pvLabel.textAlign() !== 'center') return;
                    if(!text) return;

                    var ma = pvc.normAngle(scene.midAngle),
                        la = pvc.normAngle(pvLabel.textAngle()),
                        sameAngle = Math.abs(ma - la) < 1e-6,
                        oppoAngle = false;

                    if(!sameAngle) {
                        var la2 = pvc.normAngle(la + Math.PI);
                        oppoAngle = Math.abs(ma - la2) < 1e-6;
                    }

                    if(!sameAngle && !oppoAngle) return;

                    var ir = scene.innerRadius,
                        irmin = ir,
                        or = scene.outerRadius,
                        a  = scene.angle, // angle span
                        m  = pv.Text.measure(text, pvLabel.font()),
                        hide = false, twMax;

                    if(a < Math.PI) {
                        var th = m.height * 0.85, // tight text bounding box
                            tb = pvLabel.textBaseline(),

                            // The effective height of text that must be covered.
                            thEf = tb === 'middle'
                                // quarter text margin on each side
                                ? (th + tm/2)
                                // one text margin, for the anchor,
                                // half text margin for the anchor's opposite side.
                                // All on only one of the sides of the wedge.
                                : 2 * (th + 3*tm/2);

                        // Minimum inner radius whose straight-arc has a length `thEf`
                        irmin = Math.max(
                            irmin,
                            thEf / (2 * Math.tan(a / 2)));
                    }

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
                .override('getAnchoredToMark', function() { return slice.pvMark; });
        }
    },

    renderInteractive: function() {
        this.pvSunburstPanel.render();
    },

    _buildScene: function() {
        // Hierarchical data, by categ1 (level1) , categ2 (level2), categ3 (level3),...
        var data = this.visibleData({ignoreNulls: false}),
            emptySlicesVisible = this.emptySlicesVisible,
            emptySlicesLabel   = this.emptySlicesLabel;

        // Everything hidden?
        if(!data.childCount()) return null;

        var roles = this.visualRoles,
            rootScene = new pvc.visual.SunburstScene(null, {panel: this, source: data}),
            sizeIsBound = roles.size.isBound(),
            sizeVarHelper = new pvc.visual.RoleVarHelper(rootScene, 'size', roles.size,  {allowNestedVars: true, hasPercentSubVar: true}),
            colorGrouping = roles.color && roles.color.grouping,
            colorAxis = this.axes.color,
            colorMode = this.plot.option('ColorMode'),
            isColorModeFan = colorMode === 'fan',
            isColorModeLevel = colorMode === 'level',
            isColorModeSlice = colorMode === 'slice',
            colorScale = roles.color.isBound()
                ? colorAxis.sceneScale({sceneVarName: 'color'})
                : def.fun.constant(colorAxis.option('Unbound')),
            colorAvailable = colorScale.available || def.retFalse,
            levels = 0,
            colorBrightnessFactor,
            sliceLevelAlphaRatio,
            sliceLevelAlphaMin;

        if(isColorModeFan) {
            colorBrightnessFactor = colorAxis.option('SliceBrightnessFactor');
        } else if(isColorModeLevel) {
            sliceLevelAlphaRatio = colorAxis.option('SliceLevelAlphaRatio');
            sliceLevelAlphaMin = colorAxis.option('SliceLevelAlphaMin');
        }

        function recursive(scene, level) {

            if(level > levels) levels = level;

            var group = scene.group,
                catVar = scene.vars.category = pvc_ValueLabelVar.fromComplex(group);

            if(emptySlicesLabel && catVar.value == null) // same as group.value
                catVar.value = emptySlicesLabel;

            // For what the var helpers are concerned, all nodes are considered leafs,
            // so that the size variable is created in every level.
            sizeVarHelper.onNewScene(scene, /*isLeaf*/ true);
            if(sizeIsBound && !scene.vars.size.value) {
                // 0-valued branch, retreat
                // Remove from parent, if not the root itself.
                // Return the scene anyway (required for the rootScene).
                if(scene.parentNode) scene.parentNode.removeChild(scene);
                return scene;
            }

            var children = group.children();

            // Ignore degenerate childs?
            if(!emptySlicesVisible) {
                children = children.where(function(childData) {
                    return childData.value != null;
                });
            }

            if(!colorGrouping) {
                scene.vars.color = new pvc_ValueLabelVar(null, "");
            } else {
                var colorView = colorGrouping.view(group);
                scene.vars.color = new pvc_ValueLabelVar(
                    colorView.keyTrimmed(),
                    colorView.label);
            }

            children.each(function(childData) {
                recursive(new pvc.visual.SunburstScene(scene, {source: childData}), level + 1);
            });

            return scene;
        }

        function calculateColor(scene, index, siblingsSize, level) {
            var baseColor = null,
                parent = scene.parent;
            if(parent) {
                // level >= 1
                // First-level nodes should have an own color.
                // Other levels get a color derived from its parent,
                // unless a color is available for it.
                var isColorAvailable = isColorModeSlice || parent.isRoot() || colorAvailable(scene.vars.color.value);

                baseColor = isColorAvailable ? colorScale(scene) : null;

                // Derive a color from the parent's color.
                if(!baseColor && (baseColor = parent.color)) {
                    if(isColorModeFan) {
                        if(index && colorBrightnessFactor) {
                            baseColor = baseColor.brighter(colorBrightnessFactor * index / (siblingsSize - 1));
                        }
                    } else if(isColorModeLevel) {
                        // level >= 2
                        baseColor = baseColor.rgb();

                        var r = sliceLevelAlphaRatio * (level - 1);
                        var a = Math.max(sliceLevelAlphaMin, (1 - r) * baseColor.a);
                        baseColor = baseColor.alpha(a);
                    }
                }
            }

            scene.color = baseColor;

            // Recursive Call
            var children = scene.childNodes, childrenSize = children.length;

            children.forEach(function(childScene, index) {
                calculateColor(childScene, index, childrenSize, level + 1);
            });
        }

        // Build Scene
        recursive(rootScene, 0);

        // Sort Scenes
        if(this.sliceOrder && sizeIsBound && this.sliceOrder !== "none") {
            var compare = this.sliceOrder === "bysizeascending" ? def.ascending : def.descending ;
            rootScene.sort(function(sceneA, sceneB) {
                return compare(sceneA.vars.size.value, sceneB.vars.size.value) ||
                       // Preserve source order when equal sizes.
                       // Note that calling childIndex only works during sort
                       // because we know that we did not change the childNodes
                       // after adding the children, and so their initial indexes will
                       // not be dirty... see protovis' pv.Dom.Node#sort implementation
                       // to understand this better.
                       def.ascending(sceneA.childIndex(), sceneB.childIndex());
            });
        }

        // Color Scenes
        calculateColor(rootScene, 0, 0, 0);

        return rootScene;
    }
});

pvc.PlotPanel.registerClass(pvc.SunburstPanel);

def
.type('pvc.visual.SunburstScene', pvc.visual.Scene)
.add({
    _createSelectedInfo: function() {
        var any = this.chart().data.owner.selectedCount() > 0,
            isSelected = any && this.datums().all(cdo.Datum.isSelected);

        return {any: any, is: isSelected};
    }
});

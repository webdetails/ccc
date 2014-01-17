/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true */

def
.type('pvc.SunburstPanel', pvc.PlotPanel)
.init(function(chart, parent, plot, options){

    this.base(chart, parent, plot, options);

    this.axes.size = chart._getAxis('size', (plot.option('SizeAxis') || 0) - 1); // may be undefined

    this.visualRoles.size = chart.visualRole(plot.option('SizeRole'));

    this.sliceOrder = plot.option('SliceOrder');
    
    this.emptySlicesVisible = plot.option('EmptySlicesVisible');
})
.add({
    _createCore: function(layoutInfo) {
        var me = this;
        var cs = layoutInfo.clientSize;
        var rootScene = me._buildScene();
        if(!rootScene) { return; } // Everything hidden

        var sizeProp = me.visualRoles.size.isBound() ?
                       // Does not use sceneScale on purpose because of the 'nullToZero'
                       // code not calling the base scale when null.
                       // The base scale already handles the null case,
                       // translating it to the minimum value.
                       me.axes.size.scale.by1(function(scene) { return scene.vars.size.value; }) :
                       def.fun.constant(100);

        var panel = me.pvSunburstPanel = new pvc.visual.Panel(me, me.pvPanel, {
                panelType:   pv.Layout.Partition.Fill,
                extensionId: 'panel'
            })
            .pvMark
                .lock('visible', true)
                .lock('nodes',   rootScene.nodes())
                .lock('size',    sizeProp)
                .lock('orient',  'radial');

        var slice = new pvc.visual.SunburstSlice(this, panel.node, {
            extensionId : 'slice',
            tooltipArgs: {
                options: {
                    useCorners: true,
                    gravity: function() {
                        var ma = this.midAngle();
                        var isRightPlane = Math.cos(ma) >= 0;
                        var isTopPlane   = Math.sin(ma) >= 0;
                        return  isRightPlane ?
                                (isTopPlane ? 'nw' : 'sw') :
                                (isTopPlane ? 'ne' : 'se');
                    }
                }
            }
        });

        var label = pvc.visual.ValueLabel.maybeCreate(me, panel.label, {noAnchor: true});
        if(label) {
            label
                .override('defaultText', function(scene) {
                    if(scene.isRoot()) {
                        return "";
                    }

                    return this.base(scene);
                })
                .override('trimText', function(scene, text) {
                    var maxWidth = scene.outerRadius - scene.innerRadius;

                    if(scene.angle < Math.PI) {
                        var L = maxWidth / 2 + scene.innerRadius;
                        var t2 = scene.angle / 2;
                        var h = 2 * L * Math.tan(t2);

                        if(pv.Text.fontHeight(scene.vars.font) > h) {
                            return "";
                        }
                    }

                    return pvc.text.trimToWidthB(maxWidth*.95, text, scene.vars.font, "..");
                })
                .override('calcBackgroundColor', function(scene) {
                    return slice.pvMark.scene[this.pvMark.index].fillStyle;
                })
        }
    },

    _getExtensionId: function(){
        // 'content' coincides, visually, with 'plot', in this chart type
        // Actually it shares the same panel...

        var extensionIds = [{abs: !this.chart.parent ? 'content' : 'smallContent'}];
        return extensionIds.concat(this.base());
    },

    renderInteractive: function(){
        this.pvSunburstPanel.render();
    },

    _buildScene: function() {
        // Hierarchical data, by categ1 (level1) , categ2 (level2), categ3 (level3),...
        var data = this.visibleData({ignoreNulls: false});

        // Everything hidden?
        if(!data.childCount()) { return null; }

        var roles = this.visualRoles;
        var rootScene = new pvc.visual.SunburstScene(null, {panel: this, source: data});
        var sizeIsBound = roles.size.isBound();
        var sizeVarHelper = new pvc.visual.RoleVarHelper(rootScene, roles.size,  {roleVar: 'size',  allowNestedVars: true, hasPercentSubVar: true});
        var colorGrouping = roles.color && roles.color.grouping;
        var colorAxis = this.axes.color;
        var colorBrightnessFactor = colorAxis.option('SliceBrightnessFactor');

        var colorScale;
        if(roles.color.isBound()) {
            colorScale = colorAxis.sceneScale({sceneVarName: 'color'});
        } else {
            colorScale = def.fun.constant(colorAxis.option('Unbound'));
        }

        var recursive = function(scene) {
            var group = scene.group;
            scene.vars.category = pvc_ValueLabelVar.fromComplex(group);

            // All nodes are considered leafs, for what the var helpers are concerned
            //  so that the size variable is created in every level.
            sizeVarHelper.onNewScene(scene, /*isLeaf*/ true);

            // Ignore degenerate childs
            var children = group
                .children()
                .where(function(childData) { return childData.value != null; })
                .array();

            if(!colorGrouping) {
                scene.vars.color = new pvc_ValueLabelVar(null, "");
            } else {
                var colorView = colorGrouping.view(group);
                scene.vars.color = new pvc_ValueLabelVar(
                    colorView.keyTrimmed(),
                    colorView.label);
            }

            children.forEach(function(childData) {
                recursive(new pvc.visual.SunburstScene(scene, {source: childData}));
            });

            return scene;
        };

        var calculateColor = function(scene, index, siblingsSize) {
            var baseColor = null;

            var parent = scene.parent;
            if(parent) {
                if(parent.isRoot()) {
                    baseColor = colorScale(scene);
                } else {
                    baseColor = parent.color;
                    if(index && colorBrightnessFactor)
                        baseColor = baseColor.brighter(
                            colorBrightnessFactor * index / (siblingsSize - 1));
                }
            }

            scene.color = baseColor;

            // Recursive Call
            var children = scene.childNodes;
            var childrenSize = children.length;
            children.forEach(function(childScene, index) {
                calculateColor(childScene, index, childrenSize);
            });
        };

        // Build Scene
        recursive(rootScene);

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
        calculateColor(rootScene, 0);

        return rootScene;
    }
});


def
.type('pvc.visual.SunburstScene', pvc.visual.Scene)
.add({
    _createSelectedInfo: function() {
        /*global datum_isSelected:true */
        var any = this.chart().data.owner.selectedCount() > 0,
            isSelected = any && this.datums().all(datum_isSelected);

        return {any: any, is: isSelected};
    }
})
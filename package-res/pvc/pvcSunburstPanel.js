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
    
    this.layoutMode = plot.option('LayoutMode');

    this.chartOptions = chart.options;
})
.add({
    _createCore: function(layoutInfo) {
        var me = this;
        var cs = layoutInfo.clientSize;
        var rootScene = me._buildScene();
        if(!rootScene) { return; } // Everything hidden
        
        var lw0 = def.number.to(me._getConstantExtension('leaf', 'lineWidth'), 1);
        var lw  = lw0;
        var lw2 = lw/2;
        
        var sizeProp = me.visualRoles.size.isBound() ?
                       // Does not use sceneScale on purpose because of the 'nullToZero'
                       // code not calling the base scale when null.
                       // The base scale already handles the null case, 
                       // translating it to the minimum value.
                       me.axes.size.scale.by1(function(scene) { return scene.vars.size.value; }) :
                       100;

        var panel = me.pvSunburstPanel = new pvc.visual.Panel(me, me.pvPanel, {
                panelType:   pv.Layout.Partition.Fill,
                extensionId: 'panel'
            })
            .pvMark
                .lock('visible', true)
                .lock('nodes',   rootScene.nodes())
                .lock('left',    lw2)
                .lock('top',     lw2)
                .lock('size',    function(d) { return parseInt(d.tooltip); })
                .lock('order',   'descending')
                .lock('orient',  'radial');

        var getLabel = function(d) {
            var atoms = d.atoms;
            var label = atoms.category.label;
            var type = atoms.category.dimension.type.label;

            var catInd = 1;
            var nextCat = atoms.category2;
            while (nextCat && nextCat.label !== "") {
                label = nextCat.label;
                type = nextCat.dimension.type.label;
                
                ++catInd;
                nextCat = eval("atoms.category" + catInd);
            }

            return {
                type : type,
                value : label
            };
        }

        var colorAxis = me.axes.color;
        var colorScale;
        if(me.visualRoles.color.isBound()) {
            colorScale = colorAxis.sceneScale({sceneVarName: 'color'});
        } else {
            colorScale = def.fun.constant(colorAxis.option('Unbound'));
        }

        // Add the wedges
        var overWedges = [];
        panel.node
            .left  (function(n) { return n.x  + lw; })
            .top   (function(n) { return n.y  + lw; })
            .width (function(n) { return n.dx - lw;  })
            .height(function(n) { return n.dy - lw;  })
            .add(pv.Wedge)
                .fillStyle(function(d) { 
                    var color = d.isRoot() || d.isNull ? "#FFFFFF" : colorScale(d);
                    return d.highlight ? "#000000" : color; 
                })
                .strokeStyle(function(d) { return d.mouseover ? "#000000" : "#FFFFFF" } )
                .lineWidth(function(d) { return 1; })
                .title(function(d) {
                    if (isNaN(d.tooltip) || d.isRoot()) {
                        return "";
                    }

                    var label = getLabel(d);
                    var child = d.firstChild;

                    return label.type + ": " + label.value + "\n" + 
                        d.firstAtoms.size.dimension.type.label + ": " + d.tooltip + 
                        (child ? "\n" + "Double-click to show " + getLabel(child).type : "");
                })
                .events("all")
                .event('click', function(d) {
                    if (d.isRoot()) {
                        return;
                    }

                    d.highlight = !d.highlight;
                    
                    var recurse = function(scene) {
                        for (i in scene.childNodes) {
                            var node = scene.childNodes[i];
                            node.highlight = scene.highlight;

                            recurse(node);
                        }
                    }
                    recurse(d);

                    panel.render();
                })
                .event('mouseover', function(d) {
                    if (!d.mouseover) {
                        for (var i = overWedges.length - 1 ; i >= 0; i--) {
                            overWedges.pop().mouseover = false;
                        }

                        d.mouseover = true;
                        overWedges.push(d);
                        panel.render();    
                    }
                })
                .event('mouseout', function(d) {
                    d.mouseover = false;
                    panel.render();
                });

        // Add the labels
        panel.label.add(pv.Label)
            .textStyle("#FFFFFF")
            .font("Arial")
            .text(function(d) {
                return getLabel(d).value;
            })
            .visible(function(d) { return d.parentNode && (d.angle * d.outerRadius >= 6) });
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
        var rootScene = new pvc.visual.Scene(null, {panel: this, source: data});
        var sizeVarHelper = new pvc.visual.RoleVarHelper(rootScene, roles.size,  {roleVar: 'size',  allowNestedVars: true, hasPercentSubVar: true});
        var colorGrouping = roles.color && roles.color.grouping;
        var colorByParent = colorGrouping && this.plot.option('ColorMode') === 'byparent';
        
        var recursive = function(scene) {
            var group = scene.group;
            
            // The 'category' var value is the local group's value...
            // 
            // When all categories are flattened into a single level
            // of a data hierarchy, 
            // each data's local key is compatible to the role key
            // (the one obtained by using:
            // pvc.data.Complex.compositeKey(complex, role.dimensioNames())
            // That key will be the concatenation of the keys of all atoms 
            // (corresponding to the single level's dimensions).
            // If any of these keys is empty, the key will contain 
            // consecutive ~ separator characters, like "Foo~Bar~~Guru",
            // or even a trailing one: "Foo~Bar~Guru~".
            //
            // On the other hand, the key obtained by an abs key, at a given node,
            // will contain all the keys of ascendant nodes, but no *trailing* empty keys.
            // The keys of compositeKeys are like if all keys were obtained
            // at the leaves of a regular tree (all branches have the same depth).
            // When a leaf did not, in fact, exist, 
            // an empty data node would be placed there anyway, 
            // with an empty key.
            // 
            // The two keys cannot currently be made compatible because
            // it seems that the waterfall's DfsPre/DfsPost flattening
            // needs the distinction between the key of the ancestor,
            // and the key of the unexistent leaf under it...
            //
            // 
            
            // TODO: Should be the abs key (no trailing empty keys)
            scene.vars.category = pvc_ValueLabelVar.fromComplex(group);
            
            // All nodes are considered leafs, for what the var helpers are concerned
            sizeVarHelper.onNewScene(scene, /*isLeaf*/ true);
            
            // Ignore degenerate childs
            var children = group
                .children()
                .where(function(childData) { return childData.value != null; })
                .array();
                    
            if(!colorGrouping) {
                if(!scene.parent) { scene.vars.color = new pvc_ValueLabelVar(null, ""); }
            } else {
                // Leafs, in colorByParent, receive the parent's color.
                var colorGroup = (colorByParent && !children.length) ? group.parent : group;
                if(!colorGroup) {
                    scene.vars.color = new pvc_ValueLabelVar(null, "");
                } else {
                    var colorView = colorGrouping.view(colorGroup);
                    //scene.vars.color = pvc_ValueLabelVar.fromComplex(colorView); //
                    //scene.vars.color = new pvc_ValueLabelVar(colorGroup.absKey, colorGroup.absLabel);
                    scene.vars.color = new pvc_ValueLabelVar(
                        colorView.keyTrimmed(), 
                        colorView.label);
                    
                }
            }
            
            scene.isLeaf = children.length == 0;
            scene.tooltip = 0.0;
            if (scene.isLeaf) {
                var dataStr = scene.firstAtoms.size.label;

                while (dataStr.search(",") > -1) {
                    dataStr = dataStr.replace(",", "");
                }

                scene.tooltip = parseFloat(dataStr);
            }
            else {
                children.forEach(function(childData) {
                    var childScene = new pvc.visual.Scene(scene, {source: childData});
                    recursive(childScene);
                    scene.tooltip += childScene.tooltip;
                });
            }

            
            scene.highlight = false;
            return scene;
        };
        
        return recursive(rootScene);
    }
});

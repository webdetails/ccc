/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true */

def
.type('pvc.TreemapPanel', pvc.PlotPanel)
.init(function(chart, parent, plot, options) {
    
    this.base(chart, parent, plot, options);
    
    this.axes.size = chart._getAxis('size', (plot.option('SizeAxis') || 0) - 1); // may be undefined

    this.layoutMode = plot.option('LayoutMode');
})
.add({
    plotType: 'treemap',

    _createCore: function(layoutInfo) {
        var me = this,
            cs = layoutInfo.clientSize,
            rootScene = me._buildScene();

        // Every datum is hidden
        if(!rootScene) return;

        // Not possible to represent a treemap if rootScene.vars.size.value = 0.
        // If this is a small chart, don't show message, which results in a blank plot.
        if(!rootScene.childNodes.length && !this.chart.visualRoles.multiChart.isBound())
           throw new InvalidDataException("Unable to create a treemap chart, please check the data values.");

        var lw0 = def.number.to(me._getConstantExtension('leaf', 'lineWidth'), 1),
            lw  = lw0,
            lw2 = lw/ 2,
            // Does not use sceneScale on purpose because of the 'nullToZero'
            // code not calling the base scale when null.
            // The base scale already handles the null case,
            // translating it to the minimum value.
            sizeProp = me.visualRoles.size.isBound()
                ? me.axes.size.scale.by1(function(scene) { return scene.vars.size.value; })
                : 100,

            panel = me.pvTreemapPanel = new pvc.visual.Panel(me, me.pvPanel, {
                    panelType:   pv.Layout.Treemap,
                    extensionId: 'panel'
                })
                .pvMark
                .lock('visible', true)
                .lock('nodes',   rootScene.nodes())
                // Reserve space for interaction borders
                .lock('left',    lw2)
                .lock('top',     lw2)
                .lock('width',   cs.width  - lw)
                .lock('height',  cs.height - lw)
                .lock('size',    sizeProp)
                .lock('mode',    me.layoutMode)
                .lock('order',   null) // TODO: option for this?
                .lock('round',   false);
        
        // Node prototype
        // Reserve space for interaction borders
        panel.node
            .left  (function(n) { return n.x  + lw2; })
            .top   (function(n) { return n.y  + lw2; })
            .width (function(n) { return n.dx - lw;  })
            .height(function(n) { return n.dy - lw;  });
        
        // ------------------
        
        var colorAxis = me.axes.color,
            colorScale = me.visualRoles.color.isBound()
                ? colorAxis.sceneScale({sceneVarName: 'color'})
                : def.fun.constant(colorAxis.option('Unbound')),

            pvLeafMark = new pvc.visual.Bar(me, panel.leaf, {extensionId: 'leaf'})
                .lockMark('visible')
                .override('defaultColor', function(scene) { return colorScale(scene); })
                .override('defaultStrokeWidth', function() { return lw0; })
                .pvMark
                .antialias(false)
                .lineCap('round') // only used by strokeDashArray
                .strokeDasharray(function(scene) {
                    return scene.vars.size.value < 0 ? 'dash' : null; // Keep this in sync with the style in pvc.sign.DotSizeColor
                });
       
        new pvc.visual.Bar(me, panel.node, {
            extensionId: 'ascendant',
            noHover:  true,
            noSelect: true,
            noClick:  true,
            noDoubleClick:  true
        })
        .intercept('visible', function(scene) {
            return !!scene.parent && 
                   !!scene.firstChild &&
                   this.delegateExtension(true); 
         })
        .override('anyInteraction', function(scene) {
            return scene.anyInteraction() || scene.isActiveDescendantOrSelf(); // special kind of interaction
        })
        .override('defaultStrokeWidth', function() { return 1.5 * lw; })
        .override('interactiveStrokeWidth', function(scene, w) {
            return (this.showsActivity() && scene.isActiveDescendantOrSelf())
                ? Math.max(1, w) * 1.5
                : w;
        })
        .override('defaultColor',     function(scene) { return colorScale(scene); })
        .override('normalColor',      def.fun.constant(null))
        .override('interactiveColor', function(scene, color, type) {
            if(type === 'stroke') {
                if(this.showsActivity()) {
                    if(scene.isActiveDescendantOrSelf()) return pv.color(color).brighter(0.5); /*.alpha(0.7)*/
                    if(scene.anyActive()) return null;
               }

               if(this.showsSelection() && scene.isSelectedDescendantOrSelf())
                   return pv.color(color).brighter(0.5); /*.alpha(0.7)*/
            }
            return null;
        })
        .pvMark
        .antialias(false);
        
        var label = pvc.visual.ValueLabel.maybeCreate(me, panel.label, {noAnchor: true});
        if(label) {
            label
            .pvMark
            .textMargin(3) // override Network's default text margin.
            .sign
            .optional('textAngle', function(scene) {
                // If it fits horizontally => horizontal.
                var text = this.defaultText(scene),
                    pvLabel = this.pvMark;

                return (scene.dx - 2 * pvLabel.textMargin() > pv.Text.measureWidth(text, pvLabel.font()))
                    ? 0
                    // Else, orient it in the widest dimension.
                    : ((scene.dx >= scene.dy) ? 0 : -Math.PI / 2);
            })
            .override('calcTextFitInfo', function(scene, text) {
                var pvLabel = this.pvMark,
                    tm = pvLabel.textMargin();

                if(tm < -1e-6) return;

                var ta = pvLabel.textAngle(),
                    isHorizText = Math.abs(Math.sin(ta)) < 1e-6,
                    isVertiText = !isHorizText && Math.abs(Math.cos(ta)) < 1e-6;
                
                if(!isHorizText && !isVertiText) return;

                var hide = false,
                    m  = pv.Text.measure(text, pvLabel.font()),
                    th = m.height * 0.75, // tight text bounding box
                    thMax = scene[isVertiText ? 'dx' : 'dy'];
                
                if(pvLabel.textBaseline() !== 'middle') thMax /= 2;

                thMax -= 2*tm;

                hide |= (th > thMax);

                // Text Width
                var twMax = scene[isVertiText ? 'dy' : 'dx'];
                    
                if(pvLabel.textAlign() !== 'center') twMax /= 2;

                twMax -= 2*tm;
                
                hide |= ((twMax <= 0) || (this.hideOverflowed && m.width > twMax));

                return {
                    hide: hide,
                    widthMax: twMax
                };
            })
            .override('getAnchoredToMark', function() { return pvLeafMark; });
        }
    },
    
    _getExtensionId: function() {
        // 'content' coincides, visually, with 'plot', in this chart type
        // Actually it shares the same panel...
        
        var extensionIds = [{abs: !this.chart.parent ? 'content' : 'smallContent'}];
        return extensionIds.concat(this.base());
    },
    
    renderInteractive: function() {
        this.pvTreemapPanel.render();
    },
    
    // Returns null when all size-var values sum to 0.
    _buildScene: function() {
        // Hierarchical data, by categ1 (level1) , categ2 (level2), categ3 (level3),...
        var data = this.visibleData({ignoreNulls: false})

        // Everything hidden?
        if(!data.childCount()) return null;
        
        var roles = this.visualRoles,
            rootScene     = new pvc.visual.Scene(null, {panel: this, source: data}),
            sizeVarHelper = new pvc.visual.RoleVarHelper(rootScene, 'size', roles.size, {allowNestedVars: true, hasPercentSubVar: true}),
            sizeIsBound   = roles.size.isBound(),
            colorGrouping = roles.color && roles.color.grouping,
            colorByParent = colorGrouping && this.plot.option('ColorMode') === 'byparent';
        
        function recursive(scene) {
            var group = scene.group;
            
            // The 'category' var value is the local group's value...
            // 
            // When all categories are flattened into a single level
            // of a data hierarchy, 
            // each data's local key is compatible to the role key
            // (the one obtained by using:
            // cdo.Complex.compositeKey(complex, role.dimensionNames())
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
            // and the key of the nonexistent leaf under it...

            // TODO: Should be the abs key (no trailing empty keys)
            scene.vars.category = pvc_ValueLabelVar.fromComplex(group);
            
            // All nodes are considered leafs, for what the var helpers are concerned
            sizeVarHelper.onNewScene(scene, /*isLeaf*/ true);
            if(sizeIsBound && !scene.vars.size.value) {
                // 0-valued branch, retreat
                // Remove from parent, if not the root itself.
                // Return the scene anyway (required for the rootScene).
                if(scene.parentNode) scene.parentNode.removeChild(scene);
                return scene;
            }

            // Ignore degenerate childs
            var children = group
                .children()
                .where(function(childData) { return childData.value != null; })
                .array();
                    
            if(!colorGrouping) {
                if(!scene.parent) scene.vars.color = new pvc_ValueLabelVar(null, "");
            } else {
                // Leafs, in colorByParent, receive the parent's color.
                var colorGroup = (colorByParent && !children.length) ? group.parent : group;
                if(!colorGroup) {
                    scene.vars.color = new pvc_ValueLabelVar(null, "");
                } else {
                    var colorView = colorGrouping.view(colorGroup);
                    //scene.vars.color = pvc_ValueLabelVar.fromComplex(colorView); //
                    //scene.vars.color = new pvc_ValueLabelVar(colorGroup.absKey, colorGroup.absLabel);
                    scene.vars.color = new pvc_ValueLabelVar(colorView.keyTrimmed(), colorView.label);
                }
            }
            
            children.forEach(function(childData) {
                recursive(new pvc.visual.Scene(scene, {source: childData}));
            });
            
            return scene;
        }
        
        return recursive(rootScene);
    }
});

pvc.PlotPanel.registerClass(pvc.TreemapPanel);

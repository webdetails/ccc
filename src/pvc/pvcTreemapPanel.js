/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true */

def
.type('pvc.TreemapPanel', pvc.PlotPanel)
.init(function(chart, parent, plot, options){
    
    this.base(chart, parent, plot, options);
    
    this.axes.size = chart._getAxis('size', (plot.option('SizeAxis') || 0) - 1); // may be undefined

    this.visualRoles.size = chart.visualRole(plot.option('SizeRole'));
})
.add({
    _createCore: function(layoutInfo) {
        var me = this;
        var plot = me.plot;
        var cs = layoutInfo.clientSize;
        var rootScene = me._buildScene();
        if(!rootScene) { return; } // Everything hidden
        
        var maxDepth = rootScene.group.treeHeight;
        
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
        
        // ------------------
        // HEADERS ?
        var headersHeight = 0;
        var headersFont;
        if(plot.option('HeadersVisible')) {
           headersFont = plot.option('HeadersFont');
           
           // Measure the font height
           headersHeight = pv.Text.fontHeight(headersFont)/*px*/ * 1.2 /*em*/;
        }               
        
        // ------------------
        // COLOR Scales
        var colorAxis = me.axes.color;
        var colorScaleDirect, colorScaleLeaf;
        if(me.visualRoles.color.isBound()) {
            colorScaleLeaf = colorScaleDirect = colorAxis.sceneScale({sceneVarName: 'color'});
            if(me.plot.option('ColorMode') === 'byparent') {
                colorScaleLeaf = colorScaleLeaf.by(def.propGet('parent'));
            }
        } else {
            colorScaleLeaf = colorScaleDirect = def.fun.constant(colorAxis.option('Unbound'));
        }
        
        // --------------------
        // TREEMAP Panel
        var panel = me.pvTreemapPanel = new pvc.visual.Panel(me, me.pvPanel, {
                panelType:   pv.Layout.Treemap,
                extensionId: 'panel'
            })
            .pvMark
            .lock('paddingTop',    headersHeight)
//            .lock('paddingBottom', lw)
//            .lock('paddingRight',  lw)
//            .lock('paddingLeft',   lw)
            .lock('visible', true)
            .lock('nodes',   rootScene.nodes())
            
            // Reserve space for interaction borders (only top-level)
            .lock('left',    lw2)
            .lock('top',     lw2)
            .lock('width',   cs.width  - lw)
            .lock('height',  cs.height - lw)
            
            .lock('size',    sizeProp)
            .lock('mode',    plot.option('LayoutMode'))
            .lock('order',   null) // TODO: option for this?
            .lock('round',   false);
        
        // ------------------
        // ALL NODES
        // Reserve space for interaction borders
//        panel.node
//            .left  (function(n) { return n.x  + lw2; })
//            .top   (function(n) { return n.y  + lw2; })
//            .width (function(n) { return n.dx - lw;  })
//            .height(function(n) { return n.dy - lw;  });
//        
        // ------------------
        // LEAF Bar
        var defaultStrokeWidth = function() {
            // Root depth is 0
            var d = (maxDepth - this.scene.depth) + 1;
            return d * lw0;
        };
        
        var pvLeafMark = new pvc.visual.Bar(me, panel.leaf, {extensionId: 'leaf', normalStroke: true})
            .lockMark('visible')
            .override('defaultColor',       function(type) { return type==='stroke' ? 'black' : colorScaleLeaf(this.scene); })
            .override('defaultStrokeWidth', defaultStrokeWidth)
            .pvMark
            .antialias(false)
            .lineCap('round') // only used by strokeDashArray
            .strokeDasharray(function(scene) {
                return scene.vars.size.value < 0 ? 'dash' : null; // Keep this in sync with the style in pvc.sign.DotSizeColor
            });
       
        // ------------------
        // ASCENDANT (not root, not leaf) Bar
        var pvAscMark = new pvc.visual.Bar(me, panel.node, {
                extensionId: 'ascendant',
                noHover:  true,
                noSelect: true,
                noClick:  true,
                noDoubleClick:  true
            })
            .intercept('visible', function(scene) {
                return !!scene.parent &&     // Not the root
                       !!scene.firstChild && // Not a leaf
                       this.delegateExtension(true); 
             })
            .override('anyInteraction', function() {
                return this.scene.anyInteraction() ||
                       this.scene.isActiveDescendantOrSelf(); // special kind of interaction
            })
            .override('defaultStrokeWidth', defaultStrokeWidth)
            .override('interactiveStrokeWidth', function(w) {
                if(this.showsActivity() && 
                   this.scene.isActiveDescendantOrSelf()) {
                   w = Math.max(1, w);// * 1.5;
                }
                return w;
            })
            .override('defaultColor',     function(type) { return colorScaleDirect(this.scene); })
            .override('normalColor',      function(color, type){ return type === 'fill' ? null : 'black'; })
            .override('interactiveColor', function(color, type) {
                if(type === 'stroke') {
                    if(this.showsActivity()) {
                        if(this.scene.isActiveDescendantOrSelf()) {
                            return pv.color(color).brighter(0.5)/*.alpha(0.7)*/;
                        }
                        
                        if(this.scene.anyActive()) { return null; }
                   }
                    
                   if(this.showsSelection() && this.scene.isSelectedDescendantOrSelf()) {
                       return pv.color(color).brighter(0.5)/*.alpha(0.7)*/;
                   }
                }
                return null;
            })
            .pvMark
            .antialias(false);
        
        if(headersHeight) {
            // ------------------
            // HEADER Panel
            var pvHeaderPanel = new pvc.visual.Panel(me, pvAscMark, {
                    extensionId: 'header',
                    freeColor:   false
                })
                .lock('data')
                .lock('height', headersHeight/* - lw*/)
                .lock('width')
                .override('defaultStrokeWidth', function() { return 2*lw0; })
                .override('normalColor', function(color, type) {
                    // Show semi-transparent fill and no border
                    return type === 'fill' ? color.alpha(0.5) : 'black';
                })
                .override('interactiveColor', function(color, type) {
                    if(this.showsActivity()) {
                        if(this.scene.isActiveDescendantOrSelf()) {
                            return type === 'fill' ? color.alpha(0.5) : this.base(color, type);
                        }
                    }
                    
                    if(this.showsSelection()) {
                        if(this.scene.isSelectedDescendantOrSelf()) {
                            return type === 'fill' ? color.alpha(0.5) : this.base(color, type);
                        }
                        
                        if(this.scene.anySelected()) {
                            return type === 'fill' ? this.dimColor(color, type) : null;
                        }
                    }
                    
                    return type === 'fill' ? color.alpha(0.5) : null;
                })
                .pvMark; // inherits dx

            // ------------------
            // HEADER Label
            var headerLabel = new pvc.visual.ValueLabel(me, pvHeaderPanel, {
                    extensionId:  'headerLabel',
                    valuesAnchor: plot.option('HeadersAnchor'),
                    valuesMask:   plot.option('HeadersMask'  ),
                    valuesFont:   plot.option('HeadersFont'  ),
                    valuesOptimizeLegibility: 
                                  plot.option('HeadersOptimizeLegibility')
                })
                .pvMark
                .textBaseline('middle')
                .top(function(scene) { return headersHeight / 2; })
                //.textAlign('center')
                .sign
                .override('trimText', function(text) {
                    // Add a small margin (2 px)
                    var maxWidth = this.scene.dx - 2;
                    return pvc.text.trimToWidthB(maxWidth, text, this.valuesFont, "..");
                });
        }
        
        // ------------------
        // LEAF Label
        var label = pvc.visual.ValueLabel.maybeCreate(me, panel.label, {valuesAnchor: null});
        if(label) {
            label
                .override('trimText', function(text) {
                    // Vertical/Horizontal orientation?
                    var side = this.pvMark.textAngle() ? 'dy' : 'dx';
                    // Add a small margin (2 px)
                    var maxWidth = this.scene[side] - 2;
                    return pvc.text.trimToWidthB(maxWidth, text, this.valuesFont, "..");
                })
                .override('calcBackgroundColor', function(/*type*/) {
                    // Corresponding scene on pvLeafMark sibling mark (rendered before)
                    var pvSiblingScenes = pvLeafMark.scene;
                    var pvLeafScene     = pvSiblingScenes[this.pvMark.index];
                    return pvLeafScene.fillStyle;
                });
        }
    },
    
    _getExtensionId: function(){
        // 'content' coincides, visually, with 'plot', in this chart type
        // Actually it shares the same panel...
        
        var extensionIds = [{abs: !this.chart.parent ? 'content' : 'smallContent'}];
        return extensionIds.concat(this.base());
    },
    
    renderInteractive: function(){
        this.pvTreemapPanel.render();
    },
    
    _buildScene: function() {
        // Hierarchical data, by categ1 (level1) , categ2 (level2), categ3 (level3),...
        var data = this.visibleData({ignoreNulls: false});

        // Everything hidden?
        if(!data.childCount()) { return null; }
        
        var roles = this.visualRoles;
        var rootScene = new pvc.visual.Scene(null, {panel: this, source: data});
        var sizeVarHelper  = new pvc.visual.RoleVarHelper(rootScene, roles.size,  {roleVar: 'size',  allowNestedVars: true, hasPercentSubVar: true});
        //var colorVarHelper = new pvc.visual.RoleVarHelper(rootScene, roles.color, {roleVar: 'color', allowNestedVars: true});
        
        var colorGrouping = roles.color && roles.color.grouping;
        
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
            sizeVarHelper.onNewScene(scene, /* isLeaf */ true);
            //colorVarHelper.onNewScene(scene, /* isLeaf */ true);
            
            if(!colorGrouping){
                if(!scene.parent) { scene.vars.color = new pvc_ValueLabelVar(null, ""); }
            } else {
                scene.vars.color = new pvc_ValueLabelVar(
                        group.absKey,
                        group.absLabel);
            }
            
            if(group.childCount()){
                group
                    .children()
                    .each(function(childData){
                        if(childData.value != null){ // Stop when a level is not detailed in a given branch
                            recursive(new pvc.visual.Scene(scene, {source: childData}));
                        }
                    });
            }
            
            return scene;
        };
        
        return recursive(rootScene);
    }
});

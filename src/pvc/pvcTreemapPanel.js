
def
.type('pvc.TreemapPanel', pvc.PlotPanel)
.init(function(chart, parent, plot, options){
    
    this.base(chart, parent, plot, options);
    
    this.axes.size = chart._getAxis('size', (plot.option('SizeAxis') || 0) - 1); // may be undefined

    this.visualRoles.size = chart.visualRoles(plot.option('SizeRole'));
    
    this.layoutMode = plot.option('LayoutMode');
})
.add({
    _createCore: function(layoutInfo) {
        var me = this;
        var cs = layoutInfo.clientSize;
        var rootScene = me._buildScene();
        
        var lw  = def.number.to(this._getConstantExtension('leaf', 'lineWidth'), 1);
        var lw2 = lw/2;
        
        var sizeProp = me.visualRoles.size.isBound() ?
            me.axes.size.scale.by(function(s){ 
                return s.vars.size.value; 
            }) :
            0;
                
        var panel = this.pvTreemapPanel = new pvc.visual.Panel(me, me.pvPanel, {
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
            .lock('mode',    this.layoutMode)
            .lock('order',   null) // TODO: option
            .lock('round',   false)
            ;
        
        // Node prototype
        // Reserve space for interaction borders
        panel.node
            .left  (function(n) { return n.x  + lw2; })
            .top   (function(n) { return n.y  + lw2; })
            .width (function(n) { return n.dx - lw;  })
            .height(function(n) { return n.dy - lw;  });
        
        var colorScaleDirect = this.axes.color.sceneScale({sceneVarName: 'color'});
        var colorScaleLeaf   = colorScaleDirect.by(function(s){ return s.parent; });
        
        // ------------------
        
        new pvc.visual.Bar(me, panel.leaf, { extensionId: 'leaf' })
            .lockMark('visible')
            .override('defaultStrokeWidth', function() { return 2*lw; })
            .override('defaultColor', function(type){ 
                return colorScaleLeaf(this.scene); 
            })
            .pvMark
            .antialias(false)
            ;
       
        new pvc.visual.Bar(me, panel.node, {
            extensionId: 'ascendant',
            noHover:  true,
            noSelect: true,
            noClick:  true,
            noDoubleClick:  true
        })
        .intercept('visible', function(scene){
            return !!scene.parent && 
                   !!scene.firstChild &&
                   this.delegateExtension(true); 
         })
        .override('anyInteraction', function(){
            return this.scene.anyInteraction() ||
                   this.scene.isActiveDescendantOrSelf(); // special kind of interaction
        })
        .override('defaultStrokeWidth', function() { return 2 * lw; })
        .override('interactiveStrokeWidth', function(w){
            if(this.showsActivity() && 
               this.scene.isActiveDescendantOrSelf()){
               w = Math.max(1, w) * 1.5;
            }
            return w;
        })
        .override('defaultColor',     function(type){ return colorScaleDirect(this.scene); })
        .override('normalColor',      function(/*color, type*/) { return null; })
        .override('interactiveColor', function(color, type) {
            if(type === 'stroke' && 
               this.showsActivity() && 
               this.scene.isActiveDescendantOrSelf()){
                return pv.color(color).brighter(1.3).alpha(0.7);
            }
            return null;
        });
        
        var label = pvc.visual.ValueLabel.maybeCreate(me, panel.label, {noAnchor: true});
        if(label){
            var valuesFont = this.valuesFont;
            label.override('trimText', function(text) {
                // Vertical/Horizontal orientation?
                var side = this.pvMark.textAngle() ? 'dy' : 'dx';
                // Add a small margin (2 px)
                var maxWidth = this.scene[side] - 2;
                return pvc.text.trimToWidthB(maxWidth, text, valuesFont, "..");
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
        var roles = this.visualRoles;
        
        // Hierarchical data, by categ1 (level1) , categ2 (level2), categ3 (level3),...
        var data = this.visibleData();
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
            // it seems that the waterfall's tree-pre/post flattening
            // needs the distinction between the key of the ancestor,
            // and the key of the unexistent leaf under it...
            //
            // 
            
            // TODO: Should be the abs key (no trailing empty keys)
            scene.vars.category = pvc.visual.ValueLabelVar.fromComplex(group);
            
            // All nodes are considered leafs, for what the var helpers are concerned
            sizeVarHelper .onNewScene(scene, /* isLeaf */ true);
            //colorVarHelper.onNewScene(scene, /* isLeaf */ true);
            
            if(!colorGrouping){
                if(!scene.parent){
                    scene.vars.color = new pvc.visual.ValueLabelVar(null, "");
                }
            } else {
                scene.vars.color = new pvc.visual.ValueLabelVar(
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

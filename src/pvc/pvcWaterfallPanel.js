/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pv_Mark:true, pvc_ValueLabelVar:true */

/**
 * Waterfall chart panel.
 * Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>valuesVisible</i> - Show or hide bar value. Default: false
 * <i>barSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by bars. Default: 0.9 (90%)
 * <i>barSizeMax</i> - Maximum size (width) of a bar in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>bar_</i> - for the actual bar
 * <i>barPanel_</i> - for the panel where the bars sit
 * <i>barLabel_</i> - for the main bar label
 */
def
.type('pvc.WaterfallPanel', pvc.BarAbstractPanel)
.add({
    pvWaterfallLine: null,
    ruleData: null,

    /**
     * Called to obtain the bar differentialControl property value.
     * If it returns a function,
     * that function will be called once per category,
     * on the first series.
     * @virtual
     */
    _barDifferentialControl: function() {
        var isFalling = this.chart._isFalling;
        /*
         * From protovis help:
         * 
         * Band differential control pseudo-property.
         *  2 - Drawn starting at previous band offset. Multiply values by  1. Don't update offset.
         *  1 - Drawn starting at previous band offset. Multiply values by  1. Update offset.
         *  0 - Reset offset to 0. Drawn starting at 0. Default. Leave offset at 0.
         * -1 - Drawn starting at previous band offset. Multiply values by -1. Update offset.
         * -2 - Drawn starting at previous band offset. Multiply values by -1. Don't update offset.
         */
        return function(scene) {
            if(isFalling && !this.index) {
                // First falling bar is the main total
                // Must be accounted up and update the total
                return 1;
            }

            var group = scene.vars.category.group;
            if(group._isFlattenGroup && !group._isDegenerateFlattenGroup) {
                // Groups don't update the total
                // Groups, always go down, except the first falling...
                return -2;
            }
            
            return isFalling ? -1 : 1;
        };
    },
    
    _creating: function() {
        // Register BULLET legend prototype marks
        var rootScene = this._getLegendBulletRootScene();
        if(rootScene) {
            var waterfallGroupScene = rootScene.firstChild;
            if(waterfallGroupScene && !waterfallGroupScene.hasRenderer()){
                var keyArgs = {
                        drawRule:      true,
                        drawMarker:    false,
                        rulePvProto:   new pv_Mark()
                    };
                
                this.extend(keyArgs.rulePvProto, 'line', {constOnly: true});
                
                waterfallGroupScene.renderer(
                        new pvc.visual.legend.BulletItemDefaultRenderer(keyArgs));
            }
        }
    },
    
    _createCore: function(){

        this.base();

        var chart = this.chart,
            isVertical = this.isOrientationVertical(),
            anchor = isVertical ? "bottom" : "left",
            ao = this.anchorOrtho(anchor),
            ruleRootScene = this._buildRuleScene(),
            orthoScale = chart.axes.ortho.scale,
            orthoZero = orthoScale(0),
            sceneOrthoScale = chart.axes.ortho.sceneScale({sceneVarName: 'value'}),
            sceneBaseScale  = chart.axes.base.sceneScale({sceneVarName: 'category'}),
            baseScale = chart.axes.base.scale,
            barWidth2 = this.barWidth/2,
            barWidth = this.barWidth,
            barStepWidth = this.barStepWidth,
            isFalling = chart._isFalling,
            waterColor = chart._waterColor;

        if(this.plot.option('AreasVisible')) {
            var panelColors = pv.Colors.category10();
            var waterGroupRootScene = this._buildWaterGroupScene();
            
            var orthoRange = orthoScale.range();
            var orthoPanelMargin = 0.04 * (orthoRange[1] - orthoRange[0]);
            
            this.pvWaterfallGroupPanel = new pvc.visual.Panel(this, this.pvPanel, {
                    extensionId: 'group'
                })
                .lock('data', waterGroupRootScene.childNodes)
                .pvMark
                .zOrder(-1)
                .fillStyle(function(/*scene*/) {
                    return panelColors(0)/* panelColors(scene.vars.category.level - 1)*/.alpha(0.15);
                })
                [ao](function(scene) {
                    var c = scene.vars.category;
                    return baseScale(c.valueLeft) - barStepWidth / 2;
                })
                [this.anchorLength(anchor)](function(scene) {
                    var c = scene.vars.category;
                    var len = Math.abs(baseScale(c.valueRight) - baseScale(c.valueLeft ));

                    return len + barStepWidth;
                })
                [anchor](function(scene) { // bottom
                    // animate: zero -> bottom
                    var v = scene.vars.value;
                    var b = orthoScale(v.valueBottom) - orthoPanelMargin/2;
                    return chart.animate(orthoZero, b);
                })
                [this.anchorOrthoLength(anchor)](function(scene){ // height
                    // animate: 0 -> height
                    var v = scene.vars.value;
                    var h = orthoScale(v.valueTop) - orthoScale(v.valueBottom) + orthoPanelMargin;
                    return chart.animate(0, h);
                })
                ;
        }
        
        this.pvBar
            .sign
            .override('baseColor', function(type){
                var color = this.base(type);
                if(type === 'fill'){
                    if(!this.scene.vars.category.group._isFlattenGroup){
                        return pv.color(color).alpha(0.5);
                    } 
//                    else {
//                        return pv.color(color).darker();
//                    }
                }
                
                return color;
            });
        
        this.pvWaterfallLine = new pvc.visual.Rule(this, this.pvPanel, {
                extensionId:  'line',
                noTooltip:    false,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false
            })
            .lock('data', ruleRootScene.childNodes)
            .optional('visible', function(){
                return ( isFalling && !!this.scene.previousSibling) ||
                       (!isFalling && !!this.scene.nextSibling);
            })
            .optional(anchor, function(){ 
                return orthoZero + chart.animate(0, sceneOrthoScale(this.scene) - orthoZero);
            })
            .optional(this.anchorLength(anchor), barStepWidth + barWidth)
            .optional(ao,
                isFalling ?
                    function(){ return sceneBaseScale(this.scene) - barStepWidth - barWidth2; } :
                    function(){ return sceneBaseScale(this.scene) - barWidth2; })
            .override('defaultColor', function(){ return waterColor; })
            .pvMark
            .antialias(true)
            .lineCap('butt');

        if(this.plot.option('TotalValuesVisible')) {
            this.pvWaterfallLabel = new pvc.visual.Label(
                this,
                this.pvWaterfallLine, 
                {
                    extensionId: 'lineLabel'
                })
                .intercept('visible', function(scene){
                    if(scene.vars.category.group._isFlattenGroup){
                        return false;
                    }
    
                    return isFalling || !!scene.nextSibling;
                })
                .pvMark
                [anchor](function(scene){
                    return orthoZero + chart.animate(0, sceneOrthoScale(scene) - orthoZero);
                })
                [this.anchorOrtho(anchor)](sceneBaseScale)
                .textAlign(isVertical ? 'center' : 'left')
                .textBaseline(function(categScene){
                    if(!isVertical) { return 'middle'; }
                    
                    var direction = categScene.vars.direction;
                    if(direction == null) { return 'bottom'; }
                    
                    var isRising = !isFalling;
                    return isRising === (direction === 'up') ? 'bottom' : 'top';
                })
                .textStyle(pv.Color.names.darkgray.darker(2))
                .textMargin(5)
                .text(function(scene){ return scene.vars.value.label; });
        }
    },

    _buildRuleScene: function() {
        var rootScene  = new pvc.visual.Scene(null, {panel: this, source: this.visibleData({ignoreNulls: false})});
        var prevValue;
        
        // Create starting scene tree
        if(this.chart._ruleInfos) { this.chart._ruleInfos.forEach(createCategScene, this); }
        
        return rootScene;

        function createCategScene(ruleInfo) {
            var categData1 = ruleInfo.group;
            
            var categScene = new pvc.visual.Scene(rootScene, {source: categData1});
            
            var categVar = 
                categScene.vars.category =
                pvc_ValueLabelVar.fromComplex(categData1);
            
            categVar.group = categData1;
            
            var value = ruleInfo.offset;
            
            categScene.vars.value = new pvc_ValueLabelVar(
                                value,
                                this.chart._valueDim.format(value));
            
            categScene.vars.direction = 
                (prevValue == null || prevValue === value) ? null : (prevValue < value ? 'up' : 'down');
            
            prevValue = value;
        }
    },

    _buildWaterGroupScene: function() {
        var chart = this.chart;
        var rootCatData = chart._catRole.select(
                            chart.partData(this.dataPartValue),
                            {visible: true});
        
        var rootScene = new pvc.visual.Scene(null, {panel: this, source: rootCatData});

        var ruleInfoByCategKey, isFalling;
        var ris = chart._ruleInfos;
        if(ris) {
            ruleInfoByCategKey = def.query(ris).object({name: function(ri) { return ri.group.absKey; }});
            isFalling = chart._isFalling;
            
            createRectangleSceneRecursive(rootCatData, 0); 
        }
        
        return rootScene;

        function createRectangleSceneRecursive(catData, level) {
            // TODO: ?? explain what key != "" excludes
            var q = catData.children().where(function(c) { return c.key !== ""; });
            if(q.next()) {
                // Group node (has at least one ?proper? child)
                
                // All parent categories, except the root category, 
                // draw a rectangle around their descendants.
                if(level) { createRectangleScene(catData, level); }
                
                level++;
                do { createRectangleSceneRecursive(q.item, level); } while(q.next());
            }
        }
        
        function createRectangleScene(catData, level) {
            // Rectangle scenes are all direct children of rootScene
            var rectScene = new pvc.visual.Scene(rootScene, {source: catData});
            
            var categVar = rectScene.vars.category = pvc_ValueLabelVar.fromComplex(catData);
            
            categVar.group = catData;
            categVar.level = level;

            var valueVar = rectScene.vars.value = {}; // TODO: Not A Var
            
            var ri = ruleInfoByCategKey[catData.absKey];
            
            // At which offset value this parent category starts
            var offset = ri.offset;
            
            // Maximum value-height of all descendants
            var range  = ri.range;
            var height = -range.min + range.max;

            /* Find the rectangle value coordinates
             *  
             *  When falling
             *    catData
             *  lc  x----------------+
             *      |                |
             *      |                |
             *  rc  +----------------x
             *                    lastLeafData
             *     lc                rc
             *      
             */
            var leafData, leafRuleInfo, lc, rc, bv;
            if(isFalling) {
                leafData = lastLeaf(catData);
                leafRuleInfo = ruleInfoByCategKey[leafData.absKey];
                
                lc = ri.group.value;
                rc = leafRuleInfo.group.value;
                
                bv = offset - range.max;
            } else {
                leafData = firstLeaf(catData);
                leafRuleInfo = ruleInfoByCategKey[leafData.absKey];
                
                lc = leafRuleInfo.group.value;
                rc = ri.group.value;
                
                bv = offset - range.max;
            }
            
            categVar.valueLeft   = lc;
            categVar.valueRight  = rc;
            
            valueVar.valueHeight = height;
            valueVar.valueBottom = bv;
            valueVar.valueTop    = bv + height;
        }
        
        function firstLeaf(data) {
            var children = data._children;
            var first = children && children[0];
            return first ? firstLeaf(first) : data;
        }

        function lastLeaf(data) {
            var children = data._children;
            var last = children && children[children.length - 1];
            return last ? lastLeaf(last) : data;
        }
    }
});

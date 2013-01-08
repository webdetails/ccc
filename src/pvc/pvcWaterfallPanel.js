
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
    _barDifferentialControl: function(){
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
        return function(scene){
            if(isFalling && !this.index){
                // First falling bar is the main total
                // Must be accounted up and update the total
                return 1;
            }

            var group = scene.vars.category.group;
            if(group._isFlattenGroup && !group._isDegenerateFlattenGroup){
                // Groups don't update the total
                // Groups, always go down, except the first falling...
                return -2;
            }
            
            return isFalling ? -1 : 1;
        };
    },
    
    _creating: function(){
        // Register BULLET legend prototype marks
        var rootScene = this._getLegendBulletRootScene();
        if(rootScene){
            var waterfallGroupScene = rootScene.firstChild;
            
            if(waterfallGroupScene && !waterfallGroupScene.hasRenderer()){
                var keyArgs = {
                        drawRule:      true,
                        drawMarker:    false,
                        noSelect:      true,
                        noHover:       true,
                        rulePvProto:   new pv.Mark()
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
            options = chart.options,
            isVertical = this.isOrientationVertical(),
            anchor = isVertical ? "bottom" : "left",
            ao = this.anchorOrtho(anchor),
            ruleRootScene = this._buildRuleScene(),
            orthoScale = chart.axes.ortho.scale,
            orthoPanelMargin = 0.04 * (orthoScale.range()[1] - orthoScale.range()[0]),
            orthoZero = orthoScale(0),
            sceneOrthoScale = chart.axes.ortho.sceneScale({sceneVarName: 'value'}),
            sceneBaseScale  = chart.axes.base.sceneScale({sceneVarName: 'category'}),
            baseScale = chart.axes.base.scale,
            barWidth2 = this.barWidth/2,
            barWidth = this.barWidth,
            barStepWidth = this.barStepWidth,
            isFalling = chart._isFalling,
            waterColor = chart._waterColor
            ;

        if(this.plot.option('AreasVisible')){
            var panelColors = pv.Colors.category10();
            var waterGroupRootScene = this._buildWaterGroupScene();
            
            this.pvWaterfallGroupPanel = new pvc.visual.Panel(this, this.pvPanel, {
                    extensionId: 'group'
                })
                .lock('data', waterGroupRootScene.childNodes)
                .pvMark
                .zOrder(-1)
                .fillStyle(function(scene){
                    return panelColors(0)/* panelColors(scene.vars.category.level - 1)*/.alpha(0.15);
                })
                [ao](function(scene){
                    var categVar = scene.vars.category;
                    return baseScale(categVar.leftValue) - barStepWidth / 2;
                })
                [this.anchorLength(anchor)](function(scene){
                    var categVar = scene.vars.category,
                        length = Math.abs(baseScale(categVar.rightValue) -
                                baseScale(categVar.leftValue))
                        ;

                    return length + barStepWidth;
                })
                [anchor](function(scene){
                    return orthoScale(scene.vars.value.bottomValue) - orthoPanelMargin/2;
                })
                [this.anchorOrthoLength(anchor)](function(scene){
                    return orthoScale(scene.vars.value.heightValue) + orthoPanelMargin;
                    //return chart.animate(orthoZero, orthoScale(scene.categ) - orthoZero);
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
            })
            ;
        
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
            .lineCap('butt')
            ;

        if(this.plot.option('TotalValuesVisible')){
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
                    if(!isVertical){
                        return 'middle';
                    }
                    
                    var direction = categScene.vars.direction;
                    if(direction == null){
                        return 'bottom';
                    }
                    
                    var isRising = !isFalling;
                    return  (isRising === (direction === 'up') ? 'bottom' : 'top');
                })
                .textStyle(pv.Color.names.darkgray.darker(2))
                .textMargin(5)
                .text(function(scene){ return scene.vars.value.label; });
        }
    },

    _buildRuleScene: function(){
        var rootScene  = new pvc.visual.Scene(null, {panel: this, group: this._getVisibleData()});
        var prevValue;
        
        /**
         * Create starting scene tree
         */
        if(this.chart._ruleInfos){
            this.chart._ruleInfos
                .forEach(createCategScene, this);
        }
        
        return rootScene;

        function createCategScene(ruleInfo){
            var categData1 = ruleInfo.group;
            
            var categScene = new pvc.visual.Scene(rootScene, {group: categData1});
            
            var categVar = 
                categScene.vars.category = 
                    new pvc.visual.ValueLabelVar(
                                categData1.value,
                                categData1.label);
            
            categVar.group = categData1;
            
            var value = ruleInfo.offset;
            
            categScene.vars.value = new pvc.visual.ValueLabelVar(
                                value,
                                this.chart._valueDim.format(value));
            
            categScene.vars.direction = 
                (prevValue == null || prevValue === value) ? null : (prevValue < value ? 'up' : 'down');
            
            prevValue = value;
        }
    },

    _buildWaterGroupScene: function(){
        var chart = this.chart,
            ruleInfos = this.chart._ruleInfos,
            ruleInfoByCategKey = ruleInfos && def.query(ruleInfos)
                                  .object({
                                      name:  function(ruleInfo){ return ruleInfo.group.absKey; },
                                      value: function(ruleInfo){ return ruleInfo; }
                                  }),
            isFalling = chart._isFalling,
            rootCatData = chart._catRole.select(
                            chart.partData(this.dataPartValue),
                            {visible: true}),
            rootScene  = new pvc.visual.Scene(null, {panel: this, group: rootCatData});

        if(ruleInfoByCategKey){
            createCategSceneRecursive(rootCatData, 0);
        }
        
        return rootScene;

        function createCategSceneRecursive(catData, level){
            var children = catData.children()
                                  .where(function(child){ return child.key !== ""; })
                                  .array();
            if(children.length){
                // Group node
                if(level){
                    var categScene = new pvc.visual.Scene(rootScene, {group: catData});

                    var categVar = 
                        categScene.vars.category = 
                            new pvc.visual.ValueLabelVar(
                                    catData.value,
                                    catData.label);
                    
                    categVar.group = catData;
                    categVar.level = level;

                    var valueVar = categScene.vars.value = {}; // TODO: Not A Var
                    var ruleInfo = ruleInfoByCategKey[catData.absKey];
                    var offset = ruleInfo.offset,
                        range = ruleInfo.range,
                        height = -range.min + range.max
                        ;

                    if(isFalling){
                        var lastChild = lastLeaf(catData);
                        var lastRuleInfo = ruleInfoByCategKey[lastChild.absKey];
                        categVar.leftValue  = ruleInfo.group.value;
                        categVar.rightValue = lastRuleInfo.group.value;
                        valueVar.bottomValue = offset - range.max;

                    } else {
                        var firstChild = firstLeaf(catData);
                        var firstRuleInfo = ruleInfoByCategKey[firstChild.absKey];
                        categVar.leftValue = firstRuleInfo.group.value;
                        categVar.rightValue = ruleInfo.group.value;
                        valueVar.bottomValue = offset - range.max;
                    }

                    valueVar.heightValue = height;
                }

                children.forEach(function(child){
                    createCategSceneRecursive(child, level + 1);
                });
            }
        }

        function firstLeaf(data){
            var firstChild = data._children && data._children[0];
            return firstChild ? firstLeaf(firstChild) : data;
        }

        function lastLeaf(data){
            var lastChild = data._children && data._children[data._children.length - 1];
            return lastChild ? lastLeaf(lastChild) : data;
        }
    }
});
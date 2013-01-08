
def
.type('pvc.BoxplotPanel', pvc.CategoricalAbstractPanel)
.init(function(chart, parent, plot, options) {
    
    this.base(chart, parent, plot, options);
    
    this.boxSizeRatio = plot.option('BoxSizeRatio');
    this.maxBoxSize   = plot.option('BoxSizeMax');
})
.add({
    plotType: 'box',
    
    anchor: 'fill',
    
    // Override default mappings
    _v1DimRoleName: {
        //'series':   'series',
        //'category': 'category',
        'value':    'median'
    },
    
    /**
     * @override
     */
    _createCore: function(){

        this.base();
        
        var rootScene = this._buildScene();

        var a_bottom = this.isOrientationVertical() ? "bottom" : "left",
            a_left   = this.anchorOrtho(a_bottom),
            a_width  = this.anchorLength(a_bottom),
            a_height = this.anchorOrthoLength(a_bottom)
            ;

        function defaultColor(type){
            var color = this.base(type);
            return type === 'stroke' ? color.darker(1) : color;
        }
        
        /* Category Panel */
        var extensionIds = ['panel'];
        if(this.compatVersion() <= 1){
            extensionIds.push(''); // let access as "box_"
        }
        
        this.pvBoxPanel = new pvc.visual.Panel(this, this.pvPanel, {
                extensionId: extensionIds
            })
            .lock('data', rootScene.childNodes)
            .lockMark(a_left, function(scene){
                var catVar = scene.vars.category;
                return catVar.x - catVar.width / 2;
            })
            .pvMark
            [a_width](function(scene){ return scene.vars.category.width; })
            ;
        
        /* V Rules */
        function setupRuleWhisker(rule){
            rule.lock(a_left, function(){ 
                    return this.pvMark.parent[a_width]() / 2;
                })
                .override('defaultColor', defaultColor)
                ;

            return rule;
        }

        this.pvRuleWhiskerUpper = setupRuleWhisker(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxRuleWhisker',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(scene){
                return scene.vars.category.showRuleWhiskerUpper && this.delegateExtension(true);
            })
            .lock(a_bottom, function(scene){ return scene.vars.category.ruleWhiskerUpperBottom; })
            .lock(a_height, function(scene){ return scene.vars.category.ruleWhiskerUpperHeight; })
            .pvMark
            ;

        this.pvRuleWhiskerLower = setupRuleWhisker(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxRuleWhisker',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(scene){
                return scene.vars.category.showRuleWhiskerBelow && this.delegateExtension(true);
            })
            .lock(a_bottom, function(scene){ return scene.vars.category.ruleWhiskerLowerBottom; })
            .lock(a_height, function(scene){ return scene.vars.category.ruleWhiskerLowerHeight; })
            .pvMark
            ;

        /* Box Bar */
        function setupHCateg(sign){
            sign.lock(a_left,  function(scene){ return scene.vars.category.boxLeft;  })
                .lock(a_width, function(scene){ return scene.vars.category.boxWidth; })
                ;
            
            return sign;
        }

        this.pvBar = setupHCateg(new pvc.visual.Bar(this, this.pvBoxPanel, {
                extensionId:   'boxBar',
                freePosition:  true,
                normalStroke:  true
            }))
            .intercept('visible', function(scene){
                return scene.vars.category.showBox && this.delegateExtension(true);
            })
            .lock(a_bottom, function(scene){ return scene.vars.category.boxBottom; })
            .lock(a_height, function(scene){ return scene.vars.category.boxHeight; })
            .override('defaultColor', defaultColor)
            .override('defaultStrokeWidth', def.fun.constant(1))
            .pvMark
            ;

        /* H Rules */
        function setupHRule(rule){
            setupHCateg(rule);
            
            rule.override('defaultColor', defaultColor);
            
            return rule;
        }
        
        this.pvRuleMin = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxRuleMin',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(){
                return this.scene.vars.minimum.value != null && this.delegateExtension(true);
            })
            .lock(a_bottom,  function(){ return this.scene.vars.minimum.position; }) // bottom
            .pvMark
            ;

        this.pvRuleMax = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxRuleMax',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(){
                return this.scene.vars.maximum.value != null && this.delegateExtension(true);
            })
            .lock(a_bottom,  function(){ return this.scene.vars.maximum.position; }) // bottom
            .pvMark
            ;

        this.pvRuleMedian = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxRuleMedian',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(){
                return this.scene.vars.median.value != null && this.delegateExtension(true);
            })
            .lock(a_bottom,  function(){ return this.scene.vars.median.position; }) // bottom
            .override('defaultStrokeWidth', def.fun.constant(2))
            .pvMark
            ;
    },

    /**
     * Renders this.pvScatterPanel - the parent of the marks that are affected by interaction changes.
     * @override
     */
    renderInteractive: function(){
        this.pvBoxPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum or group, or null.
     * @override
     */
    _getSelectableMarks: function(){
        return [this.pvBar];
    },

    _buildScene: function(){
        var chart = this.chart,
            measureRolesDimNames = def.query(chart.measureVisualRoles()).object({
                name:  function(role){ return role.name; },
                value: function(role){ return role.firstDimensionName(); }
            }),
            visibleKeyArgs = {visible: true, zeroIfNone: false},
            data = this._getVisibleData(),
            rootScene  = new pvc.visual.Scene(null, {panel: this, group: data}),
            baseScale  = this.axes.base.scale,
            bandWidth  = baseScale.range().band,
            boxWidth   = Math.min(bandWidth * this.boxSizeRatio, this.maxBoxSize),
            orthoScale = this.axes.ortho.scale
            ;

        /**
         * Create starting scene tree
         */
        data.children() // categories
            .each(createCategScene, this);

        return rootScene;
        
        function createCategScene(categData){
            var categScene = new pvc.visual.Scene(rootScene, {group: categData});
            var vars = categScene.vars;
            var colorVarHelper = new pvc.visual.ColorVarHelper(this.chart, this.chart._colorRole);
            
            // Series distinction is ignored
            // If the role is bound by the user, its data will not be visible 
            var serVar = vars.series   = new pvc.visual.ValueLabelVar(null, "");
            var catVar = vars.category = new pvc.visual.ValueLabelVar(categData.value, categData.label);
            
            def.set(catVar,
                'group',    categData,
                'x',        baseScale(categData.value),
                'width',    bandWidth,
                'boxWidth', boxWidth,
                'boxLeft',  bandWidth / 2 - boxWidth / 2);
            
            chart.measureVisualRoles().forEach(function(role){
                var dimName = measureRolesDimNames[role.name],
                    svar;

                if(dimName){
                    var dim = categData.dimensions(dimName),
                        value = dim.sum(visibleKeyArgs);
                    
                    svar = new pvc.visual.ValueLabelVar(value, dim.format(value));
                    svar.position = orthoScale(value);
                } else {
                    svar = new pvc.visual.ValueLabelVar(null, "");
                    svar.position = null;
                }

                vars[role.name] = svar;
            });
            
            colorVarHelper.onNewScene(categScene, /* isLeaf */ true);
            
            // ------------

            var hasMin    = vars.minimum.value  != null,
                hasLower  = vars.lowerQuartil.value != null,
                hasMedian = vars.median.value != null,
                hasUpper  = vars.upperQuartil.value != null,
                bottom,
                top;

            var show = hasLower || hasUpper;
            if(show){
                bottom = hasLower  ? vars.lowerQuartil.position :
                         hasMedian ? vars.median.position :
                         vars.upperQuartil.position
                         ;

                top    = hasUpper  ? vars.upperQuartil.position :
                         hasMedian ? vars.median.position :
                         vars.lowerQuartil.position
                         ;

                show = (top !== bottom);
                if(show){
                    catVar.boxBottom = bottom;
                    catVar.boxHeight = top - bottom;
                }
            }
            
            catVar.showBox  = show;
            
            // vRules
            show = vars.maximum.value != null;
            if(show){
                bottom = hasUpper  ? vars.upperQuartil.position :
                         hasMedian ? vars.median.position :
                         hasLower  ? vars.lowerQuartil.position :
                         hasMin    ? vars.minimum.position  :
                         null
                         ;
                
                show = bottom != null;
                if(show){
                    catVar.ruleWhiskerUpperBottom = bottom;
                    catVar.ruleWhiskerUpperHeight = vars.maximum.position - bottom;
                }
            }

            catVar.showRuleWhiskerUpper = show;

            // ----

            show = hasMin;
            if(show){
                top = hasLower  ? vars.lowerQuartil.position :
                      hasMedian ? vars.median.position :
                      hasUpper  ? vars.upperQuartil.position :
                      null
                      ;

                show = top != null;
                if(show){
                    bottom = vars.minimum.position;
                    catVar.ruleWhiskerLowerHeight = top - bottom;
                    catVar.ruleWhiskerLowerBottom = bottom;
                }
            }
            
            catVar.showRuleWhiskerBelow = show;
            
            // hasMin = vars.minimum.value  != null,
        }
    }
});

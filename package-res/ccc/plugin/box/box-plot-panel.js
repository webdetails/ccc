/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true */

def
.type('pvc.BoxplotPanel', pvc.CategoricalAbstractPanel)
.init(function(chart, parent, plot, options) {
    
    this.base(chart, parent, plot, options);
    
    this.boxSizeRatio = plot.option('BoxSizeRatio');
    this.maxBoxSize   = plot.option('BoxSizeMax');

    // Legacy field
    if(!chart.bpChartPanel) chart.bpChartPanel = this;
})
.add({
    anchor: 'fill',
    
    plotType: 'box',

    // Override default mappings
    _v1DimRoleName: {
        //'series':   'series',
        //'category': 'category',
        'value':    'median'
    },
    
    /**
     * @override
     */
    _createCore: function() {

        this.base();
        
        var rootScene = this._buildScene(),
            a_bottom  = this.isOrientationVertical() ? "bottom" : "left",
            a_left    = this.anchorOrtho(a_bottom),
            a_width   = this.anchorLength(a_bottom),
            a_height  = this.anchorOrthoLength(a_bottom);

        function defaultColor(scene, type) {
            var color = this.base(scene, type);
            return type === 'stroke' ? color.darker(1) : color;
        }
        
        /* Category Panel */
        var extensionIds = ['panel'];
        if(this.compatVersion() <= 1)
            extensionIds.push(''); // let access as "box_"
        
        this.pvBoxPanel = new pvc.visual.Panel(this, this.pvPanel, {
                extensionId: extensionIds
            })
            .lock('data', rootScene.childNodes)
            .lockMark(a_left, function(scene) {
                var catVar = scene.vars.category;
                return catVar.x - catVar.width / 2;
            })
            .pvMark
            [a_width](function(scene) { return scene.vars.category.width; });
        
        /* V Rules */
        function setupRuleWhisker(rule) {
            rule.lock(a_left, function() {
                    return this.pvMark.parent[a_width]() / 2;
                })
                .override('defaultColor', defaultColor);

            return rule;
        }

        this.pvRuleWhiskerUpper = setupRuleWhisker(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxRuleWhisker',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false,
                showsInteraction: true
            }))
            .intercept('visible', function(scene) {
                return scene.vars.category.showRuleWhiskerUpper && this.delegateExtension(true);
            })
            .pvMark
            .lock(a_bottom, function(scene) { return scene.vars.category.ruleWhiskerUpperBottom; })
            .lock(a_height, function(scene) { return scene.vars.category.ruleWhiskerUpperHeight; });

        this.pvRuleWhiskerLower = setupRuleWhisker(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxRuleWhisker',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false,
                showsInteraction: true
            }))
            .intercept('visible', function(scene) {
                return scene.vars.category.showRuleWhiskerBelow && this.delegateExtension(true);
            })
            .pvMark
            .lock(a_bottom, function(scene) { return scene.vars.category.ruleWhiskerLowerBottom; })
            .lock(a_height, function(scene) { return scene.vars.category.ruleWhiskerLowerHeight; });

        /* Box Bar */
        function setupHCateg(sign) {
            sign.lockMark(a_left,  function(scene) { return scene.vars.category.boxLeft;  })
                .lockMark(a_width, function(scene) { return scene.vars.category.boxWidth; })
                ;
            
            return sign;
        }

        this.pvBar = setupHCateg(new pvc.visual.Bar(this, this.pvBoxPanel, {
                extensionId:   'boxBar',
                freePosition:  true,
                normalStroke:  true
            }))
            .intercept('visible', function(scene) {
                return scene.vars.category.showBox && this.delegateExtension(true);
            })
            .lockMark(a_bottom, function(scene) { return scene.vars.category.boxBottom; })
            .lockMark(a_height, function(scene) { return scene.vars.category.boxHeight; })
            .override('defaultColor', defaultColor)
            .override('defaultStrokeWidth', def.fun.constant(1))
            .pvMark;

        /* H Rules */
        function setupHRule(rule) {
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
                noDoubleClick: false,
                showsInteraction: true
            }))
            .intercept('visible', function(scene) {
                return scene.vars.minimum.value != null && this.delegateExtension(true);
            })
            .pvMark
            .lock(a_bottom,  function(scene) { return scene.vars.minimum.position; }); // bottom

        this.pvRuleMax = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxRuleMax',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false,
                showsInteraction: true
            }))
            .intercept('visible', function(scene) {
                return scene.vars.maximum.value != null && this.delegateExtension(true);
            })
            .pvMark
            .lock(a_bottom, function(scene) { return scene.vars.maximum.position; }); // bottom

        this.pvRuleMedian = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxRuleMedian',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false,
                showsInteraction: true
            }))
            .intercept('visible', function(scene) {
                return scene.vars.median.value != null && this.delegateExtension(true);
            })
            .lockMark(a_bottom,  function(scene) { return scene.vars.median.position; }) // bottom
            .override('defaultStrokeWidth', def.fun.constant(2))
            .pvMark;
    },

    /**
     * Renders this.pvScatterPanel - the parent of the marks that are affected by interaction changes.
     * @override
     */
    renderInteractive: function() {
        this.pvBoxPanel.render();
    },

    _buildScene: function() {
        var chart = this.chart,
            measureRolesDimNames = def.query(chart.measureVisualRoles())
                .object({
                    name:  function(role) { return role.name; },
                    value: function(role) { return role.lastDimensionName(); }
                }),
            visibleKeyArgs = {visible: true, zeroIfNone: false},
            data       = this.visibleData({ignoreNulls: false}),
            rootScene  = new pvc.visual.Scene(null, {panel: this, source: data}),
            baseScale  = this.axes.base.scale,
            bandWidth  = baseScale.range().band,
            boxWidth   = Math.min(bandWidth * this.boxSizeRatio, this.maxBoxSize),
            orthoScale = this.axes.ortho.scale,
            colorVarHelper = new pvc.visual.RoleVarHelper(rootScene, 'color', this.visualRoles.color);

        /**
         * Create starting scene tree
         */
        data.children() // categories
            .each(createCategScene, this);

        return rootScene;
        
        function createCategScene(categData) {
            var categScene = new pvc.visual.Scene(rootScene, {source: categData}),
                vars = categScene.vars;
            
            // Series distinction is ignored
            // If the role is bound by the user, its data will not be visible 
            vars.series = new pvc_ValueLabelVar(null, "");
            var catVar  = vars.category = new pvc_ValueLabelVar(categData.value, categData.label);
            
            def.set(catVar,
                'group',    categData,
                'x',        baseScale(categData.value),
                'width',    bandWidth,
                'boxWidth', boxWidth,
                'boxLeft',  bandWidth / 2 - boxWidth / 2);
            
            chart.measureVisualRoles().forEach(function(role) {
                var dimName = measureRolesDimNames[role.name],
                    svar;

                if(dimName) {
                    var dim = categData.dimensions(dimName),
                        value = dim.value(visibleKeyArgs);
                    
                    svar = new pvc_ValueLabelVar(value, dim.format(value));
                    svar.position = orthoScale(value);
                } else {
                    svar = new pvc_ValueLabelVar(null, "");
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
            if(show) {
                bottom = hasLower  ? vars.lowerQuartil.position :
                         hasMedian ? vars.median.position :
                         vars.upperQuartil.position;

                top    = hasUpper  ? vars.upperQuartil.position :
                         hasMedian ? vars.median.position :
                         vars.lowerQuartil.position;

                show = (top !== bottom);
                if(show) {
                    catVar.boxBottom = bottom;
                    catVar.boxHeight = top - bottom;
                }
            }
            
            catVar.showBox  = show;
            
            // vRules
            show = vars.maximum.value != null;
            if(show) {
                bottom = hasUpper  ? vars.upperQuartil.position :
                         hasMedian ? vars.median.position :
                         hasLower  ? vars.lowerQuartil.position :
                         hasMin    ? vars.minimum.position  :
                         null;
                
                show = bottom != null;
                if(show) {
                    catVar.ruleWhiskerUpperBottom = bottom;
                    catVar.ruleWhiskerUpperHeight = vars.maximum.position - bottom;
                }
            }

            catVar.showRuleWhiskerUpper = show;

            // ----

            show = hasMin;
            if(show) {
                top = hasLower  ? vars.lowerQuartil.position :
                      hasMedian ? vars.median.position :
                      hasUpper  ? vars.upperQuartil.position :
                      null;

                show = top != null;
                if(show) {
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

pvc.PlotPanel.registerClass(pvc.BoxplotPanel);
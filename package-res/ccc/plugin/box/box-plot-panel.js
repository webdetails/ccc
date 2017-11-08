/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true */

def
.type('pvc.BoxplotPanel', pvc.CategoricalAbstractPanel)
.init(function(chart, parent, plot, options) {

    this.base(chart, parent, plot, options);

    this.boxSizeRatio = plot.option('BoxSizeRatio');
    this.boxSizeMax   = plot.option('BoxSizeMax');

    // Legacy field
    if(!chart.bpChartPanel) chart.bpChartPanel = this;
})
.add({
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

        var data = this.visibleData({ignoreNulls: false}),
            baseAxis = this.axes.base,

            // Need to use the order that the axis uses.
            // Note that the axis may show data from multiple plots,
            //  and thus consider null datums inexistent in `data`,
            //  and thus have a different categories order.
            axisCategDatas = baseAxis.domainItems(),

            // TODO: There's no series axis...so something like what an axis would select must be repeated here.
            // See Axis#boundDimensionsDataSetsMap.
            // Maintaining order requires basing the operation on a data with nulls still in it.
            // `data` may not have nulls anymore.
            axisSeriesDatas = this.visualRoles.series.flatten(
                this.partData(),
                {
                    visible: true,
                    isNull: this.chart.options.ignoreNulls ? false : null,
                    extensionDataSetsMap: this.plot.boundDimensionsDataSetsMap
                })
                .childNodes,

            rootScene = this._buildScene(data, axisSeriesDatas, axisCategDatas),
            a_bottom  = this.isOrientationVertical() ? "bottom" : "left",
            a_left    = this.anchorOrtho(a_bottom),
            a_width   = this.anchorLength(a_bottom),
            a_height  = this.anchorOrthoLength(a_bottom);

        function defaultColor(scene, type) {
            var color = this.base(scene, type);
            return type === 'stroke' ? color.darker(1) : color;
        }

        var pvSeriesPanel = new pvc.visual.Panel(this, this.pvPanel)
            .lock('data', rootScene.childNodes)
            .pvMark;

        // Box/Category Panel
        var extensionIds = ['panel'];
        if(this.compatVersion() <= 1)
            extensionIds.push(''); // let access as "box_"

        this.pvBoxPanel = new pvc.visual.Panel(this, pvSeriesPanel, {
                extensionId: extensionIds
            })
            .lock('data', function(seriesScene) { return seriesScene.childNodes; })
            .pvMark
            [a_width](function(scene) { return scene.vars.category.boxWidth; })
            [a_left ](function(scene) {
                var catVar = scene.vars.category;
                return catVar.boxLeft + catVar.boxWidth/2 - this[a_width]()/2;
            });

        /* Box Bar */
        function setupHCateg(sign) {
            sign.optionalMark(a_width, function() { return this.parent[a_width](); })
                .optionalMark(a_left,  function() { return this.parent[a_width]()/2 - this[a_width]()/2; })

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
            .override('interactiveColor', function(scene, color, type) {
                return type === 'stroke' ? color : this.base(scene, color, type);
            })
            .override('defaultStrokeWidth', def.fun.constant(1))
            .override('interactiveStrokeWidth', function(scene, strokeWidth) { return strokeWidth; })
            .pvMark;

        function setupRule(rule) {
            return rule
                .override('defaultColor', defaultColor)
                .override('interactiveStrokeWidth', function(scene, strokeWidth) { return strokeWidth; })
                .override('interactiveColor', function(scene, color, type) {
                    return type === 'stroke' ? color : this.base(scene, color, type);
                });
        }

        /* V Rules */
        function setupRuleWhisker(rule) {
            return setupRule(rule)
                .optionalMark(a_left, function() {
                    return this.parent[a_width]() / 2 - this[a_width]() / 2;
                });
        }

        this.pvRuleWhiskerUpper = setupRuleWhisker(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxRuleWhisker',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false,
                noTooltip:     false,
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
                noTooltip:     false,
                showsInteraction: true
            }))
            .intercept('visible', function(scene) {
                return scene.vars.category.showRuleWhiskerBelow && this.delegateExtension(true);
            })
            .pvMark
            .lock(a_bottom, function(scene) { return scene.vars.category.ruleWhiskerLowerBottom; })
            .lock(a_height, function(scene) { return scene.vars.category.ruleWhiskerLowerHeight; });

        /* H Rules */
        function setupHRule(rule) {
            return setupRule(setupHCateg(rule));
        }

        this.pvRuleMin = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxRuleMin',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false,
                noTooltip:     false,
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
                noTooltip:     false,
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
                noTooltip:     false,
                showsInteraction: true
            }))
            .intercept('visible', function(scene) {
                return scene.vars.median.value != null && this.delegateExtension(true);
            })
            .lockMark(a_bottom,  function(scene) { return scene.vars.median.position; }) // bottom
            .override('defaultStrokeWidth', def.fun.constant(2))
            .pvMark
    },

    /**
     * Renders this.pvScatterPanel - the parent of the marks that are affected by interaction changes.
     * @override
     */
    renderInteractive: function() {
        this.pvBoxPanel.render();
    },

    _buildSceneCore: function(data, axisSeriesDatas, axisCategDatas) {
        //  chart measureVisualRoles would only return bound visual roles.
        var measureVisualRoleInfos = def.query(this.visualRoleList)
                .where(function(r) { return r.isMeasureEffective; })
                .select(function(r) {
                    return {
                        roleName: r.name,
                        dimName:  r.grouping.singleDimensionName
                    };
                })
                .array(),
            visibleKeyArgs = {visible: true, zeroIfNone: false},
            rootScene  = new pvc.visual.Scene(null, {panel: this, source: data}),
            baseScale  = this.axes.base.scale,
            bandWidth  = baseScale.range().band, // bandSizeRatio already discounted
            boxSizeMax = this.boxSizeMax,
            orthoScale = this.axes.ortho.scale,
            colorVarHelper = new pvc.visual.RoleVarHelper(rootScene, 'color', this.visualRoles.color),
            isGrouped = this.plot.option('LayoutMode') !== 'overlapped',
            boxWidth, boxStep, boxesOffsetLeft;

        if(!isGrouped) {
            boxWidth = Math.min(bandWidth, boxSizeMax);
        } else {
            var seriesCount = axisSeriesDatas.length,
                boxSizeRatio = this.boxSizeRatio,
                clip, boxesWidth, boxesWidthWithMargin;

            boxWidth = !seriesCount      ? 0 : // Don't think this ever happens... no data, no layout?
                       seriesCount === 1 ? bandWidth :
                       (boxSizeRatio * bandWidth / seriesCount);

            clip = boxWidth > boxSizeMax;
            if(clip) boxWidth = boxSizeMax;
            boxesWidth = seriesCount * boxWidth;
            if(!clip) {
                boxesWidthWithMargin = bandWidth;
                boxesOffsetLeft = -bandWidth/2;
            } else {
                // boxWidth = boxSizeMax;

                // Place all boxes at the center
                boxesWidthWithMargin = boxesWidth / boxSizeRatio;
                boxesOffsetLeft = -boxesWidthWithMargin/2;
            }

            if(seriesCount > 1) {
                var boxMargin = (boxesWidthWithMargin - boxesWidth) / (seriesCount - 1);
                boxStep = boxWidth + boxMargin;
            } else {
                boxStep = 0;
            }
            // boxWidth  = X = r * W / N
            // bandWidth = W = X + M + X + M + ... + X
            //           = N*X + (N-1)*M
            // boxMargin = M = (W - N*X) / (N-1)
            // boxStep   = S = X + M
        }

        // Create starting scene tree
        axisSeriesDatas.forEach(createSeriesScene);

        return rootScene;

        function createSeriesScene(axisSeriesData, seriesIndex) {
            // Create series scene
            var seriesScene = new pvc.visual.Scene(rootScene, {source: axisSeriesData}),
                seriesKey   = axisSeriesData.key;

            seriesScene.vars.series = pvc_ValueLabelVar.fromComplex(axisSeriesData);

            colorVarHelper.onNewScene(seriesScene, /*isLeaf*/false);

            axisCategDatas.forEach(function(axisCategData) {
                createCategScene(seriesScene, seriesKey, axisCategData, seriesIndex);
            });
        }

        function createCategScene(seriesScene, seriesKey, axisCategData, seriesIndex) {
            var categData = data.child(axisCategData.key),
                group = categData && categData.child(seriesKey),
                categScene = new pvc.visual.Scene(seriesScene, {source: group}),
                vars = categScene.vars,
                catVar = vars.category = pvc_ValueLabelVar.fromComplex(categData),
                x = baseScale(categData.value), // band center
                boxLeft = x + (isGrouped
                    ? (boxesOffsetLeft + seriesIndex * boxStep)
                    : (-boxWidth/2));

            def.set(catVar,
                'group',    categData,
                'x',        x,
                'width',    bandWidth,
                'boxWidth', boxWidth,
                'boxLeft',  boxLeft);

            measureVisualRoleInfos.forEach(function(roleInfo) {
                var dimName, svar;
                if(group && (dimName = roleInfo.dimName)) {
                    var dim = group.dimensions(dimName),
                        value = dim.value(visibleKeyArgs);

                    svar = new pvc_ValueLabelVar(value, dim.format(value));
                    svar.position = orthoScale(value);
                } else {
                    svar = new pvc_ValueLabelVar(null, "");
                    svar.position = null;
                }

                vars[roleInfo.roleName] = svar;
            });

            colorVarHelper.onNewScene(categScene, /*isLeaf*/ true);

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

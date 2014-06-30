/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Sides:true, pvc_ValueLabelVar:true */

/*
 * Metric Line/Dot panel.
 * Class that draws dot and line plots.
 * Specific options are:
 * <i>dotsVisible</i> - Show or hide dots. Default: true
 * <i>linesVisible</i> - Show or hide dots. Default: true
 * <i>valuesVisible</i> - Show or hide line value. Default: false
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>line_</i> - for the actual line
 * <i>linePanel_</i> - for the panel where the lines sit
 * <i>lineDot_</i> - the dots on the line
 * <i>lineLabel_</i> - for the main line label
 */
def
.type('pvc.MetricPointPanel', pvc.CartesianAbstractPanel)
.init(function(chart, parent, plot, options) {

    this.base(chart, parent, plot, options);

    var sizeAxis = this.axes.size = chart._getAxis('size', (plot.option('SizeAxis') || 0) - 1); // may be undefined
    if(sizeAxis) {
        this.sizeAxisRatio = sizeAxis.option('Ratio');
        this.sizeAxisRatioTo = sizeAxis.option('RatioTo');
        this.autoPaddingByDotSize = plot.option('AutoPaddingByDotSize');
    }

    this.linesVisible = plot.option('LinesVisible');
    this.dotsVisible  = plot.option('DotsVisible' );
    if(!this.linesVisible && !this.dotsVisible) {
        this.linesVisible = true;
        plot.option.specify({'LinesVisible': true});
    }

    // Legacy field
    if(!chart.scatterChartPanel) chart.scatterChartPanel = this;
})
.add({
    plotType: 'scatter',

    // Override default mappings
    _v1DimRoleName: {
        //'series':   'series', // inherited
        'category': 'x',
        'value':    'y'
    },

    _creating: function() {
        // Register BULLET legend prototype marks
        var groupScene = this.defaultLegendGroupScene();
        if(groupScene && !groupScene.hasRenderer()) {
            var colorAxis = groupScene.colorAxis,
                drawMarker = def.nullyTo(colorAxis.option('LegendDrawMarker', true), this.dotsVisible),
                drawRule   = def.nullyTo(colorAxis.option('LegendDrawLine',   true), this.linesVisible);

            if(drawMarker || drawRule) {
                var keyArgs = {drawMarker: drawMarker, drawRule: drawRule};
                if(drawMarker) {
                    keyArgs.markerShape =
                        colorAxis.option('LegendShape', true) ||
                        'circle'; // Dot's default shape

                    keyArgs.markerPvProto = new pv.Dot()
                            .lineWidth(1.5, pvc.extensionTag) // act as if it were a user extension
                            .shapeSize(12, pvc.extensionTag); // idem

                    this.extend(keyArgs.markerPvProto, 'dot', {constOnly: true});
                }

                if(drawRule) {
                    keyArgs.rulePvProto = new pv.Line()
                            .lineWidth(1.5, pvc.extensionTag);

                    this.extend(keyArgs.rulePvProto, 'line', {constOnly: true});
                }

                groupScene.renderer(
                    new pvc.visual.legend.BulletItemDefaultRenderer(keyArgs));
            }
        }
    },

    _getRootScene: function() {
        return def.lazy(this, '_rootScene', this._buildScene, this);
    },

    /*
    * @override
    */
    _calcLayout: function(layoutInfo) {
        var rootScene = this._getRootScene();
        if(rootScene.isSizeBound)
            this.axes.size.setScaleRange(this._calcDotAreaRange(layoutInfo));

        /* Adjust axis offset to avoid dots getting off the content area */
        this._calcAxesPadding(layoutInfo, rootScene);
    },

    _getDotDiameterRefLength: function(layoutInfo) {
        // Use the border box to always have the same size for != axis offsets (paddings)
        var clientSize = layoutInfo.clientSize,
            paddings   = layoutInfo.paddings;

        switch(this.sizeAxisRatioTo) {
            case 'minwidthheight':
                return Math.min(
                        clientSize.width  + paddings.width,
                        clientSize.height + paddings.height);

            case 'width':  return clientSize.width  + paddings.width ;
            case 'height': return clientSize.height + paddings.height;
        }

        if(pvc.debug >= 2)
            this._log(
                def.format(
                    "Invalid option 'sizeAxisRatioTo' value. Assuming 'minWidthHeight'.",
                    [this.sizeAxisRatioTo]));

        this.sizeRatioTo = 'minwidthheight';

        return this._getDotDiameterRefLength(layoutInfo);
    },

    _calcDotRadiusRange: function(layoutInfo) {
        return {
            // Minimum SIZE (not radius) is 12
            min: Math.sqrt(12),

            // Diameter is 1/5 of ref length
            max: (this.sizeAxisRatio / 2) * this._getDotDiameterRefLength(layoutInfo)
        };
    },

    _calcDotAreaRange: function(layoutInfo) {

        var radiusRange = this._calcDotRadiusRange(layoutInfo);

        // Diamond Adjustment
        if(this.shape === 'diamond') {
            // Protovis draws diamonds inscribed on
            // a square with half-side radius*Math.SQRT2
            // (so that diamonds just look like a rotated square)
            // For the height/width of the diamond not to exceed the cell size
            // we compensate that factor here.
            radiusRange.max /= Math.SQRT2;
            radiusRange.min /= Math.SQRT2;
        }

        var maxArea  = def.sqr(radiusRange.max),
            minArea  = def.sqr(radiusRange.min),
            areaSpan = maxArea - minArea;

        if(areaSpan <= 1) {
            // Very little space
            // Rescue Mode - show *something*
            maxArea  = Math.max(maxArea, 2);
            minArea  = 1;
            areaSpan = maxArea - minArea;
            /*
            radiusRange = {
                min: Math.sqrt(minArea),
                max: Math.sqrt(maxArea)
            };
            */

            if(pvc.debug >= 3) this._log("Using rescue mode dot area calculation due to insufficient space.");
        }

        return {
            min:  minArea,
            max:  maxArea,
            span: areaSpan
        };
    },

    _calcAxesPadding: function(layoutInfo, rootScene) {
        // If we were not to take axes rounding padding effect
        // into account, it could be as simple as:
        // var offsetRadius = radiusRange.max + 6;
        // requestPaddings = new pvc_Sides(offsetRadius);

        var requestPaddings;

        if(!this.autoPaddingByDotSize) {
            requestPaddings = this._calcRequestPaddings(layoutInfo);
        } else {
            var axes = this.axes,
                clientSize = layoutInfo.clientSize,
                paddings   = layoutInfo.paddings;

            requestPaddings = {};

            /* The Worst case implementation would be like:
             *   Use more padding than is required in many cases,
             *   but ensures that no dot ever leaves the "stage".
             *
             *   Half a circle must fit in the client area
             *   at any edge of the effective plot area
             *   (the client area minus axis offsets).
             */

            // X and Y axis orientations
            axes.x.setScaleRange(clientSize.width );
            axes.y.setScaleRange(clientSize.height);

            // X and Y visual roles
            var isV = this.isOrientationVertical(),
                sceneXScale = axes.x.sceneScale({sceneVarName: isV ? 'x' : 'y'}),
                sceneYScale = axes.y.sceneScale({sceneVarName: isV ? 'y' : 'x'}),
                xMax = axes.x.scale.max,
                yMax = axes.y.scale.max,
                hasSizeRole = rootScene.isSizeBound,
                sizeScale   = hasSizeRole ? axes.size.scale : null;
            if(!sizeScale) {
                // Use the dot default size
                var defaultSize = def.number.as(this._getExtension('dot', 'shapeRadius'), 0);
                if(defaultSize <= 0) {
                    defaultSize = def.number.as(this._getExtension('dot', 'shapeSize'), 0);
                    if(defaultSize <= 0) defaultSize = 12;
                } else {
                    // Radius -> Size
                    defaultSize = def.sqr(defaultSize);
                }
                sizeScale = def.fun.constant(defaultSize);
            }

            // TODO: these padding requests do not take the resulting new scale into account
            // and as such do not work exactly...
            //var xMinPct = xScale(xDomain.min) /  clientSize.width;
            //var overflowLeft = (offsetRadius - xMinPct * (paddings.left + clientSize.width)) / (1 - xMinPct);

            requestPaddings = {};

            // Resolve offset paddings (not of PercentValue so cannot use pvc.Sides#resolve)
            var op, axisOffsetPaddings = this.chart._axisOffsetPaddings;
            if(axisOffsetPaddings) {
                op = {};
                pvc_Sides.names.forEach(function(side) {
                    var len_a = pvc.BasePanel.orthogonalLength[side];

                    op[side] = (axisOffsetPaddings[side] || 0) *
                               (clientSize[len_a] + paddings[len_a]);
                }, this);
            }

            var setSide = function(side, padding) {
                if(op) padding += (op[side] || 0);
                if(padding < 0) padding = 0;

                var value = requestPaddings[side];
                if(value == null || padding > value) requestPaddings[side] = padding;
            };

            var processScene = function(scene) {
                var x = sceneXScale(scene),
                    y = sceneYScale(scene),
                    r = Math.sqrt(sizeScale(hasSizeRole ? scene.vars.size.value : 0));

                // How much overflow on each side?
                setSide('left',   r - x);
                setSide('bottom', r - y);
                setSide('right',  x + r - xMax);
                setSide('top',    y + r - yMax);
            };

            rootScene
                .children()
                .selectMany(function(seriesScene) { return seriesScene.childNodes; })
                .each(processScene);
        }

        layoutInfo.requestPaddings = requestPaddings;
    },

    /**
     * @override
     */
    _createCore: function(/*layoutInfo*/) {
        var me = this;

        me.base();

        var chart      = me.chart,
            rootScene  = me._getRootScene(),
            wrapper    = me._buildSignsWrapper(),
            isV1Compat = me.compatVersion() <= 1;

        this._finalizeScene(rootScene);

        // ---------------
        // BUILD

        me.pvPanel.zOrder(1); // Above axes

        this.pvScatterPanel = new pvc.visual.Panel(me, me.pvPanel, {
                extensionId: 'panel'
            })
            .lock('data', rootScene.childNodes)
            .pvMark;

        // -- LINE --
        var isLineNoSelect = /*dotsVisible && */chart.selectableByFocusWindow(),

            // A discrete color role may have null values; the line is not hidden.
            isColorDiscrete = rootScene.isColorBound && this.visualRoles.color.isDiscrete(),

            line = new pvc.visual.Line(me, me.pvScatterPanel, {
                extensionId: 'line',
                wrapper:     wrapper,
                noTooltip:   false,
                noSelect:       isLineNoSelect,
                showsSelection: !isLineNoSelect
            })
            .lockMark('data', function(seriesScene) { return seriesScene.childNodes; })
            .intercept('visible', function(scene) {
                if(!me.linesVisible) return false;

                var visible = this.delegateExtension();
                if(visible == null) {
                    visible = !scene.isNull &&
                             ((!rootScene.isSizeBound && !rootScene.isColorBound) ||
                              (rootScene.isSizeBound  && scene.vars.size.value  != null) ||
                              (rootScene.isColorBound && (isColorDiscrete || scene.vars.color.value != null)));
                }

                return visible;
            })
            .override('x', function(scene) { return scene.basePosition;  })
            .override('y', function(scene) { return scene.orthoPosition; });

        me.pvLine = line.pvMark;

        // -- DOT --
        var dot = new pvc.visual.DotSizeColor(me, me.pvLine, {
                extensionId: 'dot',
                wrapper:     wrapper,
                activeSeriesAware: me.linesVisible
            })
            .override('x',  function(scene) { return scene.basePosition;  })
            .override('y',  function(scene) { return scene.orthoPosition; })
            .override('color', function(scene, type) {
                /*
                 * Handle dotsVisible
                 * -----------------
                 * Despite !dotsVisible,
                 * show a dot anyway when:
                 * 1) it is active, or
                 * 2) it is single  (the only dot in the dataset)
                 */
                return (!me.dotsVisible && !scene.isActive && !scene.isSingle)
                    ? pvc.invisibleFill
                    : this.base(scene, type); // Follow normal logic
            });

        if(!rootScene.isSizeBound) {
            dot
            .override('baseSize', function(scene) {
                /* When not showing dots,
                 * but a datum is alone and
                 * wouldn't be visible using lines,
                 * show the dot anyway,
                 * with a size = to the line's width^2
                 */
                if(!me.dotsVisible) {
                    if(scene.isSingle) {
                        // Obtain the line Width of the "sibling" line
                        var lineWidth = Math.max(me.pvLine.scene[this.pvMark.index].lineWidth, 0.2) / 2;
                        return def.sqr(lineWidth);
                    }
                }

                return this.base(scene);
            });
        } else if(!(me.autoPaddingByDotSize && me.sizeAxisRatioTo === 'minwidthheight')) {
            // Default is to hide overflow dots,
            // for a case where the provided offset, or calculated one is not enough
            // (sizeAxisRatioTo='width' or 'height' don't guarantee no overflow)
            // Padding area is used by the bubbles.
            me.pvPanel.borderPanel.overflow("hidden");
        }

        me.pvDot = dot.pvMark;
        me.pvDot.rubberBandSelectionMode = 'center';

        if(pvc.visual.ValueLabel.isNeeded(me)) {
            var extensionIds = ['label'];
            if(isV1Compat) extensionIds.push('lineLabel');

            var label = pvc.visual.ValueLabel.maybeCreate(me, me.pvDot, {
                extensionId: extensionIds,
                wrapper: wrapper
            });

            // TODO: pvHeatGridLabel is v2 Copy&Paste bug or v1 legacy?
            if(label) me.pvHeatGridLabel = label.pvMark;
        }
    },

    _buildSignsWrapper: function() {
        if(this.compatVersion() > 1) return null;

        return function(v1f) {
            return function(scene) {
                var d = {category: scene.vars.x.rawValue, value: scene.vars.y.rawValue},
                    // Compensate for the effect of intermediate scenes on mark's index
                    pseudo = Object.create(this);

                pseudo.index = scene.dataIndex;
                return v1f.call(pseudo, d);
            };
        };
    },

    /**
     * Renders this.pvScatterPanel - the parent of the marks that are affected by interaction changes.
     * @override
     */
    renderInteractive: function() {
        this.pvScatterPanel.render();
    },

    _buildScene: function() {
        var data = this.visibleData({ignoreNulls: false}),
            rootScene = new pvc.visual.Scene(null, {panel: this, source: data}),
            roles = this.visualRoles,
            colorVarHelper = new pvc.visual.RoleVarHelper(rootScene, 'color', roles.color),
            sizeVarHelper  = new pvc.visual.RoleVarHelper(rootScene, 'size',  roles.size),
            xDim = data.owner.dimensions(roles.x.lastDimensionName()),
            yDim = data.owner.dimensions(roles.y.lastDimensionName());

        // --------------

        data.children().each(createSeriesScene, this);

        /**
         * Update the scene tree to include intermediate leaf-scenes,
         * to add in the creation of lines and areas.
         */
        rootScene.children().each(completeSeriesScenes, this);

        return rootScene;

        function createSeriesScene(seriesGroup) {
            /* Create series scene */
            var seriesScene = new pvc.visual.Scene(rootScene, {source: seriesGroup});

            seriesScene.vars.series =
                    pvc_ValueLabelVar.fromComplex(seriesGroup);

            colorVarHelper.onNewScene(seriesScene, /* isLeaf */ false);

            seriesGroup
            .datums()
            .each(function(datum, dataIndex) {
                var xAtom = datum.atoms[xDim.name];
                if(xAtom.value == null) return;

                var yAtom = datum.atoms[yDim.name];
                if(yAtom.value == null) return;

                /* Create leaf scene */
                var scene = new pvc.visual.Scene(seriesScene, {source: datum});
                scene.dataIndex = dataIndex;

                scene.vars.x = pvc_ValueLabelVar.fromAtom(xAtom);
                scene.vars.y = pvc_ValueLabelVar.fromAtom(yAtom);

                sizeVarHelper .onNewScene(scene, /* isLeaf */ true);
                colorVarHelper.onNewScene(scene, /* isLeaf */ true);

                scene.isIntermediate = false;
            });
        }

        function completeSeriesScenes(seriesScene) {
            var seriesScenes = seriesScene.childNodes,
                fromScene;

            /* As intermediate nodes are added,
             * seriesScene.childNodes array is changed.
             *
             * The var 'toChildIndex' takes inserts into account;
             * its value is always the index of 'toScene' in
             * seriesScene.childNodes.
             */
            for(var c = 0, /* category index */
                    toChildIndex = 0,
                    pointCount = seriesScenes.length ; c < pointCount ; c++, toChildIndex++) {

                /* Complete toScene */
                var toScene = seriesScenes[toChildIndex];
                toScene.isSingle = !fromScene && !toScene.nextSibling;  // Look ahead

                /* Possibly create intermediate scene
                 * (between fromScene and toScene)
                 */
                if(fromScene) {
                    var interScene = createIntermediateScene(
                            seriesScene,
                            fromScene,
                            toScene,
                            toChildIndex);

                    if(interScene) toChildIndex++;
                }

                // --------

                fromScene = toScene;
            }
        }

        function createIntermediateScene(
                     seriesScene,
                     fromScene,
                     toScene,
                     toChildIndex) {

            // Code for single, continuous and date/numeric dimensions
            // Calls corresponding dimension's cast to ensure we have a date object,
            // when that's the dimension value type.
            var yToSceneAux   = (+toScene  .vars.y.value),
                yFromSceneAux = (+fromScene.vars.y.value),
                xToSceneAux   = (+toScene  .vars.x.value),
                xFromSceneAux = (+fromScene.vars.x.value),
                interYValue   = yDim.type.cast.call(null, (yToSceneAux + yFromSceneAux) / 2),
                interXValue   = xDim.type.cast.call(null, (xToSceneAux + xFromSceneAux) / 2),
                interScene = new pvc.visual.Scene(seriesScene, {
                    //insert immediately before toScene
                    index:  toChildIndex,
                    source: toScene.datum
                });

            interScene.dataIndex = toScene.dataIndex;

            interScene.vars.x = new pvc_ValueLabelVar(
                                    interXValue,
                                    xDim.format(interXValue),
                                    interXValue);

            interScene.vars.y = new pvc_ValueLabelVar(
                                    interYValue,
                                    yDim.format(interYValue),
                                    interYValue);

            sizeVarHelper .onNewScene(interScene, /* isLeaf */ true);
            colorVarHelper.onNewScene(interScene, /* isLeaf */ true);

            interScene.ownerScene = toScene;
            interScene.isIntermediate = true;
            interScene.isSingle = false;

            return interScene;
        }
    },

    _finalizeScene: function(rootScene) {
        var axes = this.axes,
            sceneBaseScale  = axes.base .sceneScale({sceneVarName: 'x'}),
            sceneOrthoScale = axes.ortho.sceneScale({sceneVarName: 'y'});

        rootScene
            .children()
            .selectMany(function(seriesScene) { return seriesScene.childNodes; })
            .each(function(leafScene) {
                leafScene.basePosition  = sceneBaseScale (leafScene);
                leafScene.orthoPosition = sceneOrthoScale(leafScene);
            });

        return rootScene;
    }
});

pvc.PlotPanel.registerClass(pvc.MetricPointPanel);

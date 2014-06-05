/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true */

/*
 * HeatGrid chart panel. Generates a heatGrid chart. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>valuesVisible</i> - Show or hide heatGrid value. Default: false
 * <i>maxHeatGridSize</i> - Maximum size of a heatGrid in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>heatGrid_</i> - for the actual heatGrid
 * <i>heatGridPanel_</i> - for the panel where the heatGrids sit
 * <i>heatGridLabel_</i> - for the main heatGrid label
 */
def
.type('pvc.HeatGridPanel', pvc.CategoricalAbstractPanel)
.init(function(chart, parent, plot, options) {

    this.base(chart, parent, plot, options);

    this.axes.size = chart._getAxis('size', plot.option('SizeAxis') - 1); // may be undefined

    var roles = this.visualRoles;

    roles.size = chart.visualRole(plot.option('SizeRole')); // SizeRole - assumed to be always defined

    this.useShapes = plot.option('UseShapes');
    this.shape     = plot.option('Shape');
    this.nullShape = plot.option('NullShape');

    // Legacy field
    if(!chart.heatGridChartPanel) chart.heatGridChartPanel = this;
})
.add({
    plotType: 'heatGrid',

    defaultBorder:  1,
    nullBorder:     2,
    selectedBorder: 2,

    /** @override */
    _createCore: function() {
        var me = this;

        me.base();

        var cellSize = me._calcCellSize(),
            a_bottom = me.isOrientationVertical() ? "bottom" : "left",
            a_left   = pvc.BasePanel.relativeAnchor[a_bottom],
            a_width  = pvc.BasePanel.parallelLength[a_bottom],
            a_height = pvc.BasePanel.orthogonalLength[a_bottom],

            // Column and Row datas
            // One multi-dimension single-level data grouping
            // There's no series axis...so something like what an axis would select must be repeated here.
            // Maintaining order requires basing the operation on a data with nulls still in it.
            // `data` may not have nulls anymore.
            rowRootData = me.visualRoles.series.flatten(
                me.partData(),
                {visible: true, isNull: me.chart.options.ignoreNulls ? false : null}),

            // One multi-dimensional, two-levels grouping (Series -> Categ)
            rootScene  = me._buildScene(me.visibleData({ignoreNulls: false}), rowRootData, cellSize),
            hasColor   = rootScene.isColorBound,
            hasSize    = rootScene.isSizeBound,
            wrapper    = me._buildSignsWrapper(rootScene),
            isV1Compat = me.compatVersion() <= 1,
            rowScale   = this.axes.base.scale,
            colScale   = this.axes.ortho.scale,
            rowStep    = rowScale.range().step,
            colStep    = colScale.range().step,
            rowStep2   = rowStep/2,
            colStep2   = colStep/ 2;

        /* PV Panels */
        var pvRowPanel = new pvc.visual.Panel(me, me.pvPanel)
            .pvMark
            .data(rootScene.childNodes)
            [a_bottom](function(scene) { return colScale(scene.vars.series.value) - colStep2; })
            [a_height](colStep);

        /* Cell panel */
        var extensionIds = ['panel'];
        if(isV1Compat) extensionIds.push(''); // let access as "heatGrid_"

        var keyArgs = {
            extensionId: extensionIds,
            wrapper:     wrapper
        };

        if(!me.useShapes) {
            // When no shapes are used,
            // clicks, double-clicks and tooltips are directly handled by
            // the cell panel
            var f = false;
            def.copy(keyArgs, {
                noSelect: f,
                noHover:  f,
                noClick:  f,
                noDoubleClick: f,
                freeColor: f,
                noTooltip: isV1Compat
            });
        }

        me.pvHeatGrid = new pvc.visual.Panel(me, pvRowPanel, keyArgs)
            .pvMark
            .lock('data',  function(serScene) { return serScene.childNodes; })
            .lock(a_left,  function(scene) { return rowScale(scene.vars.category.value) - rowStep2; })
            .lock(a_width, rowStep)
            .antialias(false);
            // THIS caused HUGE memory consumption and speed reduction (at least in use Shapes mode, and specially in Chrome)
            // Overflow can be important if valuesVisible=true
            //.overflow('hidden')

        me.shapes = me.useShapes ?
                    me._createShapesHeatMap(cellSize, wrapper, hasColor, hasSize) :
                    me._createNoShapesHeatMap(hasColor);


        if(me.valuesVisible && !me.valuesMask) me.valuesMask = me._getDefaultValuesMask(hasColor, hasSize);

        var label = pvc.visual.ValueLabel.maybeCreate(me, me.pvHeatGrid, {wrapper: wrapper});
        if(label) me.pvHeatGridLabel = label.pvMark;
    },

    _calcCellSize: function() {
        // Use existing scales
        var xScale = this.axes.x.scale,
            yScale = this.axes.y.scale,

            // Determine cell dimensions.
            w = (xScale.max - xScale.min) / xScale.domain().length,
            h = (yScale.max - yScale.min) / yScale.domain().length;

        if(!this.isOrientationVertical()) {
            var tmp = w;
            w = h;
            h = tmp;
        }

        return {width: w, height: h};
    },

    _buildSignsWrapper: function(rootScene) {
        if(this.compatVersion() > 1) return null;

        var colorValuesBySerAndCat =
            def
            .query(rootScene.childNodes)
            .object({
                name:  function(serScene) { return '' + serScene.vars.series.value; },
                value: function(serScene) {
                    return def
                        .query(serScene.childNodes)
                        .object({
                            name:  function(leafScene) { return '' + leafScene.vars.category.value; },
                            value: function(leafScene) {
                                var colorVar = leafScene.vars.color;
                                return colorVar ? ('' + colorVar.value) : null;
                            }
                        });
                }
            });

        return function(v1f) {

            return function(leafScene) {
                var colorValuesByCat = colorValuesBySerAndCat[leafScene.vars.series.value],
                    cat = leafScene.vars.category.rawValue,
                    wrapperParent = Object.create(this.parent),
                    wrapper = Object.create(this),
                    // Previously, first panel was by cats and
                    // the second (child) panel was by series
                    catIndex = leafScene.childIndex(),
                    serIndex = leafScene.parent.childIndex();

                wrapper.parent = wrapperParent;
                wrapperParent.index = catIndex;
                wrapper.index = serIndex;

                return v1f.call(wrapper, colorValuesByCat, cat);
            };
        };
    },

    _getDefaultValuesMask: function(hasColor, hasSize) {
        // The "value" concept is mapped to one of the color or size roles, by default.
        var roles = this.visualRoles,
            roleName = hasColor ? 'color' :
                       hasSize  ? 'size'  :
                       null;
        if(roleName) {
            var valueDimName = roles[roleName].lastDimensionName();
            return "{#" + valueDimName + "}";
        }
    },

    _createNoShapesHeatMap: function(hasColor) {
        var getBaseColor = this._buildGetBaseFillColor(hasColor);
        return this.pvHeatGrid
            .sign
            .override('defaultColor', function(scene, type) {
                return (type === 'stroke') ? null : getBaseColor.call(this.pvMark, scene);
            })
            .override('interactiveColor', function(scene, color, type) {
                if(scene.isActive) return color.alpha(0.6);
                if(scene.anySelected() && !scene.isSelected()) return this.dimColor(color, type);
                return this.base(scene, color, type);
            })
            .override('dimColor', function(color/*, type*/) {
                return pvc.toGrayScale(color, 0.6);
            })
            .pvMark
            .lineWidth(1.5);
    },

    _buildGetBaseFillColor: function(hasColor) {
        var colorAxis = this.axes.color;
        return hasColor
            ? colorAxis.sceneScale({sceneVarName: 'color'})
            : def.fun.constant(colorAxis.option('Unbound'));
    },

    _createShapesHeatMap: function(cellSize, wrapper, hasColor, hasSize) {
        var me = this,
            // SIZE
            areaRange = me._calcDotAreaRange(cellSize),
            // Dot Sign
            keyArgs = {
                extensionId: 'dot',
                freePosition: true,
                activeSeriesAware: false,
                //noHover:      false,
                wrapper:      wrapper,
                tooltipArgs:  me._buildShapesTooltipArgs(hasColor, hasSize)
            },
            pvDot = new pvc.visual.DotSizeColor(me, me.pvHeatGrid, keyArgs)
                .override('dimColor', function(color/*, type*/) { return pvc.toGrayScale(color, 0.6); })
                .pvMark;
                // TODO - although rotation of shapes can cause them to not fit the calculated cell,
                // we are unlocking the extension point so the users can rotate the shape;
                // and leaving for them the work of needing to resize them appropriately.
                // The radius calculation code should be improved?
                //.lock('shapeAngle');

        if(hasSize) me.axes.size.setScaleRange(areaRange);
        else pvDot.sign.override('defaultSize', def.fun.constant(areaRange.max));

        return pvDot;
    },

    _calcDotAreaRange: function(cellSize) {
        var w = cellSize.width,
            h = cellSize.height,
            maxRadius = Math.min(w, h) / 2;

        // Protovis draws diamonds inscribed on
        // a square with half-side radius*Math.SQRT2
        // (so that diamonds just look like a rotated square)
        // For the height of the diamond not to exceed the cell size
        // we compensate that factor here.
        if(this.shape === 'diamond') maxRadius /= Math.SQRT2;

        // Small margin
        maxRadius -= 2;

        var maxArea  = def.sqr(maxRadius), // apparently treats as square area even if circle, triangle is different
            minArea  = 12,
            areaSpan = maxArea - minArea;

        if(areaSpan <= 1) {
            // Very little space
            // Rescue Mode - show *something*
            maxArea = Math.max(maxArea, 2);
            minArea = 1;
            areaSpan = maxArea - minArea;

            if(pvc.debug >= 2) this._warn("Using rescue mode dot area calculation due to insufficient space.");
        }

        //var missingArea = minArea + areaSpan * 0.2; // 20% size
        return {
            min:  minArea,
            max:  maxArea,
            span: areaSpan
        };
    },

    _buildShapesTooltipArgs: function(hasColor, hasSize) {
        var chart = this.chart;

        if(this.compatVersion() <= 1 && this.showsTooltip()) {
            var options = chart.options,
                customTooltip = options.customTooltip;

            if(!customTooltip) customTooltip = function(s,c,d) {
                return  (d != null && d[0] !== undefined) ? d.join(', ') : d;
            };

            var roles   = this.visualRoles,
                seriesDimsNames = roles.series.grouping.dimensionNames(),
                categDimsNames  = roles.category.grouping.dimensionNames();

            // For use in keyArgs.tooltipArgs
            return {
                buildTooltip: options.isMultiValued ?
                    function(context) {
                        var group = context.scene.group;
                        if(!group) return ""; // null scene

                        var s = cdo.Complex.values(group, seriesDimsNames),
                            c = cdo.Complex.values(group, categDimsNames),
                            d = [],
                            vars = context.scene.vars;

                        if(hasSize ) d[options.sizeValIdx  || 0] = vars.size.value;
                        if(hasColor) d[options.colorValIdx || 0] = vars.color.value;

                        return customTooltip.call(options, s, c, d);
                    } :
                    function(context) {
                        var vars = context.scene.vars,
                            s = vars.series.rawValue,
                            c = vars.category.rawValue,
                            valueVar = vars[hasColor ? 'color' : 'size'],
                            d = valueVar ? valueVar.value : null;

                        return customTooltip.call(options, s, c, d);
                    }
            };
        }
    },

    /**
     * Renders the heat grid panel.
     * @override
     */
    renderInteractive: function() {
        this.pvPanel.render();
    },

    _buildScene: function(data, seriesRootData, cellSize) {
        var me = this,
            rootScene  = new pvc.visual.Scene(null, {panel: me, source: data}),
            categDatas = data.childNodes,
            roles = me.visualRoles,
            colorVarHelper = new pvc.visual.RoleVarHelper(rootScene, 'color', roles.color),
            sizeVarHelper  = new pvc.visual.RoleVarHelper(rootScene, 'size',  roles.size);

        rootScene.cellSize = cellSize;

        seriesRootData.children().each(createSeriesScene);

        return rootScene;

        function createSeriesScene(serData1) {
            /* Create series scene */
            var serScene = new pvc.visual.Scene(rootScene, {source: serData1});

            serScene.vars.series = pvc_ValueLabelVar.fromComplex(serData1);

            categDatas.forEach(function(catData1) {
                createSeriesCategoryScene.call(me, serScene, catData1, serData1);
            });
        }

        function createSeriesCategoryScene(serScene, catData1, serData1) {
            var group = data.child(catData1.key).child(serData1.key),
                serCatScene = new pvc.visual.Scene(serScene, {source: group});

            serCatScene.vars.category = pvc_ValueLabelVar.fromComplex(catData1);

            colorVarHelper.onNewScene(serCatScene, /* isLeaf */true);
            sizeVarHelper .onNewScene(serCatScene, /* isLeaf */true);
        }
    }
});

pvc.PlotPanel.registerClass(pvc.HeatGridPanel);
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pv_Mark:true, pvc_ValueLabelVar:true */

/**
 * Bar Abstract Panel.
 * The base panel class for bar charts.
 *
 * Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>valuesVisible</i> - Show or hide bar value. Default: false
 * <i>barSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by bars. Default: 0.9 (90%)
 * <i>barSizeMax</i> - Maximum size (width) of a bar in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 * <i>chart_</i> - for the main chart Panel
 * <i>bar_</i> - for the actual bar
 * <i>barPanel_</i> - for the panel where the bars sit
 * <i>barLabel_</i> - for the main bar label
 */
def
.type('pvc.BarAbstractPanel', pvc.CategoricalAbstractPanel)
.add({

    pvBar: null,
    pvBarLabel: null,
    pvCategoryPanel: null,
    pvSecondLine: null,
    pvSecondDot: null,

    _creating: function() {
        // Register legend prototype marks to render legend symbols.
        // These marks will belong to the legend group corresponding to the color axis of this panel's plot.
        // These marks will be called to render item scenes which are children of this legend group.
        // The first panel associated with this panel's plot - the one of the first small chart -,
        //  will be the one to register the symbol renderer.
        // However, it will be used to render markers for all legend items,
        //  even if their color is not used by this particular panel.
        // Measure discriminator dimensions must be carefully handled, because when, for example,
        //  "series" is bound to "valueRole.dim",
        //  and plot A's "value" visual role is bound to measure "sales"
        //  and plot B's "value" visual role is bound to measure "qty",
        //  the symbol renderer of plot A should only render the markers
        //  for series containing "sales",
        //  and, conversely, plot B should only render markers for series containing "qty".
        // A renderer should not be visible for itemScenes whose associated data
        //  contains a discriminator dimension with a value that does not match any of the dimensions
        //  for which the corresponding visual role of the renderer's owner plot is bound...

        var colorDataCell = this.plot.dataCellsByRole.color[0];
        if(!colorDataCell.legendSymbolRenderer() && colorDataCell.legendVisible()) {

            var colorAxis  = this.axes.color,
                drawLine   = colorAxis.option('LegendDrawLine'),
                drawMarker = !drawLine || colorAxis.option('LegendDrawMarker');

            if(drawMarker) {
                // Generate a unique extension prefix for any extension points present
                // in the visual role's legend option.
                var extAbsPrefix = pvc.uniqueExtensionAbsPrefix();

                // Load any extension points.
                this.chart._processExtensionPointsIn(colorDataCell.role.legend(), extAbsPrefix);

                var keyArgs = {
                    drawMarker:  true,
                    markerShape: colorAxis.option('LegendShape'),
                    drawLine:    drawLine,

                    // Use this extension point prefix.
                    extensionPrefix: {abs: extAbsPrefix},

                    // Must be from the same type, or extension points don't get applied with the extension tag.
                    markerPvProto: new pv.Dot()
                };

                // Configure with constant extension points of "bar"
                this.extend(keyArgs.markerPvProto, 'bar', {constOnly: true});

                colorDataCell.legendSymbolRenderer(keyArgs);
            }
        }
    },

    /**
     * @override
     */
    _createCore: function() {

        this.base();

        var me = this,
            chart = me.chart,
            plot = me.plot,
            isStacked = !!me.stacked,
            isVertical = me.isOrientationVertical(),

            data = me.visibleData({ignoreNulls: false}), // shared "categ then series" grouped data

            orthoAxis = me.axes.ortho,
            baseAxis  = me.axes.base,

            // Need to use the order that the axis uses.
            // Note that the axis may show data from multiple plots,
            //  and thus consider null datums inexistent in `data`,
            //  and thus have a different categories order.
            axisCategDatas = baseAxis.domainItems(),

            // TODO: There's no series axis...so something like what an axis would select must be repeated here.
            // See Axis#boundDimensionsDataSetsMap.
            // Maintaining order requires basing the operation on a data with nulls still in it.
            // `data` may not have nulls anymore.
            axisSeriesDatas = me.visualRoles.series.flatten(
                me.partData(),
                {
                    visible: true,
                    isNull: chart.options.ignoreNulls ? false : null,
                    extensionDataSetsMap: plot.boundDimensionsDataSetsMap
                })
                .childNodes,

            rootScene  = me._buildScene(data, axisSeriesDatas, axisCategDatas),
            orthoScale = orthoAxis.scale,
            orthoZero  = orthoScale(0),
            sceneOrthoScale = orthoAxis.sceneScale({sceneVarName: 'value', nullToZero: false}),
            sceneBaseScale  = baseAxis .sceneScale({sceneVarName: 'category'}),
            barSizeRatio = plot.option('BarSizeRatio'),
            barSizeMax   = plot.option('BarSizeMax'),
            barStackedMargin = plot.option('BarStackedMargin'),
            barOrthoSizeMin = plot.option('BarOrthoSizeMin'),
            baseRange = baseAxis.scale.range(),
            bandWidth = baseRange.band,
            barStepWidth = baseRange.step,
            barMarginWidth = baseRange.margin,
            barWidth,
            reverseSeries = isVertical === isStacked, // (V && S) || (!V && !S)
            seriesCount;

        if(isStacked) {
            barWidth = bandWidth;
        } else {
            seriesCount = axisSeriesDatas.length;

            barWidth = !seriesCount      ? 0 : // Don't think this ever happens... no data, no layout?
                       seriesCount === 1 ? bandWidth :
                       (barSizeRatio * bandWidth / seriesCount);
        }

        if(barWidth > barSizeMax) { barWidth = barSizeMax; }

        me.barWidth     = barWidth;
        me.barStepWidth = barStepWidth;

        var wrapper; // bar and label wrapper
        if(me.compatVersion() <= 1) {
            /*
             * V1 Data
             * ----------
             * Stacked:   dataSet = Series x Categ values [[]...]    (type == undef -> 0)
             *
             * !Stacked:  Categ -> Series
             *            Panel dataSet = VisibleCategoriesIndexes array
             *            Bar, Label -->  padZeros( getVisibleValuesForCategIndex( . ) )
             *
             * var visibleSerIndex = this.stacked ? mark.parent.index : index,
             *     visibleCatIndex = this.stacked ? index : mark.parent.index;
             */
            wrapper = function(v1f) {
                return function(scene) {
                    var markParent = Object.create(this.parent),
                        mark = Object.create(this);
                    mark.parent = markParent;

                    var serIndex = scene.parent.childIndex(),
                        catIndex = scene.childIndex();
                    if(isStacked) {
                        markParent.index = serIndex;
                        mark.index = catIndex;
                    } else {
                        markParent.index = catIndex;
                        mark.index = serIndex;
                    }

                    return v1f.call(mark, scene.vars.value.rawValue);
                };
            };
        }

        me.pvBarPanel = new pvc.visual.Panel(me, me.pvPanel, {
                panelType:   pv.Layout.Band,
                extensionId: 'panel'
            })
            .lock('layers', rootScene.childNodes) // series -> categories
            .lockMark('values', function(seriesScene) { return seriesScene.childNodes; })
            .lockMark('orient', isVertical ? 'bottom-left' : 'left-bottom')
            .lockMark('layout', isStacked  ? 'stacked' : 'grouped')
            .lockMark('verticalMode', me._barVerticalMode())
            .lockMark('yZero',  orthoZero)
            .optionalMark('hZero', barOrthoSizeMin)
            .pvMark
            .band // categories
                .x(sceneBaseScale)
                .w(bandWidth)
                .differentialControl(me._barDifferentialControl())
            .item
                // Stacked Vertical bar charts show series from
                // top to bottom (according to the legend)
                .order(reverseSeries ? "reverse" : null)
                .h(function(scene) {
                    /* May be negative */
                    var y = sceneOrthoScale(scene);
                    return y != null ? chart.animate(0, y - orthoZero) : null;
                })
                .w(barWidth)
                .horizontalRatio(barSizeRatio)
                .verticalMargin(barStackedMargin)
            .end;

        // When bars or the spacing are too thin,
        // with no antialias, they each show with a different width.
        var widthNeedsAntialias = barWidth <= 4 || barMarginWidth < 2;

        var pvBar = this.pvBar = new pvc.visual.Bar(me, me.pvBarPanel.item, {
                extensionId: 'bar',
                freePosition: true,
                wrapper:      wrapper
            })
            .lockDimensions()
            .optional('visible', function(scene) { return scene.getValue() != null; })
            .pvMark
            .antialias(function(scene) {
                if(widthNeedsAntialias) return true;

                // Height needs antialias?
                var y = sceneOrthoScale(scene),
                    h = y == null ? 0 : Math.abs(y - orthoZero);
                return h < 1e-8;
            });

        if(plot.option('OverflowMarkersVisible')) {
            this._addOverflowMarkers(wrapper);
        }

        var label = pvc.visual.ValueLabel.maybeCreate(me, pvBar, {wrapper: wrapper});
        if(label) {
            var labelBarOrthoLen;
            if(label.hideOrTrimOverflowed) {
                labelBarOrthoLen = bandWidth;
                if(!isStacked && seriesCount > 1) labelBarOrthoLen /= seriesCount;
            }

            me.pvBarLabel = label
                .override('calcTextFitInfo', function(scene, text) {
                    // We only know how to handle certain cases:
                    // -> horizontal text, or vertical text on vertical bars
                    // -> non-negative text margins
                    // In other cases, we just let the label show...

                    var pvLabel = this.pvMark,
                        tm = pvLabel.textMargin();

                    if(tm < -1e-6) return;

                    var a = pvLabel.textAngle(),
                        sinAngle    = Math.sin(a),
                        isHorizText = Math.abs(sinAngle) < 1e-6,
                        isVertiText = !isHorizText && Math.abs(Math.cos(a)) < 1e-6;

                    if(!isHorizText && !(isVertiText && isVertical)) return;

                    // Supported Cases

                    var h  = pvBar.height(),
                        w  = pvBar.width (),
                        ml = isVertical ? h : w, // main length
                        al = isVertical ? w : h, // across length

                        m  = pv.Text.measure(text, pvLabel.font()),
                        th = m.height * 0.75, // tight text bounding box
                        tw = m.width,

                        // the name of the anchor (its evaluated in the anchored mark)
                        va = pvLabel.name(),
                        tb = pvLabel.textBaseline(),
                        ta = pvLabel.textAlign(),
                        isVaCenter = va === 'center',
                        hide = false,
                        twMax, isInside, isTaCenter;

                    // Vertical - Column
                    if(isVertical) {
                        if(isHorizText) {
                            // Is INSIDE if:
                            // a) at bar center or
                            // b) both top or bottom sides connected
                            isInside = isVaCenter || va === tb;

                            // When OUTSIDE, not supported after all.
                            if(!isInside) return;

                            // When INSIDE, text is only hidden based on text height,
                            //  and is free to overflow horizontally.

                            // Doesn't Fit along Main direction?
                            hide |= (!isVaCenter || tb === 'middle'
                                ? th + 2*tm > ml
                                : th +   tm > ml / 2);
                        } else {
                            // Vertical Bar and Vertical Text

                            // At least 1em, or nothing can be shown...
                            hide |= (ml < th);

                            isTaCenter = ta === 'center';

                            // Is considered INSIDE if:
                            // a) at bar center or
                            // b) sinAngle >= 0 and (text-left with bar-top    or text-right with bar-bottom)
                            // c) sinAngle <  0 and (text-left with bar-bottom or text-right with bar-top   )
                            isInside = isVaCenter;
                            if(!isInside && !isTaCenter) {
                                if(sinAngle >= 1e-6) // 90 degrees
                                    isInside = ta === 'left' ? va === 'top'    : va === 'bottom';
                                else // -90 degrees
                                    isInside = ta === 'left' ? va === 'bottom' : va === 'top';
                            }

                            // When "inside", clip in both directions.
                            if(isInside) {
                                twMax = !isVaCenter || isTaCenter
                                    ? ml - 2*tm
                                    : (ml - tm) / 2;

                                hide |=
                                    // Doesn't Fit along Across Direction?
                                    (tb === 'middle' ? th > al : th > al / 2) ||

                                    // Doesn't Fit along Main Direction?
                                    (this.hideOverflowed && tw > twMax);

                                // OUTSIDE
                            } else {
                                hide |= (th >= Math.max(al, labelBarOrthoLen));
                            }
                        }
                    } else {
                        // Horizontal Bar and Horizontal Text

                        // At least 1em, or nothing can be shown...
                        hide |= (ml < th);

                        // Is inside if:
                        // a) at bar center or
                        // b) both left or right sides connected
                        isInside = isVaCenter || va === ta;

                        // When "inside", clip in both directions.
                        if(isInside) {
                            twMax = !isVaCenter || ta === 'center'
                                ? ml - 2*tm
                                : (ml - tm) / 2;

                            hide |=
                                // Doesn't Fit along Across Direction?
                                (tb === 'middle' ? th > al : th > al / 2) ||

                                // Doesn't Fit along Main direction?
                                (this.hideOverflowed && tw > twMax);

                        } else {
                            // When "outside", clip vertically.
                            hide |= (th >= Math.max(al, labelBarOrthoLen));
                        }
                    }

                    return {
                        hide: hide,
                        widthMax: twMax
                    };
                })
                .pvMark;
        }
    },

    /**
     * Called to obtain the bar verticalMode property value.
     * If it returns a function,
     *
     * that function will be called once.
     * @virtual
     */
    _barVerticalMode: function() {
        return this.plot.option('ValuesNormalized') ? 'expand' : null;
    },

    /**
     * Called to obtain the bar differentialControl property value.
     * If it returns a function,
     * that function will be called once per category,
     * on the first series.
     * @virtual
     */
    _barDifferentialControl: function() {
        return null;
    },

    _getV1Datum: function(scene) {
        // Ensure V1 tooltip function compatibility
        var datum = scene.datum;
        if(datum) {
            var datumEx = Object.create(datum);
            datumEx.percent = scene.vars.value.percent;
            datum = datumEx;
        }

        return datum;
    },

    /**
     * Determines if overflow should be hidden.
     *
     * To cope with the way bars are rendered,
     * this implementation additionally hides panel overflow if
     * the plot is not stacked and the "ortho" axis has a `false` `OriginIsZero` option.
     *
     * Note that bars are always rendered from `0` to the point's value.
     *
     * @override
     * @return {boolean} `true` to hide overflow, `false` otherwise.
     */
    _guessHideOverflow: function() {
        return this.base() || (!this.stacked && !this.axes.ortho.option("OriginIsZero"));
    },

    _addOverflowMarkers: function(wrapper) {
        var orthoAxis = this.axes.ortho,
            originIsZero = this.stacked || orthoAxis.option('OriginIsZero');

        if(!originIsZero || orthoAxis.option('FixedMax') != null)
            this.pvOverflowMarker = this._addOverflowMarker(false, orthoAxis.scale, wrapper);

        if(!originIsZero || orthoAxis.option('FixedMin') != null)
            this.pvUnderflowMarker = this._addOverflowMarker(true, orthoAxis.scale, wrapper);
    },

    _addOverflowMarker: function(isMin, orthoScale, wrapper) {
        /* NOTE: pv.Bar is not a panel,
         * and as such markers will be children of bar's parent,
         * yet have bar's anchor as a prototype.
         */

        /* The general overflow marker visibility rule is something like:
         *
         * "Show the overflow marker if the "value" end of the bar is not visible."
         *
         *  max/top overflow
         *  ----------------
         *  a) botPos   >= topBound (whatever is the "value" end)
         *  b) valuePos > topBound
         *
         *  min/bottom overflow
         *  -------------------
         *  d) topPos   <= botBound (whatever is the "value" end)
         *  e) valuePos <  botBound
         *
         * +*+ is the value end
         * +0+ is the 0 end
         *  ^  max overflow marker
         *  v  min overflow marker
         *
         *     +*+
         *     |a|      +0+
         *     |b|      |a|                     +0+
         *     +0+      |b|    +*+   +0+        |a|
         *              +*+    |b|   | |        | |
         * +-------------------| |---| |--+*+---+*+--------- max/top ortho bound
         *      ^        ^     |^|   +*+  | |    ^
         *         +-+         +0+        +0+
         *         | |
         *         +-+               +0+             +0+
         *                v      v   |v|   +*+   v   | |
         * +-------------------------| |---| |--+*+--+*+---- min/bottom ortho bound
         *                           |e|   | |  |d|
         *               +0+    +*+  +*+   +0+  | |
         *               |d|    |d|             +0+
         *               |e|    |e|
         * ^             +*+    +0+
         * |
         * |
         * +- 0 ortho position
         */
        var isVertical = this.isOrientationVertical(),
            a_bottom = isVertical ? "bottom" : "left",
            a_top    = this.anchorOpposite(a_bottom),
            a_height = this.anchorOrthoLength(a_bottom),
            a_width  = this.anchorLength(a_bottom),
            orthoSizeMinHalf = this.plot.option('BarOrthoSizeMin') / 2,
            paddings = this._layoutInfo.paddings,
            botBound = orthoScale.min - paddings[a_bottom],
            topBound = orthoScale.max + paddings[a_top],
            orthoBound = isMin ? botBound : topBound,
            angle;

        // 0 degrees
        //  /\
        // /__\
        //
        if(!isMin) {
            angle = isVertical ? Math.PI: -Math.PI/2;
        } else {
            angle = isVertical ? 0: Math.PI/2;
        }

        return new pvc.visual.Dot(
            this,
            this.pvBar.anchor('center'),
            {
                noSelect:      true,
                noHover:       true,
                noClick:       true,
                noDoubleClick: true,
                noTooltip:     false,
                freePosition:  true,
                extensionId:   isMin ? 'underflowMarker' : 'overflowMarker',
                wrapper:       wrapper
            })
            .intercept('visible', function(scene) {
                var visible = this.delegateExtension();
                if(visible !== undefined && !visible) return false;

                var value = scene.vars.value.value;
                if(value == null) return false;

                var targetInstance = this.pvMark.scene.target[this.pvMark.index],
                    // Bottom-end and top-end positions of the bar
                    botPos   = targetInstance[a_bottom],
                    topPos   = botPos + targetInstance[a_height],
                    valuePos = value < 0 ? botPos : topPos,
                    hasOverflow = isMin
                        ? (topPos <= botBound || valuePos < botBound)
                        : (botPos >= topBound || valuePos > topBound);

                if(!hasOverflow) return false;
                if(value !== 0)  return true;

                // When value is 0, barOrthoSizeMin kicks in, half placed in each quadrant.
                // If orthoFixedMin is 0, for example, we then detect that half is hidden.
                // We don't want to show overflow markers for half-hidden zero markers.
                // So, a 0-valued bar has a hidden tolerance of barOrthoSizeMin/2 pixels.
                var orthoOverflow = isMin ? (botBound - topPos) : (topPos - topBound);
                return orthoOverflow > orthoSizeMinHalf;
            })
            .pvMark
            .shape("triangle")
            .shapeRadius(function() {
                return Math.min(
                        Math.sqrt(10),
                        this.scene.target[this.index][a_width] / 2);
            })
            .shapeAngle(angle)
            .lineWidth(1.5)
            .strokeStyle("red")
            .fillStyle("white")
            [a_top   ](null)
            [a_bottom](function() {
                return orthoBound + (isMin ? 1 : -1) * (this.shapeRadius() + 2);
            });
    },

    /**
     * Renders this.pvPanel - the parent of the marks that are affected by selection changes.
     * @override
     */
    renderInteractive: function() {
        this.pvPanel.render();
    },

    _buildSceneCore: function(data, axisSeriesDatas, axisCategDatas) {

        var rootScene  = new pvc.visual.Scene(null, {panel: this, source: data});

        var valueVarHelper = new pvc.visual.RoleVarHelper(rootScene, 'value', this.visualRoles.value, {hasPercentSubVar: this.stacked});
        var colorVarHelper = new pvc.visual.RoleVarHelper(rootScene, 'color', this.visualRoles.color);

        axisSeriesDatas.forEach(createSeriesScene);

        return rootScene;

        function createSeriesScene(axisSeriesData) {
            /* Create series scene */
            var seriesScene = new pvc.visual.Scene(rootScene, {source: axisSeriesData});
            var seriesKey = axisSeriesData.key;

            seriesScene.vars.series = pvc_ValueLabelVar.fromComplex(axisSeriesData);

            colorVarHelper.onNewScene(seriesScene, /* isLeaf */ false);

            axisCategDatas.forEach(function(axisCategData) {

                var categData = data.child(axisCategData.key);
                var group = categData && categData.child(seriesKey);

                var scene = new pvc.visual.Scene(seriesScene, {source: group});

                var categVar = scene.vars.category = pvc_ValueLabelVar.fromComplex(categData);
                categVar.group = categData;

                valueVarHelper.onNewScene(scene, /* isLeaf */ true);
                colorVarHelper.onNewScene(scene, /* isLeaf */ true);
            });
        }
    }
});

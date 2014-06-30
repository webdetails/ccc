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
        // Register BULLET legend prototype marks
        var groupScene = this.defaultLegendGroupScene();
        if(groupScene && !groupScene.hasRenderer()) {
            var colorAxis  = groupScene.colorAxis;
            var drawLine   = colorAxis.option('LegendDrawLine');
            var drawMarker = !drawLine || colorAxis.option('LegendDrawMarker');
            if(drawMarker) {
                var keyArgs = {
                    drawMarker:    true,
                    markerShape:   colorAxis.option('LegendShape'),
                    drawRule:      drawLine,
                    markerPvProto: new pv_Mark()
                };

                this.extend(keyArgs.markerPvProto, '', {constOnly: true}); // '' => bar itself

                groupScene.renderer(
                    new pvc.visual.legend.BulletItemDefaultRenderer(keyArgs));
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
            // Maintaining order requires basing the operation on a data with nulls still in it.
            // `data` may not have nulls anymore.
            axisSeriesDatas = me.visualRoles.series.flatten(
                me.partData(),
                {visible: true, isNull: chart.options.ignoreNulls ? false : null})
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
            .end
            ;

        // When bars or the spacing are too thin,
        // with no antialias, they each show with a different width.
        var widthNeedsAntialias = barWidth <= 4 || barMarginWidth < 2;

        var pvBar = this.pvBar = new pvc.visual.Bar(me, me.pvBarPanel.item, {
                extensionId: 'bar',
                freePosition: true,
                wrapper:      wrapper
            })
            .lockDimensions()
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
        return null;
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

    _addOverflowMarkers: function(wrapper) {
        var orthoAxis = this.axes.ortho;
        if(orthoAxis.option('FixedMax') != null)
            this.pvOverflowMarker = this._addOverflowMarker(false, orthoAxis.scale, wrapper);

        if(orthoAxis.option('FixedMin') != null)
            this.pvUnderflowMarker = this._addOverflowMarker(true, orthoAxis.scale, wrapper);
    },

    _addOverflowMarker: function(isMin, orthoScale, wrapper) {
        /* NOTE: pv.Bar is not a panel,
         * and as such markers will be children of bar's parent,
         * yet have bar's anchor as a prototype.
         */

        var isVertical = this.isOrientationVertical(),
            a_bottom = isVertical ? "bottom" : "left",
            a_top    = this.anchorOpposite(a_bottom),
            a_height = this.anchorOrthoLength(a_bottom),
            a_width  = this.anchorLength(a_bottom),
            paddings = this._layoutInfo.paddings,
            rOrthoBound = isMin ?
                          (orthoScale.min - paddings[a_bottom]) :
                          (orthoScale.max + paddings[a_top]),
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
                noTooltip:     true,
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

                    // Where is the position of the max of the bar?
                    orthoMaxPos = targetInstance[a_bottom] +
                                  (value > 0 ? targetInstance[a_height] : 0);

                return isMin ? (orthoMaxPos < rOrthoBound) : (orthoMaxPos > rOrthoBound);
            })
            .lock(a_top, null)
            .lock('shapeSize')
            .pvMark
            .shape("triangle")
            .shapeRadius(function() {
                // this instanceof pvMark
                return Math.min(
                        Math.sqrt(10),
                        this.scene.target[this.index][a_width] / 2);
            })
            .shapeAngle(angle)
            .lineWidth(1.5)
            .strokeStyle("red")
            .fillStyle("white")
            [a_bottom](function() {
                return rOrthoBound + (isMin ? 1 : -1) * (this.shapeRadius() + 2);
            })
            ;
    },

    /**
     * Renders this.pvPanel - the parent of the marks that are affected by selection changes.
     * @override
     */
    renderInteractive: function() {
        this.pvPanel.render();
    },

    _buildScene: function(data, axisSeriesDatas, axisCategDatas) {
        var rootScene  = new pvc.visual.Scene(null, {panel: this, source: data}),
            roles = this.visualRoles,
            valueVarHelper = new pvc.visual.RoleVarHelper(rootScene, 'value', roles.value, {hasPercentSubVar: this.stacked}),
            colorVarHelper = new pvc.visual.RoleVarHelper(rootScene, 'color', roles.color);

        // Create starting scene tree
        axisSeriesDatas.forEach(createSeriesScene);

        return rootScene;

        function createSeriesScene(axisSeriesData) {
            /* Create series scene */
            var seriesScene = new pvc.visual.Scene(rootScene, {source: axisSeriesData}),
                seriesKey   = axisSeriesData.key;

            seriesScene.vars.series = pvc_ValueLabelVar.fromComplex(axisSeriesData);

            colorVarHelper.onNewScene(seriesScene, /* isLeaf */ false);

            axisCategDatas.forEach(function(axisCategData) {
                /* Create leaf scene */
                var categData = data.child(axisCategData.key),
                    group = categData && categData.child(seriesKey),
                    scene = new pvc.visual.Scene(seriesScene, {source: group}),
                    categVar = scene.vars.category =
                        pvc_ValueLabelVar.fromComplex(categData);

                categVar.group = categData;

                valueVarHelper.onNewScene(scene, /* isLeaf */ true);
                colorVarHelper.onNewScene(scene, /* isLeaf */ true);
            });
        }
    }
});
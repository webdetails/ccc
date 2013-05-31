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

    _creating: function(){
        // Register BULLET legend prototype marks
        var groupScene = this.defaultVisibleBulletGroupScene();
        if(groupScene && !groupScene.hasRenderer()){
            var colorAxis  = groupScene.colorAxis;
            var drawLine   = colorAxis.option('LegendDrawLine');
            var drawMarker = !drawLine || colorAxis.option('LegendDrawMarker');
            if(drawMarker){
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
    _createCore: function(){
        this.base();
        var me = this,
            chart = me.chart,
            plot = me.plot,
            isStacked = !!me.stacked,
            isVertical = me.isOrientationVertical(),
            data       = me.visibleData({ignoreNulls: false}), // shared "categ then series" grouped data
            seriesData = me.visualRoles.series.flatten(data),
            rootScene  = me._buildScene(data, seriesData),
            orthoAxis  = me.axes.ortho,
            baseAxis   = me.axes.base,
            orthoScale = orthoAxis.scale,
            orthoZero  = orthoScale(0),
            sceneOrthoScale = orthoAxis.sceneScale({sceneVarName: 'value', nullToZero: false}),
            sceneBaseScale  = baseAxis .sceneScale({sceneVarName: 'category'}),
            barSizeRatio = plot.option('BarSizeRatio'),
            barSizeMax   = plot.option('BarSizeMax'),
            barStackedMargin = plot.option('BarStackedMargin'),
            baseRange = baseAxis.scale.range(),
            bandWidth = baseRange.band,
            barStepWidth = baseRange.step,
            barWidth,
            reverseSeries = isVertical === isStacked; // (V && S) || (!V && !S)

        if(isStacked){
            barWidth = bandWidth;
        } else {
            var S = seriesData.childCount();
            barWidth = S > 0 ? (bandWidth * barSizeRatio / S) : 0;
        }

        if (barWidth > barSizeMax) {
            barWidth = barSizeMax;
        }

        me.barWidth     = barWidth;
        me.barStepWidth = barStepWidth;

        var wrapper; // bar and label wrapper
        if(me.compatVersion() <= 1){
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
            wrapper = function(v1f){
                return function(scene){
                    var markParent = Object.create(this.parent);
                    var mark = Object.create(this);
                    mark.parent = markParent;

                    var serIndex = scene.parent.childIndex();
                    var catIndex = scene.childIndex();

                    if(isStacked){
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
            .lockMark('values', function(seriesScene){ return seriesScene.childNodes; })
            .lockMark('orient', isVertical ? 'bottom-left' : 'left-bottom')
            .lockMark('layout', isStacked  ? 'stacked' : 'grouped')
            .lockMark('verticalMode', me._barVerticalMode())
            .lockMark('yZero',  orthoZero)
            .pvMark
            .band // categories
                .x(sceneBaseScale)
                .w(bandWidth)
                .differentialControl(me._barDifferentialControl())
            .item
                // Stacked Vertical bar charts show series from
                // top to bottom (according to the legend)
                .order(reverseSeries ? "reverse" : null)
                .h(function(scene){
                    /* May be negative */
                    var y = sceneOrthoScale(scene);
                    return y != null ? chart.animate(0, y - orthoZero) : null;
                })
                .w(barWidth)
                .horizontalRatio(barSizeRatio)
                .verticalMargin(barStackedMargin)
            .end
            ;

        this.pvBar = new pvc.visual.Bar(me, me.pvBarPanel.item, {
                extensionId: '', // with the prefix, it gets 'bar_'
                freePosition: true,
                wrapper:      wrapper
            })
            .lockDimensions()
            .pvMark
            .antialias(false)
            ;

        if(plot.option('OverflowMarkersVisible')){
            this._addOverflowMarkers(wrapper);
        }

        var label = pvc.visual.ValueLabel.maybeCreate(me, me.pvBar, {wrapper: wrapper});
        if(label){
            me.pvBarLabel = label.pvMark
                .visible(function() { // no space for text otherwise
                    // this === pvMark
                    var length = this.scene.target[this.index][isVertical ? 'height' : 'width'];

                    // Too small a bar to show any value?
                    return length >= 4;
                });
        }
    },

    /**
     * Called to obtain the bar verticalMode property value.
     * If it returns a function,
     *
     * that function will be called once.
     * @virtual
     */
    _barVerticalMode: function(){
        return null;
    },

    /**
     * Called to obtain the bar differentialControl property value.
     * If it returns a function,
     * that function will be called once per category,
     * on the first series.
     * @virtual
     */
    _barDifferentialControl: function(){
        return null;
    },

    _getV1Datum: function(scene){
        // Ensure V1 tooltip function compatibility
        var datum = scene.datum;
        if(datum){
            var datumEx = Object.create(datum);
            datumEx.percent = scene.vars.value.percent;
            datum = datumEx;
        }

        return datum;
    },

    _addOverflowMarkers: function(wrapper){
        var orthoAxis = this.axes.ortho;
        if(orthoAxis.option('FixedMax') != null){
            this.pvOverflowMarker = this._addOverflowMarker(false, orthoAxis.scale, wrapper);
        }

        if(orthoAxis.option('FixedMin') != null){
            this.pvUnderflowMarker = this._addOverflowMarker(true, orthoAxis.scale, wrapper);
        }
    },

    _addOverflowMarker: function(isMin, orthoScale, wrapper){
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
        if(!isMin){
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
            .intercept('visible', function(scene){
                var visible = this.delegateExtension();
                if(visible !== undefined && !visible){
                    return false;
                }

                var value = scene.vars.value.value;
                if(value == null){
                    return false;
                }

                var targetInstance = this.pvMark.scene.target[this.index];

                // Where is the position of the max of the bar?
                var orthoMaxPos = targetInstance[a_bottom] +
                                  (value > 0 ? targetInstance[a_height] : 0);
                return isMin ?
                        (orthoMaxPos < rOrthoBound) :
                        (orthoMaxPos > rOrthoBound);
            })
            .lock(a_top, null)
            .lock('shapeSize')
            .pvMark
            .shape("triangle")
            .shapeRadius(function(){
                return Math.min(
                        Math.sqrt(10),
                        this.scene.target[this.index][a_width] / 2);
            })
            .shapeAngle(angle)
            .lineWidth(1.5)
            .strokeStyle("red")
            .fillStyle("white")
            [a_bottom](function(){
                return rOrthoBound + (isMin ? 1 : -1) * (this.shapeRadius() + 2);
            })
            ;
    },

    /**
     * Renders this.pvPanel - the parent of the marks that are affected by selection changes.
     * @override
     */
    renderInteractive: function(){
        this.pvPanel.render();
    },

    _buildScene: function(data, seriesData){
        var rootScene  = new pvc.visual.Scene(null, {panel: this, source: data});

        var categDatas = data.childNodes;
        var roles = this.visualRoles;
        var valueVarHelper = new pvc.visual.RoleVarHelper(rootScene, roles.value, {roleVar: 'value', hasPercentSubVar: this.stacked});
        var colorVarHelper = new pvc.visual.RoleVarHelper(rootScene, roles.color, {roleVar: 'color'});

        /**
         * Create starting scene tree
         */
        seriesData
            .children()
            .each(createSeriesScene);

        return rootScene;

        function createSeriesScene(seriesData1){
            /* Create series scene */
            var seriesScene = new pvc.visual.Scene(rootScene, {source: seriesData1}),
                seriesKey   = seriesData1.key;

            seriesScene.vars.series = pvc_ValueLabelVar.fromComplex(seriesData1);

            colorVarHelper.onNewScene(seriesScene, /* isLeaf */ false);

            categDatas.forEach(function(categData1){
                /* Create leaf scene */
                var group = data.child(categData1.key).child(seriesKey),
                    scene = new pvc.visual.Scene(seriesScene, {source: group});

                var categVar =
                    scene.vars.category = pvc_ValueLabelVar.fromComplex(categData1);

                categVar.group = categData1;

                valueVarHelper.onNewScene(scene, /* isLeaf */ true);
                colorVarHelper.onNewScene(scene, /* isLeaf */ true);
            });
        }
    }
});
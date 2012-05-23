
/**
 * Bar Abstract Panel.
 * The base panel class for bar charts.
 * 
 * Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide bar value. Default: false
 * <i>barSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by bars. Default: 0.9 (90%)
 * <i>maxBarSize</i> - Maximum size (width) of a bar in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 * <i>chart_</i> - for the main chart Panel
 * <i>bar_</i> - for the actual bar
 * <i>barPanel_</i> - for the panel where the bars sit
 * <i>barLabel_</i> - for the main bar label
 */
pvc.BarAbstractPanel = pvc.CartesianAbstractPanel.extend({
    
    pvBar: null,
    pvBarLabel: null,
    pvCategoryPanel: null,
    pvSecondLine: null,
    pvSecondDot: null,

    data: null,

    barSizeRatio: 0.9,
    maxBarSize: 200,
    showValues: true,
    barWidth: null,
    barStepWidth: null,
    _linePanel: null,

    constructor: function(chart, parent, options){
        this.base(chart, parent, options);

        // Cache
        options = this.chart.options;
        this.stacked = options.stacked;
    },

    /**
     * @override
     */
    _createCore: function(){
        this.base();
         
        var chart = this.chart,
            options = chart.options,
            isStacked = !!this.stacked,
            isVertical = this.isOrientationVertical();

        var data = this._getVisibleData(), // shared "categ then series" grouped data
            seriesData = chart._serRole.flatten(data),
            rootScene = this._buildScene(data, seriesData)
            ;

        var orthoScale = chart.axes.ortho.scale,
            orthoZero  = orthoScale(0),
            sceneOrthoScale = chart.axes.ortho.sceneScale(),
            
            bandWidth = chart.axes.base.scale.range().band,
            barStepWidth = chart.axes.base.scale.range().step,
            barWidth,

            reverseSeries = isVertical === isStacked // (V && S) || (!V && !S)
            ;

        if(isStacked){
            barWidth = bandWidth;
        } else {
            var S = seriesData.childCount();
            barWidth = S > 0 ? (bandWidth * this.barSizeRatio / S) : 0;
        }
        
        if (barWidth > this.maxBarSize) {
            barWidth = this.maxBarSize;
        }

        this.barWidth  = barWidth;
        this.barStepWidth = barStepWidth;
        
        this.pvBarPanel = this.pvPanel.add(pv.Layout.Band)
            .layers(rootScene.childNodes) // series -> categories
            .values(function(seriesScene){ return seriesScene.childNodes; })
            .orient(isVertical ? 'bottom-left' : 'left-bottom')
            .layout(isStacked  ? 'stacked' : 'grouped')
            .verticalMode(this._barVerticalMode())
            .yZero(orthoZero)
            .band // categories
                .x(chart.axes.base.sceneScale())
                .w(bandWidth)
                .differentialControl(this._barDifferentialControl())
            .item
                // Stacked Vertical bar charts show series from
                // top to bottom (according to the legend)
                .order(reverseSeries ? "reverse" : null)
                .h(function(scene){
                    /* May be negative */
                    return chart.animate(0, sceneOrthoScale(scene) - orthoZero);
                })
                .w(barWidth)
                .horizontalRatio(this.barSizeRatio)
                .verticalMargin(options.barStackedMargin || 0)
            .end
            ;

        this.pvBar = new pvc.visual.Bar(this, this.pvBarPanel.item, {
                extensionId: 'bar',
                freePosition: true
            })
            .lockDimensions()
            .pvMark
            ;

        this._addOverflowMarkers();
        
        if(this.showValues){
            this.pvBarLabel = this.pvBar.anchor(this.valuesAnchor || 'center')
                .add(pv.Label)
                .localProperty('_valueAct')
                ._valueAct(function(scene){
                    return options.showValuePercentage ?
                            scene.acts.value.percent :
                            scene.acts.value;
                })
                .visible(function() { //no space for text otherwise
                    var length = this.scene.target[this.index][isVertical ? 'height' : 'width'];
                    // Too small a bar to show any value?
                    return length >= 4;
                })
                .text(function(){
                    return this._valueAct().label;
                });
        }
    },

    /**
     * Called to obtain the bar verticalMode property value.
     * If it returns a function,
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
    
    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        // Extend bar and barPanel
        this.extend(this.pvBarPanel, "barPanel_");
        this.extend(this.pvBar, "bar_");

        this.extend(this.pvUnderflowMarker, "barUnderflowMarker_");
        this.extend(this.pvOverflowMarker,  "barOverflowMarker_");

        this.extend(this.pvBarLabel, "barLabel_");
        
        if(this._linePanel){
            this.extend(this._linePanel.pvLine, "barSecondLine_");
            this.extend(this._linePanel.pvDot,  "barSecondDot_" );
        }
    },

    _addOverflowMarkers: function(){
        var orthoAxis = this.chart.axes.ortho;
        if(orthoAxis.option('FixedMax') != null){
            this.pvOverflowMarker = this._addOverflowMarker(false, orthoAxis.scale);
        }

        if(orthoAxis.option('FixedMin') != null){
            this.pvUnderflowMarker = this._addOverflowMarker(true, orthoAxis.scale);
        }
    },

    _addOverflowMarker: function(isMin, orthoScale){
        /* NOTE: pv.Bar is not a panel,
         * and as such markers will be children of bar's parent,
         * yet have bar's anchor as a prototype.
         */

        var myself = this,
            isVertical = this.isOrientationVertical(),
            orthoProp = isVertical ? "bottom" : "left",
            lengthProp = myself.anchorOrthoLength(orthoProp),
            orthoLengthProp = myself.anchorLength(orthoProp),
            rOrthoBound = isMin ?
                        (orthoScale.min - orthoScale.offset) :
                        (orthoScale.max + orthoScale.offset),
        
            angle;

        if(!isMin){
            angle = isVertical ? Math.PI: -Math.PI/2;
        } else {
            angle = isVertical ? 0: Math.PI/2;
        }
        
        return this.pvBar.anchor('center').add(pv.Dot)
            .visible(function(scene){
                var value = scene.acts.value.value;
                if(value == null){
                    return false;
                }

                var targetInstance = this.scene.target[this.index];
                // Where is the position of the max of the bar??
                var orthoMaxPos = targetInstance[orthoProp] +
                                  (value > 0 ? targetInstance[lengthProp] : 0);
                return isMin ?
                        (orthoMaxPos < rOrthoBound) :
                        (orthoMaxPos > rOrthoBound);
            })
            .shape("triangle")
            .lock('shapeSize')
            .shapeRadius(function(){
                return Math.min(
                        Math.sqrt(10),
                        this.scene.target[this.index][orthoLengthProp] / 2);
            })
            .shapeAngle(angle)
            .lineWidth(1.5)
            .strokeStyle("red")
            .fillStyle("white")
            [orthoProp](function(){
                return rOrthoBound + (isMin ? 1 : -1) * (this.shapeRadius() + 2);
            })
            [this.anchorOpposite(orthoProp)](null)
            ;
    },

    /**
     * Renders this.pvPanel - the parent of the marks that are affected by selection changes.
     * @override
     */
    _renderInteractive: function(){
        this.pvPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @override
     */
    _getSignums: function(){
        return [this.pvBar];
    },

    _buildScene: function(data, seriesData){
        var rootScene  = new pvc.visual.Scene(null, {panel: this, group: data}),
            categDatas = data._children;

        /**
         * Create starting scene tree
         */
        seriesData
            .children()
            .each(createSeriesScene, this);

        return rootScene;

        function createSeriesScene(seriesData1){
            /* Create series scene */
            var seriesScene = new pvc.visual.Scene(rootScene, {group: seriesData1}),
                seriesKey   = seriesData1.key;

            this._onNewSeriesScene(seriesScene, seriesData1);

            categDatas.forEach(function(categData1){
                /* Create leaf scene */
                var categKey = categData1.key,
                    group = data._childrenByKey[categKey]._childrenByKey[seriesKey],

                    /* If there's no group, provide, at least, a null datum */
                    datum = group ? null : createNullDatum(seriesData1, categData1),
                    scene = new pvc.visual.Scene(seriesScene, {group: group, datum: datum});

                this._onNewSeriesCategoryScene(scene, categData1, seriesData1);
            }, this);
        }

        function createNullDatum(serData1, catData1) {
            // Create a null datum with col and row coordinate atoms
            var atoms = def.array.append(
                            def.own(serData1.atoms),
                            def.own(catData1.atoms));

            return new pvc.data.Datum(data, atoms, true);
        }
    },

    _onNewSeriesScene: function(seriesScene, seriesData1){
        seriesScene.acts.series = {
            value: seriesData1.value,
            label: seriesData1.label
        };
    },

    _onNewSeriesCategoryScene: function(categScene, categData1, seriesData1){
        categScene.acts.category = {
            value: categData1.value,
            label: categData1.label,
            group: categData1
        };

        var chart = this.chart,
            valueDim = categScene.group ?
                            categScene
                                .group
                                .dimensions(chart._valueDim.name) :
                            null;

        var value = valueDim ? valueDim.sum({visible: true}) : null;

        var valueAct = categScene.acts.value = {
            value:    value,
            label:    chart._valueDim.format(value)
        };

        // TODO: Percent formatting?
        if(chart.options.showValuePercentage) {
            if(value == null){
                valueAct.percent = {
                    value: null,
                    label: valueAct.label
                };
            } else {
                var valuePct = valueDim.percentOverParent({visible: true});
                valueAct.percent = {
                    value: valuePct,
                    label: chart.options.valueFormat.call(null, Math.round(valuePct * 100))
                };
            }
        }

        categScene.isNull = !categScene.group; // A virtual scene?
    }
});
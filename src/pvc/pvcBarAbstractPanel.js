
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
    showOverflowMarkers: true,
    
    constructor: function(chart, parent, options){
        this.base(chart, parent, options);

        // Cache
        options = this.chart.options;
        this.stacked = options.stacked;
    },
    
    _creating: function(){
        // Register BULLET legend prototype marks
        var groupScene = this.defaultVisibleBulletGroupScene();
        if(groupScene && !groupScene.hasRenderer()){
            var colorAxis  = groupScene.colorAxis;
            var drawLine   = colorAxis.option('DrawLine');
            var drawMarker = !drawLine || colorAxis.option('DrawMarker');
            if(drawMarker){
                var keyArgs = {
                    drawMarker:    true,
                    markerShape:   colorAxis.option('Shape'),
                    drawRule:      drawLine,
                    markerPvProto: new pv.Mark()
                };
                
                this.extend(keyArgs.markerPvProto, 'bar', {constOnly: true});
                
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
         
        var chart = this.chart,
            options = chart.options,
            isStacked = !!this.stacked,
            isVertical = this.isOrientationVertical();
        
        var data = this._getVisibleData(), // shared "categ then series" grouped data
            seriesData = chart._serRole.flatten(data),
            rootScene = this._buildScene(data, seriesData)
            ;

        var orthoScale = this._orthoAxis.scale,
            orthoZero  = orthoScale(0),
            sceneOrthoScale = this._orthoAxis.sceneScale({sceneVarName: 'value', nullToZero: false}),
            baseRange = this._baseAxis.scale.range(),
            bandWidth = baseRange.band,
            barStepWidth = baseRange.step,
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
        
        var wrapper;
        if(this.compatVersion() <= 1){
            wrapper = function(v1f){
                return function(scene){
                    return v1f.call(this, scene.vars.value.rawValue);
                };
            };
        }
        
        this.pvBarPanel = new pvc.visual.Panel(this, this.pvPanel, {
                panelType:   pv.Layout.Band,
                extensionId: 'barPanel'
            })
            .lock('layers', rootScene.childNodes) // series -> categories
            .lockMark('values', function(seriesScene){ return seriesScene.childNodes; })
            .lockMark('orient', isVertical ? 'bottom-left' : 'left-bottom')
            .lockMark('layout', isStacked  ? 'stacked' : 'grouped')
            .lockMark('verticalMode', this._barVerticalMode())
            .lockMark('yZero',  orthoZero)
            .pvMark
            .band // categories
                .x(this._baseAxis.sceneScale({sceneVarName: 'category'}))
                .w(bandWidth)
                .differentialControl(this._barDifferentialControl())
            .item
                // Stacked Vertical bar charts show series from
                // top to bottom (according to the legend)
                .order(reverseSeries ? "reverse" : null)
                .h(function(scene){
                    /* May be negative */
                    var h = sceneOrthoScale(scene);
                    return h != null ? chart.animate(0, h - orthoZero) : null;
                })
                .w(barWidth)
                .horizontalRatio(this.barSizeRatio)
                .verticalMargin(options.barStackedMargin || 0)
            .end
            ;
        
        this.pvBar = new pvc.visual.Bar(this, this.pvBarPanel.item, {
                extensionId: 'bar',
                freePosition: true,
                wrapper:      wrapper
            })
            .lockDimensions()
            .pvMark
            .antialias(false)
            ;

        if(this.showOverflowMarkers){
            this._addOverflowMarkers(wrapper);
        }
        
        if(this.showValues){
            this.pvBarLabel = new pvc.visual.Label(
                this, 
                this.pvBar.anchor(this.valuesAnchor || 'center'), 
                {
                    extensionId: ['barLabel', 'label'],
                    wrapper:     wrapper
                })
                .pvMark
                .visible(function() { //no space for text otherwise
                    // this === pvMark
                    var length = this.scene.target[this.index][isVertical ? 'height' : 'width'];
                    
                    // Too small a bar to show any value?
                    return length >= 4;
                })
                .text(function(scene){
                    var valueVar = options.showValuePercentage ?
                                   scene.vars.value.percent :
                                   scene.vars.value;
                    
                    return valueVar.label; 
                })
                ;
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
    
    /**
     * @override
     */
    applyExtensions: function(){

        this.base();
        
        if(this._linePanel){
            this.extend(this._linePanel.pvLine, "barSecondLine");
            this.extend(this._linePanel.pvDot,  "barSecondDot" );
        }
    },
    
    _addOverflowMarkers: function(wrapper){
        var orthoAxis = this._orthoAxis;
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
        
        var myself = this,
            isVertical = this.isOrientationVertical(),
            a_bottom = isVertical ? "bottom" : "left",
            a_top    = this.anchorOpposite(a_bottom),
            a_height = this.anchorOrthoLength(a_bottom),
            a_width  = this.anchorLength(a_bottom),
            paddings = this._layoutInfo.paddings,
            rOrthoBound = isMin ? 
                          (orthoScale.min - paddings[a_bottom]) : 
                          (orthoScale.max + paddings[a_top]),
            angle;

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
                noTooltip:    true,
                freePosition:  true,
                extensionId:   isMin ? 'barUnderflowMarker' : 'barOverflowMarker',
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

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @override
     */
    _getSelectableMarks: function(){
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
            var atoms = def.copy(def.copy({}, serData1.atoms), catData1.atoms);

            return new pvc.data.Datum(data, atoms, true);
        }
    },

    _onNewSeriesScene: function(seriesScene, seriesData1){
        seriesScene.vars.series = new pvc.visual.ValueLabelVar(
            seriesData1.value,
            seriesData1.label,
            seriesData1.rawValue);
    },

    _onNewSeriesCategoryScene: function(categScene, categData1, seriesData1){
        var categVar = categScene.vars.category = new pvc.visual.ValueLabelVar(
            categData1.value, categData1.label, categData1.rawValue);
        
        categVar.group = categData1;
        
        var chart = this.chart,
            valueDim = categScene.group ?
                            categScene
                                .group
                                .dimensions(chart._valueDim.name) :
                            null;

        var value = valueDim ? valueDim.sum({visible: true, zeroIfNone: false}) : null;

        var valueVar = 
            categScene.vars.value = new pvc.visual.ValueLabelVar(
                                    value, 
                                    chart._valueDim.format(value),
                                    value);
        
        // TODO: Percent formatting?
        if(chart.options.showValuePercentage) {
            if(value == null){
                valueVar.percent = new pvc.visual.ValueLabelVar(null, valueVar.label);
            } else {
                var valuePct = valueDim.percentOverParent({visible: true});
                
                valueVar.percent = new pvc.visual.ValueLabelVar(
                                        valuePct,
                                        chart.options.percentValueFormat.call(null, valuePct));
            }
        }

        categScene.isNull = !categScene.group; // A virtual scene?
    }
});

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
    
    _linePanel: null,
    
    barWidth:     null,
    barStepWidth: null,
    
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
                    markerPvProto: new pv.Mark()
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
         
        var chart = this.chart,
            options = chart.options,
            isStacked = !!this.stacked,
            isVertical = this.isOrientationVertical();
        
        var data = this._getVisibleData(), // shared "categ then series" grouped data
            seriesData = chart._serRole.flatten(data),
            rootScene = this._buildScene(data, seriesData)
            ;

        var orthoScale = this.axes.ortho.scale,
            orthoZero  = orthoScale(0),
            sceneOrthoScale = this.axes.ortho.sceneScale({sceneVarName: 'value', nullToZero: false}),
            barSizeRatio = this.plot.option('BarSizeRatio'),
            barSizeMax   = this.plot.option('BarSizeMax'),
            baseRange = this.axes.base.scale.range(),
            bandWidth = baseRange.band,
            barStepWidth = baseRange.step,
            barWidth,
            reverseSeries = isVertical === isStacked // (V && S) || (!V && !S)
            ;

        if(isStacked){
            barWidth = bandWidth;
        } else {
            var S = seriesData.childCount();
            barWidth = S > 0 ? (bandWidth * barSizeRatio / S) : 0;
        }
        
        if (barWidth > barSizeMax) {
            barWidth = barSizeMax;
        }

        this.barWidth     = barWidth;
        this.barStepWidth = barStepWidth;
        
        var wrapper; // bar and label wrapper
        if(this.compatVersion() <= 1){
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
        
        this.pvBarPanel = new pvc.visual.Panel(this, this.pvPanel, {
                panelType:   pv.Layout.Band,
                extensionId: 'panel'
            })
            .lock('layers', rootScene.childNodes) // series -> categories
            .lockMark('values', function(seriesScene){ return seriesScene.childNodes; })
            .lockMark('orient', isVertical ? 'bottom-left' : 'left-bottom')
            .lockMark('layout', isStacked  ? 'stacked' : 'grouped')
            .lockMark('verticalMode', this._barVerticalMode())
            .lockMark('yZero',  orthoZero)
            .pvMark
            .band // categories
                .x(this.axes.base.sceneScale({sceneVarName: 'category'}))
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
                .horizontalRatio(barSizeRatio)
                .verticalMargin(options.barStackedMargin || 0)
            .end
            ;
        
        this.pvBar = new pvc.visual.Bar(this, this.pvBarPanel.item, {
                extensionId: '', // with the prefix, it gets 'bar_'
                freePosition: true,
                wrapper:      wrapper
            })
            .lockDimensions()
            .pvMark
            .antialias(false)
            ;

        if(this.plot.option('OverflowMarkersVisible')){
            this._addOverflowMarkers(wrapper);
        }
        
        if(this.valuesVisible){
            this.pvBarLabel = new pvc.visual.Label(
                this, 
                this.pvBar.anchor(this.valuesAnchor || 'center'), 
                {
                    extensionId: 'label',
                    wrapper:     wrapper
                })
                .pvMark
                .visible(function() { //no space for text otherwise
                    // this === pvMark
                    var length = this.scene.target[this.index][isVertical ? 'height' : 'width'];
                    
                    // Too small a bar to show any value?
                    return length >= 4;
                })
                .font(this.valuesFont) // default
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

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @override
     */
    _getSelectableMarks: function(){
        return [this.pvBar];
    },

    _buildScene: function(data, seriesData){
        var rootScene  = new pvc.visual.Scene(null, {panel: this, group: data});
        var categDatas = data._children;
        var colorVarHelper = new pvc.visual.ColorVarHelper(this.chart, this.chart._colorRole);
        
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
            
            colorVarHelper.onNewScene(seriesScene, /* isLeaf */ false);
            
            categDatas.forEach(function(categData1){
                /* Create leaf scene */
                var categKey = categData1.key,
                    group = data._childrenByKey[categKey]._childrenByKey[seriesKey],
                    scene = new pvc.visual.Scene(seriesScene, {group: group});

                this._onNewSeriesCategoryScene(scene, categData1, seriesData1);
                
                colorVarHelper.onNewScene(scene, /* isLeaf */ true);
            }, this);
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

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

    var sizeRoleName = plot.option('SizeRole'); // assumed to be always defined
    roles.size = chart.visualRoles(sizeRoleName);

    this.useShapes = plot.option('UseShapes');
    this.shape     = plot.option('Shape');
    this.nullShape = plot.option('NullShape');
})
.add({
    defaultBorder:  1,
    nullBorder:     2,
    selectedBorder: 2,

    /** @override */
    _createCore: function(){
        var me = this;

        me.base();

        var cellSize = me._calcCellSize();

        var a_bottom = me.isOrientationVertical() ? "bottom" : "left";
        var a_left   = pvc.BasePanel.relativeAnchor[a_bottom];
        var a_width  = pvc.BasePanel.parallelLength[a_bottom];
        var a_height = pvc.BasePanel.orthogonalLength[a_bottom];

        /* Column and Row datas  */

        // One multi-dimension single-level data grouping
        var rowRootData = me.data.flattenBy(me.visualRoles.series, {visible: true});

        // One multi-dimensional, two-levels grouping (Series -> Categ)
        var rootScene  = me._buildScene(me.visibleData(), rowRootData, cellSize);
        var hasColor   = rootScene.isColorBound;
        var hasSize    = rootScene.isSizeBound;
        var wrapper    = me._buildSignsWrapper(rootScene);
        var isV1Compat = me.compatVersion() <= 1;
        
        var rowScale   = this.axes.base.scale;
        var colScale   = this.axes.ortho.scale;
        
        var rowStep = rowScale.range().step;
        var colStep = colScale.range().step;
        var rowStep2 = rowStep/2;
        var colStep2 = colStep/2;
        
        /* PV Panels */
        var pvRowPanel = new pvc.visual.Panel(me, me.pvPanel)
            .pvMark
            .data(rootScene.childNodes)
            [a_bottom](function(scene){ return colScale(scene.vars.series.value) - colStep2; })
            [a_height](colStep);

        /* Cell panel */
        var extensionIds = ['panel'];
        if(isV1Compat){
            extensionIds.push(''); // let access as "heatGrid_"
        }

        var keyArgs = {
            extensionId: extensionIds,
            wrapper:     wrapper
        };

        if(!me.useShapes){
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
            .lock('data', function(serScene){ return serScene.childNodes; })
            .pvMark
            .lock(a_left,  function(scene){ return rowScale(scene.vars.category.value) - rowStep2; })
            .lock(a_width, rowStep)
            .antialias(false);
            // THIS caused HUGE memory consumption and speed reduction (at least in use Shapes mode, and specially in Chrome)
            // Overflow can be important if valuesVisible=true
            //.overflow('hidden') 

        me.shapes = me.useShapes ? 
                    me._createShapesHeatMap(cellSize, wrapper, hasColor, hasSize) :
                    me._createNoShapesHeatMap(hasColor);

        
        if(me.valuesVisible && !me.valuesMask){
            me.valuesMask = me._getDefaultValuesMask(hasColor, hasSize);
        }
        
        var label = pvc.visual.ValueLabel.maybeCreate(me, me.pvHeatGrid, {wrapper: wrapper});
        if(label){
            me.pvHeatGridLabel = label.pvMark;
        }
    },

    _calcCellSize: function(){
        /* Use existing scales */
        var xScale = this.axes.x.scale;
        var yScale = this.axes.y.scale;

        /* Determine cell dimensions. */
        var w = (xScale.max - xScale.min) / xScale.domain().length;
        var h = (yScale.max - yScale.min) / yScale.domain().length;

        if (!this.isOrientationVertical()) {
            var tmp = w;
            w = h;
            h = tmp;
        }

        return {width: w, height: h};
    },

    _buildSignsWrapper: function(rootScene){
        if(this.compatVersion() > 1){
            return null;
        }

        var colorValuesBySerAndCat =
            def
            .query(rootScene.childNodes)
            .object({
                name:  function(serScene){ return '' + serScene.vars.series.value; },
                value: function(serScene){
                    return def
                        .query(serScene.childNodes)
                        .object({
                            name:  function(leafScene){ return '' + leafScene.vars.category.value; },
                            value: function(leafScene){
                                var colorVar = leafScene.vars.color;
                                return colorVar ? ('' + colorVar.value) : null;
                            }
                        });
                }
            });

        return function(v1f){

            return function(leafScene){
                var colorValuesByCat = colorValuesBySerAndCat[leafScene.vars.series.value];
                var cat = leafScene.vars.category.rawValue;

                var wrapperParent = Object.create(this.parent);
                var wrapper = Object.create(this);
                wrapper.parent = wrapperParent;

                // Previously, first panel was by cats and
                // the second (child) panel was by series
                var catIndex = leafScene.childIndex();
                var serIndex = leafScene.parent.childIndex();

                wrapperParent.index = catIndex;
                wrapper.index = serIndex;

                return v1f.call(wrapper, colorValuesByCat, cat);
            };
        };
    },

    _getDefaultValuesMask: function(hasColor, hasSize){
        // The "value" concept is mapped to one of the color or size roles, by default.
        var roles = this.visualRoles;
        var roleName = hasColor ? 'color' :
                       hasSize  ? 'size'  :
                       null;
        if(roleName){
            var valueDimName = roles[roleName].firstDimensionName();
            return "{#" + valueDimName + "}";
        }
    },

    _createNoShapesHeatMap: function(hasColor){
        var getBaseColor = this._buildGetBaseFillColor(hasColor);
        return this.pvHeatGrid
            .sign
            .override('defaultColor', function(type){
                if(type === 'stroke'){
                    return null;
                }

                return getBaseColor.call(this.pvMark, this.scene);
            })
            .override('interactiveColor', function(color, type){
                var scene = this.scene;
                if(scene.isActive) {
                    return color.alpha(0.6);
                }

                if(scene.anySelected() && !scene.isSelected()) {
                    return this.dimColor(color, type);
                }

                return this.base(color, type);
            })
            .override('dimColor', function(color/*, type*/){
                return pvc.toGrayScale(color, 0.6);
            })
            .pvMark
            .lineWidth(1.5)
            ;
    },

    _buildGetBaseFillColor: function(hasColor){
        var colorAxis = this.axes.color;
        if(hasColor){
            return colorAxis.sceneScale({sceneVarName: this.visualRoles.color.name});
        }

        var colorMissing = colorAxis && colorAxis.option('Missing');
        return def.fun.constant(colorMissing || pvc.defaultColor);
    },
            
    _createShapesHeatMap: function(cellSize, wrapper, hasColor, hasSize){
        var me = this;

        /* SIZE */
        var areaRange = me._calcDotAreaRange(cellSize);
        if(hasSize){
             me.axes.size.setScaleRange(areaRange);
        }

        // Dot Sign
        var keyArgs = {
            extensionId: 'dot',
            freePosition: true,
            activeSeriesAware: false,
            //noHover:      false,
            wrapper:      wrapper,
            tooltipArgs:  me._buildShapesTooltipArgs(hasColor, hasSize)
        };
        
        var pvDot = new pvc.visual.DotSizeColor(me, me.pvHeatGrid, keyArgs)
            .override('dimColor', function(color/*, type*/){
                return pvc.toGrayScale(color, 0.6);
            })
            .pvMark
            .lock('shapeAngle'); // TODO - rotation of shapes can cause them to not fit the calculated cell. Would have to improve the radius calculation code.
            
        if(!hasSize){
            pvDot.sign.override('defaultSize', def.fun.constant(areaRange.max));
        }
        
        return pvDot;
    },

    _calcDotAreaRange: function(cellSize){
        var w = cellSize.width;
        var h = cellSize.height;

        var maxRadius = Math.min(w, h) / 2;

        if(this.shape === 'diamond'){
            // Protovis draws diamonds inscribed on
            // a square with half-side radius*Math.SQRT2
            // (so that diamonds just look like a rotated square)
            // For the height of the diamond not to exceed the cell size
            // we compensate that factor here.
            maxRadius /= Math.SQRT2;
        }

        // Small margin
        maxRadius -= 2;

        var maxArea  = def.sqr(maxRadius), // apparently treats as square area even if circle, triangle is different
            minArea  = 12,
            areaSpan = maxArea - minArea;

        if(areaSpan <= 1){
            // Very little space
            // Rescue Mode - show *something*
            maxArea = Math.max(maxArea, 2);
            minArea = 1;
            areaSpan = maxArea - minArea;

            if(pvc.debug >= 2){
                this._warn("Using rescue mode dot area calculation due to insufficient space.");
            }
        }

        //var missingArea = minArea + areaSpan * 0.2; // 20% size

        return {
            min:  minArea,
            max:  maxArea,
            span: areaSpan
        };
    },

    _buildShapesTooltipArgs: function(hasColor, hasSize){
        var chart = this.chart;

        if(this.compatVersion <= 1 && chart._tooltipEnabled){
            var options = chart.options;
            var customTooltip = options.customTooltip;
            if(!customTooltip){
                customTooltip = function(s,c,d){
                    if(d != null && d[0] !== undefined){
                        return d.join(', ');
                    }
                    return d;
                };
            }

            var roles   = this.visualRoles;
            var seriesDimsNames = roles.series.grouping.dimensionNames();
            var categDimsNames  = roles.category.grouping.dimensionNames();

            // For use in keyArgs.tooltipArgs
            return {
                buildTooltip: options.isMultiValued ?
                    function(context){
                        var group = context.scene.group;
                        var s = pvc.data.Complex.values(group, seriesDimsNames);
                        var c = pvc.data.Complex.values(group, categDimsNames);

                        var d = [];
                        var vars = context.scene.vars;
                        if(hasSize){
                            d[options.sizeValIdx  || 0] = vars.size.value;
                        }
                        if(hasColor){
                            d[options.colorValIdx || 0] = vars.color.value;
                        }

                        return customTooltip.call(options, s, c, d);
                    } :
                    function(context){
                        var vars = context.scene.vars;
                        var s = vars.series.rawValue;
                        var c = vars.category.rawValue;
                        var valueVar = vars[hasColor ? 'color' : 'size'];
                        var d = valueVar ? valueVar.value : null;
                        return customTooltip.call(options, s, c, d);
                    }
            };
        }
    },

    /**
     * Renders the heat grid panel.
     * @override
     */
    renderInteractive: function(){
        this.pvPanel.render();
    },

    _buildScene: function(data, seriesRootData, cellSize){
        var me = this;
        var rootScene  = new pvc.visual.Scene(null, {panel: me, group: data});
        var categDatas = data._children;

        var roles = me.visualRoles;
        var colorVarHelper = new pvc.visual.RoleVarHelper(rootScene, roles.color, {roleVar: 'color'});
        var sizeVarHelper  = new pvc.visual.RoleVarHelper(rootScene, roles.size,  {roleVar: 'size' });
        
        rootScene.cellSize = cellSize;

        seriesRootData
            .children()
            .each(createSeriesScene);

        return rootScene;

        function createSeriesScene(serData1){
            /* Create series scene */
            var serScene = new pvc.visual.Scene(rootScene, {group: serData1});

            serScene.vars.series = pvc.visual.ValueLabelVar.fromComplex(serData1);

            categDatas.forEach(function(catData1){
                createSeriesCategoryScene.call(me, serScene, catData1, serData1);
            });
        }

        function createSeriesCategoryScene(serScene, catData1, serData1){
            var group = data._childrenByKey[catData1.key]._childrenByKey[serData1.key];

            var serCatScene = new pvc.visual.Scene(serScene, {group: group});

            serCatScene.vars.category = pvc.visual.ValueLabelVar.fromComplex(catData1);

            colorVarHelper.onNewScene(serCatScene, /* isLeaf */true);
            sizeVarHelper .onNewScene(serCatScene, /* isLeaf */true);
        }
    }
});

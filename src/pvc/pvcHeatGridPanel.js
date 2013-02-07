
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

    pvHeatGrid: null,
    pvHeatGridLabel: null,

    defaultBorder:  1,
    nullBorder:     2,
    selectedBorder: 2,

    /**
     * @override
     */
    _createCore: function(){

        this.base();

        // TODO: this options treatment is highly "non-standard". Refactor to chart + panel-constructor

        var chart    = this.chart;
        var cellSize = this._calcCellSize();

        var a_bottom = this.isOrientationVertical() ? "bottom" : "left";
        var a_left   = pvc.BasePanel.relativeAnchor[a_bottom];
        var a_width  = pvc.BasePanel.parallelLength[a_bottom];
        var a_height = pvc.BasePanel.orthogonalLength[a_bottom];

        /* Column and Row datas  */

        // One multi-dimension single-level data grouping
        var rowRootData = this.data.flattenBy(this.visualRoles.series, {visible: true});

        // One multi-dimensional, two-levels data grouping
        var rootScene  = this._buildScene(this.visibleData(), rowRootData, cellSize);
        var hasColor   = rootScene.hasColorRole;
        var hasSize    = rootScene.hasSizeRole;
        var getFillColor = this._buildGetFillColor(hasColor);
        var wrapper    = this._buildSignsWrapper(rootScene);
        var isV1Compat = this.compatVersion() <= 1;

        /* PV Panels */
        var pvRowPanel = new pvc.visual.Panel(this, this.pvPanel)
            .pvMark
            .data(rootScene.childNodes)
            [a_bottom](function(){ return this.index * cellSize.height; })
            [a_height](cellSize.height);

        /* Cell panel */
        var extensionIds = ['panel'];
        if(isV1Compat){
            extensionIds.push(''); // let access as "heatGrid_"
        }

        var keyArgs = {
            extensionId: extensionIds,
            wrapper:     wrapper
        };

        if(!this.useShapes){
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

        var pvHeatGrid = this.pvHeatGrid = new pvc.visual.Panel(this, pvRowPanel, keyArgs)
            .lock('data', function(serScene){ return serScene.childNodes; })
            .pvMark

            .lock(a_left,  function(){ return this.index * cellSize.width; })
            .lock(a_width, cellSize.width)

            .antialias(false)
            //.lineWidth(0)
            ;
            // THIS caused HUGE memory consumption and speed reduction (at least in use Shapes mode)
            //.overflow('hidden'); //overflow important if valuesVisible=true

        if(this.useShapes){
            this.shapes = this._createShapesHeatMap(cellSize, getFillColor, wrapper, hasColor, hasSize);
        } else {
            this.shapes = this._createNoShapesHeatMap(getFillColor);
        }

        if(this.valuesVisible){
            // The "value" concept is mapped to one of the color or size roles.
            var valuesMask = this.valuesMask;
            if(!valuesMask){
                var valueDimName;
                var roles = this.visualRoles;
                if(roles.color.isBound()){ // assumed to always exist on this chart type
                    valueDimName = roles.color.firstDimensionName();
                } else if(roles.size.isBound()){
                    valueDimName = roles.size.firstDimensionName();
                }

                if(valueDimName){
                    valuesMask = "{#" + valueDimName + "}";
                }
            }
            
            if(valuesMask){
                this.pvHeatGridLabel = new pvc.visual.Label(
                    this,
                    this.pvHeatGrid.anchor("center"),
                    {
                        extensionId: 'label',
                        wrapper:     wrapper
                    })
                    .pvMark
                    .font(this.valuesFont) // default
                    .text(function(scene){ 
                        return scene.format(valuesMask);
                    })
                    ;
            }
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

        function wrapper(v1f){

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
        }

        return wrapper;
    },

    _buildGetFillColor: function(hasColor){
        var colorAxis = this.axes.color;
        var colorNull = colorAxis.option('Missing');
        if(hasColor){
            var fillColorScaleByColKey = colorAxis.scalesByCateg;
            if(fillColorScaleByColKey){
                return function(leafScene){
                    var colorValue = leafScene.vars.color.value;
                    if(colorValue == null) {
                        return colorNull;
                    }

                    var colAbsKey = leafScene.group.parent.absKey;
                    return fillColorScaleByColKey[colAbsKey](colorValue);
                };
            }

            var colorScale = colorAxis.scale;
            return function(leafScene){
                return colorScale(leafScene.vars.color.value);
            };
        }

        return def.fun.constant(colorNull);
    },

    _calcDotAreaRange: function(cellSize){
        var w = cellSize.width;
        var h = cellSize.height;

        var maxRadius = Math.min(w, h) / 2;

        if(this.shape === 'diamond'){
            // Protovis draws diamonds inscribed on
            // a square with half-side radius*Math.SQRT2
            // (so that diamonds just look like a rotated square)
            // For the height of the dimanod not to exceed the cell size
            // we compensate that factor here.
            maxRadius /= Math.SQRT2;
        }

        // Small margin
        maxRadius -= 2;

        var maxArea  = (maxRadius * maxRadius), // apparently treats as square area even if circle, triangle is different
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

        return {
            min:  minArea,
            max:  maxArea,
            span: areaSpan
        };
    },

    _createNoShapesHeatMap: function(getFillColor){
        return this.pvHeatGrid
            .sign
            .override('defaultColor', function(type){
                if(type === 'stroke'){
                    return null;
                }

                return getFillColor.call(this.pvMark, this.scene);
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

    _createShapesHeatMap: function(cellSize, getFillColor, wrapper, hasColor, hasSize){
        var me = this,
            nullShapeType = me.nullShape,
            shapeType = me.shape;

        /* SIZE */
        var areaRange = me._calcDotAreaRange(cellSize);
        var maxArea   = areaRange.max;

        /* BORDER WIDTH & COLOR */
        var notNullSelectedBorder = (me.selectedBorder == null || (+me.selectedBorder) === 0) ?
                                     me.defaultBorder :
                                     me.selectedBorder;

        var nullSelectedBorder = (me.selectedBorder == null || (+me.selectedBorder) === 0) ?
                                  me.nullBorder :
                                  me.selectedBorder;

        var nullDeselectedBorder = me.defaultBorder > 0 ? me.defaultBorder : me.nullBorder;

        /* SHAPE TYPE & SIZE */
        var getShapeSize, getShapeType;
        if(!hasSize){
            getShapeType = def.fun.constant(shapeType);
            getShapeSize = function(scene){
                /* When neither color nor size dimensions */
                return (hasColor && !nullShapeType && scene.vars.color.value == null) ? 0 : maxArea;
            };
        } else {
            var sizeScale = me.axes.size
                .setScaleRange(areaRange)
                .scale;

            getShapeType = function(scene){
                return scene.vars.size.value != null ? shapeType : nullShapeType;
            };
            getShapeSize = function(scene){
                var sizeValue = scene.vars.size.value;
                return (sizeValue == null && !nullShapeType) ? 0 : sizeScale(sizeValue);
            };
        }

        // Dot Sign
        var keyArgs = {
            extensionId: 'dot',
            freePosition: true,
            activeSeriesAware: false,
            noHover:      false,
            wrapper:      wrapper,
            tooltipArgs:  this._buildTooltipArgs(hasColor, hasSize)
        };

        return new pvc.visual.Dot(me, me.pvHeatGrid, keyArgs)
            .override('defaultSize', function(){
                return getShapeSize.call(this.pvMark, this.scene);
            })
            .override('interactiveSize', function(size){
                if(this.scene.isActive){
                    return Math.max(size, 5) * 1.5;
                }

                return size;
            })
            .override('baseColor', function(/*type*/){
                return getFillColor.call(this.pvMark.parent, this.scene);
            })
            .override('normalColor', function(color, type){
                if(type === 'stroke'){
                    return color.darker();
                }

                return this.base(color, type);
            })
            .override('interactiveColor', function(color, type){
                var scene = this.scene;

                if(type === 'stroke'){
                    if(scene.anySelected() && !scene.isSelected()){
                        return color;
                    }

                    return color.darker();
                }

                if(scene.isActive){
                    return color.alpha(0.6);
                }

                return this.base(color, type);
            })
            .override('dimColor', function(color/*, type*/){
                return pvc.toGrayScale(color, 0.6);
            })
            .pvMark
            .shape(getShapeType)
            .lock('shapeAngle') // TODO - rotation of shapes can cause them to not fit the calculated cell. Would have to improve the radius calculation code.
            .lineWidth(function(scene){
                if(!hasSize || !me._isNullShapeLineOnly() || scene.vars.size.value != null){
                    return scene.isSelected() ? notNullSelectedBorder : me.defaultBorder;
                }

                // is null
                return scene.isSelected() ? nullSelectedBorder : nullDeselectedBorder;
            })
            ;
    },

    _buildTooltipArgs: function(hasColor, hasSize){
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

    _isNullShapeLineOnly: function(){
        return this.nullShape == 'cross';
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @override
     */
    _getSelectableMarks: function(){
        return [this.shapes];
    },

    /**
     * Renders the heat grid panel.
     * @override
     */
    renderInteractive: function(){
        this.pvPanel.render();
    },

    _buildScene: function(data, seriesRootData){
        var me = this;
        var rootScene  = new pvc.visual.Scene(null, {panel: me, group: data});
        var categDatas = data._children;

        var roles = me.visualRoles;
        var colorVarHelper = new pvc.visual.RoleVarHelper(rootScene, roles.color);
        var sizeVarHelper  = new pvc.visual.RoleVarHelper(rootScene, roles.size);

        rootScene.hasColorRole = colorVarHelper.isBound();
        rootScene.hasSizeRole  = sizeVarHelper .isBound();

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

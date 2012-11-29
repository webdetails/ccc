
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
    
    this.axes.size = chart.getAxis('size', plot.option('SizeAxis') - 1); // may be undefined
    
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
        
        var chart = this.chart,
            options = chart.options,
            me = this;

        var colorDimName = this.colorDimName = chart._colorDim && chart._colorDim.name,
            sizeDimName  = this.sizeDimName  = chart._sizeDim  && chart._sizeDim.name;
        
        var a_bottom = this.isOrientationVertical() ? "bottom" : "left";

        /* Use existing scales */
        var xScale = this.axes.x.scale,
            yScale = this.axes.y.scale;

        /* Determine cell dimensions. */
        var w = (xScale.max - xScale.min) / xScale.domain().length;
        var h = (yScale.max - yScale.min) / yScale.domain().length;

        if (a_bottom !== "bottom") {
            var tmp = w;
            w = h;
            h = tmp;
        }
        
        this._cellWidth  = w;
        this._cellHeight = h;
        
        /* Column and Row datas  */
        var keyArgs = {visible: true},
            // Two multi-dimension single-level data groupings
            
            colRootData = chart.data.flattenBy(chart._catRole, keyArgs),
            rowRootData = chart.data.flattenBy(chart._serRole, keyArgs),
            
            // <=> One multi-dimensional, two-levels data grouping
            data = this._getVisibleData(),
            
            rootScene = this._buildScene(data, rowRootData);
        
        /* COLOR */
        
        var getFillColor;
        var colorAxis = this.axes.color;
        var colorNull = colorAxis.option('Missing');
        if(colorDimName){
            var fillColorScaleByColKey = colorAxis.scalesByCateg;
            if(fillColorScaleByColKey){
                getFillColor = function(leafScene){
                    var colorValue = leafScene.vars.color.value;
                    if(colorValue == null) {
                        return colorNull;
                    }
                    
                    var colAbsKey = leafScene.group.parent.absKey;
                    return fillColorScaleByColKey[colAbsKey](colorValue);
                };
            } else {
                var colorScale = colorAxis.scale;
                getFillColor = function(leafScene){
                    return colorScale(leafScene.vars.color.value);
                };
            }
        } else {
            getFillColor = def.fun.constant(colorNull);
        }
        
        /* PV Panels */
        var a_left   = pvc.BasePanel.relativeAnchor[a_bottom];
        var a_width  = pvc.BasePanel.parallelLength[a_bottom];
        var a_height = pvc.BasePanel.orthogonalLength[a_bottom];
        
        var pvRowPanel = new pvc.visual.Panel(this, this.pvPanel)
            .pvMark
            .data(rootScene.childNodes)
            [a_bottom](function(){ return this.index * h; })
            [a_height](h)
            ;
        
        var wrapper;
        if(this.compatVersion() <= 1){
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
                
            wrapper = function(v1f){
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
        }
        
        /* Cell panel */
        var extensionIds = ['panel'];
        if(this.compatVersion() <= 1){
            extensionIds.push(''); // let access as "heatGrid_"
        }
        
        keyArgs = { // reuse var
            extensionId: extensionIds,
            wrapper:     wrapper
        };
        
        if(!this.useShapes){
            // When no shapes are used,
            // clicks, double-clicks and tooltips are all handled by
            // the cell panel
            keyArgs.noSelect = 
            keyArgs.noHover = 
            keyArgs.noClick = 
            keyArgs.noDoubleClick = 
            keyArgs.freeColor = false;
            
            keyArgs.noTooltip = !!wrapper; // V1 had no tooltips
        }
        
        var pvHeatGrid = this.pvHeatGrid = new pvc.visual.Panel(this, pvRowPanel, keyArgs)
            .lock('data', function(serScene){ return serScene.childNodes; })
            .pvMark
            
            .localProperty('colorValue')
            .lock('colorValue', function(leafScene){
                return colorDimName && leafScene.vars.color.value;
            })
            
            .localProperty('sizeValue')
            .lock('sizeValue', function(leafScene){
                return sizeDimName && leafScene.vars.size.value;
            })
            
            .lock(a_left,  function(){ return this.index * w; })
            .lock(a_width, w)
            
            .antialias(false)
            //.lineWidth(0)
            ;
            // THIS caused HUGE memory consumption and speed reduction (at least in use Shapes mode)
            //.overflow('hidden'); //overflow important if valuesVisible=true
        
        
        if(this.useShapes){
            this.shapes = this.createHeatMap(w, h, getFillColor, wrapper);
        } else {
            this.shapes = pvHeatGrid
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
                .override('dimColor', function(color, type){
                    return pvc.toGrayScale(color, 0.6);
                })
                .pvMark
                .lineWidth(1.5)
                ;
        }
        
        // TODO: valueMask??
        var valueDimName = this.valueDimName = colorDimName || sizeDimName;
        
        if(this.valuesVisible && valueDimName){
            this.pvHeatGridLabel = new pvc.visual.Label(
                this, 
                this.pvHeatGrid.anchor("center"), 
                {
                    extensionId: 'label',
                    wrapper:     wrapper
                })
                .pvMark
                .font(this.valuesFont) // default
                .text(function(leafScene){
                    return leafScene.atoms[valueDimName].label;
                })
                ;
        }
    },

    _calcDotAreaRange: function(w, h){
        
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
        
        var maxArea  = maxRadius * maxRadius, // apparently treats as square area even if circle, triangle is different
            minArea  = 12,
            areaSpan = maxArea - minArea;

        if(areaSpan <= 1){
            // Very little space
            // Rescue Mode - show *something*
            maxArea = Math.max(maxArea, 2);
            minArea = 1;
            areaSpan = maxArea - minArea;
            
            if(pvc.debug >= 2){
                this._log("Using rescue mode dot area calculation due to insufficient space.");
            }
        }
        
        return {
            min:  minArea,
            max:  maxArea,
            span: areaSpan
        };
    },
    
    createHeatMap: function(w, h, getFillColor, wrapper){
        var myself = this,
            chart = this.chart,
            data = chart.data,
            sizeDimName  = this.sizeDimName,
            colorDimName = this.colorDimName,
            nullShapeType = this.nullShape,
            shapeType = this.shape;
        
        /* SIZE */
        var areaRange = this._calcDotAreaRange(w, h);
        var maxArea = areaRange.max;
        
        var sizeScale;
        var sizeAxis = this.axes.size;
        if(sizeAxis && sizeAxis.isBound()){
            sizeScale = sizeAxis
                .setScaleRange(areaRange)
                .scale;
        } else {
            sizeDimName = null;
        }
        
        /* BORDER WIDTH & COLOR */
        var notNullSelectedBorder = (this.selectedBorder == null || (+this.selectedBorder) === 0) ? 
                                     this.defaultBorder : 
                                     this.selectedBorder;
        
        var nullSelectedBorder = (this.selectedBorder == null || (+this.selectedBorder) === 0) ? 
                                  this.nullBorder : 
                                  this.selectedBorder;
        
        var nullDeselectedBorder = this.defaultBorder > 0 ? this.defaultBorder : this.nullBorder;
        
       /* SHAPE TYPE & SIZE */
        var getShapeType;
        if(!sizeDimName) {
            getShapeType = def.fun.constant(shapeType);
        } else {
            getShapeType = function(){
                return this.parent.sizeValue() != null ? shapeType : nullShapeType;
            };
        }
        
        var getShapeSize;
        if(!sizeDimName){
            getShapeSize = function(){
                /* When neither color nor size dimensions */
                return (colorDimName && !nullShapeType && this.parent.colorValue() == null) ? 0 : maxArea;
            };
        } else {
            getShapeSize = function(){
                var sizeValue = this.parent.sizeValue();
                return (sizeValue == null && !nullShapeType) ? 0 : sizeScale(sizeValue);
            };
        }
        
        // Dot
        var keyArgs = {
            extensionId: 'dot',
            freePosition: true,
            activeSeriesAware: false,
            noHover:      false,
            wrapper:      wrapper
        };
        
        var options = chart.options;
        if(wrapper && chart._tooltipEnabled){
            var customTooltip = options.customTooltip;
            if(!customTooltip){
                customTooltip = function(s,c,d){ 
                    if(d != null && d[0] !== undefined){
                        return d.join(', ');
                    }
                    return d;
                };
            }
            
            keyArgs.tooltipArgs = {
                buildTooltip: 
                    options.isMultiValued ?
                    function(context){
                        var group = context.scene.group;
                        var s = pvc.data.Complex.values(group, chart._serRole.grouping.dimensionNames());
                        var c = pvc.data.Complex.values(group, chart._catRole.grouping.dimensionNames());
                        
                        var d = [];
                        if(sizeDimName){
                            d[options.sizeValIdx  || 0] = context.scene.vars.size.value;
                        }
                        if(colorDimName){
                            d[options.colorValIdx || 0] = context.scene.vars.color.value;
                        }
                        
                        return customTooltip.call(options, s, c, d);
                    } : 
                    function(context){
                        var s = context.scene.vars.series.rawValue;
                        var c = context.scene.vars.category.rawValue;
                        var valueVar = context.scene.vars[colorDimName ? 'color' : 'size'];
                        var d = valueVar ? valueVar.value : null;
                        return customTooltip.call(options, s, c, d);
                    }
            };
        }
        
        return new pvc.visual.Dot(this, this.pvHeatGrid, keyArgs)
            .override('defaultSize', function(){
                return getShapeSize.call(this.pvMark, this.scene);
            })
            .override('interactiveSize', function(size){
                if(this.scene.isActive){
                    return Math.max(size, 5) * 1.5;
                }
                
                return size;
            })
            .override('baseColor', function(type){
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
            .override('dimColor', function(color, type){
                return pvc.toGrayScale(color, 0.6);
            })
            .pvMark
            
            .shape(getShapeType)
            
            .lock('shapeAngle') // rotation of shapes can cause them to not fit the calculated cell. Would have to improve the radius calculation code.
            
            .lineWidth(function(leafScene){
                if(!sizeDimName || !myself._isNullShapeLineOnly() || this.parent.sizeValue() != null){
                    return leafScene.isSelected() ? notNullSelectedBorder : myself.defaultBorder;
                }

                // is null
                return leafScene.isSelected() ? nullSelectedBorder : nullDeselectedBorder;
            })
            ;
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
        var rootScene  = new pvc.visual.Scene(null, {panel: this, group: data});
        var categDatas = data._children;
        
        var chart = this.chart;
        var colorRootDim = chart._colorDim;
        var sizeRootDim  = chart._sizeDim;
        
        /**
         * Create starting scene tree
         */
        seriesRootData
            .children()
            .each(createSeriesScene, this);

        return rootScene;

        function createSeriesScene(serData1){
            /* Create series scene */
            var serScene = new pvc.visual.Scene(rootScene, {group: serData1});

            serScene.vars.series = new pvc.visual.ValueLabelVar(
                serData1.value,
                serData1.label,
                serData1.rawValue);
            
            categDatas.forEach(function(catData1){
                createSeriesCategoryScene.call(this, serScene, catData1, serData1); 
            }, this);
        }

        function createSeriesCategoryScene(serScene, catData1, serData1){
            /* Create leaf scene */
            var group = 
                data
                ._childrenByKey[catData1.key]
                ._childrenByKey[serData1.key];
            
            var singleDatum = group && group.singleDatum();
            
            /* If there's no group, provide, at least, a null datum */
            var datum = group ? null : createNullDatum(serData1, catData1);
            
            var serCatScene = new pvc.visual.Scene(serScene, {group: group, datum: datum});
            var catVars  = serCatScene.vars;
            
            catVars.category = 
                new pvc.visual.ValueLabelVar(
                    catData1.value, 
                    catData1.label, 
                    catData1.rawValue);
            
            var value, label;
            
            var chart = this.chart;
            if(colorRootDim){
                if(singleDatum){
                    catVars.color = Object.create(singleDatum.atoms[colorRootDim.name]);
                } else {
                    value = group ? 
                             group
                             .dimensions(colorRootDim.name)
                             .sum({visible: true, zeroIfNone: false}) :
                            null;
                    
                    label = colorRootDim.format(value);
                    
                    catVars.color = new pvc.visual.ValueLabelVar(value, label, value);
                }
            }
            
            if(sizeRootDim){
                if(singleDatum){
                    catVars.size = Object.create(singleDatum.atoms[sizeRootDim.name]);
                } else {
                    value = group ? 
                             group
                             .dimensions(sizeRootDim.name)
                             .sum({visible: true, zeroIfNone: false}) :
                            null;
                    
                    label = sizeRootDim.format(value);
                    
                    catVars.size = new pvc.visual.ValueLabelVar(value, label, value);
                }
            }

            serCatScene.isNull = !group; // A virtual scene?
        }
        
        function createNullDatum(serData1, catData1) {
            // Create a null datum with col and row coordinate atoms
            var atoms = def.copy(def.copy({}, serData1.atoms), catData1.atoms);
            return new pvc.data.Datum(data, atoms, true);
        }
    }
});

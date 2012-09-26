
/*
 * HeatGrid chart panel. Generates a heatGrid chart. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide heatGrid value. Default: false
 * <i>maxHeatGridSize</i> - Maximum size of a heatGrid in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>heatGrid_</i> - for the actual heatGrid
 * <i>heatGridPanel_</i> - for the panel where the heatGrids sit
 * <i>heatGridLabel_</i> - for the main heatGrid label
 */
pvc.HeatGridPanel = pvc.CartesianAbstractPanel.extend({
    anchor: 'fill',
    pvHeatGrid: null,
    pvHeatGridLabel: null,
    data: null,

    showValues: true,
    orientation: "vertical",
    shape: "square",
    nullShape: "cross",

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
            options = chart.options;

        var colorDimName = this.colorDimName = chart._colorDim && chart._colorDim.name,
            sizeDimName  = this.sizeDimName  = chart._sizeDim  && chart._sizeDim.name;
        
        // colors
        options.nullColor = pv.color(options.nullColor);
        
        if(options.minColor != null) { options.minColor = pv.color(options.minColor); }
        if(options.maxColor != null) { options.maxColor = pv.color(options.maxColor); }
        
        if(options.shape != null) {
            this.shape = options.shape;
        }
        
        if(options.nullShape !== undefined) { // can clear the null shape!
            this.nullShape = options.nullShape;
        }
        
        var a_bottom = this.isOrientationVertical() ? "bottom" : "left";

        /* Use existing scales */
        var xScale = chart.axes.x.scale,
            yScale = chart.axes.y.scale;

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
        if(colorDimName){
            var fillColorScaleByColKey = pvc.color.scales(def.create(false, options, {
                /* Override/create these options, inherit the rest */
                type: options.colorScaleType, 
                data: colRootData,
                colorDimension: colorDimName
            }));
            
            getFillColor = function(leafScene){
                var color;
                var colorValue = leafScene.vars.color.value;
                if(colorValue != null) {
                    var colAbsKey = leafScene.group.parent.absKey;
                    color = fillColorScaleByColKey[colAbsKey](colorValue);
                } else {
                    color = options.nullColor;
                }
                
                return color;
            };
        } else {
            getFillColor = def.fun.constant(options.nullColor);
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
                                 },
                            });
                    },
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
        var keyArgs = {
            extensionId: ['heatGridPanel', 'heatGrid'],
            wrapper:     wrapper
        };
        
        if(!options.useShapes){
            // When no shapes are used,
            // clicks, double-clicks and tooltips are all handled by
            // the cell panel
            keyArgs.noSelect = 
            keyArgs.noHover = 
            keyArgs.noClick = 
            keyArgs.noDoubleClick = 
            keyArgs.noTooltips = 
            keyArgs.freeColor = false;
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
            .lineWidth(0)
            ;
            // THIS caused HUGE memory consumption and speed reduction (at least in use Shapes mode)
            //.overflow('hidden'); //overflow important if showValues=true
        
        
        if(options.useShapes){
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
                .override('interactiveColor', function(type, color){
                    var scene = this.scene;
                    if(scene.anySelected() && !scene.isSelected()) {
                        return this.dimColor(type, color);
                    }
                    
                    return this.base(type, color);
                })
                .override('dimColor', function(type, color){
                    return pvc.toGrayScale(color, 0.6);
                })
                .pvMark
                ;
        }
        
        // TODO: valueMask??
        var valueDimName = this.valueDimName = colorDimName || sizeDimName;
        
        if(this.showValues && valueDimName){
            this.pvHeatGridLabel = new pvc.visual.Label(
                this, 
                this.pvHeatGrid.anchor("center"), 
                {
                    extensionId: 'heatGridLabel',
                    wrapper:     wrapper
                })
                .pvMark
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
                pvc.log("Using rescue mode dot area calculation due to insufficient space.");
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
            data = this.chart.data,
            sizeDimName  = this.sizeDimName,
            colorDimName = this.colorDimName,
            nullShapeType = this.nullShape,
            shapeType = this.shape;
        
        /* SIZE */
        var areaRange = this._calcDotAreaRange(w, h);
        var maxArea = areaRange.max;
        
        var sizeScale;
        var sizeAxis = this.chart.axes.size;
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
        
        // Panel
        return new pvc.visual.Dot(this, this.pvHeatGrid, {
                freePosition: true,
                wrapper:      wrapper,
                noHover:      true,
            })
        
            .override('size', function(){
                return getShapeSize.call(this.pvMark, this.scene);
            })
            .override('baseColor', function(type){
                return getFillColor.call(this.pvMark.parent, this.scene);
            })
            .override('normalColor', function(type, color){
                if(type === 'stroke'){
                    return color.darker();
                }
                
                return this.base(type, color);
            })
            .override('interactiveColor', function(type, color){
                var scene = this.scene;
                if(type === 'stroke'){
                    return scene.isSelected() ? color.darker() : color;
                }
                
                return this.base(type, color);
            })
            .override('dimColor', function(type, color){
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
    _renderInteractive: function(){
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
            var group    = data
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
            var atoms = def.array.append(
                            def.own(serData1.atoms),
                            def.own(catData1.atoms));

            return new pvc.data.Datum(data, atoms, true);
        }
    }
});

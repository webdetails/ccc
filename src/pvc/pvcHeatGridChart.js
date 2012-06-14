
/**
 * HeatGridChart is the main class for generating... heatGrid charts.
 *  A heatGrid visualizes a matrix of values by a grid (matrix) of *
 *  bars, where the color of the bar represents the actual value.
 *  By default the colors are a range of green values, where
 *  light green represents low values and dark green high values.
 *  A heatGrid contains:
 *     - two categorical axis (both on x and y-axis)
 *     - no legend as series become rows on the perpendicular axis 
 *  Please contact CvK if there are issues with HeatGrid at cde@vinzi.nl.
 */
pvc.HeatGridChart = pvc.CategoricalAbstract.extend({

    constructor: function(options){

        options = def.set(options, 
                'orthoAxisOrdinal', true,
                'legend', false);
        
//        if(options.useCompositeAxis){
//            options.isMultiValued = true;
//        }
//
        if(options.scalingType && !options.colorScaleType){
            options.colorScaleType = options.scalingType;
        }
        
        this.base(options);

        var defaultOptions = {
            colorValIdx: 0,
            sizeValIdx:  1,
            measuresIndexes: [2],

            //multi-dimensional clickable label
            showValues: true,
            axisOffset: 0,
            
            orientation: "vertical",
            
            colorScaleType: "linear",  // "discrete", "normal" (distribution) or "linear"
            
            normPerBaseCategory: true,
            numSD: 2,                 // width (only for normal distribution)
            nullShape: undefined,
            shape: undefined,
            useShapes: false,
            colorRange: ['red', 'yellow','green'],
            colorRangeInterval:  undefined,
            minColor: undefined, //"white",
            maxColor: undefined, //"darkgreen",
            nullColor:  "#efc5ad"  // white with a shade of orange
        };
        
        // Apply options
        pvc.mergeDefaults(this.options, defaultOptions, options);

        var parent = this.parent;
        if(parent) {
            this._colorRole   = parent._colorRole;
            this._dotSizeRole = parent._dotSizeRole;
        }
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();

        var colorDimName = 'value',
            sizeDimName  = 'value2';

        if(this.options.compatVersion <= 1){
            switch(this.options.colorValIdx){
                case 0:  colorDimName = 'value';  break;
                case 1:  colorDimName = 'value2'; break;
                default: colorDimName = undefined;
            }

            switch(this.options.sizeValIdx){
                case 0:  sizeDimName = 'value';  break;
                case 1:  sizeDimName = 'value2'; break;
                default: sizeDimName = undefined;
            }
        }

        this._addVisualRoles({
            color:  {
                isMeasure: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: colorDimName
            },
            
            dotSize: {
                isMeasure: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: sizeDimName
            }
        });

        this._colorRole   = this.visualRoles('color');
        this._dotSizeRole = this.visualRoles('dotSize');
    },

    _initData: function(keyArgs){
        
        this.base(keyArgs);

        // Cached
        var dotSizeGrouping = this._dotSizeRole.grouping;
        if(dotSizeGrouping){
            this._dotSizeDim = this.data.dimensions(dotSizeGrouping.firstDimension.name);
        }

        var colorGrouping = this._colorRole.grouping;
        if(colorGrouping) {
            this._colorDim = this.data.dimensions(colorGrouping.firstDimension.name);
        }
    },
    
    /* @override */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in heatGridChart");
        }
        
        var options = this.options;
        return new pvc.HeatGridChartPanel(this, parentPanel, {
            showValues:  options.showValues,
            orientation: options.orientation
        });
    }
});

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
pvc.HeatGridChartPanel = pvc.CartesianAbstractPanel.extend({
    anchor: 'fill',
    pvHeatGrid: null,
    pvHeatGridLabel: null,
    data: null,

    showValues: true,
    orientation: "vertical",
    shape: "square",
    nullShape: "cross",

    defaultBorder: 1,
    nullBorder: 2,
    selectedBorder: 2,

    /**
     * @override
     */
     _createCore: function(){
         this.base();

        var chart = this.chart,
            options = chart.options;

        var colorDimName = this.colorDimName = chart._colorDim   && chart._colorDim.name,
            sizeDimName  = this.sizeDimName  = chart._dotSizeDim && chart._dotSizeDim.name;
        
        // colors
        options.nullColor = pv.color(options.nullColor);
        
        if(options.minColor != null) { options.minColor = pv.color(options.minColor); }
        if(options.maxColor != null) { options.maxColor = pv.color(options.maxColor); }
        
        if(options.shape != null) {
            this.shape = options.shape;
        }
        
        var anchor = this.isOrientationVertical() ? "bottom" : "left";

        /* Use existing scales */
        var xScale = chart.axes.x.scale,
            yScale = chart.axes.y.scale;

        /* Determine cell dimensions. */
        var w = (xScale.max - xScale.min) / xScale.domain().length;
        var h = (yScale.max - yScale.min) / yScale.domain().length;

        if (anchor !== "bottom") {
            var tmp = w;
            w = h;
            h = tmp;
        }
        
        this._cellWidth  = w;
        this._cellHeight = h;
        
        /* Column and Row datas  */
        var keyArgs = {visible: true},
            // Two multi-dimension single-level data groupings
            colRootData = chart._catRole.flatten(chart.data, keyArgs),
            rowRootData = chart._serRole.flatten(chart.data, keyArgs),

            // <=> One multi-dimensional, two-levels data grouping
            data = this._getVisibleData();
        
        /* Color scale */
        var fillColorScaleByColKey;
        
        if(colorDimName){
            fillColorScaleByColKey =  pvc.color.scales(def.create(false, this.chart.options, {
                /* Override/create these options, inherit the rest */
                type: options.colorScaleType, 
                data: colRootData,
                colorDimension: colorDimName
            }));
        }
        
        function getFillColor(detectSelection){
            var color;
            
            var colorValue = this.colorValue();
            if(colorValue != null) {
                color = fillColorScaleByColKey[this.group().parent.absKey](colorValue);
            } else {
                color = options.nullColor;
            }
            
            if(detectSelection && 
               data.owner.selectedCount() > 0 && 
               !this.datum().isSelected){
                 color = pvc.toGrayScale(color, 0.6);
            }
            
            return color;
        }
        
        /* DATUM */
        function getDatum(rowData1, colData1){
            var colData = this.parent.group();
            if(colData) {
                var rowData = colData._childrenByKey[rowData1.absKey];
                if(rowData) {
                    var datum = rowData._datums[0];
                    if(datum) {
                        return datum;
                    }
                }
            }
            
            // Create a null datum with col and row coordinate atoms
            var atoms = def.array.append(
                            def.own(rowData1.atoms),
                            def.own(colData1.atoms));
            
            return new pvc.data.Datum(data, atoms, true);
        }
        
        /* PV Panels */
        var pvColPanel = this.pvPanel.add(pv.Panel)
            .data(colRootData._children)
            .localProperty('group', Object)
            .group(function(colData1){
                return data._childrenByKey[colData1.absKey]; // must exist
            })
            [pvc.BasePanel.relativeAnchor[anchor]](function(){ //ex: datum.left(i=1 * w=15)
                return this.index * w;
             })
            [pvc.BasePanel.parallelLength[anchor]](w)
            ;
        
        var pvHeatGrid = this.pvHeatGrid = pvColPanel.add(pv.Panel)
            .data(rowRootData._children)
            .localProperty('group', Object)
            .datum(getDatum)
            .group(function(rowData1){
                return this.parent.group()._childrenByKey[rowData1.absKey];
            })
            .localProperty('colorValue', Number)
            .colorValue(function(){
                return colorDimName && this.datum().atoms[colorDimName].value;
            })
            .localProperty('sizeValue',  Number)
            .sizeValue(function(){
                return sizeDimName && this.datum().atoms[sizeDimName].value;
            })
            ;
            
        pvHeatGrid
            [anchor](function(){ return this.index * h; })
            [pvc.BasePanel.orthogonalLength[anchor]](h)
            .antialias(false)
            .strokeStyle(null)
            .lineWidth(0)
            ;
            // THIS caused HUGE memory consumption and speed reduction (at least in use Shapes mode)
            //.overflow('hidden'); //overflow important if showValues=true
        
         
        if(options.useShapes){
            this.shapes = this.createHeatMap(w, h, getFillColor);
        } else {
            this.shapes = pvHeatGrid;
        }

        this.shapes
            //.text(getLabel) // Ended up showing when the tooltip should be empty
            .fillStyle(function(){
                return getFillColor.call(pvHeatGrid, true);
            })
            ;
        
        var valueDimName = colorDimName || sizeDimName;
        
        if(this.showValues && valueDimName){
            
            this.pvHeatGridLabel = pvHeatGrid.anchor("center").add(pv.Label)
                .bottom(0)
                .text(function(){
                    return this.datum().atoms[valueDimName].label;
                })
                ;
        }
        
        if(this._shouldHandleClick()){ // TODO: should have valueDimName -> value argument
            this._addPropClick(this.shapes);
        }

        if(options.doubleClickAction){ // TODO: should have valueDimName -> value argument
            this._addPropDoubleClick(this.shapes);
        }
        
        if(options.showTooltips){
            this._addPropTooltip(this.shapes, {tipsyEvent: 'mouseover'});
        }
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        if(this.pvHeatGridLabel){
            this.extend(this.pvHeatGridLabel, "heatGridLabel_");
        }

        // Extend heatGrid and heatGridPanel
        this.extend(this.pvHeatGrid,"heatGridPanel_");
        this.extend(this.pvHeatGrid,"heatGrid_");
    },

    createHeatMap: function(w, h, getFillColor){
        var myself = this,
            options = this.chart.options,
            data = this.chart.data,
            sizeDimName  = this.sizeDimName,
            colorDimName = this.colorDimName,
            nullShapeType = options.nullShape,
            shapeType = this.shape;
        
        /* SIZE RANGE */
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
            
            pvc.log("Using rescue mode dot area calculation due to insufficient space.");
        }
        
        var sizeValueToArea;
        if(sizeDimName){
            /* SIZE DOMAIN */
            def.scope(function(){
                var sizeValExtent = data.dimensions(sizeDimName).extent({visible: true}),
                    sizeValMin   = sizeValExtent.min.value,
                    sizeValMax   = sizeValExtent.max.value,
                    sizeValSpan  = Math.abs(sizeValMax - sizeValMin); // may be zero
                
                if(isFinite(sizeValSpan) && sizeValSpan > 0.001) {
                    // Linear mapping
                    // TODO: a linear scale object??
                    var sizeSlope = areaSpan / sizeValSpan;
                    
                    sizeValueToArea = function(sizeVal){
                        return minArea + sizeSlope * (sizeVal == null ? 0 : (sizeVal - sizeValMin));
                    };
                }
            });
        }
        
        if(!sizeValueToArea) {
            sizeValueToArea = pv.functor(maxArea);
        }
        
        /* BORDER WIDTH & COLOR */
        var notNullSelectedBorder = (this.selectedBorder == null || (+this.selectedBorder) === 0) ? 
                                     this.defaultBorder : 
                                     this.selectedBorder;
        
        var nullSelectedBorder = (this.selectedBorder == null || (+this.selectedBorder) === 0) ? 
                                  this.nullBorder : 
                                  this.selectedBorder;
        
        var nullDeselectedBorder = this.defaultBorder > 0 ? this.defaultBorder : this.nullBorder;
        
        function getBorderWidth(){
            if(!sizeDimName || !myself._isNullShapeLineOnly() || this.parent.sizeValue() != null){
                return this.selected() ? notNullSelectedBorder : myself.defaultBorder;
            }

            // is null
            return this.selected() ? nullSelectedBorder : nullDeselectedBorder;
        }

        function getBorderColor(){
            var lineWidth = this.lineWidth();
            if(!(lineWidth > 0)){ //null|<0
                return null; // no style
            }
            
            var color = getFillColor.call(this.parent, false);
            return (data.owner.selectedCount() === 0 || this.selected()) ? 
                    color.darker() : 
                    color;
        }
        
        /* SHAPE TYPE & SIZE */
        var getShapeType;
        if(!sizeDimName) {
            getShapeType = def.constant(shapeType);
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
                return (!sizeValue && !nullShapeType) ? 0 : sizeValueToArea(sizeValue);
            };
        }
        
        // Panel
        return this.pvHeatGrid.add(pv.Dot)
            .localProperty("selected", Boolean)
            .selected(function(){ return this.datum().isSelected; })
            .shape(getShapeType)
            .shapeSize(getShapeSize)
            .lock('shapeAngle') // rotation of shapes may cause them to not fit the calculated cell. Would have to improve the radius calculation code.
            .fillStyle(function(){ return getFillColor.call(this.parent); })
            .lineWidth(getBorderWidth)
            .strokeStyle(getBorderColor)
            ;
    },

    _isNullShapeLineOnly: function(){
        return this.nullShape == 'cross';  
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @override
     */
    _getSignums: function(){
        return [this.shapes];
    },
    
    /**
     * Renders the heat grid panel.
     * @override
     */
    _renderInteractive: function(){
        this.pvPanel.render();
    }
});

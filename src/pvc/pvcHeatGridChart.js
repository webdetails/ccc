
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

        this.base(options);

        var parent = this.parent;
        if(parent) {
            this._colorRole   = parent._colorRole;
            this._sizeRole = parent._sizeRole;
        }
    },
    
    _processOptionsCore: function(options){
        
        this.base(options);
        
        def.set(options, 
            'orthoAxisOrdinal', true,
            'legend', false,
                
            // Has no meaning in the current implementation
            'panelSizeRatio', 1);
  
        if(options.scalingType && !options.colorScaleType){
            options.colorScaleType = options.scalingType;
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

        if(this.compatVersion() <= 1){
            switch(this.options.colorValIdx){
                case 0:  colorDimName = 'value';  break;
                case 1:  colorDimName = 'value2'; break;
                default: colorDimName = 'value';
            }

            switch(this.options.sizeValIdx){
                case 0:  sizeDimName = 'value' ; break;
                case 1:  sizeDimName = 'value2'; break;
                default: sizeDimName = 'value' ;
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
            
            size: {
                isMeasure: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: sizeDimName
            }
        });

        this._colorRole = this.visualRoles('color');
        this._sizeRole  = this.visualRoles('size' );
    },

    _initData: function(keyArgs){
        
        this.base(keyArgs);

        // Cached
        var sizeGrouping = this._sizeRole.grouping;
        if(sizeGrouping){
            this._sizeDim = this.data.dimensions(sizeGrouping.firstDimension.name);
        }

        var colorGrouping = this._colorRole.grouping;
        if(colorGrouping) {
            this._colorDim = this.data.dimensions(colorGrouping.firstDimension.name);
        }
    },
    
    _initAxes: function(hasMultiRole){
        
        this.base(hasMultiRole);
        
        if(!hasMultiRole || this.parent){
            /* Create size and color axes */
            
            if(this.options.useShapes){
                this._addAxis(new pvc.visual.SizeAxis(this, 'size', 0));
            }
        }
    },
    
    _bindAxes: function(hasMultiRole){
        
        this.base(hasMultiRole);
        
        var sizeAxis = this.axes.size;
        if(sizeAxis && !sizeAxis.isBound() && this._sizeRole.isBound()){
            sizeAxis.bind(this._buildRolesDataCells(this._sizeRole));
        }
    },
    
    _setAxesScales: function(hasMultiRole){
        
        this.base(hasMultiRole);
        
        if(!hasMultiRole || this.parent){
            
            var sizeAxis = this.axes.size;
            if(sizeAxis && sizeAxis.isBound()){
                this._createAxisScale(sizeAxis);
            }
        }
    },
    
    /* @override */
    _createMainContentPanel: function(parentPanel, baseOptions){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in heatGridChart");
        }
        
        var options = this.options;
        return (this.heatGridChartPanel = new pvc.HeatGridPanel(this, parentPanel, def.create(baseOptions, {
            showValues:  options.showValues,
            orientation: options.orientation
        })));
    },
    
    defaults: def.create(pvc.CategoricalAbstract.prototype.defaults, {
        colorValIdx: 0,
        sizeValIdx:  1,
        measuresIndexes: [2],

        //multi-dimensional clickable label
        showValues: true,
        axisOffset: 0,
        
        showPlotFrame: false,

        //customTooltip: undefined, // V1 & useShapes only
        
//      nullShape: undefined,
//      shape: undefined,
        useShapes: false,
      
        /* Size Role */
//      sizeAxisUseAbs: true,
//      sizeAxisFixedMin: undefined,
//      sizeAxisFixedMax: undefined,
//      sizeAxisOriginIsZero: false,
        
        /* Color Role */
        colorScaleType: "linear",  // "discrete", "normal" (distribution) or "linear"
        
        normPerBaseCategory: true,
        numSD: 2,                 // width (only for normal distribution)
        colorRange: ['red', 'yellow','green'],
//        colorRangeInterval:  undefined,
//        minColor: undefined, //"white",
//        maxColor: undefined, //"darkgreen",
        nullColor:  "#efc5ad"  // white with a shade of orange
    })
});


/**
 * MetricLineDotAbstract is the base class of metric dot and line.
 */
pvc.MetricLineDotAbstract = pvc.MetricXYAbstract.extend({

    constructor: function(options){

        this.base(options);

        var parent = this.parent;
        if(parent) {
            this._colorRole = parent._colorRole;
            this._sizeRole = parent._sizeRole;
        }
    },

    /**
     * @override 
     */
    _processOptionsCore: function(options){
        this.base(options);
        
        if(options.nullColor){
            options.nullColor = pv.color(options.nullColor);
        }
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        var isV1Compat = (this.compatVersion() <= 1);
        
        this._addVisualRoles({
            color:  { 
                isMeasure: true, 
                //requireSingleDimension: true,  // TODO: generalize this...
                //requireIsDiscrete: false, 
                //valueType: Number,
                defaultDimensionName: isV1Compat ? 'value2' : 'value3'
            },
            size: { 
                isMeasure: true, 
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: isV1Compat ? 'value3' : 'value4' 
            }
        });

        this._colorRole = this.visualRoles('color');
        this._sizeRole = this.visualRoles('size' );
    },

    _initData: function(keyArgs){
        this.base(keyArgs);

        // Cached
        var sizeGrouping = this._sizeRole.grouping;
        if(sizeGrouping){
            this._sizeDim = this.data.dimensions(sizeGrouping.firstDimension.name);
        }

        /* Change the legend source role */
        if(!this.parent){
            var colorGrouping = this._colorRole.grouping;
            if(colorGrouping) {
                if(colorGrouping.isDiscrete()){
                    // role is bound and discrete => change legend source
                    this.legendSource = 'color';
                } else {
                    /* The "color legend" has no use
                     * but to, possibly, show/hide "series",
                     * if any
                     */
                    this.options.legend = false;
                }
            }
        }
    },
    
    _initAxes: function(hasMultiRole){
        
        this.base(hasMultiRole);
        
        if(!hasMultiRole || this.parent){
            /* Create size and color axes */
            
            if(this.options.showDots){
                this._addAxis(new pvc.visual.SizeAxis(this, 'size', 0));
            }
        }
    },
    
    _bindAxes: function(hasMultiRole){
        
        this.base(hasMultiRole);
        
        if(!hasMultiRole || this.parent){
            
            var sizeAxis = this.axes.size;
            if(sizeAxis && !sizeAxis.isBound() && this._sizeRole.isBound()){
                sizeAxis.bind(this._buildRolesDataCells(this._sizeRole));
            }
            
            
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
    
     /**
      * @override 
      */
    _createMainContentPanel: function(parentPanel, baseOptions){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in MetricLineDot");
        }
        
        var options = this.options;
        
        return (this.scatterChartPanel = new pvc.MetricLineDotPanel(this, parentPanel, def.create(baseOptions, {
            showValues:         options.showValues,
            valuesAnchor:       options.valuesAnchor,
            showLines:          options.showLines,
            showDots:           options.showDots,
            orientation:        options.orientation,
            
            // Size axis
            sizeAxisRatio:       options.sizeAxisRatio,
            sizeAxisRatioTo:     options.sizeAxisRatioTo,
            autoDotSizePadding: options.autoDotSizePadding
        })));
    },
    
    defaults: def.create(pvc.MetricXYAbstract.prototype.defaults, {
        showDots:   false,
        showLines:  false,
        showValues: false,
        originIsZero: false,
        
        tipsySettings: { offset: 15 },
        
        /* Color Role */
        colorScaleType: "linear", // "discrete", "normal" (distribution) or "linear"
        colorRange: ['red', 'yellow','green'],
//        colorRangeInterval:  undefined,
//        minColor:  undefined, //"white",
//        maxColor:  undefined, //"darkgreen",
        nullColor: "#efc5ad"   // white with a shade of orange
         
        /* Size Role */
//      sizeAxisUseAbs: true,
//      sizeAxisFixedMin: undefined,
//      sizeAxisFixedMax: undefined,
//      sizeAxisOriginIsZero: false,

//      sizeAxisRatio:   undefined,
//      sizeAxisRatioTo: undefined,
//      autoDotSizePadding: undefined
    })
});

/**
 * Metric Dot Chart
 */
pvc.MetricDotChart = pvc.MetricLineDotAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showDots = true;
    }
});


/**
 * Metric Line Chart
 */
pvc.MetricLineChart = pvc.MetricLineDotAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showLines = true;
    }
});
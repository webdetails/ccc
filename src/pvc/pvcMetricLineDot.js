
/**
 * MetricLineDotAbstract is the base class of metric dot and line.
 */
pvc.MetricLineDotAbstract = pvc.MetricXYAbstract.extend({

    constructor: function(options){

        this.base(options);

        pvc.mergeDefaults(this.options, pvc.MetricLineDotAbstract.defaultOptions, options);

        var parent = this.parent;
        if(parent) {
            this._colorRole = parent._colorRole;
            this._dotSizeRole = parent._dotSizeRole;
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
        
        var isV1Compat = (this.options.compatVersion <= 1);
        
        this._addVisualRoles({
            color:  { 
                isMeasure: true, 
                //requireSingleDimension: true,  // TODO: generalize this...
                //requireIsDiscrete: false, 
                //valueType: Number,
                defaultDimensionName: isV1Compat ? 'value2' : 'value3'
            },
            dotSize: { 
                isMeasure: true, 
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: isV1Compat ? 'value3' : 'value4' 
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
    
     /**
      * @override 
      */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in MetricLineDot");
        }
        
        var options = this.options;
        
        return new pvc.MetricLineDotPanel(this, parentPanel, {
            showValues:    options.showValues,
            valuesAnchor:   options.valuesAnchor,
            showLines:      options.showLines,
            showDots:       options.showDots,
            orientation:    options.orientation,
            dotSizeRatio:   options.dotSizeRatio,
            dotSizeRatioTo: options.dotSizeRatioTo,
            autoDotSizePadding: options.autoDotSizePadding
        });
    }
}, {
    defaultOptions: {
        showDots:   false,
        showLines:  false,
        showValues: false,
        originIsZero: false,
        tipsySettings: def.create(pvc.BaseChart.defaultOptions.tipsySettings, { offset: 15 }),
        
        /* Dot Color Role */
        colorScaleType: "linear", // "discrete", "normal" (distribution) or "linear"
        colorRange: ['red', 'yellow','green'],
        colorRangeInterval:  undefined,
        minColor:  undefined, //"white",
        maxColor:  undefined, //"darkgreen",
        nullColor: "#efc5ad",  // white with a shade of orange
        
        /* Dot Size Role */
        dotSizeRatio:   undefined,
        dotSizeRatioTo: undefined,
        autoDotSizePadding: undefined
    }
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
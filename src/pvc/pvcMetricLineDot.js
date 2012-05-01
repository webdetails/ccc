
/**
 * MetricLineDotAbstract is the base class of metric dot and line.
 */
pvc.MetricLineDotAbstract = pvc.MetricXYAbstract.extend({

    constructor: function(options){

        this.base(options);

        pvc.mergeDefaults(this.options, pvc.MetricLineDotAbstract.defaultOptions, options);
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
                //singleValueType: Number,
                defaultDimensionName: isV1Compat ? 'value2' : 'value3'
            },
            dotSize: { 
                isMeasure: true, 
                requireSingleDimension: true,
                requireIsDiscrete: false,
                singleValueType: Number,
                defaultDimensionName: isV1Compat ? 'value3' : 'value4' 
            }
        });
    },
    
    _initData: function(keyArgs){
        this.base(keyArgs);
        
        if(!this.parent) {
            /* Maybe change the legend source role */
            var colorRoleGrouping = this.visualRoles('color').grouping;
            if(colorRoleGrouping){
                if(colorRoleGrouping.isDiscrete()){
                    // role is bound and discrete => change legend source
                    this.legendSource = 'color';
                } else {
                    /* The color legend has no use 
                     * but to, possibly, show/hide series, 
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
        pvc.log("Prerendering in MetricLineDot");

        var options = this.options;
        
        return new pvc.MetricLineDotPanel(this, parentPanel, {
            showValues:   options.showValues,
            valuesAnchor: options.valuesAnchor,
            showLines:    options.showLines,
            showDots:     options.showDots,
            orientation:  options.orientation
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
        nullColor: "#efc5ad"  // white with a shade of orange
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
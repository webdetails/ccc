
/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */
pvc.BarChart = pvc.CategoricalAbstract.extend({

    constructor: function(options){

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.BarChart.defaultOptions, options);
    },

    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options){

        options.waterfall = false;
        options.percentageNormalized = false;
        
        this.base(options);
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRoles({
            /* value: required, continuous, numeric */
            value:  { isMeasure: true, isRequired: true, isPercent: this.options.stacked,  isSingleDimension: true, isDiscrete: false, singleValueType: Number, defaultDimensionName: 'value' },
            
            /* value2: continuous, numeric */
            value2: { isMeasure: true, isPercent: this.options.stacked, isSingleDimension: true, isDiscrete: false, singleValueType: Number, defaultDimensionName: 'value2' }
        });
    },
    
    /**
     * @override 
     */
    _createMainContentPanel: function(parentPanel){
        pvc.log("Prerendering in barChart");
        
        var options = this.options;
        return new pvc.WaterfallChartPanel(this, parentPanel, {
            waterfall:    false,
            barSizeRatio: options.barSizeRatio,
            maxBarSize:   options.maxBarSize,
            showValues:   options.showValues,
            valuesAnchor: options.valuesAnchor,
            orientation:  options.orientation
        });
    }
}, {
    defaultOptions: {
        showValues:   true,
        barSizeRatio: 0.9,
        maxBarSize:   2000,
        valuesAnchor: "center"
    }
});


/***************
 *  removed BarChartPanel  (CvK)
 *
 * Refactored the CODE:  BarChartPanel is now replaced by the
 *    WaterfallChartPanel as the Waterfallchart code is easier to extend.
 *    (in a next refactoringstep we could take the waterfall specific
 *     code out of the Waterfallchart panel out and make 
 *     restore inherence to waterfall being a special case of barChart.
 *
 ***************/


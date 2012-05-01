
/**
 * A NormalizedBarChart is a 100% stacked bar chart.
 */
pvc.NormalizedBarChart = pvc.CategoricalAbstract.extend({

    constructor: function(options){

        this.base(options);

        // Apply options
        options = pvc.mergeDefaults(this.options, pvc.NormalizedBarChart.defaultOptions, options);
    },

    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options){

        options.waterfall = false;
        options.stacked = true;
        options.percentageNormalized = true;

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
            value: { isMeasure: true, isRequired: true, requireSingleDimension: true, requireIsDiscrete: false, singleValueType: Number, defaultDimensionName: 'value' }
        });
    },
    
    /* @override */
    _createMainContentPanel: function(parentPanel){
        pvc.log("Prerendering in NormalizedBarChart");

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
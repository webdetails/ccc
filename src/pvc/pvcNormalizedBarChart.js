
/**
 * A NormalizedBarChart is a 100% stacked bar chart.
 */
pvc.NormalizedBarChart = pvc.CategoricalAbstract.extend({

    barChartPanel : null,

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
    
    /* @override */
    createCategoricalPanel: function(){
        pvc.log("Prerendering in barChart");

        this.barChartPanel = new pvc.WaterfallChartPanel(this, {
            waterfall:          false,
            barSizeRatio:       this.options.barSizeRatio,
            maxBarSize:         this.options.maxBarSize,
            showValues:         this.options.showValues,
            valuesAnchor:       this.options.valuesAnchor,
            orientation:        this.options.orientation
        });
        
        return this.barChartPanel;
    }
}, {
    defaultOptions: {
        showValues:   true,
        barSizeRatio: 0.9,
        maxBarSize:   2000,
        valuesAnchor: "center"
    }
});
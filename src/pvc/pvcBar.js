
/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */
pvc.BarChart = pvc.CategoricalAbstract.extend({

    barChartPanel : null,

    constructor: function(options){

        this.base(options);

        // Apply options
        $.extend(this.options, pvc.BarChart.defaultOptions, options);
    },
    
    /**
     * Creates a custom WaterfallDataEngine.
     * @override
     */
    createDataEngine: function(){
        return new pvc.WaterfallDataEngine(this);
    },

    /* @override */
    createCategoricalPanel: function(){
        pvc.log("Prerendering in barChart");

        this.barChartPanel = new pvc.WaterfallChartPanel(this, {
            stacked:        this.options.stacked,
            waterfall:      false,
            barSizeRatio:   this.options.barSizeRatio,
            maxBarSize:     this.options.maxBarSize,
            showValues:     this.options.showValues,
            valuesAnchor:   this.options.valuesAnchor,
            orientation:    this.options.orientation
        });
        
        return this.barChartPanel;
    }
}, {
    defaultOptions: {
        showValues:   true,
        stacked:      false,
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


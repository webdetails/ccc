
/**
 * A NormalizedBarChart is a 100% stacked bar chart.
 */
pvc.NormalizedBarChart = pvc.BarAbstract.extend({

    constructor: function(options){

        options = def.set(options,
                    'stacked', true,
                    'percentageNormalized', true);

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.NormalizedBarChart.defaultOptions, options);
    },

    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options){

        options.stacked = true;
        options.percentageNormalized = true;

        this.base(options);
    },
    
    /* @override */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in NormalizedBarChart");
        }
        
        var options = this.options;
        return new pvc.NormalizedBarPanel(this, parentPanel, {
            barSizeRatio: options.barSizeRatio,
            maxBarSize:   options.maxBarSize,
            showValues:   options.showValues,
            valuesAnchor: options.valuesAnchor,
            orientation:  options.orientation
        });
    }
}, {
    defaultOptions: {
        showValuePercentage: true
    }
});
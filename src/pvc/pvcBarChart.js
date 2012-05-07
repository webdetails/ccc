
/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */
pvc.BarChart = pvc.BarAbstract.extend({

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
     * @override 
     */
    _createMainContentPanel: function(parentPanel){
        pvc.log("Prerendering in barChart");
        
        var options = this.options;
        return new pvc.BarPanel(this, parentPanel, {
            waterfall:    false,
            barSizeRatio: options.barSizeRatio,
            maxBarSize:   options.maxBarSize,
            showValues:   options.showValues,
            valuesAnchor: options.valuesAnchor,
            orientation:  options.orientation
        });
    }
});

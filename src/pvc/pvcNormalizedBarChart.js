
/**
 * A NormalizedBarChart is a 100% stacked bar chart.
 */
pvc.NormalizedBarChart = pvc.BarAbstract.extend({

    constructor: function(options){

        options = def.set(options, 'stacked', true);

        this.base(options);
    },

    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options){

        options.stacked = true;

        this.base(options);
    },

    /**
     * @override
     */
    _getVisibleValueExtentConstrained: function(axis, dataPartValue, min, max){
        if(axis.type === 'ortho') {
            /* 
             * Forces showing 0-100 in the axis.
             * Note that the bars are streched automatically by the band layout,
             * so this scale ends up being ignored by the bars.
             * Note also that each category would have a different scale,
             * so it isn't possible to provide a single correct scale.
             */
            min = 0;
            max = 100;
        }

        return this.base(axis, dataPartValue, min, max);
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
});
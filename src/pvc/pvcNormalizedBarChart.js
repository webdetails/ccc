
/**
 * A NormalizedBarChart is a 100% stacked bar chart.
 */
pvc.NormalizedBarChart = pvc.BarAbstract.extend({
    
    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options){
        // Still affects default data cell settings
        options.stacked = true;

        this.base(options);
    },

    /**
     * @override
     */
    _getContinuousVisibleExtentConstrained: function(axis, min, max){
        if(axis.type === 'ortho') {
            /* 
             * Forces showing 0-100 in the axis.
             * Note that the bars are stretched automatically by the band layout,
             * so this scale ends up being ignored by the bars.
             * Note also that each category would have a different scale,
             * so it isn't possible to provide a single correct scale,
             * that would satisfy all the bars...
             */
            min = 0;
            max = 100;
        }

        return this.base(axis, min, max);
    },

    /* @override */
    _createMainContentPanel: function(parentPanel, baseOptions){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in NormalizedBarChart");
        }
        
        var plot = new pvc.visual.NormalizedBarPlot(this);
        
        return (this.barChartPanel = new pvc.NormalizedBarPanel(this, parentPanel, plot, baseOptions));
    }
});
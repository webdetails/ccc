
/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */
pvc.BarChart = pvc.BarAbstract.extend({

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
        // TODO
        options.waterfall = false;
        options.percentageNormalized = false;
        
        this.base(options);
    },

    _hasDataPartRole: function(){
        return true;
    },

    _getAxisDataPart: function(axis){
        return this.options.secondAxis && axis.type === 'ortho' ? (''+axis.index) : null;
    },

    /**
     * @override 
     */
    _createMainContentPanel: function(parentPanel){
        pvc.log("Prerendering in barChart");
        
        var options = this.options;
        var barPanel = new pvc.BarPanel(this, parentPanel, {
            dataPartValue:  options.secondAxis ? '0' : null,
            barSizeRatio: options.barSizeRatio,
            maxBarSize:   options.maxBarSize,
            showValues:   options.showValues,
            valuesAnchor: options.valuesAnchor,
            orientation:  options.orientation
        });

        if(options.secondAxis){
            if(pvc.debug >= 3){
                pvc.log("Creating LineDotArea panel.");
            }
            
            var linePanel = new pvc.LineDotAreaPanel(this, parentPanel, {
                dataPartValue:  '1',
                stacked:        false,
                showValues:     !(options.compatVersion <= 1) && options.showValues,
                valuesAnchor:   options.valuesAnchor != 'center' ? options.valuesAnchor : 'right',
                showLines:      options.showLines,
                showDots:       options.showDots,
                showAreas:      options.showAreas,
                orientation:    options.orientation
            });

            this._secContentPanel = linePanel;
            
            barPanel._linePanel = linePanel;
        }
        
        return barPanel;
    }
}, {
    defaultOptions: {
        showDots: true,
        showLines: true,
        showAreas: false
    }
});

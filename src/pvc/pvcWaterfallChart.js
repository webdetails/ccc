
/**
 * WaterfallChart is the class that generates waterfall charts.
 *
 * The waterfall chart is an alternative to the pie chart for
 * showing distributions. The advantage of the waterfall chart is that
 * it possibilities to visualize sub-totals and offers more convenient
 * possibilities to compare the size of categories (in a pie-chart you
 * have to compare wedges that are at a different angle, which
 * requires some additional processing/brainpower of the end-user).
 *
 * Waterfall charts are basically Bar-charts with some added
 * functionality. Given the complexity of the added features this
 * class has it's own code-base. However, it would be easy to
 * derive a BarChart class from this class by switching off a few
 * features.
 *
 * If you have an issue or suggestions regarding the Waterfall-charts
 * please contact CvK at cde@vinzi.nl
 */
pvc.WaterfallChart = pvc.BarAbstract.extend({

    constructor: function(options){

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.WaterfallChart.defaultOptions, options);
    },

    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options){

        // Waterfall charts are always stacked and not percentageNormalized
        options.waterfall = true;
        options.stacked = true;
        options.percentageNormalized = false;

        this.base(options);
    },

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();

        // TODO: waterfall up/down/total control role
    },
    
    /**
     * Creates a custom WaterfallDataEngine.
     * [override]
     */
    createDataEngine: function(){
        return new pvc.WaterfallDataEngine(this);
    },

    /* @override */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in WaterfallChart");
        }
        
        var options = this.options;
        
        return new pvc.WaterfallPanel(this, parentPanel, {
            waterfall:    options.waterfall,
            barSizeRatio: options.barSizeRatio,
            maxBarSize:   options.maxBarSize,
            showValues:   options.showValues,
            orientation:  options.orientation
        });
    }
});

/*

pvc.WaterfallDataEngine = pvc.DataEngine.extend({
    constructor: function(chart){
        this.base(chart);
    },

    // Creates and prepares the custom WaterfallTranslator.
    // [override]
    createTranslator: function(){
        this.base();

        var sourceTranslator = this.translator;

        this.translator = new pvc.WaterfallTranslator(
                            sourceTranslator,
                            this.chart.options.waterfall,
                            this.chart.isOrientationVertical());

        pvc.log("Creating WaterfallTranslator wrapper");

        this.prepareTranslator();
    }
});

pvc.WaterfallTranslator = pvc.DataTranslator.extend({

    constructor: function(sourceTranslator, isWaterfall, isVertical){
        this.base();

        this.sourceTranslator = sourceTranslator;

        this.isWaterfall = isWaterfall;
        this.isVertical  = isVertical;
    },

    prepareImpl: function(){
        // Call base version
        this.base();

        
//         (Total column is for waterfall)
//         Values:
//         [["X",    "Ser1", "Ser2", "Ser3"],
//          ["Cat1", "U",      800,    1200],  // 1800 (depends on visible series)
//          ["Cat2", "D",      100,     600],  //  700
//          ["Cat3", "D",      400,     300],  //  700
//          ["Cat4", "D",      200,     100],  //  300
//          ["Cat5", "D",      100,     200]]  //  300
//        

        this.sourceTranslator.setData(this.metadata, this.resultset);
        this.sourceTranslator.dataEngine = this.dataEngine;
        this.sourceTranslator.prepareImpl();

        // The MultiValueTranslator doesn't support this kind of treatment...
        this.values = this.sourceTranslator.values;
        this.metadata = this.sourceTranslator.metadata;
        this.resultset = this.sourceTranslator.resultset;

        if(this.isWaterfall && this.isVertical){
            // Put the Total column in the last position
            //  so that when drawing, reversed,
            //  it remains at the bottom
            // ... ["Cat1",  800, 1200, "U"],
            // row[1] -> row[L-1]
            this.values = this.values.map(function(row){
                row = row.slice(0);
                row.push(row[1]);
                row.splice(1, 1);

                return row;
            });
        }
    }
});

*/


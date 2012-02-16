
/**
 * ScatterAbstract is the class that will be extended by dot, line, stackedline and area charts.
 */
pvc.MetricScatterAbstract = pvc.MetricAbstract.extend({

    scatterChartPanel : null,
  
    constructor: function(options){

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.MetricScatterAbstract.defaultOptions, options);
    },

     /* @override */
    createCategoricalPanel: function(){
        pvc.log("Prerendering in MetricScatterAbstract");

        this.scatterChartPanel = new pvc.MetricScatterChartPanel(this, {
            showValues: this.options.showValues,
            valuesAnchor: this.options.valuesAnchor,
            showLines: this.options.showLines,
            showDots: this.options.showDots,
            showAreas: this.options.showAreas,
            orientation: this.options.orientation
        });

        return this.scatterChartPanel;
    }
}, {
    defaultOptions: {
        showDots: false,
        showLines: false,
        showAreas: false,
        showValues: false,
        axisOffset: 0.05,
        valuesAnchor: "right",
        panelSizeRatio: 1
    }
});

/**
 * Metric Dot Chart
 */
pvc.MetricDotChart = pvc.MetricScatterAbstract.extend({

  constructor: function(options){

    this.base(options);

    this.options.showDots = true;
  }
});


/**
 * Metric Line Chart
 */
pvc.MetricLineChart = pvc.MetricScatterAbstract.extend({

  constructor: function(options){

    this.base(options);

    this.options.showLines = true;
  }
});

/**
 * Metric Stacked Line Chart
 */
pvc.mStackedLineChart = pvc.MetricScatterAbstract.extend({

  constructor: function(options){

    this.base(options);

    this.options.showLines = true;
    this.options.stacked = true;
  }
});

/**
 * Metric Stacked Area Chart
 */
pvc.mStackedAreaChart = pvc.MetricScatterAbstract.extend({

  constructor: function(options){

    this.base(options);

    this.options.showAreas = true;
    this.options.stacked = true;
  }
});

/**
 * ScatterAbstract is the class that will be extended by dot, line, stackedline and area charts.
 */
pvc.MetricScatterAbstract = pvc.MetricAbstract.extend({

    constructor: function(options){

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.MetricScatterAbstract.defaultOptions, options);
    },

     /* @override */
    _createMainContentPanel: function(parentPanel){
        pvc.log("Prerendering in MetricScatterAbstract");

        var options = this.options;
        return new pvc.MetricScatterChartPanel(this, parentPanel, {
            showValues:   options.showValues,
            valuesAnchor: options.valuesAnchor,
            showLines:    options.showLines,
            showDots:     options.showDots,
            showAreas:    options.showAreas,
            orientation:  options.orientation
        });
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
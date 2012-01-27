/**
 * ScatterAbstract is the class that will be extended by dot, line, stackedline and area charts.
 */
pvc.MetricScatterAbstract = pvc.MetricAbstract.extend({

    scatterChartPanel : null,
  
    constructor: function(o){

        this.base(o);

        var _defaults = {
            showDots: false,
            showLines: false,
            showAreas: false,
            showValues: false,
            axisOffset: 0.05,
            valuesAnchor: "right",
            stacked: false,
            panelSizeRatio: 1
        };

        // Apply options
        $.extend(this.options, _defaults, o);
    },

     /* @override */
    createCategoricalPanel: function(){
        pvc.log("Prerendering in MetricScatterAbstract");

        this.scatterChartPanel = new pvc.MetricScatterChartPanel(this, {
            stacked: this.options.stacked,
            showValues: this.options.showValues,
            valuesAnchor: this.options.valuesAnchor,
            showLines: this.options.showLines,
            showDots: this.options.showDots,
            showAreas: this.options.showAreas,
            orientation: this.options.orientation
        });

        return this.scatterChartPanel;
    }
});

/**
 * Metric Dot Chart
 *
 */

pvc.MetricDotChart = pvc.MetricScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: true
    };

    // Apply options
    $.extend(this.options,_defaults, o);

  }
});


/**
 * Metric Line Chart
 *
 */

pvc.MetricLineChart = pvc.MetricScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showLines: true
    };

    // Apply options
    $.extend(this.options,_defaults, o);
  }
});



/**
 * Metric Stacked Line Chart
 *
 */
pvc.mStackedLineChart = pvc.MetricScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showLines: true,
      stacked: true
    };

    // Apply options
    $.extend(this.options,_defaults, o);


  }
});


/**
 * Metric Stacked Area Chart
 *
 */

pvc.mStackedAreaChart = pvc.MetricScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showAreas: true,
      stacked: true
    };

    // Apply options
    $.extend(this.options,_defaults, o);
  }
});
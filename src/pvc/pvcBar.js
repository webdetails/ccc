


/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */

pvc.BarChart = pvc.CategoricalAbstract.extend({

  barChartPanel : null,

  constructor: function(o){

    this.base();

    var _defaults = {
      showValues: true,
      stackedBarChart: false,
      panelWidthRatio: 1,
      innerBandWidthRatio: 1,
      maxBarSize: 2000,
      originIsZero: true
    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering in barChart");


    this.barChartPanel = new pvc.BarChartPanel(this, {
      stacked: this.options.stackedBarChart,
      panelWidthRatio: this.options.panelWidthRatio,
      barWidthRatio: this.options.barWidthRatio,
      maxBarSize: this.options.maxBarSize,
      showValues: this.options.showValues
    });

    this.barChartPanel.appendTo(this.basePanel); // Add it

  },

  /*
   * Generic xx scale for testing purposes. Needs to be overriden per chart
   */

  getXScale: function(){


    var scale = new pv.Scale.ordinal(pv.range(0,this.dataEngine.getCategoriesSize()));

    if(this.options.yAxisPosition == "left"){
      scale.splitBanded( this.options.yAxisSize , this.basePanel.width, this.options.panelWidthRatio);
    }
    else{
      scale.splitBanded(0, this.basePanel.width - this.options.yAxisSize, this.options.panelWidthRatio);
    }

    return scale;
  },

  /*
   * Generic yy scale for testing purposes. Needs to be overriden per chart
   */

  getYScale: function(){

    var max = this.dataEngine.getSeriesAbsoluteMax();
    var min = this.dataEngine.getSeriesAbsoluteMin();
    if(min > 0 && this.options.originIsZero){
      min = 0
    }
    return new pv.Scale.linear(min,max);
  },

  /*
   * Generates the X axis. It's in a separate function to allow overriding this value
   */

  generateXAxis: function(){

    if (this.options.showXScale){

      this.xScale = this.getXScale(); // Get it again, since the ranges were overwritten
      
      this.xAxisPanel = new pvc.XAxisPanel(this, {
        ordinal: true,
        showAllTimeseries: false,
        anchor: this.options.xAxisPosition,
        axisSize: this.options.xAxisSize,
        oppositeAxisSize: this.options.yAxisSize,
        fullGrid:  this.options.xAxisFullGrid,
        elements: this.dataEngine.getCategories()
      });

      this.xAxisPanel.setScale(this.xScale);
      this.xAxisPanel.appendTo(this.basePanel); // Add it

    }


  }

}
);


/*
   * Bar chart panel. Generates a bar chart. Specific options are:
   * <i>showValues</i> - Show or hide bar value. Default: false
   * <i>stackedBarChart</i> -  Stacked? Default: false
   * <i>panelWidthRatio</i> - Ratio of the band occupied by the pane;. Default: 0.5 (50%)
   * <i>barWidthRatio</i> - In multiple series, percentage of inner
   * band occupied by bars. Default: 0.5 (50%)
   * <i>maxBarSize</i> - Maximum size of a bar in pixels. Default: 2000
   *
   * Has the following protovis extension points:
   *
   * <i>chart_</i> - for the main chart Panel
   * <i>bar_</i> - for the main bar wedge
   * <i>barLabel_</i> - for the main bar label
   */


pvc.BarChartPanel = pvc.BasePanel.extend({

  _parent: null,
  pvBar: null,
  pvBarLabel: null,
  data: null,

  stacked: false,
  panelWidthRatio: 1,
  barWidthRatio: 0.5,
  maxBarSize: 200,
  showValues: true,


  constructor: function(chart, options){

    this.base(chart,options);

  },

  create: function(){

    this.width = this._parent.width;
    this.height = this._parent.height;

    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)

    // Extend body

    var y = this.chart.yScale;
    var x = this.chart.getXScale()
    .splitBanded(0, this.chart.basePanel.width, this.chart.options.panelWidthRatio);

    // 1 - single series

    // We need to take into account the maxValue if our band is higher than that
    var maxBarSize = x.range().band;
    var barPositionOffset = 0;
    if (maxBarSize > this.maxBarSize){
      barPositionOffset = (maxBarSize - this.maxBarSize)/2 ;
      maxBarSize = this.maxBarSize;
    }

    this.pvBar = this.pvPanel.add(pv.Bar)
    .data(this.chart.dataEngine.getValuesForSeriesIdx(0))
    .left(function(d){
      return x(this.index) + barPositionOffset;
    })
    .bottom(0)
    .width(maxBarSize)
    .height(y)

    // Labels:

    if(this.showValues){
      this.pvBarLabel = this.pvBar
      .anchor("center")
      .add(pv.Label)
      .bottom(0)
      .text(pv.identity)

      this.extend(this.pvBarLabel,"barLabel_");
    }

    // Extend bar
    this.extend(this.pvBar,"bar_");
    
    // Extend barLabel
    this.extend(this.pvBarLabel,"barLabel_");


    // Extend body
    this.extend(this.pvPanel,"chart_");

  }

});
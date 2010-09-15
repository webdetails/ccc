


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
      panelSizeRatio: 1,
      innerBandWidthRatio: 1,
      maxBarSize: 2000,
      originIsZero: true,
      barOrientation: "vertical"
    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering in barChart");


    this.barChartPanel = new pvc.BarChartPanel(this, {
      stacked: this.options.stackedBarChart,
      panelSizeRatio: this.options.panelSizeRatio,
      barSizeRatio: this.options.barSizeRatio,
      maxBarSize: this.options.maxBarSize,
      showValues: this.options.showValues,
      barOrientation: this.options.barOrientation
    });

    this.barChartPanel.appendTo(this.basePanel); // Add it

  },

  /*
   * xx scale for bar chart
   */

  getXScale: function(){

    return this.options.barOrientation == "vertical"?
    this.getOrdinalScale():
    this.getLinearScale();

  },

  /*
   * yy scale for bar chart
   */

  getYScale: function(){

    return this.options.barOrientation == "vertical"?
    this.getLinearScale():
    this.getOrdinalScale();
  },

  /*
   * Scale for the ordinal axis. xx if barOrientation is vertical, yy otherwise
   *
   */
  getOrdinalScale: function(){

    var scale = new pv.Scale.ordinal(pv.range(0,this.dataEngine.getCategoriesSize()));

    var size = this.options.barOrientation=="vertical"?this.basePanel.width:this.basePanel.height;

    if(this.options.barOrientation=="vertical" && this.options.yAxisPosition == "left"){
      scale.splitBanded( this.options.yAxisSize , size, this.options.panelSizeRatio);
    }
    else if(this.options.barOrientation=="vertical" && this.options.yAxisPosition == "right"){
      scale.splitBanded(0, size - this.options.yAxisSize, this.options.panelSizeRatio);
    }
    else{
      scale.splitBanded(0, size - this.options.xAxisSize, this.options.panelSizeRatio);
    }

    return scale;



  },

  /*
   * Scale for the linear axis. yy if barOrientation is vertical, xx otherwise
   *
   */
  getLinearScale: function(){


    var size = this.options.barOrientation=="vertical"?
    this.basePanel.height - this.options.xAxisSize:
    this.basePanel.width;

    var max, min;

    if(this.options.stackedBarChart){
      max = this.dataEngine.getCategoriesMaxSum();
      min = 0;
    }
    else{
      max = this.dataEngine.getSeriesAbsoluteMax();
      min = this.dataEngine.getSeriesAbsoluteMin();

    }
    if(min > 0 && this.options.originIsZero){
      min = 0
    }
    return new pv.Scale.linear(min,max).range(0, size );
    

  },

  /*
   * Indicates if xx is an ordinal scale
   */

  isXAxisOrdinal: function(){
    return this.options.barOrientation == "vertical";
  },


  /*
   * Indicates if yy is an ordinal scale
   */

  isYAxisOrdinal: function(){
    return this.options.barOrientation == "horizontal";
  },

  /*
   *  List of elements to use in the axis ordinal
   *
   */
  getAxisOrdinalElements: function(){
    return this.dataEngine.getCategories();
  }



}
);


/*
 * Bar chart panel. Generates a bar chart. Specific options are:
 * <i>barOrientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide bar value. Default: false
 * <i>stackedBarChart</i> -  Stacked? Default: false
 * <i>panelSizeRatio</i> - Ratio of the band occupied by the pane;. Default: 0.5 (50%)
 * <i>barSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by bars. Default: 0.5 (50%)
 * <i>maxBarSize</i> - Maximum size of a bar in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>bar_</i> - for the actual bar
 * <i>barPanel_</i> - for the panel where the bars sit
 * <i>barLabel_</i> - for the main bar label
 */


pvc.BarChartPanel = pvc.BasePanel.extend({

  _parent: null,
  pvBar: null,
  pvBarLabel: null,
  pvCategoryPanel: null,
  data: null,

  stacked: false,
  panelSizeRatio: 1,
  barSizeRatio: 0.5,
  maxBarSize: 200,
  showValues: true,
  barOrientation: "vertical",


  constructor: function(chart, options){

    this.base(chart,options);

  },

  create: function(){

    var myself = this;
    this.width = this._parent.width;
    this.height = this._parent.height;

    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)

    var anchor = this.barOrientation == "vertical"?"bottom":"left";

    // Extend body, resetting axisSizes
    this.chart.options.yAxisSize = 0;
    this.chart.options.xAxisSize = 0;

    var lScale = this.chart.getLinearScale();
    var oScale = this.chart.getOrdinalScale();
    
    
    var maxBarSize;


    // Stacked?
    if (this.stacked){


      maxBarSize = oScale.range().band;
      var bScale = new pv.Scale.ordinal([0])
      .splitBanded(0, oScale.range().band, this.barSizeRatio);


      var barPositionOffset = 0;
      if (maxBarSize > this.maxBarSize){
        barPositionOffset = (maxBarSize - this.maxBarSize)/2 ;
        maxBarSize = this.maxBarSize;
      }
      
     
      this.pvBarPanel = this.pvPanel.add(pv.Layout.Stack)
      /*
      .orient(anchor)
      .order("inside-out")
      .offset("wiggle")*/
      .layers(this.chart.dataEngine.getTransposedValues())
      [this.barOrientation == "vertical"?"y":"x"](function(d){
        return myself.chart.animate(0, lScale(d||0))
      })
      [this.barOrientation == "vertical"?"x":"y"](oScale.by(pv.index))

      this.pvBar = this.pvBarPanel.layer.add(pv.Bar)
      .data(function(d){return d||0})
      [pvc.BasePanel.paralelLength[anchor]](maxBarSize)

    /*[pvc.BasePanel.relativeAnchor[anchor]](function(d){
        return this.parent.left() + barPositionOffset
      })*/;

    }
    else{

      var bScale = new pv.Scale.ordinal(pv.range(0,this.chart.dataEngine.getSeriesSize()))
      .splitBanded(0, oScale.range().band, this.barSizeRatio);

      // We need to take into account the maxValue if our band is higher than that
      maxBarSize = bScale.range().band;
      var barPositionOffset = 0;
      if (maxBarSize > this.maxBarSize){
        barPositionOffset = (maxBarSize - this.maxBarSize)/2 ;
        maxBarSize = this.maxBarSize;
      }

      this.pvBarPanel = this.pvPanel.add(pv.Panel)
      .data(pv.range(0,this.chart.dataEngine.getCategoriesSize()))
      [pvc.BasePanel.relativeAnchor[anchor]](function(d){
        return oScale(this.index) + barPositionOffset;
      })
      [anchor](0)
      [pvc.BasePanel.paralelLength[anchor]](oScale.range().band)
      [pvc.BasePanel.orthogonalLength[anchor]](this[pvc.BasePanel.orthogonalLength[anchor]])


      this.pvBar = this.pvBarPanel.add(pv.Bar)
      .data(function(d){
        return myself.chart.dataEngine.getValuesForCategoryIdx(d)
        })
      .fillStyle(pv.Colors.category20().by(pv.index))
      [pvc.BasePanel.relativeAnchor[anchor]](function(d){
        return bScale(this.index) + barPositionOffset;
      })
      [anchor](0)
      [pvc.BasePanel.orthogonalLength[anchor]](function(d){
        return myself.chart.animate(0, lScale(d||0))
      })
      [pvc.BasePanel.paralelLength[anchor]](maxBarSize)

    }
    // Labels:

    this.pvBar
    .title(function(d){
      return  typeof d == "undefined"?"":d.toFixed(1);
    })
    .event("mouseover", pv.Behavior.tipsy({
      gravity: "s",
      fade: true
    }))
    .cursor("pointer")
    .event("click",function(d){
      pvc.log("You clicked on index " + this.index + ", value " + d);
    });

    if(this.showValues){
      this.pvBarLabel = this.pvBar
      .anchor("center")
      .add(pv.Label)
      .bottom(0)
      .text(pv.identity)

      // Extend barLabel
      this.extend(this.pvBarLabel,"barLabel_");
    }


    // Extend bar and barPanel
    this.extend(this.pvBar,"barPanel_");
    this.extend(this.pvBar,"bar_");
    

    // Extend body
    this.extend(this.pvPanel,"chart_");

  }

});
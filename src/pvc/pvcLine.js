


/**
 * LineChart is the main class for generating... line charts (another surprise!).
 */

pvc.LineChart = pvc.CategoricalAbstract.extend({

  lineChartPanel : null,

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: false,
      showValues: false,
      stackedLineChart: false,
      originIsZero: true,
      lineOrientation: "vertical",
      timeSeries: false,
      timeSeriesFormat: "%Y-%m-%d"
    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering in lineChart");


    this.lineChartPanel = new pvc.LineChartPanel(this, {
      stacked: this.options.stackedLineChart,
      showValues: this.options.showValues,
      showDots: this.options.showDots,
      lineOrientation: this.options.lineOrientation
    });

    this.lineChartPanel.appendTo(this.basePanel); // Add it

  },

  /*
   * xx scale for line chart
   */

  getXScale: function(){

    return this.options.lineOrientation == "vertical"?
    this.getOrdinalScale():
    this.getLinearScale();

  },

  /*
   * yy scale for line chart
   */

  getYScale: function(){

    return this.options.lineOrientation == "vertical"?
    this.getLinearScale():
    this.getOrdinalScale();
  },

  /*
   * Scale for the ordinal axis. xx if lineOrientation is vertical, yy otherwise
   *
   */
  getOrdinalScale: function(){

    var scale = new pv.Scale.ordinal(pv.range(0,this.dataEngine.getCategoriesSize()));

    var size = this.options.lineOrientation=="vertical"?this.basePanel.width:this.basePanel.height;

    if(this.options.lineOrientation=="vertical" && this.options.yAxisPosition == "left"){
      scale.splitBanded( this.options.yAxisSize , size, 1);
    }
    else if(this.options.lineOrientation=="vertical" && this.options.yAxisPosition == "right"){
      scale.splitBanded(0, size - this.options.yAxisSize, 1);
    }
    else{
      scale.splitBanded(0, size - this.options.xAxisSize, 1);
    }

    return scale;



  },

  /*
   * Scale for the linear axis. yy if lineOrientation is vertical, xx otherwise
   *
   */
  getLinearScale: function(){


    var size = this.options.lineOrientation=="vertical"?
    this.basePanel.height - this.options.xAxisSize:
    this.basePanel.width;

    var max, min;

    if(this.options.stackedLineChart){
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
    return this.options.lineOrientation == "vertical";
  },


  /*
   * Indicates if yy is an ordinal scale
   */

  isYAxisOrdinal: function(){
    return this.options.lineOrientation == "horizontal";
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
 * Line chart panel. Generates a line chart. Specific options are:
 * <i>lineOrientation</i> - horizontal or vertical. Default: vertical
 * <i>showDots</i> - Show or hide dots. Default: true
 * <i>showValues</i> - Show or hide line value. Default: false
 * <i>stackedLineChart</i> -  Stacked? Default: false
 * <i>panelSizeRatio</i> - Ratio of the band occupied by the pane;. Default: 0.5 (50%)
 * <i>lineSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by lines. Default: 0.5 (50%)
 * <i>maxLineSize</i> - Maximum size of a line in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>line_</i> - for the actual line
 * <i>linePanel_</i> - for the panel where the lines sit
 * <i>lineDot_</i> - the dots on the line
 * <i>lineLabel_</i> - for the main line label
 */


pvc.LineChartPanel = pvc.BasePanel.extend({

  _parent: null,
  pvLine: null,
  pvLineDot: null,
  pvLineLabel: null,
  pvCategoryPanel: null,
  data: null,

  timeSeries: false,
  timeSeriesFormat: "%Y-%m-%d",

  stacked: false,
  panelSizeRatio: 1,
  lineSizeRatio: 0.5,
  maxLineSize: 200,
  showValues: true,
  showDots: true,
  lineOrientation: "vertical",


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

    var anchor = this.lineOrientation == "vertical"?"bottom":"left";

    // Extend body, resetting axisSizes
    this.chart.options.yAxisSize = 0;
    this.chart.options.xAxisSize = 0;

    var lScale = this.chart.getLinearScale();
    var oScale = this.chart.getOrdinalScale();
    
    
    var maxLineSize;


    // Stacked?
    if (this.stacked){


      maxLineSize = oScale.range().band;
      var bScale = new pv.Scale.ordinal([0])
      .splitBanded(0, oScale.range().band, this.lineSizeRatio);


      this.pvLinePanel = this.pvPanel.add(pv.Layout.Stack)
      .layers(this.chart.dataEngine.getTransposedValues())
      [this.lineOrientation == "vertical"?"x":"y"](function(){
        return oScale(this.index)
      })
      [this.lineOrientation == "vertical"?"y":"x"](lScale)

      this.pvLine = this.pvLinePanel.layer.add(pv.Line)
      [pvc.BasePanel.paralelLength[anchor]](maxLineSize)

    }
    else{


      this.pvLinePanel = this.pvPanel.add(pv.Panel)
      .data(pv.range(0,this.chart.dataEngine.getSeriesSize()))


      this.pvLine = this.pvLinePanel.add(pv.Line)
      .data(function(d){
        return myself.chart.dataEngine.getObjectsForSeriesIdx(d)
      })
      //.strokeStyle(pv.Colors.category20().by(pv.index))
      [pvc.BasePanel.relativeAnchor[anchor]](function(d){
        return oScale(d.category) + oScale.range().band/2;
      })
      [anchor](function(d){
        return myself.chart.animate(0,lScale(d.value));
      })
   

    }
    // Labels:

    //this.pvPanel.event("mousemove", pv.Behavior.point(Infinity).collapse("y"));
    this.chart.basePanel.pvPanel
    .events("all")
    .event("mousemove", pv.Behavior.point(Infinity));

    this.pvLine
    .text(function(d){
      return d.value.toFixed(1)
    })
    .event("point", pv.Behavior.tipsy({
      gravity: "s",
      fade: true
    }))


    this.pvLineDot = this.pvLine.add(pv.Dot)
    .shapeSize(this.showDots?20:0)
    .cursor("pointer")
    .event("click",function(d){
      pvc.log("You clicked on index " + this.index + ", value " + d.value );
    });

    if(this.showValues){
      this.pvLineLabel = this.pvLineDot
      .anchor("bottom")
      .add(pv.Label)
      .bottom(0)
      .text(pv.identity)

      // Extend lineLabel
      this.extend(this.pvLineLabel,"lineLabel_");
    }


    // Extend line and linePanel
    this.extend(this.pvLine,"linePanel_");
    this.extend(this.pvLine,"line_");
    

    // Extend body
    this.extend(this.pvPanel,"chart_");

  }

});
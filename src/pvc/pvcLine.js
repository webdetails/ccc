


/**
 * ScatterAbstract is the class that will be extended by dot, line, stackedline and area charts.
 */

pvc.ScatterAbstract = pvc.CategoricalAbstract.extend({

  scatterChartPanel : null,

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: false,
      showLines: false,
      showAreas: false,
      showValues: false,
      axisOffset: 0.05,
      valuesAnchor: "right",
      stacked: false,
      originIsZero: true,
      orientation: "vertical",
      timeSeries: false,
      timeSeriesFormat: "%Y-%m-%d"
    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering in ScatterAbstract");


    this.scatterChartPanel = new pvc.ScatterChartPanel(this, {
      stacked: this.options.stacked,
      showValues: this.options.showValues,
      valuesAnchor: this.options.valuesAnchor,
      showLines: this.options.showLines,
      showDots: this.options.showDots,
      showAreas: this.options.showAreas,
      orientation: this.options.orientation,
      timeSeries: this.options.timeSeries,
      timeSeriesFormat: this.options.timeSeriesFormat
    });

    this.scatterChartPanel.appendTo(this.basePanel); // Add it

  },

  /*
   * xx scale for line chart
   */

  getXScale: function(){

    return this.options.orientation == "vertical"?
    (this.options.timeSeries?this.getTimeseriesScale():this.getOrdinalScale()):
    this.getLinearScale();

  },

  /*
   * yy scale for line chart
   */

  getYScale: function(){

    return this.options.orientation == "vertical"?
    this.getLinearScale():
    (this.options.timeSeries?this.getTimeseriesScale():this.getOrdinalScale());
  },

  /*
   * Scale for the ordinal axis. xx if orientation is vertical, yy otherwise
   *
   */
  getOrdinalScale: function(){

    var scale = new pv.Scale.ordinal(pv.range(0,this.dataEngine.getCategoriesSize()));

    var size = this.options.orientation=="vertical"?this.basePanel.width:this.basePanel.height;

    if(this.options.orientation=="vertical" && this.options.yAxisPosition == "left"){
      scale.splitBanded( this.options.yAxisSize , size, 1);
    }
    else if(this.options.orientation=="vertical" && this.options.yAxisPosition == "right"){
      scale.splitBanded(0, size - this.options.yAxisSize, 1);
    }
    else{
      scale.splitBanded(0, size - this.options.xAxisSize, 1);
    }

    return scale;



  },

  /*
   * Scale for the linear axis. yy if orientation is vertical, xx otherwise
   *
   */
  getLinearScale: function(){

    var size = this.options.orientation=="vertical"?
    this.basePanel.height - this.options.xAxisSize:
    this.basePanel.width;

    var max, min;

    if(this.options.stacked){
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

    // Adding a small offset to the scale:
    var offset = (max - min) * this.options.axisOffset;

    return new pv.Scale.linear(min - offset,max + offset).range(0, size );
    

  },

  /*
   * Scale for the timeseries axis. xx if orientation is vertical, yy otherwise
   *
   */
  getTimeseriesScale: function(){


    var size = this.options.orientation=="vertical"?
    this.basePanel.width:
    this.basePanel.height - this.options.xAxisSize;

    var parser = pv.Format.date(this.options.timeSeriesFormat);
    var categories =  this.dataEngine.getCategories().sort(function(a,b){
      return parser.parse(a) - parser.parse(b)
    });


    // Adding a small offset to the scale:
    var max = parser.parse(categories[categories.length -1]);
    var min = parser.parse(categories[0]);
    var offset = (max.getTime() - min.getTime()) * this.options.axisOffset;

    var scale = new pv.Scale.linear(new Date(min.getTime() - offset),new Date(max.getTime() + offset));

    if(this.options.orientation=="vertical" && this.options.yAxisPosition == "left"){
      scale.range( this.options.yAxisSize , size);
    }
    else if(this.options.orientation=="vertical" && this.options.yAxisPosition == "right"){
      scale.range(0, size - this.options.yAxisSize);
    }
    else{
      scale.range(0, size - this.options.xAxisSize);
    }

    return scale;


  },

  /*
   * Indicates if xx is an ordinal scale
   */

  isXAxisOrdinal: function(){
    return this.options.orientation == "vertical" && !this.options.timeSeries;
  },


  /*
   * Indicates if yy is an ordinal scale
   */

  isYAxisOrdinal: function(){
    return this.options.orientation == "horizontal" && !this.options.timeSeries;
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

/**
 * Dot Chart
 *
 */

pvc.DotChart = pvc.ScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: true,
      showLines: false,
      showAreas: false,
      showValues: false,
      stacked: false
    };

    // Apply options
    $.extend(this.options,_defaults, o);

  }
});


/**
 * Line Chart
 *
 */

pvc.LineChart = pvc.ScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: false, // ask
      showLines: true,
      showAreas: false,
      showValues: false,
      stacked: false
    };

    // Apply options
    $.extend(this.options,_defaults, o);


  }
});



/**
 * Stacked Line Chart
 *
 */

pvc.StackedLineChart = pvc.ScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: false, // ask
      showLines: true,
      showAreas: false,
      showValues: false,
      stacked: true
    };

    // Apply options
    $.extend(this.options,_defaults, o);


  }
});


/**
 * Stacked Area Chart
 *
 */

pvc.StackedAreaChart = pvc.ScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: false, // ask
      showLines: false,
      showAreas: true,
      showValues: false,
      stacked: true
    };

    // Apply options
    $.extend(this.options,_defaults, o);


  }
});



/*
 * Scatter chart panel. Base class for generating the other xy charts. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showDots</i> - Show or hide dots. Default: true
 * <i>showValues</i> - Show or hide line value. Default: false
 * <i>stacked</i> -  Stacked? Default: false
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


pvc.ScatterChartPanel = pvc.BasePanel.extend({

  _parent: null,
  pvLine: null,
  pvArea: null,
  pvDot: null,
  pvLabel: null,
  pvCategoryPanel: null,
  data: null,

  timeSeries: false,
  timeSeriesFormat: "%Y-%m-%d",

  stacked: false,
  showAreas: false,
  showLines: true,
  showDots: true,
  showValues: true,
  valuesAnchor: "right",
  orientation: "vertical",


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

    var anchor = this.orientation == "vertical"?"bottom":"left";

    // Extend body, resetting axisSizes
    this.chart.options.yAxisSize = 0;
    this.chart.options.xAxisSize = 0;

    var lScale = this.chart.getLinearScale();
    var oScale = this.chart.getOrdinalScale();
    var tScale = this.chart.getTimeseriesScale();
    var parser = pv.Format.date(this.timeSeriesFormat);
    
    var maxLineSize;


    // Stacked?
    if (this.stacked){

      
      this.pvScatterPanel = this.pvPanel.add(pv.Layout.Stack)
      .layers(this.chart.dataEngine.getTransposedValues())
      [this.orientation == "vertical"?"x":"y"](function(){
        if(myself.timeSeries){
          return tScale(parser.parse(myself.chart.dataEngine.getCategories()[this.index]));
        }
        else{
          return oScale(parser.parse(myself.chart.dataEngine.getCategories()[this.index])) + oScale.range().band/2;
        }
      })
      [this.orientation == "vertical"?"y":"x"](function(d){
        return myself.chart.animate(0,lScale(d));
      })

      this.pvArea = this.pvScatterPanel.layer.add(pv.Area)
      .fillStyle(this.showAreas?pv.Colors.category10().by(pv.parent):null);

      this.pvLine = this.pvArea.anchor("top").add(pv.Line)
      .lineWidth(this.showLines?1.5:0);
    //[pvc.BasePanel.paralelLength[anchor]](maxLineSize)
      
    }
    else{

      this.pvScatterPanel = this.pvPanel.add(pv.Panel)
      .data(pv.range(0,this.chart.dataEngine.getSeriesSize()))

      this.pvArea = this.pvScatterPanel.add(pv.Area)
      .fillStyle(this.showAreas?pv.Colors.category10().by(pv.parent):null);

      this.pvLine = this.pvArea.add(pv.Line)
      .data(function(d){
        return myself.chart.dataEngine.getObjectsForSeriesIdx(d, this.timeSeries?function(a,b){
          return parser.parse(a.category) - parser.parse(b.category);
          }: null)
        })
      .lineWidth(this.showLines?1.5:0)
      //.strokeStyle(pv.Colors.category20().by(pv.index))
      [pvc.BasePanel.relativeAnchor[anchor]](function(d){

        if(myself.timeSeries){
          return tScale(parser.parse(d.category));
        }
        else{
          return oScale(d.category) + oScale.range().band/2;
        }

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
      if( typeof d == "object"){
        return d.value.toFixed(1);
      }
      else return d.toFixed(1);
    })
    .event("point", pv.Behavior.tipsy({
      gravity: "s",
      fade: true
    }))


    this.pvDot = this.pvLine.add(pv.Dot)
    .shapeSize(this.showDots?20:0)
    .lineWidth(this.showDots?1.5:0)
    //.strokeStyle(pv.Colors.category20().by(pv.index))
    .cursor("pointer")
    .event("click",function(d){
      pvc.log("You clicked on index " + this.index + ", value " + d.value );
    });

    if(this.showValues){
      this.pvLabel = this.pvDot
      .anchor(this.valuesAnchor)
      .add(pv.Label)
      .bottom(0)
      .text(function(d){
        if( typeof d == "object"){
          return d.value.toFixed(1);
        }
        else return d.toFixed(1);
      })

      // Extend lineLabel
      this.extend(this.pvLabel,"lineLabel_");
    }


    // Extend line and linePanel
    this.extend(this.pvScatterPanel,"scatterPanel_");
    this.extend(this.pvArea,"area_");
    this.extend(this.pvLine,"line_");
    this.extend(this.pvDot,"dot_");
    this.extend(this.pvLabel,"label_");


    // Extend body
    this.extend(this.pvPanel,"chart_");

  }

});
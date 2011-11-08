


/**
 * ScatterAbstract is the class that will be extended by dot, line, stackedline and area charts.
 */

pvc.ScatterAbstract = pvc.CategoricalAbstract.extend({

  scatterChartPanel : null,
  tipsySettings: {
    gravity: "s",
    fade: true
  },

  constructor: function(o){

    this.base(o);

    var _defaults = {
      showDots: false,
      showLines: false,
      showAreas: false,
      showValues: false,
      showTooltips: true,
      axisOffset: 0.05,
      valuesAnchor: "right",
      stacked: false,
      originIsZero: true,
      orientation: "vertical",
      timeSeries: false,
      timeSeriesFormat: "%Y-%m-%d",
      panelSizeRatio: 1,
      orthoFixedMin: null,
      orthoFixedMax: null
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
      showTooltips: this.options.showTooltips,
      orientation: this.options.orientation,
      timeSeries: this.options.timeSeries,
      timeSeriesFormat: this.options.timeSeriesFormat
    });

    this.scatterChartPanel.appendTo(this.basePanel); // Add it

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
  showTooltips: true,
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
    .height(this.height);

    // add clipping for bounds
    if  (   (myself.chart.options.orthoFixedMin != null)
      || (myself.chart.options.orthoFixedMax != null) )
      this.pvPanel["overflow"]("hidden");

    if(this.showTooltips || this.chart.options.clickable ){
      this.pvPanel
      .events("all")
      .event("mousemove", pv.Behavior.point(Infinity));
    }

    var anchor = this.orientation == "vertical"?"bottom":"left";

    // Extend body, resetting axisSizes

    var lScale = this.chart.getLinearScale(true);
    var oScale = this.chart.getOrdinalScale(true);
    var tScale;
    if(this.timeSeries){
      tScale = this.chart.getTimeseriesScale(true,true);
    }
    
    var parser = pv.Format.date(this.timeSeriesFormat);
    
    var colors = this.chart.colors(pv.range(this.chart.dataEngine.getSeriesSize()));
    var colorFunc = function(d){
      // return colors(d.serieIndex)
      return colors(myself.chart.dataEngine.getVisibleSeriesIndexes()[this.parent.index])
    };

    // Stacked?
    if (this.stacked){
      
      this.pvScatterPanel = this.pvPanel.add(pv.Layout.Stack)
      .layers(pvc.padMatrixWithZeros(this.chart.dataEngine.getVisibleTransposedValues()))
      [this.orientation == "vertical"?"x":"y"](function(){
        if(myself.timeSeries){
          return tScale(parser.parse(myself.chart.dataEngine.getCategoryByIndex(this.index)));
        }
        else{
          return oScale(myself.chart.dataEngine.getCategoryByIndex(this.index)) + oScale.range().band/2;
        }
      })
      [anchor](lScale(0))
      [this.orientation == "vertical"?"y":"x"](function(d){
        return myself.chart.animate(0,lScale(d)-lScale(0));
      })

      this.pvArea = this.pvScatterPanel.layer.add(pv.Area)
      .fillStyle(this.showAreas?colorFunc:null);

      this.pvLine = this.pvArea.anchor(pvc.BasePanel.oppositeAnchor[anchor]).add(pv.Line)
      .lineWidth(this.showLines?1.5:0.001);
    //[pvc.BasePanel.paralelLength[anchor]](maxLineSize)
      
    }
    else{

      this.pvScatterPanel = this.pvPanel.add(pv.Panel)
      .data(this.chart.dataEngine.getVisibleSeriesIndexes())

      this.pvArea = this.pvScatterPanel.add(pv.Area)
      .fillStyle(this.showAreas?colorFunc:null);

      this.pvLine = this.pvArea.add(pv.Line)
      .data(function(d){
        return myself.chart.dataEngine.getObjectsForSeriesIndex(d, this.timeSeries?function(a,b){
          return parser.parse(a.category) - parser.parse(b.category);
          }: null)
        })
      .lineWidth(this.showLines?1.5:0.001)
      .segmented(true)
      .visible(function(d) {
        return d.value==null?false:true;
      })
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

    
    this.pvLine
    .strokeStyle(colorFunc)
    .text(function(d){
      var v, c;
      var s = myself.chart.dataEngine.getVisibleSeries()[this.parent.index]
      if( d != null && typeof d == "object"){
        v = d.value;
        c = d.category
      }
      else{
        v = d
        c = myself.chart.dataEngine.getVisibleCategories()[this.index]
      };
      return myself.chart.options.tooltipFormat.call(myself,s,c,v);
    })

    if(this.showTooltips){
      this.extend(this.chart.tipsySettings,"tooltip_");
      this.pvLine
      .event("point", pv.Behavior.tipsy(this.chart.tipsySettings));
    }

    this.pvDot = this.pvLine.add(pv.Dot)
    .shapeSize(12)
    .lineWidth(1.5)
    .strokeStyle(this.showDots?colorFunc:null)
    .fillStyle(this.showDots?colorFunc:null)
    

    if (this.chart.options.clickable){
      this.pvDot
      .cursor("pointer")
      .event("click",function(d){
        var v, c;
        var s = myself.chart.dataEngine.getSeries()[this.parent.index];
        var elem = this.scene.$g.childNodes[this.index];
        if(  d != null && typeof d == "object"){
          v = d.value;
          c = d.category
        }
        else{
          v = d
          c = myself.chart.dataEngine.getCategories()[this.index]
        }
        return myself.chart.options.clickAction(s,c, v, elem);
      });
    }



    if(this.showValues){
      this.pvLabel = this.pvDot
      .anchor(this.valuesAnchor)
      .add(pv.Label)
      .bottom(0)
      .text(function(d){
        return myself.chart.options.valueFormat( (d != null && typeof d == "object")?d.value:d)
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

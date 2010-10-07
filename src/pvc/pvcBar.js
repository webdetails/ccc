


/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */

pvc.BarChart = pvc.CategoricalAbstract.extend({

  barChartPanel : null,

  constructor: function(o){

    this.base();

    var _defaults = {
      showValues: true,
      stacked: false,
      panelSizeRatio: 0.9,
      barSizeRatio: 0.9,
      maxBarSize: 2000,
      originIsZero: true,
      axisOffset: 0.05,
      orientation: "vertical"
    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering in barChart");


    this.barChartPanel = new pvc.BarChartPanel(this, {
      stacked: this.options.stacked,
      panelSizeRatio: this.options.panelSizeRatio,
      barSizeRatio: this.options.barSizeRatio,
      maxBarSize: this.options.maxBarSize,
      showValues: this.options.showValues,
      orientation: this.options.orientation
    });

    this.barChartPanel.appendTo(this.basePanel); // Add it

  }

}
);


/*
 * Bar chart panel. Generates a bar chart. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide bar value. Default: false
 * <i>stacked</i> -  Stacked? Default: false
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
      [this.orientation == "vertical"?"y":"x"](function(d){
        return myself.chart.animate(0, lScale(d||0))
      })
      [this.orientation == "vertical"?"x":"y"](oScale.by(pv.index))

      this.pvBar = this.pvBarPanel.layer.add(pv.Bar)
      .data(function(d){
        return d||0
      })
      [pvc.BasePanel.paralelLength[anchor]](maxBarSize)
      .fillStyle(this.chart.colors().by(pv.parent))

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
      .fillStyle(this.chart.colors().by(pv.index))
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
      var v = myself.chart.options.valueFormat(d);
      var s = myself.chart.dataEngine.getSeries()[myself.stacked?this.parent.index:this.index]
      var c = myself.chart.dataEngine.getCategories()[myself.stacked?this.index:this.parent.index]
      return myself.chart.options.tooltipFormat(s,c, v);
    
    })
    .event("mouseover", pv.Behavior.tipsy({
      gravity: "s",
      fade: true
    }));

    if (this.chart.options.clickable){
      this.pvBar
      .cursor("pointer")
      .event("click",function(d){
        var s = myself.chart.dataEngine.getSeries()[myself.stacked?this.parent.index:this.index]
        var c = myself.chart.dataEngine.getCategories()[myself.stacked?this.index:this.parent.index]
        return myself.chart.options.clickAction(s,c, d);
      });
    }

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
/*********
 *  Panel use to draw line and dotCharts
 *     LScatter is for graphs with a linear base-axis
 *
 *  The original ScatterChartPanel was difficult to generalize as
 *  many (scattered) changes were needed in the long create function.
 *     OScatter could be develofor graphs with a ordinal base-axis
 *
 *  Later we might consider to merge LScatter and OScatter again, and 
 *  refactor the general stuff to an abstract base class.
 *********/


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


pvc.MetricScatterChartPanel = pvc.BasePanel.extend({

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


  prepareDataFunctions:  function() {
    /*
        This function implements a number of helper functions via
        closures. The helper functions are all stored in this.DF
        Overriding this function allows you to implement
        a different ScatterScart.
     */
    var myself = this;

    var baseScale = this.chart.getLinearBaseScale(true);
    var orthoScale = this.chart.getLinearScale(true); 

    if(this.timeSeries){
      tScale = this.chart.getTimeseriesScale(true);
    }
    
    // create empty container for the functions and data
    myself.DF = {}

    myself.DF.baseValues = this.chart.dataEngine.getVisibleCategories();
    myself.DF.visibleSerieIds = this.chart.dataEngine.getVisibleSeriesIndexes()
//    myself.DF.data = this.chart.dataEngine.getVisibleTransposedValues();

    // calculate a position along the base-axis
    myself.DF.baseCalculation = (myself.timeSeries) ?
      function(d){ return tScale(parser.parse(d.category)); }   :
      function(d) { return baseScale(d.category);  };
      

    // calculate a position along the orthogonal axis
    myself.DF.orthoCalculation = function(d){
      return myself.chart.animate(0, orthoScale(d.value));
    };

    // get a data-series for the ID
    var pFunc = null;
    if (this.timeSeries) {
      var parser = pv.Format.date(this.timeSeriesFormat);
      pFunc = function(a,b){ 
        return parser.parse(a.category)-parser.parse(b.category);};
    }  
    myself.DF.getDataForSerieId = 
      function(d){ var res = myself.chart.dataEngine
            .getObjectsForSeriesIndex(d, pFunc);
            res.sort(function(a, b) {return a.category - b.category; })
            return res;
          };


    var colors = this.chart.colors(
         pv.range(this.chart.dataEngine.getSeriesSize()));
    myself.DF.colorFunc = function(d){
      // return colors(d.serieIndex)
      return colors(myself.chart.dataEngine.getVisibleSeriesIndexes()
              [this.parent.index])
    };

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

    // prepare data and functions when creating (rendering) the chart.
    this.prepareDataFunctions();

    var maxLineSize;

    // Stacked?
    if (this.stacked){

      pvc.log("WARNING: the stacked option of metric charts still needs to be implemented.");

/*    CvK:  have to rewrite this code  
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
    */    
    }
    else {

      // Add the serie identifiers to the scatterPanel
      // CvK: Why do we need a new pvPanel and can't we use existing pvPanel?
      this.pvScatterPanel = this.pvPanel.add(pv.Panel)
           .data(myself.DF.visibleSerieIds);

      // add the area's
      // CvK: why adding area's if showArea
      this.pvArea = this.pvScatterPanel.add(pv.Area)
        .fillStyle(this.showAreas?myself.DF.colorFunc:null);

      var lineWidth = this.showLines ? 1.5 : 0.001;
      // add line and make lines invisible if not needed.
      this.pvLine = this.pvArea.add(pv.Line)
      .data(myself.DF.getDataForSerieId)
      .lineWidth(lineWidth)
      [pvc.BasePanel.relativeAnchor[anchor]](myself.DF.baseCalculation)
      [anchor](myself.DF.orthoCalculation)
    }

    
    this.pvLine
      .strokeStyle(myself.DF.colorFunc)
      .text(function(d){
        var v, c;
        var s = myself.chart.dataEngine.getVisibleSeries()[this.parent.index]
        if( typeof d == "object"){
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
    .strokeStyle(this.showDots?myself.DF.colorFunc:null)
    .fillStyle(this.showDots?myself.DF.colorFunc:null)
    

    if (this.chart.options.clickable){
      this.pvDot
      .cursor("pointer")
      .event("click",function(d){
        var v, c, elem;
        var s = myself.chart.dataEngine.getSeries()[this.parent.index]
        elem = this.scene.$g.childNodes[this.index];
        if( typeof d == "object"){
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
        return myself.chart.options.valueFormat(typeof d == "object"?d.value:d)
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




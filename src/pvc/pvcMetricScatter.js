
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

pvc.MetricScatterChartPanel = pvc.CategoricalAbstractPanel.extend({
    
  pvLine: null,
  pvArea: null,
  pvDot: null,
  pvLabel: null,
  pvCategoryPanel: null,
  
  showAreas: false,
  showLines: true,
  showDots: true,
  showValues: true,
  valuesAnchor: "right",
  
//  constructor: function(chart, options){
//    this.base(chart,options);
//  },

  prepareDataFunctions: function(){
    /*
        This function implements a number of helper functions via
        closures. The helper functions are all stored in this.DF
        Overriding this function allows you to implement
        a different ScatterChart.
     */
    var myself = this,
        chart = this.chart,
        dataEngine = chart.dataEngine,
        options = chart.options,
        baseScale = chart.getLinearBaseScale({bypassAxisSize: true}),
        orthoScale = chart.getLinearScale({bypassAxisSize: true}),
        tScale,
        parser;

    if(options.timeSeries){
        parser = pv.Format.date(options.timeSeriesFormat);
        tScale = chart.getTimeseriesScale({bypassAxisSize: true});
    }
    
    // create empty container for the functions and data
    myself.DF = {}

    // calculate a position along the base-axis
    myself.DF.baseCalculation = options.timeSeries ?
          function(d) { return tScale(parser.parse(d.category)); } :
          function(d) { return baseScale(d.category); };
      

    // calculate a position along the orthogonal axis
    myself.DF.orthoCalculation = function(d){
      return chart.animate(0, orthoScale(d.value));
    };

    // get a data-series for the ID
//    var pFunc;
//    if (options.timeSeries) {
//        pFunc = function(a,b){
//            return parser.parse(a.category) - parser.parse(b.category);
//        };
//    }

    var sortFun = function(a, b) {return a.category - b.category; };
    myself.DF.getSeriesData =
        function(d){
            return dataEngine.getObjectsForSeriesIndex(d, sortFun);
        };


    var colors = this.chart.colors(pv.range(dataEngine.getSeriesSize()));

    myself.DF.colorFunc = function(d){
        // return colors(d.serieIndex)
        return colors(dataEngine.getVisibleSeriesIndexes()[this.parent.index])
    };
  },

    /**
     * @override
     */
    createCore: function(){
        // Mantain the panel at its default normal z-order
        this.pvPanel.zOrder(0);

        var myself = this,
            options = this.chart.options,
            dataEngine = this.chart.dataEngine;

        if(options.showTooltips || this._shouldHandleClick()){
            this.pvPanel
                // Receive events even if in a transparent panel (default is "painted")
                .events("all")
                .event("mousemove", pv.Behavior.point(40));
        }

        var anchor = this.isOrientationVertical() ? "bottom" : "left";

        // prepare data and functions when creating (rendering) the chart.
        this.prepareDataFunctions();

        //var maxLineSize;

        // Stacked?
        if (options.stacked){

            pvc.log("WARNING: the stacked option of metric charts still needs to be implemented.");

        } else {

            // Add the series identifiers to the scatterPanel
            // One instance of pvScatterPanel per series
            this.pvScatterPanel = this.pvPanel.add(pv.Panel)
                .data(dataEngine.getVisibleSeriesIndexes());

            // Add the area
            // CvK: why adding area's if showArea
            this.pvArea = this.pvScatterPanel.add(pv.Area)
                .fillStyle(this.showAreas ? myself.DF.colorFunc : null);

            var lineWidth = this.showLines ? 1.5 : 0.001;

            // Add line and make lines invisible if not needed.
            this.pvLine = this.pvArea.add(pv.Line)
                .data(myself.DF.getSeriesData)
                .lineWidth(lineWidth)
                [pvc.BasePanel.relativeAnchor[anchor]](myself.DF.baseCalculation)
                [anchor](myself.DF.orthoCalculation);
        }

        this.pvLine
            .strokeStyle(myself.DF.colorFunc)
            .text(function(d){
                var v, c;
                var s = dataEngine.getVisibleSeries()[this.parent.index];
                if(typeof d == "object"){
                    v = d.value;
                    c = d.category;
                } else {
                    v = d;
                    c = dataEngine.getVisibleCategories()[this.index];
                }
                
                return options.tooltipFormat.call(myself,s,c,v);
            });

        if(options.showTooltips){
            this.pvLine.event("point", pv.Behavior.tipsy(options.tipsySettings));
        }

        this.pvDot = this.pvLine.add(pv.Dot)
            .shapeSize(12)
            .lineWidth(1.5)
            .strokeStyle(this.showDots ? myself.DF.colorFunc : null)
            .fillStyle(this.showDots ? myself.DF.colorFunc : null);
    
        if (this._shouldHandleClick()){
            this.pvDot
                .cursor("pointer")
                .event("click", function(d){
                    var v, c, e;
                    var s = dataEngine.getSeries()[this.parent.index];
                    if( typeof d == "object"){
                        v = d.value;
                        c = d.category
                    } else {
                        v = d
                        c = dataEngine.getCategories()[this.index];
                    }

                    e = arguments[arguments.length-1];

                    return options.clickAction(s, c, v, e);
                });
        }

        if(this.showValues){
            this.pvLabel = this.pvDot
                .anchor(this.valuesAnchor)
                .add(pv.Label)
                .bottom(0)
                .text(function(d){
                    return options.valueFormat(typeof d == "object"?d.value:d);
                });
        }
    },
    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        // Extend lineLabel
        if(this.pvLabel){
            this.extend(this.pvLabel, "lineLabel_");
        }

        // Extend line and linePanel
        this.extend(this.pvScatterPanel, "scatterPanel_");
        this.extend(this.pvArea, "area_");
        this.extend(this.pvLine, "line_");
        this.extend(this.pvDot, "dot_");
        this.extend(this.pvLabel, "label_");
    }
});
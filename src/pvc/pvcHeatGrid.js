/**
 * HeatGridChart is the main class for generating... heatGrid charts.
 *  A heatGrid visualizes a matrix of values by a grid (matrix) of *
 *  bars, where the color of the bar represents the actual value.
 *  By default the colors are a range of green values, where
 *  light green represents low values and dark green high values.
 *  A heatGrid contains:
 *     - two categorical axis (both on x and y-axis)
 *     - no legend as series become rows on the perpendicular axis 
 *  Please contact CvK if there are issues with HeatGrid at cde@vinzi.nl.
 */

pvc.HeatGridChart = pvc.CategoricalAbstract.extend({

    heatGridChartPanel : null,

    constructor: function(o){

        this.base(o);

	// enforce some defaults for the HeatGridChart
        this.options.legend = false;
        this.options.orthoAxisOrdinal = true;
        this.options.orginIsZero = true;

        var _defaults = {
            showValues: true,
            //originIsZero: true,
            axisOffset: 0,
            showTooltips: true,
            orientation: "vertical",
            // use a categorical here based on series labels
            scalingType: "linear",    // "normal" (distribution) or "linear"
            normPerBaseCategory: true,
            orthoAxisOrdinal: true,
            numSD: 2,                 // width (only for normal distribution)
            minColor: "white",
            maxColor: "darkgreen",
            nullColor:  "#efc5ad"  // white with a shade of orange
        };

        // Apply options
        $.extend(this.options,_defaults, o);

	// enforce some defaults for the HeatGridChart
        this.options.orthoAxisOrdinal = true;
        this.options.legend = false;
        this.options.orginIsZero = true;

    },

    preRender: function(){

        this.base();

        pvc.log("Prerendering in heatGridChart");


        this.heatGridChartPanel = new pvc.HeatGridChartPanel(this, {
            stacked: this.options.stacked,
            panelSizeRatio: this.options.panelSizeRatio,
            heatGridSizeRatio: this.options.heatGridSizeRatio,
            maxHeatGridSize: this.options.maxHeatGridSize,
            showValues: this.options.showValues,
            showTooltips: this.options.showTooltips,
            orientation: this.options.orientation
        });

        this.heatGridChartPanel.appendTo(this.basePanel); // Add it

    }

}
);


/*
 * HeatGrid chart panel. Generates a heatGrid chart. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide heatGrid value. Default: false
 * <i>stacked</i> -  Stacked? Default: false
 * <i>panelSizeRatio</i> - Ratio of the band occupied by the pane;. Default: 0.5 (50%)
 * <i>heatGridSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by heatGrids. Default: 0.5 (50%)
 * <i>maxHeatGridSize</i> - Maximum size of a heatGrid in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>heatGrid_</i> - for the actual heatGrid
 * <i>heatGridPanel_</i> - for the panel where the heatGrids sit
 * <i>heatGridLabel_</i> - for the main heatGrid label
 */


pvc.HeatGridChartPanel = pvc.BasePanel.extend({

    _parent: null,
    pvHeatGrid: null,
    pvHeatGridLabel: null,
    data: null,

    stacked: false,
    panelSizeRatio: 1,
    heatGridSizeRatio: 0.5,
    showTooltips: true,
    maxHeatGridSize: 200,
    showValues: true,
    orientation: "vertical",


    constructor: function(chart, options){

        this.base(chart,options);

    },

    create: function(){

        var myself = this;
        var opts = this.chart.options;
        this.width = this._parent.width;
        this.height = this._parent.height;

        this.pvPanel = this._parent.getPvPanel().add(this.type)
        .width(this.width)
        .height(this.height)

        var anchor = this.orientation == "vertical"?"bottom":"left";

        // reuse the existings scales
        var xScale = this.chart.xAxisPanel.scale;
        var yScale = this.chart.yAxisPanel.scale;
        
        var cols =  (anchor == "bottom") ? xScale.domain() : yScale.domain();

        var origData = this.chart.dataEngine.getVisibleTransposedValues();
        // create a mapping of the data that shows the columns (rows)
        data = origData.map(function(d){
            return pv.dict(cols, function(){
                return  d[this.index]
            })
        });
        data.reverse();  // the colums are build from top to bottom

        // get an array of scaling functions (one per column)
        var fill = this.getColorScale(data, cols);

        /* The cell dimensions. */
        var w = (xScale.max - xScale.min)/xScale.domain().length;
        var h = (yScale.max - yScale.min)/yScale.domain().length;

        if (anchor != "bottom") {
            var tmp = w;
            w = h;
            h = tmp;
        }

        this.pvHeatGrid = this.pvPanel.add(pv.Panel)
        .data(cols)
        [pvc.BasePanel.relativeAnchor[anchor]](function(){
            return this.index * w
            })
        [pvc.BasePanel.paralelLength[anchor]](w)
        .add(pv.Panel)
        .data(data)
        [pvc.BasePanel.oppositeAnchor[anchor]](function(){
            return this.index * h
        })
        [pvc.BasePanel.orthogonalLength[anchor]](h)
        .fillStyle(function(dat, col){
            return  (dat[col] != null) ? fill[col](dat[col]):opts.nullColor
        })
        .strokeStyle("white")
        .lineWidth(1)
        .antialias(false)
        .text(function(d,f){
          return d[f]});


        // NO SUPPORT for overflow and underflow on HeatGrids

        // NO SUPPORT for SecondAxis on HeatGrids (does not make sense)

        // Labels:

        if(this.showTooltips){
            this.pvHeatGrid
            .event("mouseover", pv.Behavior.tipsy({
                gravity: "s",
                fade: true
            }));
        }

        if (opts.clickable){
            this.pvHeatGrid
            .cursor("pointer")
            .event("click",function(row, rowCol){
                var s = myself.chart.dataEngine.getSeries()[myself.stacked?this.parent.index:this.index]
                var c = myself.chart.dataEngine.getCategories()[myself.stacked?this.index:this.parent.index]
                var d = row[rowCol];
                return myself.chart.options.clickAction(s,c,d);
            });
        }

        if(this.showValues){
            
            var getValue = function(row, rowAgain, rowCol){
                return row[rowCol];
            };
            
            this.pvHeatGridLabel = this.pvHeatGrid
            .anchor("center")
            .add(pv.Label)
            .bottom(0)
            .text(getValue);

            // Extend heatGridLabel
            this.extend(this.pvHeatGridLabel,"heatGridLabel_");
        }


        // Extend heatGrid and heatGridPanel
        this.extend(this.pvHeatGrid,"heatGridPanel_");
        this.extend(this.pvHeatGrid,"heatGrid_");

        // Extend body
        this.extend(this.pvPanel,"chart_");

    },
  
  /***********
   * compute an array of fill-functions. Each column out of "cols" 
   * gets it's own scale function assigned to compute the color
   * for a value. Currently supported scales are:
   *    -  linear (from min to max
   *    -  normal distributed from   -numSD*sd to  numSD*sd 
   *         (where sd is the standards deviation)
   ********/
  getColorScale: function(data, cols) {
    switch (this.chart.options.scalingType) {
    case "normal": return this.getNormalColorScale(data, cols);
    case "linear": return this.getLinearColorScale(data, cols);
    default:
      throw "Invalid option " + this.scaleType + " in HeatGrid"
    }
  },

  getLinearColorScale: function (data, cols){
    var fill;
    var opts = this.chart.options;
    // compute the mean and standard-deviation for each column
    var min = pv.dict(cols, function(f){
      return pv.min(data, function(d){
        return d[f]
      })
    });
    var max = pv.dict(cols, function(f){
      return pv.max(data, function(d){
        return d[f]
      })
    });

    if (opts.normPerBaseCategory)  //  compute a scale-function for each column (each key
      fill = pv.dict(cols, function(f){
        return pv.Scale.linear()
          .domain(min[f], max[f])
          .range(opts.minColor, opts.maxColor)
      });
     else {   // normalize over the whole array
      var theMin = min[cols[0]];
      for (var i=1; i<cols.length; i++)
        if (min[cols[i]] < theMin) theMin = min[cols[i]];

      var theMax = max[cols[0]];
      for (var i=1; i<cols.length; i++)
        if (max[cols[i]] < theMax) theMax = max[cols[i]];

      var scale = pv.Scale.linear()
        .domain(theMin, theMax)
        .range(opts.minColor, opts.maxColor);
      fill = pv.dict(cols, function(f){
        return scale
      })
    }

    return fill;  // run an array of values to compute the colors per column
  },

  getNormalColorScale: function (data, cols){
    var fill;
    var opts = this.chart.options;
    if (opts.normPerBaseCategory) {
      // compute the mean and standard-deviation for each column
      var mean = pv.dict(cols, function(f){
        return pv.mean(data, function(d){
          return d[f]
        })
      });
      var sd = pv.dict(cols, function(f){
        return pv.deviation(data, function(d){
          return d[f]
        })
      });
      //  compute a scale-function for each column (each key)
      fill = pv.dict(cols, function(f){
        return pv.Scale.linear()
          .domain(-opts.numSD * sd[f] + mean[f],
                  opts.numSD * sd[f] + mean[f])
          .range(opts.minColor, opts.maxColor)
      });
    } else {   // normalize over the whole array
      var mean = 0.0, sd = 0.0, count = 0;
      for (var i=0; i<origData.length; i++)
        for(var j=0; j<origData[i].length; j++)
          if (origData[i][j] != null){
            mean += origData[i][j];
            count++;
          }
      mean /= count;
      for (var i=0; i<origData.length; i++)
        for(var j=0; j<origData[i].length; j++)
          if (origData[i][j] != null){
            var variance = origData[i][j] - mean;
            sd += variance*variance;
          }
      sd /= count;
      sd = Math.sqrt(sd);
      
      var scale = pv.Scale.linear()
        .domain(-opts.numSD * sd + mean,
                opts.numSD * sd + mean)
        .range(opts.minColor, opts.maxColor);
      fill = pv.dict(cols, function(f){
        return scale
      })
    }

    return fill;  // run an array of values to compute the colors per column
}


});

/**
 * BoxplotChart is the main class for generating... categorical boxplotcharts.
 * 
 * The boxplot is used to represent the distribution of data using:
 *  - a box to represent the region that contains 50% of the datapoints,
 *  - the whiskers to represent the regions that contains 95% of the datapoints, and
 *  - a center line (in the box) that represents the median of the dataset.
 * For more information on boxplots you can visit  http://en.wikipedia.org/wiki/Box_plot
 *
 * If you have an issue or suggestions regarding the ccc BoxPlot-charts
 * please contact CvK at cde@vinzi.nl
 */



pvc.BoxplotChart = pvc.CategoricalAbstract.extend({

    bpChartPanel : null,

    constructor: function(o){

        this.base(o);

        var _defaults = {
            showValues: true,
	    //stacked: false,
	    //            waterfall: false,
            panelSizeRatio: 0.9,
            boxSizeRatio: 0.9,
            maxBarSize: 2000,

            originIsZero: true,
            axisOffset: 0,
            showTooltips: true,
            orientation: "vertical",
	    /* 
            orthoFixedMin: null,
            orthoFixedMax: null */
	    boxplotColor: "darkgreen"  // "grey"
        };

        // Apply options
        $.extend(this.options,_defaults, o);

        //  force stacked to be true (default of base-class is false)
	//        this.options.stacked = true;

        return;
    },


    preRender: function(){

       this.base();

       pvc.log("Prerendering in boxplotChart");


       this.bpChartPanel = new pvc.BoxplotChartPanel(this, {
		//stacked: this.options.stacked,
	    //            waterfall: this.options.waterfall,
            panelSizeRatio: this.options.panelSizeRatio,
            boxSizeRatio: this.options.boxSizeRatio,
            maxBarSize: this.options.maxBarSize,
            showValues: this.options.showValues,
            showTooltips: this.options.showTooltips,
            orientation: this.options.orientation,
	    // boxplot specific options
	    boxplotColor: this.options.boxplotColor
        });

        this.bpChartPanel.appendTo(this.basePanel); // Add it

        return;
    }
}
);


/*
 * Boxplot chart panel generates the actual box-plot with a categorical base-axis.
 * for more information on the options see the documentation file.
 */


pvc.BoxplotChartPanel = pvc.BasePanel.extend({

    _parent: null,
    pvBox: null,
    pvBoxLabel: null,
    /*
    pvWaterfallLine: null,
    pvCategoryPanel: null,
    pvSecondLie: null,
    pvSecondDot: null,
    data: null,
  
    stacked: false,
    */
    panelSizeRatio: 1,
    boxSizeRatio: 0.5,
    boxplotColor: "grey",
    showTooltips: true,
    maxBarSize: 200,
    showValues: true,
    orientation: "vertical",
    tipsySettings: {
        gravity: "s",
        fade: true
    },
    //    ruleData: null,

    hRules: null,
    vRules: null,
    bars: null,


    constructor: function(chart, options){

        this.base(chart,options);

        return;
    },



    getDataSet:  function() {
	    // selection on visibility does not make too much sense here
	    // a box-plot consist of five data-series (and no legend)
        var dataset = this.chart.dataEngine.getVisibleCategoriesIndexes();
        return dataset;
    } ,




    /*
     *   This function implements a number of helper functions in order
     *   to increase the readibily and extendibility of the code by:
     *    1: providing symbolic names (abstractions) to the numerous anonymous
     *        functions that need to be passed to Protovis
     *    2: by moving large parts of the local variabele (parameters
     *       and scaling functions out of the 'create' function to this
     *       prepareDataFunctions blok. 
     *
     *   These helper functions (closures) are all stored in 'this.DF'
     *
     *   Overriding this 'prepareDataFunctions' allows you to implement
     *   a different ScatterScart, however, it is also possible to
     *   replace specific functions from the 'this.DF' object.
     *
     *   Currently I still use a separate chart-type for waterfall/bar plots
     *   and for box-plots.
     */
    prepareDataFunctions:  function() {
        var myself = this;

        // create empty container for the functions and data
        this.DF = {}

        var lScale = this.chart.getLinearScale(true);

        var l2Scale = this.chart.getSecondScale(true);
        var oScale = this.chart.getOrdinalScale(true);
        var bSCale = null;

        // determine barPositionOffset and bScale
        this.DF.maxBarSize = null;
        var barPositionOffset = 0;
	bScale = new pv.Scale.ordinal(
	   this.chart.dataEngine.getVisibleSeriesIndexes())
            .splitBanded(0, oScale.range().band, this.boxSizeRatio);
	// We need to take into account the maxValue if our band 
        // exceeds this value

	this.DF.maxBarSize = bScale.range().band;

        if (this.DF.maxBarSize > this.maxBarSize) {
            barPositionOffset = (this.DF.maxBarSize - this.maxBarSize)/2 ;
            this.DF.maxBarSize = this.maxBarSize;
        }
        // export needed for generated overflow markers.
	//        this.DF.bScale = bScale;


     /*
     * fuctions to determine positions along base axis.
     */
	/*
        this.DF.basePositionFunc = stacked ?
        function(d){
            var res = oScale(this.index) + barPositionOffset;
            // This function used this pointer instead of d !!
            return res
        } :
        null;

        this.DF.baseRulePosFunc = stacked ?
        function(d){
            var res = oScale(d) + barPositionOffset;
            return res
        } :
        null;
	*/

	// find the left side of the container
        this.DF.catContainerBasePosFunc = oScale; 
	/*
	function(d){
            return oScale(this.index);
	    };*/

        this.DF.catContainerWidth = oScale.range().band;

	// find the relative position within this container

        this.DF.relBasePosFunc  = function(d){
            var res = bScale(myself.chart.dataEngine
                .getVisibleSeriesIndexes()[this.index]) + barPositionOffset;
            return res;
        };


        this.DF.secBasePosFunc = 
        function(d){
            if(myself.timeSeries){
                return tScale(parser.parse(d.category));
            }
            else{
                return oScale(d.category) + oScale.range().band/2;
            }
        };

    /*
     * functions to determine positions along orthogonal axis
     */
        this.DF.orthoBotPos = function(d){
            return lScale(pv.min([0,d]));
        };

        this.DF.orthoLengthFunc = function(d){
	    //            var res = myself.chart.animate(0, 
	    //  Math.abs(lScale(d||0) - lScale(0)));
	    res = lScale(d);
            return res;
        };

        this.DF.secOrthoLengthFunc = function(d){
            return myself.chart.animate(0,l2Scale(d.value));
        };


    /*
     * functions to determine the color palette.
     */
        var colors = this.chart.colors(pv.range(this.chart.dataEngine.getSeriesSize()));

	/*  Not used as a box-plot only contains one series??
        // colorFunc is used for the base dataseries
        this.DF.colorFunc = function(d){
            var ind = this.parent.index;
            return colors (myself.chart.dataEngine
                .getVisibleSeriesIndexes()[ind]);
        };
	*/

        // colorFunc2 is used for ....
        this.DF.colorFunc2 = function(d){
            return colors(myself.chart.dataEngine
                .getVisibleSeriesIndexes()[this.index])
        };

        return;
    } ,

  generateBoxPlots: function() {
    var de = this.chart.dataEngine;
    var opts = this.chart.options;
    var colLabels = de.getVisibleCategories();
    var visibleSeries = de.getVisibleSeries();
    var values = de.getValues();

    var lwa = 2;   // lineWidth of average.

    // store the index of the different values
    var median = 0,
    p25 = 1,
    p75 = 2,
    p5 = 3,
    p95 = 4;

    // boxplot covers third of width of container
    var widthBox = this.DF.catContainerWidth/3; 
    // to do: adjust for max-width and minWidth
    var leftOffset = (this.DF.catContainerWidth - widthBox)/2;

    for(var index=0;  index < colLabels.length; index++) {

	// order the data elements from 5% bound to 95% bound
	// and determine the horizontal scale
	var dat = values[index].map(this.DF.orthoLengthFunc);
      
	var leftBox = this.DF.catContainerBasePosFunc(index) + leftOffset,
	    rightBox = leftBox + widthBox,
	    midBox = (leftBox + rightBox)/2;
	
        this.vRules.push({"left": midBox,
		    "height": dat[p25] - dat[p5],
		    "lWidth": 1,
		    "bottom": dat[p5]});
        this.vRules.push({"left": leftBox,
		    "height": dat[p75] - dat[p25],
		    "lWidth": 1,
		    "bottom": dat[p25]});
        this.vRules.push({"left": rightBox,
		    "height": dat[p75] - dat[p25],
		    "lWidth": 1,
		    "bottom": dat[p25]});
        this.vRules.push({"left": midBox,
		    "height": dat[p95] - dat[p75],
		    "lWidth": 1,
		    "bottom": dat[p75]});
        for(var i=0; i<dat.length; i++)
	    this.hRules.push({"left": leftBox,
			"bottom": dat[i],
			"lWidth": (i == median) ? lwa : 1,
			"width": widthBox});

	this.bars.push({"left": leftBox,
		    "bottom": dat[p25],
		    "width": widthBox,
		    "height": dat[p75]-dat[p25],
		    "fillStyle": "limegreen"
	          });
      }

    /*      sp.labels.push({left: dat[2],
                      bottom: sp.textBottom,
                      text: this.labelFixedDigits(avLabel),
                      size: opts.smValueFont,
                      color: opts.boxplotColor});
    */
    //    }
  } ,


  create: function(){
    var myself = this;
    this.width = this._parent.width;
    this.height = this._parent.height;
    
    this.pvPanel = this._parent.getPvPanel().add(this.type)
      .width(this.width)
      .height(this.height)

    this.hRules = [];
    this.vRules = [];
    this.bars = [];


    var anchor = this.orientation == "vertical"?"bottom":"left";

    // prepare data and functions when creating (rendering) the chart.
    this.prepareDataFunctions();

    this.generateBoxPlots();

    var maxBarSize = this.DF.maxBarSize;

    // define a panel for each category label.
    // later the individuals bars of series will be drawn in 
    // these panels.
    this.pvBoxPanel = this.pvPanel.add(pv.Panel);

    // add the box-plots to the chart
      this.pvBoxPanel.add(pv.Bar)
        .data(myself.bars)
        .left(function(d) { return d.left})
        .width( function(d) { return d.width})
        .height( function(d) { return d.height})
        .bottom( function(d) { return d.bottom})
        .fillStyle( function(d) { return d.fillStyle; });

      this.pvBoxPanel.add(pv.Rule)
        .data(myself.hRules)
        .left(function(d) { return d.left})
        .width( function(d) { return d.width})
        .bottom( function(d) { return d.bottom})
        .lineWidth( function(d) { return d.lWidth; })
        .strokeStyle(myself.chart.options.boxplotColor);

      this.pvBoxPanel.add(pv.Rule)
        .data(myself.vRules)
        .left(function(d) { return d.left})
        .height( function(d) { return d.height})
        .bottom( function(d) { return d.bottom})
        .lineWidth( function(d) { return d.lWidth; })
        .strokeStyle(myself.chart.options.boxplotColor);


        if(this.chart.options.secondAxis){
            // Second axis - support for lines
            this.pvSecondLine = this.pvPanel.add(pv.Line)
            .data(function(d){
                return myself.chart.dataEngine.getObjectsForSecondAxis(d, 
                    this.timeSeries ? function(a,b){
                    return parser.parse(a.category) - parser.parse(b.category);
                    }: null)
                })
            .strokeStyle(this.chart.options.secondAxisColor)
            [pvc.BasePanel.relativeAnchor[anchor]](myself.DF.secBasePosFunc)
            [anchor](myself.DF.secOrthoLengthFunc);

            this.pvSecondDot = this.pvSecondLine.add(pv.Dot)
            .shapeSize(8)
            .lineWidth(1.5)
            .fillStyle(this.chart.options.secondAxisColor)
        }

        // add Labels:
        this.pvBoxPanel
        .text(function(d){
            var v = myself.chart.options.valueFormat(d);
            var s = myself.chart.dataEngine
            .getVisibleSeries()[myself.stacked?this.parent.index:this.index]
            var c = myself.chart.dataEngine
            .getVisibleCategories()[myself.stacked?this.index:this.parent.index]
            return myself.chart.options.tooltipFormat.call(myself,s,c,v);
    
        })

        if(this.showTooltips){
            // Extend default
            this.extend(this.tipsySettings,"tooltip_");
            this.pvBoxPanel
            .event("mouseover", pv.Behavior.tipsy(this.tipsySettings));
        }


        if (this.chart.options.clickable){
            this.pvBoxPanel
            .cursor("pointer")
            .event("click",function(d){
                var s = myself.chart.dataEngine
                .getSeries()[myself.stacked?this.parent.index:this.index];
                var c = myself.chart.dataEngine
                .getCategories()[myself.stacked?this.index:this.parent.index];
                var elem = this.scene.$g.childNodes[this.index];
                return myself.chart.options.clickAction(s,c, d, elem);
            });
        }
    /*  heeft geen data !!
        if(this.showValues){
            this.pvBoxLabel = this.pvBoxPanel
            .anchor("center")
            .add(pv.Label)
            .bottom(0)
            .text(function(d){
                return myself.chart.options.valueFormat(d);
            })
      
            // Extend barLabel
            this.extend(this.pvBoxLabel,"barLabel_");
        }
    */
        // Extend bar and barPanel
        this.extend(this.pvBoxPanel,"boxPanel_");
        this.extend(this.pvBoxPanel,"box_");
    

        // Extend body
        this.extend(this.pvPanel,"chart_");

    }

});

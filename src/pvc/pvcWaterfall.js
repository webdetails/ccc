/**
 * WaterfallChart is the main class for generating... waterfall charts.
 * 
 * The waterfall chart is an alternative to the pie chart for
 * showing distributions. The advantage of the waterfall chart is that
 * it possibilities to visualize sub-totals and offers more convenient
 * possibilities to compare the size of categories (in a pie-chart you
 * have to compare wedges that are at a different angle, which
 * requires some additional processing/brainpower of the end-user).
 *
 * Waterfall charts are basically Bar-charts with some added
 * functionality. Given the complexity of the added features this
 * class has it's own code-base. However, it would be easy to
 * derive a BarChart class from this class by swithing of a few 
 * features.
 * 
 * If you have an issue or suggestions regarding the Waterfall-charts
 * please contact CvK at cde@vinzi.nl
 */



pvc.WaterfallChart = pvc.CategoricalAbstract.extend({

    wfChartPanel : null,

    constructor: function(o){

        this.base(o);

        var _defaults = {
            showValues: true,
            stacked: true,
            waterfall: true,
            panelSizeRatio: 0.9,
            barSizeRatio: 0.9,
            maxBarSize: 2000,
            originIsZero: true,
            axisOffset: 0,
            showTooltips: true,
            orientation: "vertical",
            orthoFixedMin: null,
            orthoFixedMax: null
        };

        // Apply options
        $.extend(this.options,_defaults, o);
		
        //  force stacked to be true (default of base-class is false)
        this.options.stacked = true;

        return;
    },

    callWithHiddenFirstSeries: function(callFunc) {
        var res;
        var de = this.dataEngine;

        if (de.isVisible("series", 0)) {
            de.toggleSerieVisibility(0);
            res = callFunc.call(this);
            de.toggleSerieVisibility(0);
        } else
            res = callFunc();

        return res;
    } ,

    preRender: function(){

        // first series are symbolic labels, so hide it such that
        // the axis-range computation is possible in "AbstractCategoricalAxis.
        this.callWithHiddenFirstSeries( this.base );

        var logMessage = "Prerendering a ";
        if (this.options.waterfall)
            logMessage += "WaterfallChart";
        else logMessage +=  ((this.options.stacked) ?
            "stacked" : "normal")  +  " BarChart";
        pvc.log(logMessage);

        this.wfChartPanel = new pvc.WaterfallChartPanel(this, {
            stacked: this.options.stacked,
            waterfall: this.options.waterfall,
            panelSizeRatio: this.options.panelSizeRatio,
            barSizeRatio: this.options.barSizeRatio,
            maxBarSize: this.options.maxBarSize,
            showValues: this.options.showValues,
            showTooltips: this.options.showTooltips,
            orientation: this.options.orientation
        });

        this.categoricalPanel = this.wfChartPanel;

        this.wfChartPanel.appendTo(this.basePanel); // Add it

        return;
    }
}
);


/*
 * Waterfall chart panel (also bar-chart). Generates a bar chart. Specific options are:
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


pvc.WaterfallChartPanel = pvc.BasePanel.extend({

    _parent: null,
    pvBar: null,
    pvBarLabel: null,
    pvWaterfallLine: null,
    pvCategoryPanel: null,
    pvSecondLine: null,
    pvSecondDot: null,
    data: null,
  
    stacked: false,
    panelSizeRatio: 1,
    barSizeRatio: 0.5,
    showTooltips: true,
    maxBarSize: 200,
    showValues: true,
    orientation: "vertical",
    tipsySettings: {
        gravity: "s",
        fade: true
    },
    ruleData: null,
	selections: {},

    constructor: function(chart, options){

        this.base(chart,options);

        return;
    },


    callWithHiddenFirstSeries: function(env, callFunc) {
        var res;
        var de = this.chart.dataEngine;

        if (de.isVisible("series", 0)) {
            de.toggleSerieVisibility(0);
            switch (arguments.length) {
                case 2:
                    res = callFunc.call(env);
                    break;
                case 3:
                    res = callFunc.call(env, arguments[2]);
                    break;
                case 4:
                    res = callFunc.call(env, arguments[2], arguments[3]);
                    break;
                default:
                    pvc.log("ERROR: wrong number of arguments in callWithHiddenFirstSeries!!")

            }
            de.toggleSerieVisibility(0);
        } else
            res = callFunc();

        return res;
    } ,


    /****
   *  Functions that transforms a dataset to waterfall-format.
   *
   * The assumption made is that the first category is a tekst column
   * containing one of the following values:
   *    - "U":  If this category (row) needs go upwards (height
   *       increases)
   *    - "D": If the waterfall goes downward.
   *    - other values: the waterfall resets to zero (used represent
   *        intermediate subtotal) Currently subtotals need to be
   *        provided in the dataset.
   *  This function computes the offsets of each bar and stores the
   *  offset in the first category (for stacked charts)
   ****/
  
    constructWaterfall: function(dataset) 
    {
        var cumulated = 0.0;
        var ruleData = [[],[]];
    
        var cats = this.chart.dataEngine.getVisibleCategoriesIndexes(); 
    
        for(var c=0; c<dataset[0].length; c++) {
            var mult;
      
            // store the category
            ruleData[0].push(cats[c]);

            // determine next action (direction)
            if (dataset[0][c] == "U")
                mult = 1.0;
            else if (dataset[0][c] == "D")
                mult = -1.0;
            else {
                mult = 1.0;
                cumulated = 0.0;
            }
            if (mult > 0.0)
                dataset[0][c] = cumulated;
      
            // update the other series and determine new cumulated
            for(var ser=1; ser<dataset.length; ser++) {
                var val = Math.abs(dataset[ser][c]);
                dataset[ser][c] = val;  // negative values not allowed
                // only use negative values for internal usage in waterfall
                cumulated += mult*val;
            }
            if (mult < 0.0)
                dataset[0][c] = cumulated;
            ruleData[1].push(cumulated);
        }
        return ruleData;
    },


    getDataSet:  function() {
        
        //clear needed to force re-fetch of visible series
        this.chart.dataEngine.clearDataCache();
        
        var dataset = null
        // check whether it does not kill the source-data    
        dataset = this.stacked ?  
        pvc.padMatrixWithZeros(this.chart.dataEngine
            .getVisibleTransposedValues()) :
        this.chart.dataEngine.getVisibleCategoriesIndexes();

        if (this.waterfall)
            this.ruleData = this.constructWaterfall(dataset)

        return dataset;
    } ,




    /*
     *   This function implements a number of helper functions in order
     *   to increase the readibily and extendibility of the code by:
     *    1: providing symbolic names to the numerous anonymous
     *        functions that need to be passed to CC
     *    2: by moving large parts of the local variabele (parameters
     *       and scaling functions out of the 'create' function to this
     *       prepareDataFunctions blok. 
     *    3: More sharing of code due to introduction of the 'this.DF'
     *        for storing all helper functions.
     *    4: increased code-sharing between stacked and non-stacked
     *       variant of the bar chart.
     *    The create function is now much cleaner and easier to understand.
     *
     *   These helper functions (closures) are all stored in 'this.DF'
     *
     *   Overriding this 'prepareDataFunctions' allows you to implement
     *   a different ScatterScart.
     *   however, it is also possible to replace specific functions
     *   from the 'this.DF' object.
     */
    prepareDataFunctions:  function(stacked) {
        var myself = this;

        // create empty container for the functions and data
        this.DF = {}

        // first series are symbolic labels, so hide it such that
        // the axis-range computation is possible.
        /*
    var lScale = this.waterfall ?
      this.callWithHiddenFirstSeries(this.chart,
           this.chart.getLinearScale, true):
      this.chart.getLinearScale(true);
*/
        /** start  fix  (need to resolve this nicely  (CvK))**/
        var lScale;
        if (this.waterfall) {
            // compute the dataset
            var ds = this.getDataSet();
            // extract the maximum
            var mx = 0.0 
            for(var c=0; c<ds[0].length; c++) {
                var h = 0.0;
                for(var r=0; r<ds.length; r++)
                    h += ds[r][c];
                if (h > mx)  mx = h;
            }
            // set maximum as a fixed bound
            this.chart.options.orthoFixedMax = mx;	

            lScale = this.chart.getLinearScale(true);

        } else
            lScale = this.chart.getLinearScale(true);
        /** end fix **/
        var l2Scale = this.chart.getSecondScale(true);
        var oScale = this.chart.getOrdinalScale(true);
        var bScale = null;

        // determine barPositionOffset and bScale
        this.DF.maxBarSize = null;
        var barPositionOffset = 0;
        if (stacked) {
            this.DF.maxBarSize = oScale.range().band;

            //CvK: check whether bScale is ever used for stacked graphs!)
            bScale = new pv.Scale.ordinal([0])
            .splitBanded(0, oScale.range().band, this.barSizeRatio);      
      
        } else {
            bScale = new pv.Scale.ordinal(
                this.chart.dataEngine.getVisibleSeriesIndexes())
            .splitBanded(0, oScale.range().band, this.barSizeRatio);
            // We need to take into account the maxValue if our band is higher than that
            this.DF.maxBarSize = bScale.range().band;
        }
        if (this.DF.maxBarSize > this.maxBarSize) {
            barPositionOffset = (this.DF.maxBarSize - this.maxBarSize)/2 ;
            this.DF.maxBarSize = this.maxBarSize;
        }
        // export needed for generated overflow markers.
        this.DF.bScale = bScale;


        /*
     * functions to determine positions along base axis.
     */
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

        this.DF.catContainerBasePosFunc = (stacked) ? null :
        function(d){
            return oScale(myself.chart.dataEngine.getVisibleCategories()[d]);
        };

        this.DF.catContainerWidth = (stacked) ? null :
        oScale.range().band;

        this.DF.relBasePosFunc  = (stacked) ? null :
        function(d){
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
        this.DF.orthoBotPos = stacked ?
        lScale(0) :
        function(d){
            return lScale(pv.min([0,d]));
        };

        this.DF.orthoLengthFunc = stacked ? 
        function(d){
            var res = myself.chart.animate(0, lScale(d||0)-lScale(0));
            return res;
        } :
        function(d){
            var res = myself.chart.animate(0, 
                Math.abs(lScale(d||0) - lScale(0)));
            return res;
        };

        this.DF.secOrthoLengthFunc = 
        function(d){
            return myself.chart.animate(0,l2Scale(d.value));
        };


    /*
     * functions to determine the color palette.
     */
        var colors = this.chart.colors(pv.range(this.chart.dataEngine.getSeriesSize()));
        // colorFunc is used for the base dataseries
        this.DF.colorFunc = function(d){
            var ind = this.parent.index;
            
			var s = myself.chart.dataEngine.getSeries()[this.index];
			var c = myself.chart.dataEngine.getCategories()[this.parent.index];
            var isSelected =   myself.isSelected(s,c);            
            
            var shouldChangeColor = myself.getSelections().length > 0;
            if (myself.waterfall) {
                if (ind == 0)
                    return pv.Color.names["transparent"];
            //        ind--;   don't do the ind-- otherwise it doesn't match legend
            }
            
            var clr = colors (myself.chart.dataEngine.getVisibleSeriesIndexes()[ind]);
            return (!shouldChangeColor || (shouldChangeColor && isSelected)) ? clr : myself.toGreyScale(clr);
        };
        // colorFunc2 is used for ....
        this.DF.colorFunc2 = function(d){
			var s = myself.chart.dataEngine.getSeries()[this.index];
			var c = myself.chart.dataEngine.getCategories()[this.parent.index];
            var isSelected =   myself.isSelected(s,c);            
            var shouldChangeColor = myself.getSelections().length > 0;
            
        	var clr = colors(myself.chart.dataEngine.getVisibleSeriesIndexes()[this.index]);
            return (!shouldChangeColor || (shouldChangeColor && isSelected)) ? clr : myself.toGreyScale(clr);
        };

        return;
    } ,



 toGreyScale: function(color){
            //convert to greyscale using YCbCr luminance conv
            var avg = Math.round( 0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
            //  var avg = Math.round( (color.r + color.g + color.b)/3);
            return pv.rgb(avg,avg,avg,0.6).brighter();
        },


    /****
   *  Functions used to draw a set of horizontal rules that connect
   *  the bars that compose the waterfall
   ****/
    drawWaterfalls: function(panel) {
        var ruleData = this.ruleData;

        if (this.stacked)
            this.drawRules(panel, ruleData[0], ruleData[1], 2);
        else
            pvc.log("Waterfall not implemented for none-stacked");
    } ,

    drawRules: function(panel, cats, vals, offset) {
        var data = []; 

        var anchor = this.orientation == "vertical"?"bottom":"left";

        // build the dataset as a hashmap
        var x1 = this.DF.baseRulePosFunc(cats[0]) +offset;
        for(var i=0; i<cats.length-1; i++) 
        // this is the function for stacked data
        {
            var x2 = this.DF.baseRulePosFunc(cats[i+1]) + offset;
            data.push({
                x: x1, 
                y:  this.DF.orthoLengthFunc(vals[i]), 
                w: x2 - x1
            });
            x1 = x2;  // go to next element
        }

        this.pvWaterfallLine = panel.add(pv.Rule)
        .data(data)
        [pvc.BasePanel.relativeAnchor[anchor]](function(d) {
            return d.x
        })
        [anchor](function(d) {
            return d.y
        })
        [pvc.BasePanel.parallelLength[anchor]](function(d) {
            return d.w
        })
        .strokeStyle("#c0c0c0");

        return;
    },



    create: function(){
        var myself = this;
        this.width = this._parent.width;
        this.height = this._parent.height;


        this.onSelectionChange = myself.chart.options.onSelectionChange;

        this.pvPanel = this._parent.getPvPanel().add(this.type)
        .width(this.width)
        .height(this.height)

        if  (   (myself.chart.options.orthoFixedMin != null)
            || (myself.chart.options.orthoFixedMax != null) )
            this.pvPanel["overflow"]("hidden");

        var anchor = this.orientation == "vertical"?"bottom":"left";

        // prepare data and functions when creating (rendering) the chart.
        this.prepareDataFunctions(this.stacked);


        var maxBarSize = this.DF.maxBarSize;

        if (this.stacked){
            var dataset = this.getDataSet();

            if (this.orientation == "vertical")
                pvc.log("WARNING: currently the 'horizontal' orientation is not possible for stacked barcharts and waterfall charts (will be implemented later)");

            if (this.waterfall)
                this.drawWaterfalls(this.pvPanel);

            this.pvBarPanel = this.pvPanel.add(pv.Layout.Stack)
            .layers(dataset)
            [this.orientation == "vertical"?"y":"x"](myself.DF.orthoLengthFunc)
            [anchor](myself.DF.orthoBotPos)
            [this.orientation == "vertical"?"x":"y"](myself.DF.basePositionFunc);

            this.pvBar = this.pvBarPanel.layer.add(pv.Bar)
            .data(function(d){
                return d
            })
            [pvc.BasePanel.parallelLength[anchor]](maxBarSize)
            .fillStyle(myself.DF.colorFunc);

        } else {   //  not this.stacked

            // define a container (panel) for each category label.
            // later the individuals bars of series will be drawn in 
            // these panels.
            this.pvBarPanel = this.pvPanel.add(pv.Panel)
            .data(this.getDataSet() )
            [pvc.BasePanel.relativeAnchor[anchor]](myself.DF.catContainerBasePosFunc)
            [anchor](0)
            [pvc.BasePanel.parallelLength[anchor]](myself.DF.catContainerWidth)
            // pvBarPanel[X]  = this[X]  (copy the function)
            [pvc.BasePanel.orthogonalLength[anchor]](
                this[pvc.BasePanel.orthogonalLength[anchor]])

            // next add the bars to the bar-containers in pvBarPanel
            this.pvBar = this.pvBarPanel.add(pv.Bar)
            .data(function(d){
                var res = myself.chart.dataEngine
                .getVisibleValuesForCategoryIndex(d);
                return res;
                })
            .fillStyle(myself.DF.colorFunc2)
            [pvc.BasePanel.relativeAnchor[anchor]](myself.DF.relBasePosFunc)
            [anchor](myself.DF.orthoBotPos)
            [pvc.BasePanel.orthogonalLength[anchor]](myself.DF.orthoLengthFunc)
            [pvc.BasePanel.parallelLength[anchor]](maxBarSize)  ; 

        }  // end of if (stacked)

        // generate red markers if some data falls outside the panel bounds
        this.generateOverflowMarkers(anchor, this.stacked);


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


        //double click + click
        var ignoreClicks = 0;
        var DBL_CLICK_MAX_DELAY = (this.clickDelay)? this.clickDelay : 300; //ms
        //click
        var clickAction = function(s,c,d,e){
            if(ignoreClicks) { ignoreClicks--;}
            else {
                if(e.ctrlKey){
                    myself.toggleSelection(s,c);
                } else {//hard select
                    myself.clearSelections();
                    myself.addSelection(s,c);
                }
                myself.triggerSelectionChange();
                //classic clickAction
                if(typeof(myself.chart.options.clickAction) == 'function'){
                    if(d!= null && d[0] !== undefined){ d= d[0]; }
                    myself.chart.options.clickAction(s,c,d,e);
                }
                myself.pvPanel.render();
            }
        };


        var doubleClickAction = (typeof(myself.chart.options.doubleClickAction) == 'function')?
            function(s,c,d,e){
                ignoreClicks = 2;
                myself.chart.options.doubleClickAction(s,c,d, e);
            } :
            null;




        if(doubleClickAction)
        {
            this.pvBar.cursor("pointer").event("dblclick", function(r,ra,i){
                var s = myself.chart.dataEngine.getSeries()[this.parent.index];
                var c = myself.chart.dataEngine.getCategories()[this.parent.index];
                var d = r[i];
                var e = arguments[arguments.length-1];//pv.event;
                doubleClickAction(s,c,d,e);
            });
        }


        // add Labels:
        this.pvBar
        .text(function(d){
            var v = myself.chart.options.valueFormat(d);
            var s = myself.chart.dataEngine
            .getVisibleSeries()[myself.stacked?this.parent.index:this.index];
            var c = myself.chart.dataEngine
            .getVisibleCategories()[myself.stacked?this.index:this.parent.index];
            return myself.chart.options.tooltipFormat.call(myself,s,c,v);
    
        })

        if(this.showTooltips){
            // Extend default
            this.extend(this.tipsySettings,"tooltip_");
            this.pvBar
            .def("tooltip",'')
            .title(function(r,ra,i){
                var tooltip = '';
                if(myself.chart.options.customTooltip){
                    var s = myself.chart.dataEngine.getSeries()[this.index];
                    var c = myself.chart.dataEngine.getCategories()[this.parent.index];
                    var d = r;
                    tooltip = myself.chart.options.customTooltip(s,c,d);
                }
                else {
                    tooltip = r[i];
                }
                this.tooltip(tooltip);
                return '';//prevent browser tooltip
            })
            .event("mouseover", pv.Behavior.tipsy({
                html: true,
                gravity: "c",
                fade: false,
                followMouse:true
            }));
            
//            .event("mouseover", pv.Behavior.tipsy(this.tipsySettings));
        }


        if (this.chart.options.clickable){
            this.pvBar
                .cursor("pointer")
                .event("click",function(d){
                    var s = myself.chart.dataEngine
                        .getSeries()[myself.stacked?this.parent.index:this.index];
                    var c = myself.chart.dataEngine
                        .getCategories()[myself.stacked?this.index:this.parent.index];
                    var e = arguments[arguments.length-1];
                    return clickAction(s, c, d, e);
                });
        }

        if(this.showValues){
            this.pvBarLabel = this.pvBar
            .anchor(this.valuesAnchor ? this.valuesAnchor : 'center')
            .add(pv.Label)
            .bottom(0)
            .text(function(d){
                return myself.chart.options.valueFormat(d);
            })
      
            // Extend barLabel
            this.extend(this.pvBarLabel,"barLabel_");
        }

        // Extend waterfall line
        if (this.waterfall){
            this.extend(this.pvWaterfallLine,"barWaterfallLine_");
        }

        // Extend bar and barPanel
        this.extend(this.pvBarPanel,"barPanel_");
        this.extend(this.pvBar,"bar_");
    
        // Extend secondAxis
        if(this.pvSecondLine){
            this.extend(this.pvSecondLine,"barSecondLine_");
        }

        if(this.pvSecondDot){
            this.extend(this.pvSecondDot,"barSecondDot_");
        }


		if (pv.renderer() != 'batik')
        {
            this.createSelectOverlay(this.width,this.height);
        }

        // Extend body
        this.extend(this.pvPanel,"chart_");

    },


    /*******
   *  Function used to generate overflow and underflowmarkers.
   *  This function is only used when fixedMinX and orthoFixedMax are set
   *
   *******/

    generateOverflowMarkers: function(anchor, stacked)
    {
        var myself = this;

        if (stacked) {
            if (   (myself.chart.options.orthoFixedMin != null)
                || (myself.chart.options.orthoFixedMin != null) )  
                pvc.log("WARNING: overflow markers not implemented for Stacked graph yet");
        } else {
            if      (myself.chart.options.orthoFixedMin != null)
                // CvK: adding markers for datapoints that are off-axis
                //  UNDERFLOW  =  datavalues < orthoFixedMin
                this.doGenOverflMarks(anchor, true, this.DF.maxBarSize, 
                    0, this.DF.bScale,
                    function(d){
                        var res = myself.chart.dataEngine
                        .getVisibleValuesForCategoryIndex(d);
                        // check for off-grid values (and replace by null)
                        var fixedMin = myself.chart.options.orthoFixedMin;
                        for(var i=0; i<res.length; i++)
                            res[i] = (res[i] < fixedMin) ? fixedMin : null; 
                        return res;
                    });
      
            if (myself.chart.options.orthoFixedMax != null)
                // CvK: overflow markers: max > orthoFixedMax
                this.doGenOverflMarks(anchor, false, this.DF.maxBarSize, 
                    Math.PI, this.DF.bScale,
                    function(d){
                        var res = myself.chart.dataEngine
                        .getVisibleValuesForCategoryIndex(d);
                        // check for off-grid values (and replace by null)
                        var fixedMax = myself.chart.options.orthoFixedMax;
                        for(var i=0; i<res.length; i++)
                            res[i] = (res[i] > fixedMax) ? fixedMax : null; 
                        return res;
                    });
        };
        return;
    },

    // helper routine used for both underflow and overflow marks
    doGenOverflMarks: function(anchor, underflow, maxBarSize, angle,
        bScale, dataFunction)
        {
        var myself = this;
        var offGridBarOffset = maxBarSize/2;
    
        var offGridBorderOffset = (underflow) ?
        this.chart.getLinearScale(true).min + 8  :
        this.chart.getLinearScale(true).max - 8   ;
    
        if (this.orientation != "vertical")
            angle += Math.PI/2.0;
    
        this.overflowMarkers = this.pvBarPanel.add(pv.Dot)
        .shape("triangle")
        .shapeSize(10)
        .shapeAngle(angle)
        .lineWidth(1.5)
        .strokeStyle("red")
        .fillStyle("white")
        .data(dataFunction)
        [pvc.BasePanel.relativeAnchor[anchor]](function(d){
            var res = bScale(myself.chart.dataEngine
                .getVisibleSeriesIndexes()[this.index])
            + offGridBarOffset;
            return res;
        })
        [anchor](function(d){ 
            // draw the markers at a fixed position (null values are
            // shown off-grid (-1000)
            return (d != null) ? offGridBorderOffset: -10000;
        }) ;
    },
    
    
    /***********************
     * SELECTIONS (start)
     */
    
    /**
     * init with default (bool)
     **/
    initSelections:function(defaultValue){
      this.selections = {};
      var series = this.chart.dataEngine.getSeries();
      var cats = this.chart.dataEngine.getCategories();
        for(var i = 0; i < series.length; i++ ){
            this.selections[series[i]] = {};
            for(var j = 0; j < cats.length; j++ ){
                this.selections[series[i]][cats[j]] = defaultValue;
            }
      }
    },
    
    //makes none selected
    clearSelections: function(){
        this.selections = {};
        this.selectCount = null;
    },
    
    isSelected: function(s,c){
      return this.selections[s] ?
        this.selections[s][c]!=null :
        false;
    },
    
    isValueNull: function(s,c){
      var sIdx = this.chart.dataEngine.getSeries().indexOf(s);
      var cIdx = this.chart.dataEngine.getCategories().indexOf(c);
      var val = this.chart.dataEngine.getValues()[cIdx][sIdx];
      return val == null ;
    },
    
    addSelection: function(s,c){
      if(!this.selectNullValues)
      {//check if null
        if(this.isValueNull(s,c)){ return; }
      }
      if(!this.selections[s]) this.selections[s] = {};
      this.selections[s][c] = {'series': s, 'category' : c};
      this.selectCount = null;
    },
    
    removeSelection: function(s,c){
      if(this.selections[s]){
        this.selections[s][c] = null;//TODO: delete?
      }
      this.selectCount = null;
    },
    
    toggleSelection: function(s,c){
        if(this.isSelected(s,c)) {
            this.removeSelection(s,c);
        }
        else {
            this.addSelection(s,c);
        }
    },
    
    getSelections: function(){
        var selections = [];
        for(var s in this.selections){
          if(this.selections.hasOwnProperty(s) )
          {
              for(var c in this.selections[s]){
               if(this.selections[s].hasOwnProperty(c))
               {
                    if(this.selections[s][c]){
                        selections.push(this.selections[s][c]);
                    }
               }
              }
          }
        }
        return selections;
    },
    
    setSelections: function(selections){
        this.selections = {};
        for(var i=0;i<selections.length;i++){
            this.addSelection(selections[i].series, selections[i].category);
        }
    },
    
    selectSeries: function(s){
        var cats = this.chart.dataEngine.getCategories();
        for(var i = 0; i < cats.length; i++ ){
            this.addSelection(s,cats[i]);
            //this.selections[s][cats[i]] = true;
        }
    },
    
    selectCategories: function(c){
        var series = this.chart.dataEngine.getSeries();
        for(var i = 0; i < series.length; i++ ){
            this.addSelection(series[i],c);
        }
    },
    
    selectAxisValue: function(axis, axisValue, toggle)
    {
        var type = (this.orientation == 'horizontal')?
            ((axis == 'x')? 's' : 'c') :
            ((axis == 'x')? 'c' : 's')
            
        if(this.chart.options.useCompositeAxis)
        {
            if(!toggle){
                this.clearSelections();
            }
            if(type =='c'){
                if(!toggle){
                    this.selectCategoriesHierarchy(axisValue);
                }
                else {
                    this.toggleCategoriesHierarchy(axisValue);
                }
            }
            else {
                if(!toggle){
                    this.selectSeriesHierarchy(axisValue);
                }
                else{
                    this.toggleSeriesHierarchy(axisValue);
                }
            }
        }
        else
        {//??
            if(type =='c'){ this.toggleCategories(axisValue); }
            else { this.toggleSeries(axisValue); }
        }
    },
    
    /**
     *ex.: arrayStartsWith(['EMEA','UK','London'], ['EMEA']) -> true
     *     arrayStartsWith(a, a) -> true
     **/
    arrayStartsWith: function(array, base)
    {
        if(array.length < base.length) { return false; }
        
        for(var i=0; i<base.length;i++){
            if(base[i] != array[i]) {
                return false;
            }
        }
        return true;
    },
    
    toggleCategoriesHierarchy: function(cbase){
        if(this.selectCategoriesHierarchy(cbase)){
            this.deselectCategoriesHierarchy(cbase);
        }
    },
    
    toggleSeriesHierarchy: function(sbase){
        if(this.selectSeriesHierarchy(sbase)){
            this.deselectSeriesHierarchy(sbase);
        }
    },
    
    /**
     *returns bool wereAllSelected
     **/
    selectCategoriesHierarchy: function(cbase){
        var categories = this.chart.dataEngine.getCategories();
        var selected = true;
        for(var i =0; i< categories.length ; i++){
            var c = categories[i];
            if( this.arrayStartsWith(c, cbase) ){
                selected &= this.selectCategory(c);
            }
        }
        return selected;
    },
    
    selectSeriesHierarchy: function(sbase){
        var series = this.chart.dataEngine.getSeries();
        var selected = true;
        for(var i =0; i< series.length ; i++){
            var s = series[i];
            if( this.arrayStartsWith(s, sbase) ){
                selected &= this.selectSeries(s);
            }
        }
        return selected;
    },
    
    deselectCategoriesHierarchy: function(cbase){
        var categories = this.chart.dataEngine.getCategories();
        for(var i =0; i< categories.length ; i++){
            var c = categories[i];
            if( this.arrayStartsWith(c, cbase) ){
                this.deselectCategory(c);
            }
        }
    },

    deselectSeriesHierarchy: function(sbase){
        var series = this.chart.dataEngine.getSeries();
        for(var i =0; i< series.length ; i++){
            var s = series[i];
            if( this.arrayStartsWith(s, sbase) ){
                this.deselectSeries(s);
            }
        }
    },
    
    /**
     *returns bool wereAllSelected
     **/
    selectCategory: function(c){
        var series = this.chart.dataEngine.getSeries();
        var wereAllSelected = true;
        for(var i = 0; i < series.length; i++ ){
            var s = series[i];
            if(!this.selectNullValues && this.isValueNull(s,c)){
                continue;
            }
            wereAllSelected &= this.isSelected(s,c);
            this.addSelection(s,c);
        }
        return wereAllSelected;
    },
    
    selectSeries: function(s){
        var categories = this.chart.dataEngine.getCategories();
        var wereAllSelected = true;
        for(var i = 0; i < categories.length; i++ ){
            var c = categories[i];
            if(!this.selectNullValues && this.isValueNull(s,c)){
                continue;
            }
            wereAllSelected &= this.isSelected(s,c);
            this.addSelection(s,c);
        }
        return wereAllSelected;
    },
    
    deselectCategory: function(c){
        var series = this.chart.dataEngine.getSeries();
        for(var i = 0; i < series.length; i++ ){
            this.removeSelection(series[i],c);
        }
    },

    deselectSeries: function(s){
        var categories = this.chart.dataEngine.getCategories();
        for(var i = 0; i < categories.length; i++ ){
            this.removeSelection(s, categories[i]);
        }
    },
    
    /**
     *pseudo-toggle elements with category c:
     *deselect all if all selected, otherwise select all
     **/
    toggleCategories: function(c){
        var series = this.chart.dataEngine.getSeries();
        var selected = this.selectCategory(c);
        if(selected){
            this.deselectCategory(c);
        }
    },
    
    /**
     *pseudo-toggle elements with series s:
     *deselect all if all selected, otherwise select all
     **/
    toggleSeries: function(s){
        var categories = this.chart.dataEngine.getCategories();
        var selected = this.selectSeries(s);
        if(selected){
            this.deselectSeries(s);
        }
    },
    
    getSelectCount: function(){
        if(this.selectCount == null){
          this.selectCount = this.getSelections().length;
        }
        return this.selectCount;
    },
    
    triggerSelectionChange: function(){
        if(typeof(this.onSelectionChange) == 'function'){
            var selections = this.getSelections();
            this.onSelectionChange(selections);
        }
    },
    
        inRubberBandSelection: function(x,y){
        if(!this.rubberBand) { return false; }
        
        var r = this.rubberBand;
        return  x > r.x && x < r.x + r.dx &&
                y > r.y && y < r.y + r.dy ;
        
    },
    
    /**
     * Add rubberband functionality to main panel (includes axis)
     **/
    createSelectOverlay : function(w,h)
    {
        //TODO: flip support: parallelLength etc..
        var opts = this.chart.options;
        this.rubberBand = {x:0, y:0, dx:4, dy:4};
        var myself = this;
        
        if(opts.orientation == 'horizontal')
        {//switch back w,h
            var tmp = w;
            w=h;
            h=tmp;
        }
        
        var dMin= Math.min(w,h) /2;
        
        var isSelecting = false;
        var checkSelections = false;
        var selectFill = 'rgba(255, 127, 0, 0.15)'; // opts.rubberBandFill;
        var selectStroke =  'rgb(255,127,0)';// opts.rubberBandLine;
        var invisibleFill = 'rgba(127,127,127,0.01)';
        
        //callback to handle end of rubber band selection
        var dispatchRubberBandSelection = function(rb, ev)
        {//do the rubber band
            var xAxis = myself.chart.xAxisPanel;
            var yAxis = myself.chart.yAxisPanel;
            
            var opts = myself.chart.options;
            
            var positions = ['top','left', 'bottom', 'right'];
            var setPositions = function(position, len){
              var obj ={};
              for(var i=0; i< positions.length;i++){
                if(positions[i] == position){
                    obj[positions[i]] = len;
                }
                else {
                    obj[positions[i]] = 0;
                }
              }
              return obj;
            };
            
            //get offsets
            var titleOffset;
            if(myself.chart.titlePanel != null){
                titleOffset = setPositions(opts.titlePosition, myself.chart.titlePanel.titleSize);
            }
            else {
                titleOffset = setPositions();
            }
            var xAxisOffset = setPositions(opts.xAxisPosition, myself.chart.xAxisPanel.height);
            var yAxisOffset = setPositions(opts.yAxisPosition, myself.chart.yAxisPanel.width);
            
            var y = 0, x=0;   
            //1) x axis
            var xSelections = [];
            if(opts.useCompositeAxis){
                y = rb.y - titleOffset['top'] ;
                if(opts.xAxisPosition == 'bottom'){//chart
                    y -= myself.height;
                }
                x = rb.x - titleOffset['left'] - yAxisOffset['left'];
                xSelections =  myself.chart.xAxisPanel.getAreaSelections(x, y, rb.dx, rb.dy);
            }
                        
            //2) y axis
            var ySelections = [];
            if(opts.useCompositeAxis){
                y = rb.y - titleOffset['top'] - xAxisOffset['top'];//- xAxisOffset['top'];
                x = rb.x - titleOffset['left'];
                if(opts.yAxisPosition == 'right'){//chart
                    x -= myself.width;
                }
                ySelections = myself.chart.yAxisPanel.getAreaSelections(x, y, rb.dx, rb.dy);
            }
            
            if(!ev.ctrlKey){
                myself.clearSelections();
            }
            
            if( ySelections.length > 0 && xSelections.length > 0 )
            {//intersection
                var series = myself.chart.dataEngine.getSeries();
                var categories = myself.chart.dataEngine.getCategories();
                var selectedSeries = [], selectedCategories = [],
                    sSelections, cSelections;
                if(opts.orientation == 'horizontal'){
                    sSelections = xSelections;
                    cSelections = ySelections;
                }
                else {
                    sSelections = ySelections;
                    cSelections = xSelections;                    
                }
                //expand selections
                for(var i=0;i<sSelections.length;i++)
                {
                    var s = sSelections[i];
                    for(var j=0;j<series.length; j++){
                        if( myself.arrayStartsWith(series[j], s)){
                            selectedSeries.push(series[j]);
                        }
                    }
                }
                for(var i=0;i<cSelections.length;i++)
                {
                    var c = cSelections[i];
                    for(var j=0;j<categories.length; j++){
                        if( myself.arrayStartsWith(categories[j], c)){
                            selectedCategories.push(categories[j]);
                        }
                    }
                }
                //intersection
                for(var i=0;i<selectedSeries.length;i++)
                {
                    var s = selectedSeries[i];
                    for(var j=0; j<selectedCategories.length; j++)
                    {
                        var c = selectedCategories[j];
                        myself.addSelection(s,c);
                    }
                }
            }
            else if(ySelections.length == 0 && xSelections.length == 0)
            {//if there are label selections, they already include any chart selections
                //3) Chart: translate coordinates (drawn bottom-up)
                //first get offsets
                y = rb.y -titleOffset['top'] - xAxisOffset['top'];
                x = rb.x - titleOffset['left'] - yAxisOffset['left'];
                //top->bottom
                y = myself.height -y -rb.dy;
                myself.rubberBand.x = x;
                myself.rubberBand.y = y;

                myself.setRubberbandSelections(myself.rubberBand,w,h);            
            }
            else
            {
                for(var i=0; i<xSelections.length; i++){
                    myself.selectAxisValue('x', xSelections[i], true);
                }
                for(var i=0; i<ySelections.length; i++){
                    myself.selectAxisValue('y', ySelections[i], true);
                }
            }

            myself.pvBar.render();
            myself.triggerSelectionChange();
            
        };
        
        //rubber band display
        this.selectBar = this.pvPanel.root//TODO
           .add(pv.Bar)
                .visible(function() {return isSelecting;} )
                .left(function(d) { return d.x; })
                .top(function(d) { return d.y;})
                .width(function(d) { return d.dx;})
                .height(function(d) { return d.dy;})
                .fillStyle(selectFill)
                .strokeStyle(selectStroke);
                
        //rubber band selection behavior definition
        if(!opts.extensionPoints ||
           !opts.extensionPoints.base_fillStyle)
        {
            this.pvPanel.root.fillStyle(invisibleFill);
        }
        
        this.pvPanel.root
            .data([myself.rubberBand])
            .event("click", function(d) {
                var e = arguments[arguments.length-1];
                //if(!pv.event.ctrlKey){
                if(!e.ctrlKey){
                    myself.clearSelections();
                    myself.pvBar.render();
                    myself.triggerSelectionChange();
                }
            })
            .event('mousedown', pv.Behavior.selector(false))
            .event('selectstart', function(d){
                isSelecting = true;
            })
            .event('select', function(rb){
                
                myself.rubberBand = rb;
                if(isSelecting && (rb.dx > dMin || rb.dy > dMin)){
                    checkSelections = true;
                    myself.selectBar.render();
                }
            })
            .event('selectend', function(rb,event){
                if(isSelecting){
                    isSelecting = false;
                    //translate top to bottom
                    if(checkSelections){
                        checkSelections = false;
                        myself.selectBar.render();
                        dispatchRubberBandSelection(rb, event);
                    }
                }
            });
    },
    
    setRubberbandSelections: function(rb,w,h)
    {
        var orient = (this.orientation == 'horizontal')? 'h' : 'v';
        
        var categories = this.chart.dataEngine.getCategories();

        var series =             this.chart.dataEngine.getSeries();

        var ySel = [];
        var xSel = [];
        
        //find included series/categories
        for(var i=0; i< categories.length; i++){
			if (orient == 'v') {
				var start= this.pvPanel.scene[0].children[0][i].left;
				var length= this.pvPanel.scene[0].children[0][i].width;
                
            	for (var j=0; j < series.length;j++) {
					var startY= this.pvPanel.scene[0].children[0][i].children[0][j].bottom;
					var endY= this.pvPanel.scene[0].children[0][i].children[0][j].height + startY;
					var startX= this.pvPanel.scene[0].children[0][i].children[0][j].left + start;
					var endX= this.pvPanel.scene[0].children[0][i].children[0][j].width + startX;
            			
            		if (((startY >= rb.y && startY < rb.y + rb.dy) && ((startX >= rb.x && startX < rb.x + rb.dx) || (endX >= rb.x && endX < rb.x + rb.dx))) ||
            			((endY >= rb.y && endY < rb.y + rb.dy) && ((startX >= rb.x && startX < rb.x + rb.dx) || (endX >= rb.x && endX < rb.x + rb.dx)))) {
						xSel.push(categories[i]);            			
						ySel.push(series[j]);            		
					}
            	}
            } else {

				var start= this.pvPanel.scene[0].children[0][i].bottom;
				var length= this.pvPanel.scene[0].children[0][i].height;
                           
            	for (var j=0; j < series.length;j++) {
					var startX= this.pvPanel.scene[0].children[0][i].children[0][j].left;
					var endX= this.pvPanel.scene[0].children[0][i].children[0][j].width + startX;
					var startY= this.pvPanel.scene[0].children[0][i].children[0][j].bottom + start;
					var endY= this.pvPanel.scene[0].children[0][i].children[0][j].height + startY;

            			   			
            		if (((startY >= rb.y && startY < rb.y + rb.dy) && ((startX >= rb.x && startX < rb.x + rb.dx) || (endX >= rb.x && endX < rb.x + rb.dx))) ||
            			((endY >= rb.y && endY < rb.y + rb.dy) && ((startX >= rb.x && startX < rb.x + rb.dx) || (endX >= rb.x && endX < rb.x + rb.dx)))) {
						ySel.push(categories[i]);            			
						xSel.push(series[j]);            		
					}
            	}                                            
            }
        }

        
        var sSel, cSel;
        if(orient == 'h'){
            sSel = xSel;
            cSel = ySel;
        }
        else {
            sSel = ySel;
            cSel = xSel;            
        }
        
        //select shapes in intersection
        for(var i=0; i< sSel.length; i++)
        {
            var s = sSel[i];
            this.addSelection(s, cSel[i]);
        }
    }
    
    
    /*
     *selections (end)
     **********************/
    
    
    

});

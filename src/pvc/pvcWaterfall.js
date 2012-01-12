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
    },
    
    /**
     * Creates a custom WaterfallDataEngine.
     * [override]
     */
    createDataEngine: function(){
        return new pvc.WaterfallDataEngine(this);
    },
    
    preRender: function(){
        // First series are symbolic labels, so hide it such that
        // the axis-range computation is possible in "AbstractCategoricalAxis.
        this.dataEngine.callWithHiddenFirstSeries(this.base, this);

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
    }
});


pvc.WaterfallDataEngine = pvc.DataEngine.extend({
    constructor: function(chart){
        this.base(chart);
    },
    
    /**
     * Creates and prepares the custom WaterfallTranslator.
     * [override]
     */
    createTranslator: function(){
        this.base();
        
        var sourceTranslator = this.translator;
        
        this.translator = new pvc.WaterfallTranslator(
                            sourceTranslator,
                            this.chart.options.waterfall,
                            this.chart.isOrientationVertical());
        
        pvc.log("Creating WaterfallTranslator wrapper");
        
        this.prepareTranslator();
    },
    
    callWithHiddenFirstSeries: function(fun, ctx) {
        if (!this.isVisible("series", 0)) {
           return fun.call(ctx);
        }
        
        this.toggleSerieVisibility(0);
        try{
            return fun.call(ctx);
        } finally {
            this.toggleSerieVisibility(0);
        }
    }
});

pvc.WaterfallTranslator = pvc.DataTranslator.extend({
    
    constructor: function(sourceTranslator, isWaterfall, isVertical){
        this.base();
        
        this.sourceTranslator = sourceTranslator;
        
        this.isWaterfall = isWaterfall;
        this.isVertical  = isVertical;
    },
    
    prepareImpl: function(){
        // Call base version 
        this.base();
        
        /*
         (Total column is for waterfall)
         Values:
         [["X",    "Ser1", "Ser2", "Ser3"],
          ["Cat1", "U",      800,    1200],  // 1800 (depends on visible series)
          ["Cat2", "D",      100,     600],  //  700
          ["Cat3", "D",      400,     300],  //  700
          ["Cat4", "D",      200,     100],  //  300
          ["Cat5", "D",      100,     200]]  //  300
         */
        
        this.sourceTranslator.setData(this.metadata, this.resultset);
        this.sourceTranslator.dataEngine = this.dataEngine;
        this.sourceTranslator.prepareImpl();
        
        // The MultiValueTranslator doesn't support this kind of treatment...
        this.values = this.sourceTranslator.values;
        this.metadata = this.sourceTranslator.metadata;
        this.resultset = this.sourceTranslator.resultset;
        
        if(this.isWaterfall && this.isVertical){
            // Place Total as last position
            // So that when drawing (reversed) it remains at the bottom
            // ... ["Cat1",  800, 1200, "U"],
            // row[1] -> row[L-1]
            
            function switchWaterFallSpec(row){
                row = row.slice(0);
                row.push(row[1]);
                row.splice(1, 1);
                
                return row;
            }
            
            this.values = this.values.map(switchWaterFallSpec);
            //this.metadata = reverseRowExceptFirstCol(this.metadata);
        }
    }
});

/**
 * Waterfall chart panel (also bar-chart). Generates a bar chart. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide bar value. Default: false
 * <i>stacked</i> -  Stacked? Default: false
 * <i>panelSizeRatio</i> - Ratio of the band occupied by the pane;. Default: 0.5 (50%)
 * <i>barSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by bars. Default: 0.9 (90%)
 * <i>maxBarSize</i> - Maximum size (width) of a bar in pixels. Default: 2000
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

    constructor: function(chart, options){
        this.base(chart, options);
    },

    /* @Override */
    isOrientationVertical: function(){
        return this.orientation == "vertical";
    },
    
    /* @Override */
    isOrientationHorizontal: function(){
        return this.orientation == "horizontal";
    },
    
    /***
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
    */
    constructWaterfall: function(dataset){
        var cumulated = 0,
            categoryIndexes = [],
            categoryTotals = [],
            cats = this.chart.dataEngine.getVisibleCategoriesIndexes(),
            seriesCount  = dataset.length,
            totalsSeriesIndex = this.isOrientationHorizontal() 
                                ? 0 
                                : (seriesCount - 1),
            totalsSeries = dataset[totalsSeriesIndex],
            catCount = cats.length;
        
        for(var c = 0 ; c < catCount; c++) {
            categoryIndexes.push(cats[c]);

            // Determine next action (direction)
            var mult;
            if (totalsSeries[c] == "U") {
                mult = 1;
            } else if (totalsSeries[c] == "D") {
                mult = -1;
            } else {
                mult = 1;
                cumulated = 0;
            }
            
            if (mult > 0){
                totalsSeries[c] = cumulated;
            }
            
            // Update the other series and determine new cumulated
            for(var seriesIndex = 0 ; seriesIndex < seriesCount ; seriesIndex++) {
                if(seriesIndex !== totalsSeriesIndex){
                    var series = dataset[seriesIndex],
                        val = Math.abs(series[c]);

                    // Negative values not allowed
                    series[c] = val;

                    // Only use negative values internally for the waterfall
                    //  to control Up or Down
                    cumulated += mult * val;
                }
            }
            
            if (mult < 0) {
                totalsSeries[c] = cumulated;
            }
            
            categoryTotals.push(cumulated);
        }
        
        return {
            categoryIndexes: categoryIndexes,
            categoryTotals: categoryTotals
        };
    },

    getDataSet: function() {
        // Clear needed to force re-fetch of visible series
        this.chart.dataEngine.clearDataCache();
        
        var dataset;
        if(this.stacked){
          /*
            Values
            Total  A     B
            [["U", 800, 1200],  // 1800 (depends on visible series)
             ["D", 100,  600],  //  700
             ["D", 400,  300],  //  700
             ["D", 200,  100],  //  300
             ["D", 100,  200]]  //  300

            Values Transposed
            [[ "U", "D", "D", "D", "D"],
             [ 800, 100, 400, 200, 100],
             [1200, 600, 300, 100, 200]]
           */
            dataset = pvc.padMatrixWithZeros(
                             this.chart.dataEngine.getVisibleTransposedValues());
            
            if (this.waterfall){
                // NOTE: changes dataset
                this.ruleData = this.constructWaterfall(dataset);
            }
        } else {
            dataset = this.chart.dataEngine.getVisibleCategoriesIndexes();
        }
        
        return dataset;
    },

    /*
     *   This function implements a number of helper functions in order
     *   to increase the readability and extensibility of the code by:
     *    1: providing symbolic names to the numerous anonymous
     *        functions that need to be passed to CC
     *    2: by moving large parts of the local variable (parameters
     *       and scaling functions out of the 'create' function to this
     *       prepareDataFunctions block. 
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
    prepareDataFunctions:  function(dataset, stacked, isVertical) {
        var myself = this,
        	chart  = this.chart,
        	dataEngine = chart.dataEngine;

        // create empty container for the functions and data
        this.DF = {};

        // first series are symbolic labels, so hide it such that
        // the axis-range computation is possible.
        /*
		    var lScale = this.waterfall
		  		 ? this.callWithHiddenFirstSeries(
		  			this.chart,
		           	this.chart.getLinearScale, 
		           	true)
		         : this.chart.getLinearScale(true);
		*/
        /** start  fix  (need to resolve this nicely  (CvK))**/
        if (this.waterfall) {
            // extract the maximum
            var mx = 0, 
                catCount = dataset[0].length;
            for(var c = 0 ; c < catCount ; c++) {
                var h = 0;
                for(var s = 0 ; s < dataset.length ; s++){
                    h += dataset[s][c];
                }
                if (h > mx) {
                	mx = h;
                }
            }
            
            // set maximum as a fixed bound
            chart.options.orthoFixedMax = mx;	
        }
        
        var lScale = chart.getLinearScale(true);
        /** end fix **/
        
        var l2Scale = chart.getSecondScale(true);
        var oScale  = chart.getOrdinalScale(true);
        
        // determine barPositionOffset and barScale
        var barPositionOffset = 0,
        	barScale, // for !stacked and overflow markers
        	ordBand = oScale.range().band,
        	maxBarSize = ordBand;
        
        if(!stacked){
        	var ordDomain = dataEngine.getVisibleSeriesIndexes();
            if(!isVertical){
                // Non-stacked Horizontal bar charts show series from
                //  top to bottom (according to the legend)
            	ordDomain = ordDomain.slice(0);
            	ordDomain.reverse();
            }
            
            barScale = new pv.Scale.ordinal(ordDomain)
            				.splitBanded(0, ordBand, this.barSizeRatio);
            
            // Export needed for generated overflow markers.
            this.DF.barScale = barScale;
            
            maxBarSize = barScale.range().band;
        }
        
        if (maxBarSize > this.maxBarSize) {
            barPositionOffset = (maxBarSize - this.maxBarSize) / 2;
            maxBarSize = this.maxBarSize;
        }
        
        this.DF.maxBarSize = maxBarSize;
        
        /*
         * functions to determine positions along BASE axis.
         */
        if(stacked){
            this.DF.basePositionFunc = function(d){
                return barPositionOffset + oScale(this.index);
            };
            
            // for drawRules
            if (this.waterfall){
                this.DF.baseRulePosFunc = function(d){
                    return barPositionOffset + oScale(d);
                };
            }
        } else {
            this.DF.catContainerBasePosFunc = function(d){
                return oScale(dataEngine.getVisibleCategories()[d]);
            };
            
            this.DF.catContainerWidth = ordBand;
            
            this.DF.relBasePosFunc = function(d){
                return barScale(dataEngine.getVisibleSeriesIndexes()[this.index]) + 
                		barPositionOffset;
            };
        }

        this.DF.secBasePosFunc = function(d){
            return myself.timeSeries 
            	   ? tScale(parser.parse(d.category))
            	   : (oScale(d.category) + ordBand / 2);
        };

        /*
        * functions to determine positions along ORTHOGONAL axis
        */
        this.DF.orthoBotPos = stacked ?
            lScale(0) :
            function(d){ return lScale(pv.min([0,d])); };

        this.DF.orthoLengthFunc = stacked ? 
        function(d){
            return chart.animate(0, lScale(d||0)-lScale(0) );
        } :
        function(d){
            var res = chart.animate(0, 
                Math.abs(lScale(d||0) - lScale(0)));
            return res;
        };

        this.DF.secOrthoLengthFunc = function(d){
            return chart.animate(0, l2Scale(d.value));
        };

        /*
         * functions to determine the color palette.
         */
        var seriesCount = dataEngine.getSeriesSize(),
            colors = chart.colors(pv.range(seriesCount));
        if (this.stacked){
            var totalsSeriesIndex = this.isOrientationHorizontal()
                                    ? 0 
                                    : (seriesCount - 1);
                                    
            this.DF.colorFunc = function(/*d*/){
                var seriesIndex = this.parent.index;
                if (myself.waterfall && seriesIndex == totalsSeriesIndex) {
                    return pv.Color.names["transparent"];
                }

                var seriesIndex2 = dataEngine.getVisibleSeriesIndexes()[seriesIndex];
                return colors(seriesIndex2);
            };
            
        } else {
            this.DF.colorFunc2 = function(d){
                return colors(dataEngine.getVisibleSeriesIndexes()[this.index]);
            };
        }
    },

    /****
    *  Functions used to draw a set of horizontal rules that connect
    *  the bars that compose the waterfall
    ****/
    drawWaterfalls: function(panel) {
        var ruleData = this.ruleData;

        if (!this.stacked){
            pvc.log("Waterfall must be stacked");
            return;
        }
        
        this.drawWaterfallRules(
                    panel, 
                    ruleData.categoryIndexes, 
                    ruleData.categoryTotals, 
                    2);
    },

    drawWaterfallRules: function(panel, cats, vals, offset) {
        var data = [],
            anchor = this.isOrientationVertical() ? "bottom" : "left";

        // build the dataset as a hashmap
        var x1 = offset + this.DF.baseRulePosFunc(cats[0]);
        for(var i = 0; i < cats.length-1 ; i++)
        {
            var x2 = offset + this.DF.baseRulePosFunc(cats[i+1]);
            data.push({
                x: x1, 
                y: this.DF.orthoLengthFunc(vals[i]), 
                w: x2 - x1
            });
            x1 = x2;  // go to next element
        }

        this.pvWaterfallLine = panel.add(pv.Rule)
            .data(data)
            [this.anchorOrtho(anchor) ](function(d) { return d.x; })
            [anchor                   ](function(d) { return d.y; })
            [this.anchorLength(anchor)](function(d) { return d.w; })
            .strokeStyle("#c0c0c0");

        return;
    },

    create: function(){
        var myself = this;
        
        this.width  = this._parent.width;
        this.height = this._parent.height;
        
        // Creates the pvc panel
        this.base();

        if  ((this.chart.options.orthoFixedMin != null) || 
             (this.chart.options.orthoFixedMax != null)){
            this.pvPanel["overflow"]("hidden");
        }

        var isVertical = this.isOrientationVertical(),
            anchor = isVertical ? "bottom" : "left",
            anchorOrtho = this.anchorOrtho(anchor),
            anchorOrthoLength = this.anchorOrthoLength(anchor),
            anchorLength = this.anchorLength(anchor),
            dataset = this.getDataSet();
        
        // prepare data and functions when creating (rendering) the chart.
        this.prepareDataFunctions(dataset, this.stacked, isVertical);

        var maxBarSize = this.DF.maxBarSize;
        
        if (this.stacked){
            if (this.waterfall){
                this.drawWaterfalls(this.pvPanel);
            }

            this.pvBarPanel = this.pvPanel.add(pv.Layout.Stack)
				.layers(dataset)
                // Stacked Vertical bar charts show series from
                //  top to bottom (according to the legend)
                .order(isVertical  ? "reverse"     : null)
				.orient(isVertical ? "bottom-left" : "left-bottom")
				.x(this.DF.basePositionFunc)
				.y(this.DF.orthoLengthFunc)
				[anchor](this.DF.orthoBotPos);

            this.pvBar = this.pvBarPanel.layer.add(pv.Bar)
                .data(function(d){ return d; })
                [anchorLength](maxBarSize)
                .fillStyle(this.DF.colorFunc);

        } else {   //  not this.stacked
            // define a container (panel) for each category label.
            // later the individuals bars of series will be drawn in 
            // these panels.
            this.pvBarPanel = this.pvPanel.add(pv.Panel)
                                .data(dataset)
                                [anchorOrtho      ](this.DF.catContainerBasePosFunc)
                                [anchor           ](0)
                                [anchorLength     ](this.DF.catContainerWidth)
                                // pvBarPanel[X]  = this[X]  (copy the function)
                                [anchorOrthoLength](this[anchorOrthoLength]);

            // next add the bars to the bar-containers in pvBarPanel
            this.pvBar = this.pvBarPanel.add(pv.Bar)
                .data(function(d){
                        return myself.chart.dataEngine.
                                    getVisibleValuesForCategoryIndex(d);
                    })
                .fillStyle(this.DF.colorFunc2)
                [anchorOrtho      ](this.DF.relBasePosFunc)
                [anchor           ](this.DF.orthoBotPos)
                [anchorOrthoLength](this.DF.orthoLengthFunc)
                [anchorLength     ](maxBarSize); 

        }  // end of if (stacked)

        // generate red markers if some data falls outside the panel bounds
        this.generateOverflowMarkers(anchor, this.stacked);

        if(this.chart.options.secondAxis){
            // Second axis - support for line
            this.pvSecondScatterPanel = this.pvPanel.add(pv.Panel)
                .data(this.chart.dataEngine.getSecondAxisIndices());
            
            this.pvArea = this.pvSecondScatterPanel.add(pv.Area)
                .fillStyle(null);
                
            this.pvSecondLine = this.pvArea.add(pv.Line)
                .segmented(true)
                .data(function(d){
                    return myself.chart.dataEngine.getObjectsForSecondAxis(d,
                        this.timeSeries ? function(a,b){
                        return parser.parse(a.category) - parser.parse(b.category);
                        }: null)
                    })
                .strokeStyle(function(){
                    var colors = myself.chart.options.secondAxisColor;
                    colors = colors instanceof Array ? colors : [colors];
                    return colors[this.parent.index % colors.length];
                })
                [anchorOrtho](this.DF.secBasePosFunc)
                [anchor     ](this.DF.secOrthoLengthFunc);

            this.pvSecondDot = this.pvSecondLine.add(pv.Dot)
                .shapeSize(8)
                .lineWidth(1.5)
                .fillStyle(function(){
                    var colors = myself.chart.options.secondAxisColor;
                    colors = colors instanceof Array ? colors : [colors];
                    return colors[this.parent.index % colors.length];
                });
        }

        // Labels:
        this.pvBar
            .text(function(d){
                var dataEngine = myself.chart.dataEngine, 
                    s  = dataEngine.getVisibleSeries()
                		 [myself.stacked ? this.parent.index : this.index],
                	c  = dataEngine.getVisibleCategories()
                		 [myself.stacked ? this.index : this.parent.index];
                
                return myself.chart.options.tooltipFormat.call(myself,s,c,d);
            });

        if(this.showTooltips){
            // Extend default
            this.extend(this.tipsySettings, "tooltip_");
            this.pvBar.event("mouseover", pv.Behavior.tipsy(this.tipsySettings));
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
                    return myself.chart.options.clickAction(s, c, d, e);
                });
        }

        if(this.showValues){
            this.pvBarLabel = this.pvBar
                .anchor(this.valuesAnchor || 'center')
                .add(pv.Label)
                .bottom(0)
                .text(function(d){
                    return myself.chart.options.valueFormat(d);
                });
      
            // Extend barLabel
            this.extend(this.pvBarLabel, "barLabel_");
        }

        // Extend waterfall line
        if (this.waterfall){
            this.extend(this.pvWaterfallLine, "barWaterfallLine_");
        }

        // Extend bar and barPanel
        this.extend(this.pvBarPanel, "barPanel_");
        this.extend(this.pvBar, "bar_");
    
        // Extend secondAxis
        if(this.pvSecondLine){
            this.extend(this.pvSecondLine, "barSecondLine_");
        }

        if(this.pvSecondDot){
            this.extend(this.pvSecondDot, "barSecondDot_");
        }

        // Extend body
        this.extend(this.pvPanel, "chart_");
    },


    /*******
   *  Function used to generate overflow and underflowmarkers.
   *  This function is only used when fixedMinX and orthoFixedMax are set
   *
   *******/
    generateOverflowMarkers: function(anchor, stacked){
        if (stacked) {
            if ((this.chart.options.orthoFixedMin != null) || 
                (this.chart.options.orthoFixedMax != null)){  
                pvc.log("WARNING: overflow markers not implemented for Stacked graph yet");
            }
            return;
        }
        
        var myself = this;
        if  (this.chart.options.orthoFixedMin != null){
            // CvK: adding markers for datapoints that are off-axis
            //  UNDERFLOW  =  datavalues < orthoFixedMin
            this.doGenOverflMarks(anchor, true, this.DF.maxBarSize, 
                0, this.DF.barScale,
                function(d){
                    var res = myself.chart.dataEngine
                    .getVisibleValuesForCategoryIndex(d);
                    // check for off-grid values (and replace by null)
                    var fixedMin = myself.chart.options.orthoFixedMin;
                    for(var i=0; i<res.length; i++)
                        res[i] = (res[i] < fixedMin) ? fixedMin : null; 
                    return res;
                });
        }
  
        if (this.chart.options.orthoFixedMax != null){
            // CvK: overflow markers: max > orthoFixedMax
            this.doGenOverflMarks(anchor, false, this.DF.maxBarSize, 
                Math.PI, this.DF.barScale,
                function(d){
                    var res = myself.chart.dataEngine
                    .getVisibleValuesForCategoryIndex(d);
                    // check for off-grid values (and replace by null)
                    var fixedMax = myself.chart.options.orthoFixedMax;
                    for(var i=0; i<res.length; i++)
                        res[i] = (res[i] > fixedMax) ? fixedMax : null; 
                    return res;
                });
        }
    },

    // helper routine used for both underflow and overflow marks
    doGenOverflMarks: function(anchor, underflow, maxBarSize, angle,
        barScale, dataFunction)
    {
        var myself = this;
        var offGridBarOffset = maxBarSize/2,
            lScale = this.chart.getLinearScale(true);
    
        var offGridBorderOffset = underflow 
                                    ? lScale.min + 8  
                                    : lScale.max - 8;
    
        if (this.orientation != "vertical"){
            angle += Math.PI/2.0;
        }
    
        this.overflowMarkers = this.pvBarPanel.add(pv.Dot)
            .shape("triangle")
            .shapeSize(10)
            .shapeAngle(angle)
            .lineWidth(1.5)
            .strokeStyle("red")
            .fillStyle("white")
            .data(dataFunction)
            [this.anchorOrtho(anchor)](function(d){
                var res = barScale(myself.chart.dataEngine
                    .getVisibleSeriesIndexes()[this.index])
                    + offGridBarOffset;
                return res;
            })
            [anchor](function(d){ 
                // draw the markers at a fixed position (null values are
                // shown off-grid (-1000)
                return (d != null) ? offGridBorderOffset: -10000;
            }) ;
    }
});
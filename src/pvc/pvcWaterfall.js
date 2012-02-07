
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
 * derive a BarChart class from this class by switching off a few
 * features.
 *
 * If you have an issue or suggestions regarding the Waterfall-charts
 * please contact CvK at cde@vinzi.nl
 */
pvc.WaterfallChart = pvc.CategoricalAbstract.extend({

    wfChartPanel : null,

    constructor: function(options){

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.WaterfallChart.defaultOptions, options);

        // Water-falls are always stacked
        this.options.stacked = true;
    },

    /**
     * Creates a custom WaterfallDataEngine.
     * [override]
     */
    createDataEngine: function(){
        return new pvc.WaterfallDataEngine(this);
    },

    /* @override */
    createCategoricalPanel: function(){
        var logMessage = "Prerendering a ";
        if (this.options.waterfall)
            logMessage += "WaterfallChart";
        else
            logMessage +=  (this.options.stacked ? "stacked" : "normal") +
                           " BarChart";
        pvc.log(logMessage);
        
        this.wfChartPanel = new pvc.WaterfallChartPanel(this, {
            stacked:        this.options.stacked,
            waterfall:      this.options.waterfall,
            barSizeRatio:   this.options.barSizeRatio,
            maxBarSize:     this.options.maxBarSize,
            showValues:     this.options.showValues,
            orientation:    this.options.orientation
        });
        
        return this.wfChartPanel;
    }
}, {
    defaultOptions: {
        showValues:   true,
        stacked:      true,
        waterfall:    true,
        barSizeRatio: 0.9,
        maxBarSize:   2000
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
pvc.WaterfallChartPanel = pvc.CategoricalAbstractPanel.extend({

    pvBar: null,
    pvBarLabel: null,
    pvWaterfallLine: null,
    pvCategoryPanel: null,
    pvSecondLine: null,
    pvSecondDot: null,

    data: null,

    waterfall: false,
    stacked: false,

    barSizeRatio: 0.9,
    maxBarSize: 200,
    showValues: true,

    ruleData: null,

//    constructor: function(chart, options){
//        this.base(chart, options);
//    },

    /***
    *  Functions that transforms a dataSet to waterfall-format.
    *
    * The assumption made is that the first category is a tekst column
    * containing one of the following values:
    *    - "U":  If this category (row) needs go upwards (height
    *       increases)
    *    - "D": If the waterfall goes downward.
    *    - other values: the waterfall resets to zero (used represent
    *        intermediate subtotal) Currently subtotals need to be
    *        provided in the dataSet.
    *  This function computes the offsets of each bar and stores the
    *  offset in the first category (for stacked charts)
    */
    constructWaterfall: function(dataSet){
        var cumulated = 0,
            categoryIndexes = [],
            categoryTotals = [],
            cats = this.chart.dataEngine.getVisibleCategoriesIndexes(),
            seriesCount  = dataSet.length,
            totalsSeriesIndex = this.isOrientationHorizontal()
                                ? 0
                                : (seriesCount - 1),
            totalsSeries = dataSet[totalsSeriesIndex],
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
                    var series = dataSet[seriesIndex],
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
        var dataSet;
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
            dataSet = pvc.padMatrixWithZeros(
                             this.chart.dataEngine.getVisibleTransposedValues());

            if (this.waterfall){
                // NOTE: changes dataSet
                this.ruleData = this.constructWaterfall(dataSet);
            }
        } else {
            dataSet = this.chart.dataEngine.getVisibleCategoriesIndexes();
        }

        return dataSet;
    },
    
    /**
     * Returns the datum associated with the 
     * current rendering indexes of this.pvBar.
     * @override 
     */
    _getRenderingDatum: function(mark){
        var index = this.pvBar.index;
        if(index >= 0){
            var visibleSerIndex = this.stacked ? this.pvBar.parent.index : index,
                visibleCatIndex = this.stacked ? index : this.pvBar.parent.index,
                de = this.chart.dataEngine;

            var datumRef = {
                categories: de.translateDimensionVisibleIndex('categories', visibleCatIndex),
                series:     de.translateDimensionVisibleIndex('series',     visibleSerIndex)
            };

            return de.findDatum(datumRef, true);
        }
        return null;
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
    prepareDataFunctions:  function(dataSet, isVertical) {
        var myself = this,
            chart  = this.chart,
            options = chart.options,
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
                catCount = dataSet[0].length;
            for(var c = 0 ; c < catCount ; c++) {
                var h = 0;
                for(var s = 0 ; s < dataSet.length ; s++){
                    h += dataSet[s][c];
                }
                if (h > mx) {
                	mx = h;
                }
            }

            // set maximum as a fixed bound
            options.orthoFixedMax = mx;
        }

        var lScale = chart.getLinearScale(true);
        /** end fix **/

        var l2Scale = chart.getSecondScale(true),
            oScale  = chart.getOrdinalScale(true);

        // determine barPositionOffset and barScale
        var barPositionOffset = 0,
            barScale, // for !stacked and overflow markers
            ordBand = oScale.range().band,
            barSize = ordBand;

        if(!this.stacked){
            var ordDomain = dataEngine.getVisibleSeriesIndexes();
            if(!isVertical){
                // Non-stacked Horizontal bar charts show series from
                //  top to bottom (according to the legend)
            	ordDomain = ordDomain.slice(0);
            	ordDomain.reverse();
            }

            // NOTE: 'barSizeRatio' affects the space between bars.
            // Space between categories is controlled by panelSizeRatio.
            barScale = new pv.Scale.ordinal(ordDomain)
                            .splitBanded(0, ordBand, this.barSizeRatio);

            // Export needed for generated overflow markers.
            this.DF.barScale = barScale;

            barSize = barScale.range().band;
        }

        if (barSize > this.maxBarSize) {
            barPositionOffset = (barSize - this.maxBarSize) / 2;
            barSize = this.maxBarSize;
        }

        this.DF.maxBarSize = barSize;

        /*
         * functions to determine positions along BASE axis.
         */
        if(this.stacked){
            this.DF.basePositionFunc = function(d){
                return barPositionOffset + 
                       oScale(dataEngine.getVisibleCategories()[this.index]);
            };

            // for drawRules
            if (this.waterfall){
                this.DF.baseRulePosFunc = function(d){
                    return barPositionOffset + oScale(d);
                };
            }
        } else {
            // TODO: barPositionOffset - does not affect this?
            this.DF.catContainerBasePosFunc = function(d){
                // TODO: d?? is it an index?, a category value??
                return oScale(dataEngine.getVisibleCategories()[d]);
            };

            this.DF.catContainerWidth = ordBand;

            this.DF.relBasePosFunc = function(d){
                return barPositionOffset + 
                       barScale(dataEngine.getVisibleSeriesIndexes()[this.index]);
            };
        }

        if(options.secondAxis){
            var parser = pv.Format.date(options.timeSeriesFormat);
            this.DF.secBasePosFunc = function(d){
                return options.timeSeries
                       ? tScale(parser.parse(d.category))
                       : (oScale(d.category) + ordBand / 2);
            };
        }

        /*
        * functions to determine positions along ORTHOGONAL axis
        */
        this.DF.orthoBotPos = this.stacked ?
            lScale(0) :
            function(d){ return lScale(pv.min([0,d])); };

        this.DF.orthoLengthFunc = this.stacked ?
            function(d){
                return chart.animate(0, lScale(d||0) - lScale(0));
            } :
            function(d){
                var res = chart.animate(0,
                    Math.abs(lScale(d||0) - lScale(0)));
                return res;
            };

        if(options.secondAxis){
            this.DF.secOrthoLengthFunc = function(d){
                return chart.animate(0, l2Scale(d.value));
            };
        }
        
        /*
         * functions to determine the color of Bars
         * (fillStyle of this.pvBar)
         */
        var seriesCount = dataEngine.getSeriesSize(),
            colors = chart.colors(pv.range(seriesCount)),

            // Only relevant for stacked:
            totalsSeriesIndex = this.isOrientationHorizontal() ?
                                0 : (seriesCount - 1);

        this.DF.colorFunc = function(){
            var datum = myself._getRenderingDatum(this),
                seriesIndex = datum.keyIndexes.series;

            // Change the color of the totals series
            if (myself.waterfall && seriesIndex == totalsSeriesIndex) {
                return pv.Color.names["transparent"];
            }

            var color = colors(seriesIndex),
                shouldDimColor = dataEngine.getSelectedCount() > 0 &&
                                 !datum.isSelected();

            return shouldDimColor ? pvc.toGrayScale(color) : color;
        };
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

        // build the dataSet as a hashmap
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
    },

    /**
     * @override
     */
    createCore: function(){
        var myself = this,
            dataEngine = this.chart.dataEngine,
            options = this.chart.options;
        
        var isVertical = this.isOrientationVertical(),
            anchor = isVertical ? "bottom" : "left",
            anchorOrtho = this.anchorOrtho(anchor),
            anchorOrthoLength = this.anchorOrthoLength(anchor),
            anchorLength = this.anchorLength(anchor),
            dataSet = this.getDataSet();

        // prepare data and functions when creating (rendering) the chart.
        this.prepareDataFunctions(dataSet, isVertical);

        var maxBarSize = this.DF.maxBarSize;

        if (this.stacked){
            if (this.waterfall){
                this.drawWaterfalls(this.pvPanel);
            }
            
            // one item per visible category ->
            //  [
            //      // 1st visible category
            //      [datum1, datum2, datum3] // 1 per visible series
            this.pvBarPanel = this.pvPanel.add(pv.Layout.Stack)
                //.data()        // datums -> categories
                .layers(dataSet) // series
                // Stacked Vertical bar charts show series from
                //  top to bottom (according to the legend)
                .order(isVertical  ? "reverse"     : null)
                .orient(isVertical ? "bottom-left" : "left-bottom")
                .x(this.DF.basePositionFunc)
                .y(this.DF.orthoLengthFunc)
                [anchor](this.DF.orthoBotPos);

            this.pvBar = this.pvBarPanel.layer.add(pv.Bar)
                .data(function(d){
                    return d;
                }) // TODO: is this needed?
                [anchorLength](maxBarSize)
                .fillStyle(this.DF.colorFunc);

        } else {   //  not this.stacked
            // define a container (panel) for each category label.
            // later the individuals bars of series will be drawn in
            // these panels.
            this.pvBarPanel = this.pvPanel.add(pv.Panel)
                                .data(dataSet)
                                [anchorOrtho      ](this.DF.catContainerBasePosFunc)
                                [anchor           ](0)
                                [anchorLength     ](this.DF.catContainerWidth)
                                // pvBarPanel[X]  = this[X]  (copy the function)
                                [anchorOrthoLength](this[anchorOrthoLength]);

            // next add the bars to the bar-containers in pvBarPanel
            this.pvBar = this.pvBarPanel.add(pv.Bar)
                .data(function(d){
                        return pvc.padArrayWithZeros(
                                dataEngine.getVisibleValuesForCategoryIndex(d));
                      })
                .fillStyle(this.DF.colorFunc)
                [anchorOrtho      ](this.DF.relBasePosFunc)
                [anchor           ](this.DF.orthoBotPos)
                [anchorOrthoLength](this.DF.orthoLengthFunc)
                [anchorLength     ](maxBarSize);

        }  // end of if (stacked)

        // generate red markers if some data falls outside the panel bounds
        this.generateOverflowMarkers(anchor, this.stacked);

        if(options.secondAxis){
            // Second axis - support for line
            this.pvSecondScatterPanel = this.pvPanel.add(pv.Panel)
                .data(dataEngine.getSecondAxisIndices());

            this.pvArea = this.pvSecondScatterPanel.add(pv.Area)
                .fillStyle(null);
            
            var valueComparer = options.timeSeries ?
                                pvc.createDateComparer(
                                    pv.Format.date(options.timeSeriesFormat), 
                                    function(item){ return item.category; }) :
                                null;

            // TODO: this.chart.secondAxisColor();
            var secondAxisColors = pvc.toArray(options.secondAxisColor);
            function secondAxisColorScale(){
                return secondAxisColors[this.parent.index % secondAxisColors.length];
            }

            this.pvSecondLine = this.pvArea.add(pv.Line)
                .segmented(true)
                .data(function(d){
                        return dataEngine.getObjectsForSecondAxis(d, valueComparer);
                    })
                .strokeStyle(secondAxisColorScale)
                [anchorOrtho](this.DF.secBasePosFunc)
                [anchor     ](this.DF.secOrthoLengthFunc);

            this.pvSecondDot = this.pvSecondLine.add(pv.Dot)
                .shapeSize(8)
                .lineWidth(1.5)
                .fillStyle(secondAxisColorScale);
        }

        // For labels, tooltips
        this.pvBar
            .text(function(d){
                // TODO: for the no series case... 's' assumes the value "Series"
                // added by the translator
                var datum = myself._getRenderingDatum(this),
                    s = datum.keyValues.series,
                    c = datum.keyValues.categories;
                    // d = datum.values

                return options.tooltipFormat.call(myself, s, c, d, datum);
            });

        if(options.showTooltips){
            /*
            this.tipsySettings = {
                html: true,
                gravity: "c",
                fade: false,
                followMouse:true
            };
            */
            this.pvBar
                .localProperty("tooltip", String) // see pvc.js
                .tooltip(function(r, ra, i){  // NOTE: row, rowAgain, index?
                    var tooltip;
                    if(options.customTooltip){
                        var datum = myself._getRenderingDatum(this),
                            s = datum.keyValues.series,
                            c = datum.keyValues.categories,
                            d = r;

                        tooltip = options.customTooltip.call(null, s, c, d, datum);
                    } else {
                        tooltip = r[i];
                    }

                    return tooltip;
                })
                .title(function(){
                    return ''; // prevent browser tooltip
                })
                .event("mouseover", pv.Behavior.tipsy(options.tipsySettings));
        }


        if (options.clickable){
            this.pvBar
                .cursor("pointer")
                .event("click", function(d){
                    var ev = arguments[arguments.length - 1];
                    return myself._handleClick(this, d, ev);
                });
        }
        
        if(options.doubleClickAction) {
            this.pvBar
                .cursor("pointer")
                .event("dblclick", function(r, ra, i){
                     var ev = arguments[arguments.length - 1];
                     return myself._handleDoubleClick(this, r[i], ev);
                });
        }

        if(this.showValues){
            this.pvBarLabel = this.pvBar
                .anchor(this.valuesAnchor || 'center')
                .add(pv.Label)
                .bottom(0)
                .visible(function(d) { //no space for text otherwise
                    var v = parseFloat(d);
                    return !isNaN(v) && Math.abs(v) >= 1;
                 })
                .text(function(d){
                    return options.valueFormat(d);
                });
        }
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        if(this.pvBarLabel){
            this.extend(this.pvBarLabel, "barLabel_");
        }
         
        if (this.pvWaterfallLine){
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
    },

    /*******
    *  Function used to generate overflow and underflowmarkers.
    *  This function is only used when fixedMinX and orthoFixedMax are set
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
    doGenOverflMarks: function(anchor, underflow, maxBarSize, angle, barScale, dataFunction){
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
    },


    /**********************
     * selections (begin)
     */
    
    /**
     * Renders this.pvBar - the mark that is affected by selection changes.
     * @override
     */
    _renderSelectableMarks: function(){
        this.pvBarPanel.render();
    },

    /**
     * @override
     */
    _collectRubberBandSelections: function(){
        var dataEngine = this.chart.dataEngine,
            categories = dataEngine.getVisibleCategories(),
            series = dataEngine.getVisibleSeries(),
            C = categories.length,
            S = series.length;

        var rb = this.rubberBand;
        //pvc.log("rubber=[" + [rb.x0, rb.x0 + rb.dx, rb.y0, rb.y0 + rb.dy] +  "]");

        var index = 0,
            where = [];
        
        this._forEachInstanceInRubberBand(this.pvBar, function(instance, index){
            var i, j;

            if(this.stacked){
				// index = j*C + i
                j = Math.floor(index / C);
                i = index % C;
            } else {
				// index = i*S + j
                i = Math.floor(index / S);
                j = index % S;
            }

//            pvc.log("instance data: " + instance.data +
//                    " index: " + index +
//                    " [" + [i,j] + "]=[" + [categories[i],series[j]]  + "]");

            where.push({
                categories: [categories[i]],
                series:     [series[j]]
            });
        }, this);

        return dataEngine.getWhere(where);
    }
    /*
     * selections (end)
     **********************/
});
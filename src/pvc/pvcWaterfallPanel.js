
/**
 * Waterfall chart panel.
 * Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide bar value. Default: false
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
pvc.WaterfallPanel = pvc.BarAbstractPanel.extend({
    pvWaterfallLine: null,
    ruleData: null,

    /***
    * Function that transform a dataSet to waterfall-format.
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
        var dataSet = pvc.padMatrixWithZeros(
                        this.chart.dataEngine.getVisibleTransposedValues());

        // NOTE: changes dataSet
        this.ruleData = this.constructWaterfall(dataSet);
        
        return dataSet;
    },

    
    prepareDataFunctions:  function(dataSet) {
        var chart  = this.chart,
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
                     : this.chart.getLinearScale();
        */
        /** start  fix  (need to resolve this nicely  (CvK))**/
        // TODO: ???
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
        /** end fix **/

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
        }

        /*
         * functions to determine the color of Bars
         * (fillStyle of this.pvBar)
         */
        var seriesValues = dataEngine.owner.getSeries(),
            colors = chart.colors(seriesValues);

            // TODO: waterfall
            // Only relevant for waterfall
//            totalsSeriesIndex = this.isOrientationHorizontal() ?
//                                0 : (seriesValues.length - 1);

        this.DF.colorFunc = function(){
            var datum = this.datum();
            
//            var visibleSerIndex = myself.stacked ? this.parent.index : this.index,
//                seriesIndex = dataEngine.owner.getVisibleSeriesIndexes()[visibleSerIndex];
            
            // TODO: waterfall
            // Change the color of the totals series
//            if (myself.waterfall && seriesIndex == totalsSeriesIndex) {
//                return pv.Color.transparent;
//            }
            var seriesValue = this.datum().atoms.series.value,
                color = colors(seriesValue),
                shouldDimColor = dataEngine.owner.selectedCount() > 0 &&
                                 !datum.isSelected;

            return shouldDimColor ? pvc.toGrayScale(color, 0.6) : color;
        };
    },

    /**
     * Function used to draw a set of horizontal rules that connect
     * the bars that compose the waterfall.
     */

    drawWaterfallRules: function(panel, cats, vals, offset) {
        var data = [],
            anchor = this.isOrientationVertical() ? "bottom" : "left";

        // build the dataSet as a hashmap
        var x1 = offset + this.DF.baseRulePosFunc(cats[0]);
        for(var i = 0; i < cats.length-1 ; i++){
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
            [this.anchorOrtho(anchor) ](function(d) {return d.x;})
            [anchor                   ](function(d) {return d.y;})
            [this.anchorLength(anchor)](function(d) {return d.w;})
            .strokeStyle("#c0c0c0");
    },

    /**
     * @override
     */
    _createCore: function(){
        this.base();
         
        var ruleData = this.ruleData;

        this.drawWaterfallRules(
                    this.pvPanel,
                    ruleData.categoryIndexes,
                    ruleData.categoryTotals,
                    2);
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        this.extend(this.pvWaterfallLine, "barWaterfallLine_");
    }
});
/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */

pvc.BarChart = pvc.CategoricalAbstract.extend({

    barChartPanel : null,

    constructor: function(o){

        this.base(o);

        var _defaults = {
            showValues: true,
            stacked: false,
            panelSizeRatio: 0.9,
            barSizeRatio: 0.9,
            maxBarSize: 2000,
            valuesAnchor: "center",
            originIsZero: true,
            axisOffset: 0,
            showTooltips: true,
            orientation: "vertical",
            orthoFixedMin: null,
            orthoFixedMax: null
        };


        // Apply options
        $.extend(this.options,_defaults, o);


    },

    preRender: function(){

        this.base();

        pvc.log("Prerendering in barChart");


        this.barChartPanel = new pvc.WaterfallChartPanel(this, {
            stacked: this.options.stacked,
            waterfal: false,
            panelSizeRatio: this.options.panelSizeRatio,
            barSizeRatio: this.options.barSizeRatio,
            maxBarSize: this.options.maxBarSize,
            showValues: this.options.showValues,
            valuesAnchor: this.options.valuesAnchor,
            showTooltips: this.options.showTooltips,
            orientation: this.options.orientation
        });

        this.barChartPanel.appendTo(this.basePanel); // Add it

    }

}
);


/***************
 *  removed BarChartPanel  (CvK)
 *
 * Refactored the CODE:  BarChartPanel is now replaced by the
 *    WaterfallChartPanel as the Waterfallchart code is easier to extend.
 *    (in a next refactoringstep we could take the waterfall specific
 *     code out of the Waterfallchart panel out and make 
 *     restore inherence to waterfall being a special case of barChart.
 *
 ***************/


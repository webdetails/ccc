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
            originIsZero: true,
            axisOffset: 0,
            showTooltips: true,
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
            showTooltips: this.options.showTooltips,
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
    pvSecondLie: null,
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

        var lScale = this.chart.getLinearScale(true);
        var l2Scale = this.chart.getSecondScale(true);
        var oScale = this.chart.getOrdinalScale(true);

        var colors = this.chart.colors(pv.range(this.chart.dataEngine.getSeriesSize()));
        var colorFunc = function(d){
            return colors(myself.chart.dataEngine.getVisibleSeriesIndexes()[this.parent.index])
        };
        var colorFunc2 = function(d){
            return colors(myself.chart.dataEngine.getVisibleSeriesIndexes()[this.index])
        };
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
            .layers(pvc.padMatrixWithZeros(this.chart.dataEngine.getVisibleTransposedValues()))
            [this.orientation == "vertical"?"y":"x"](function(d){
                return myself.chart.animate(0, lScale(d||0)-lScale(0))
            })
            [anchor](lScale(0))
            [this.orientation == "vertical"?"x":"y"](function(d){
                return oScale(this.index) + barPositionOffset;
            });
            this.pvBar = this.pvBarPanel.layer.add(pv.Bar)
            .data(function(d){
                return d
            })
            //[anchor](lScale(0))
            [pvc.BasePanel.paralelLength[anchor]](maxBarSize)
            .fillStyle(colorFunc)

        /*[pvc.BasePanel.relativeAnchor[anchor]](function(d){
        return this.parent.left() + barPositionOffset
      })*/;

        }
        else{

            var bScale = new pv.Scale.ordinal(this.chart.dataEngine.getVisibleSeriesIndexes())
            .splitBanded(0, oScale.range().band, this.barSizeRatio);

            // We need to take into account the maxValue if our band is higher than that
            maxBarSize = bScale.range().band;
            var barPositionOffset = 0;
            if (maxBarSize > this.maxBarSize){
                barPositionOffset = (maxBarSize - this.maxBarSize)/2 ;
                maxBarSize = this.maxBarSize;
            }

            this.pvBarPanel = this.pvPanel.add(pv.Panel)
            .data(this.chart.dataEngine.getVisibleCategoriesIndexes())
            [pvc.BasePanel.relativeAnchor[anchor]](function(d){
                return oScale(this.index);
            })
            [anchor](0)
            [pvc.BasePanel.paralelLength[anchor]](oScale.range().band)
            [pvc.BasePanel.orthogonalLength[anchor]](this[pvc.BasePanel.orthogonalLength[anchor]])


            this.pvBar = this.pvBarPanel.add(pv.Bar)
            .data(function(d){
                return myself.chart.dataEngine.getVisibleValuesForCategoryIndex(d)
                })
            .fillStyle(colorFunc2)
            [pvc.BasePanel.relativeAnchor[anchor]](function(d){
                return bScale(myself.chart.dataEngine.getVisibleSeriesIndexes()[this.index]) + barPositionOffset;
            })
            [anchor](function(d){
                return lScale(pv.min([0,d]))
            })
            [pvc.BasePanel.orthogonalLength[anchor]](function(d){
                return myself.chart.animate(0, Math.abs(lScale(d||0) - lScale(0)))
            })
            [pvc.BasePanel.paralelLength[anchor]](maxBarSize)

        }


        if(this.chart.options.secondAxis){
            // Second axis - support for lines
            this.pvSecondLine = this.pvPanel.add(pv.Line)
            .data(function(d){
                return myself.chart.dataEngine.getObjectsForSecondAxis(d, this.timeSeries?function(a,b){
                    return parser.parse(a.category) - parser.parse(b.category);
                    }: null)
                })
            .strokeStyle(this.chart.options.secondAxisColor)
            [pvc.BasePanel.relativeAnchor[anchor]](function(d){
                if(myself.timeSeries){
                    return tScale(parser.parse(d.category));
                }
                else{
                    return oScale(d.category) + oScale.range().band/2;
                }
            })
            [anchor](function(d){
                return myself.chart.animate(0,l2Scale(d.value));
            })

            this.pvSecondDot = this.pvSecondLine.add(pv.Dot)
            .shapeSize(8)
            .lineWidth(1.5)
            .fillStyle(this.chart.options.secondAxisColor)
        }

        // Labels:

        this.pvBar
        .text(function(d){
            var v = myself.chart.options.valueFormat(d);
            var s = myself.chart.dataEngine.getVisibleSeries()[myself.stacked?this.parent.index:this.index]
            var c = myself.chart.dataEngine.getVisibleCategories()[myself.stacked?this.index:this.parent.index]
            return myself.chart.options.tooltipFormat.call(myself,s,c,v);
    
        })

        if(this.showTooltips){
            // Extend default
            this.extend(this.tipsySettings,"tooltip_");
            this.pvBar
            .event("mouseover", pv.Behavior.tipsy(this.tipsySettings));
        }


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
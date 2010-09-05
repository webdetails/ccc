

/**
 * xyAbstract is the base class for XY charts.
 */

pvc.PieChart = pvc.Base.extend({

  pieChartPanel : null,

  constructor: function(o){

    this.base();

    var _defaults = {
      showInnerValue: false,
      innerGap: 0.8
    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    // TODO: Build it
    this.base();

    pvc.log("Prerendering in pieChart");


    this.pieChartPanel = new pvc.PieChartPanel(this, {
      innerGap: this.options.innerGap
    });

    this.pieChartPanel.appendTo(this.basePanel); // Add it

  }

}
);


/*
   * Legend panel. Generates the legend. Specific options are:
   * <i>legend</i> - text. Default: false
   * <i>legendPosition</i> - top / bottom / left / right. Default: bottom
   * <i>legendSize</i> - The size of the legend in pixels. Default: 25
   *
   * Has the following protovis extension points:
   *
   * <i>legend_</i> - for the main legend Panel
   */


pvc.PieChartPanel = pvc.BasePanel.extend({

  _parent: null,
  pvPie: null,
  pvPieLabel: null,
  
  innerGap: 0.8,


  constructor: function(chart, options){

    this.base(chart,options);

  },

  create: function(){


    this.width = this._parent.width;
    this.height = this._parent.height;

    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)


    // Add the chart. For a pie chart we have one series only

    var r = pv.min([this.width, this.height])/2 * this.innerGap;

    var sum = this.chart.dataEngine.getSeriesMaxSum();
    
    pvc.log("Radius: "+ r + "; Maximum sum: " + sum);

    var a = pv.Scale.linear(0, sum).range(0, 2 * Math.PI);

    this.pvPie = this.pvPanel.add(pv.Wedge)
    .data(this.chart.dataEngine.getValuesForSeriesIdx(0))
    .bottom(this.height / 2)
    .left(this.width / 2)
    .strokeStyle("white")
    .outerRadius(r)
    .angle(a)
    .cursor("pointer")
    .event("click",function(d){
      pvc.log("You clicked on index " + this.index + ", value " + d)
    });

    // Extend pie
    this.extend(this.pvPie,"pie_");


    this.pvPieLabel = this.pvPie.anchor("center").add(pv.Label)
    .textAngle(0)
    .text(function(d){
      return d.toFixed(2)
    });

    // Extend pieLabel
    this.extend(this.pvPieLabel,"pieLabel_");


    // Extend body
    this.extend(this.pvPanel,"chart_");


  }

});
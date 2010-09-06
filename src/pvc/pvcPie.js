

/**
 * xyAbstract is the base class for XY charts.
 */

pvc.PieChart = pvc.Base.extend({

  pieChartPanel : null,

  constructor: function(o){

    this.base();

    var _defaults = {
      showValues: true,
      innerGap: 0.9,
      explodedSliceRadius: 0
    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    // TODO: Build it
    this.base();

    pvc.log("Prerendering in pieChart");


    this.pieChartPanel = new pvc.PieChartPanel(this, {
      innerGap: this.options.innerGap,
      explodedSliceRadius: this.options.explodedSliceRadius,
      showValues: this.options.showValues
    });

    this.pieChartPanel.appendTo(this.basePanel); // Add it

  }

}
);


/*
   * Pie chart panel. Generates a pie chart. Specific options are:
   * <i>showValues</i> - Show or hide slice value. Default: false
   * <i>explodedSliceRadius</i> - If one wants a pie with an exploded effect,
   *  specify a value in pixels here. Default: 0
   * <i>innerGap</i> - The size of the legend in pixels. Default: 25
   *
   * Has the following protovis extension points:
   *
   * <i>chart_</i> - for the main chart Panel
   * <i>pie_</i> - for the main pie wedge
   * <i>pieLabel_</i> - for the main pie label
   */


pvc.PieChartPanel = pvc.BasePanel.extend({

  _parent: null,
  pvPie: null,
  pvPieLabel: null,
  data: null,

  innerGap: 0.9,
  explodedSliceRadius: 0,
  showValues: true,


  constructor: function(chart, options){

    this.base(chart,options);

  },

  create: function(){

    var myself=this;
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
    this.data = this.chart.dataEngine.getValuesForSeriesIdx(0);


    this.pvPie = this.pvPanel.add(pv.Wedge)
    .data(this.chart.dataEngine.getValuesForSeriesIdx(0))
    .bottom(function(d){
      return myself.explodeSlice("cos",myself.explodedSliceRadius, a, this.index);
    })
    .left(function(d){
      return myself.explodeSlice("sin", myself.explodedSliceRadius, a, this.index);
    })
    .outerRadius(r)
    .angle(a)
    .cursor("pointer")
    .event("click",function(d){
      pvc.log("You clicked on index " + this.index + ", value " + d + ", angle: " + myself.accumulateAngle(a,this.index));
    });

    // Extend pie
    this.extend(this.pvPie,"pie_");


    this.pvPieLabel = this.pvPie.anchor("outer").add(pv.Label)
    //.textAngle(0)
    .text(function(d){
      return " "+ d.toFixed(2)
    })
    .textMargin(10)
    .visible(this.showValues);

    // Extend pieLabel
    this.extend(this.pvPieLabel,"pieLabel_");


    // Extend body
    this.extend(this.pvPanel,"chart_");


  },

  accumulateAngle: function(a,idx){

    var arr = this.data.slice(0,idx);
    arr.push(this.data[idx]/2);
    var angle = a(pv.sum(arr));
    return angle;

  },

  explodeSlice: function(fun, size, a, idx){

    return (fun=="cos"?this.height:this.width)/2 + size*Math[fun](this.accumulateAngle(a,idx));

  }

});
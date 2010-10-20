


/**
 * PieChart is the main class for generating... pie charts (surprise!).
 */

pvc.PieChart = pvc.Base.extend({

  pieChartPanel : null,
  legendSource: "categories",

  constructor: function(o){

    this.base();

    var _defaults = {
      showValues: true,
      innerGap: 0.9,
      explodedSliceRadius: 0,
      explodedSliceIndex: null,
      tooltipFormat: function(s,c,v){
        return c+":  " + v;
      }
    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering in pieChart");


    this.pieChartPanel = new pvc.PieChartPanel(this, {
      innerGap: this.options.innerGap,
      explodedSliceRadius: this.options.explodedSliceRadius,
      explodedSliceIndex: this.options.explodedSliceIndex,
      showValues: this.options.showValues
    });

    this.pieChartPanel.appendTo(this.basePanel); // Add it

  }

}
);


/*
 * Pie chart panel. Generates a pie chart. Specific options are:
 * <i>showValues</i> - Show or hide slice value. Default: false
 * <i>explodedSliceIndex</i> - Index of the slice to explode. Default: null
 * <i>explodedSliceRadius</i> - If one wants a pie with an exploded effect,
 *  specify a value in pixels here. If above argument is specified, explodes
 *  only one slice. Else explodes all. Default: 0
 * <i>innerGap</i> - The percentage of the inner area used by the pie. Default: 0.9 (90%)
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
  explodedSliceIndex: null,
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

    var sum = this.chart.dataEngine.getVisibleSeriesMaxSum();
    
    pvc.log("Radius: "+ r + "; Maximum sum: " + sum);

    var a = pv.Scale.linear(0, sum).range(0, 2 * Math.PI);
    this.data = this.chart.dataEngine.getValuesForSeriesIndex(0);


    this.pvPie = this.pvPanel.add(pv.Wedge)
    .data(this.chart.dataEngine.getValuesForSeriesIndex(0))
    .bottom(function(d){
      return myself.explodeSlice("cos", a, this.index);
    })
    .left(function(d){
      return myself.explodeSlice("sin", a, this.index);
    })
    .outerRadius(function(d){
      return myself.chart.animate(0 , r)
    })
    .fillStyle(this.chart.colors().by(pv.index))
    .angle(function(d){
      return a(d)
    })
    .title(function(d){
      var v = myself.chart.options.valueFormat(d);
      var s = myself.chart.dataEngine.getSeries()[this.parent.index]
      var c = myself.chart.dataEngine.getCategories()[this.index]
      return myself.chart.options.tooltipFormat(s,c,v);
    })
    .event("mouseover", pv.Behavior.tipsy({
      gravity: "s",
      fade: true
    }));


    if (this.chart.options.clickable){
      this.pvPie
      .cursor("pointer")
      .event("click",function(d){
        var s = myself.chart.dataEngine.getSeries()[this.parent.index]
        var c = myself.chart.dataEngine.getCategories()[this.index]
        return myself.chart.options.clickAction(s,c, d);
      });
    }

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

  explodeSlice: function(fun, a, idx){

    var size = 0;
    if(this.explodedSliceIndex == null){
      size = this.explodedSliceRadius
    }
    else{
      size = this.explodedSliceIndex==idx?this.explodedSliceRadius:0;
    }
    return (fun=="cos"?this.height:this.width)/2 + size*Math[fun](this.accumulateAngle(a,idx));

  }

});
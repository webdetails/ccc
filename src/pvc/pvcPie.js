

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
      
      });

    this.pieChartPanel.appendTo(this.basePanel); // Add it

  }

}
);




pvc.PieChartPanel = pvc.BasePanel.extend({

  _parent: null,
  pvPanel: null,

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


    // Add the chart!

    var r = pv.min([this.width, this.height],pv.naturalOrder)/2 * this.innerGap;

    /*
    a = pv.Scale.linear(0, pv.sum(data)).range(0, 2 * Math.PI);



    vis.add(pv.Wedge)
    .data(data.sort(pv.reverseOrder))
    .bottom(w / 2)
    .left(w / 2)
    //.innerRadius(r - 40)
    .outerRadius(r)
    .angle(a)
    .anchor("center").add(pv.Label)
    .textAngle(0)
    .text(function(d){
      return d.toFixed(2)
      });

      */

    // Extend body
    this.extend(this.pvPanel,"chart_");


  }

});
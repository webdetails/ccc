/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */

pvc.CategoricalAbstract = pvc.TimeseriesAbstract.extend({

  yAxisPanel : null,
  xAxisPanel : null,

  yScale: null,
  xScale: null,


  constructor: function(o){

    this.base();

    var _defaults = {
      showAllTimeseries: false, // meaningless here
      showXScale: true,
      showYScale: true,
      yAxisPosition: "left",
      xAxisPosition: "bottom",
      yAxisSize: 50,
      xAxisSize: 50
    };


    // Apply options
    $.extend(this.options,_defaults, o);

    // Sanitize some options:
    if (this.options.showYScale == false){
      this.options.yAxisSize = 0
    }
    if (this.options.showXScale == false){
      this.options.xAxisSize = 0
    }


  },

  preRender: function(){

    // TODO: Build it
    this.base();

    pvc.log("Prerendering in CategoricalAbstract");

    this.xScale = this.getXScale();
    if(this.options.yAxisPosition == "left"){
      this.xScale.range( this.options.yAxisSize , this.basePanel.width);
    }
    else{
      this.xScale.range(0, this.basePanel.width - this.options.yAxisSize);
    }

    this.yScale = this.getYScale().range(0, this.basePanel.height - this.options.xAxisSize);




    // Generate axis

    if (this.options.showXScale){
      this.xAxisPanel = new pvc.XAxisPanel(this, {
        showAllTimeseries: false,
        anchor: this.options.xAxisPosition,
        axisSize: this.options.xAxisSize,
        oppositeAxisSize: this.options.yAxisSize
      });

      this.xAxisPanel.setScale(this.xScale);
      this.xAxisPanel.appendTo(this.basePanel); // Add it
      

    }


    if (this.options.showYScale){
      this.yAxisPanel = new pvc.YAxisPanel(this, {
        showAllTimeseries: false,
        anchor: this.options.yAxisPosition,
        axisSize: this.options.yAxisSize,
        oppositeAxisSize: this.options.xAxisSize
      });

      this.yAxisPanel.setScale(this.yScale);
      this.yAxisPanel.appendTo(this.basePanel); // Add it

    }

  },

  /*
   * Generic xx scale for testing purposes. Needs to be overriden per chart
   */

  getXScale: function(){
    return new pv.Scale.linear(0,10);
  },

  /*
   * Generic yy scale for testing purposes. Needs to be overriden per chart
   */

  getYScale: function(){
    return new pv.Scale.linear(0,20);
  }



}
)


/*
 * AxisPanel panel. 
 *
 * 
 */
pvc.AxisPanel = pvc.BasePanel.extend({

  _parent: null,
  pvRule: null,
  pvRuleLabel: null,

  anchor: "bottom",
  axisSize: 50,
  tickLength: 6,
  oppositeAxisSize: 50,
  panelName: "axis", // override
  scale: null,


  constructor: function(chart, options){

    this.base(chart,options);

  },

  create: function(){

    // Size will depend only on the existence of the labels


    if (this.anchor == "top" || this.anchor == "bottom"){
      this.width = this._parent.width;
      this.height = this.axisSize;
    }
    else{
      this.height = this._parent.height;
      this.width = this.axisSize;
    }


    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)

    this.renderAxis();

    // Extend panel
    this.extend(this.pvPanel, this.panelName + "_");
    this.extend(this.pvRule, this.panelName + "Rule_");
    this.extend(this.pvRuleLabel, this.panelName + "RuleLabel_");

  },


  setScale: function(scale){
    this.scale = scale;
  },

  renderAxis: function(){

    var myself = this;

    this.pvRule = this.pvPanel
    .add(pv.Rule)
    .strokeStyle("#aaa")
    [pvc.BasePanel.oppositeAnchor[this.anchor]](0)
    [pvc.BasePanel.relativeAnchor[this.anchor]](this.scale(0))
    [pvc.BasePanel.paralelLength[this.anchor]](this.scale.range()[1])

    this.pvRuleLabel = this.pvRule.add(pv.Rule)
    .data(this.scale.ticks(20))
    [pvc.BasePanel.paralelLength[this.anchor]](null)
    [pvc.BasePanel.oppositeAnchor[this.anchor]](0)
    [pvc.BasePanel.relativeAnchor[this.anchor]](this.scale)
    [pvc.BasePanel.orthogonalLength[this.anchor]](function(d){
      return myself.tickLength/(this.index%2 + 1)
    })
    .anchor(this.anchor)
    .add(pv.Label)
    .text(this.scale.tickFormat)
    .visible(function(d){
      // mini grids
      if (this.index % 2){
        return false;
      }
      // also, hide the first and last ones
      if( myself.scale(d) == myself.scale.range()[0] || myself.scale(d) == myself.scale.range()[1] ){
        return false;
      }
      return true;
    })

  }



});

/*
 * XAxisPanel panel.
 *
 *
 */
pvc.XAxisPanel = pvc.AxisPanel.extend({

  anchor: "bottom",
  panelName: "xAxis",

  constructor: function(chart, options){

    this.base(chart,options);

  }

});


/*
 * YAxisPanel panel.
 *
 *
 */
pvc.YAxisPanel = pvc.AxisPanel.extend({

  anchor: "left",
  panelName: "yAxis",
  pvRule: null,

  constructor: function(chart, options){

    this.base(chart,options);

  }



});
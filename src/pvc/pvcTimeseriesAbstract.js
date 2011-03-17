/**
 * TimeseriesAbstract is the base class for all categorical or timeseries
 */

pvc.TimeseriesAbstract = pvc.Base.extend({

  allTimeseriesPanel : null,

  constructor: function(o){

    this.base();

    var _defaults = {
      showAllTimeseries: true,
      allTimeseriesPosition: "bottom",
      allTimeseriesSize: 50
    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    this.base();


    // Do we have the timeseries panel? add it

    if (this.options.showAllTimeseries){
      this.allTimeseriesPanel = new pvc.AllTimeseriesPanel(this, {
        anchor: this.options.allTimeseriesPosition,
        allTimeseriesSize: this.options.allTimeseriesSize

      });

      this.allTimeseriesPanel.appendTo(this.basePanel); // Add it

    }

  }

}
)


/*
 * AllTimeseriesPanel panel. Generates a small timeseries panel that the user
 * can use to select the range:
 * <i>allTimeseriesPosition</i> - top / bottom / left / right. Default: top
 * <i>allTimeseriesSize</i> - The size of the timeseries in pixels. Default: 100
 *
 * Has the following protovis extension points:
 *
 * <i>allTimeseries_</i> - for the title Panel
 * 
 */
pvc.AllTimeseriesPanel = pvc.BasePanel.extend({

  _parent: null,
  pvAllTimeseriesPanel: null,
  anchor: "bottom",
  allTimeseriesSize: 50,



  constructor: function(chart, options){

    this.base(chart,options);

  },

  create: function(){

    // Size will depend on positioning and font size mainly

    if (this.anchor == "top" || this.anchor == "bottom"){
      this.width = this._parent.width;
      this.height = this.allTimeseriesSize;
    }
    else{
      this.height = this._parent.height;
      this.width = this.allTimeseriesSize;
    }


    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)

    // Extend panel
    this.extend(this.pvPanel,"allTimeseries_");


  }


});




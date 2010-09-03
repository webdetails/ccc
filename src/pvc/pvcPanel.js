
/**
 *
 * Base panel. A lot of them will exist here, with some common properties.
 * Each class that extends pvc.base will be responsible to know how to use it
 *
 */
pvc.BasePanel = Base.extend({

  chart: null,
  _parent: null,
  type: pv.Panel, // default one
  height: null,
  width: null,
  anchor: "center",
  pvPanel: null,
  fillColor: "red",
  margins:{
    top:0,
    right: 0,
    bottom: 0,
    left: 0
  },




  constructor: function(chart,options){

    this.chart = chart;
    $.extend(this,options);

  },


  create: function(){

    if(this._parent == null){
      // Should be created for the vis panel only
      this.pvPanel = new pv.Panel();
      this.extend(this.pvPanel,"base_");
    }
    else{
      this.pvPanel = this._parent.pvPanel.add(this.type);
    }

    this.pvPanel
    .width(this.width)
    .height(this.height);

  },


  /*
   *  Create the panel, appending it to the previous one using a specified anchor.
   *
   *  Will:
   *  1) create the panel.
   *  2) subtract it's size from the previous panel's size
   *  3) append it to the previous one in the correct position
   *
   */

  appendTo: function(_parent){

    this._parent = _parent;
    this.create();

    // Reduce size and update margins
    var a = this.anchor;
    if(a == "top" || a == "bottom"){
      this._parent.height -= this.height;
    }
    else{
      this._parent.width -= this.width;
    }


    
    // See where to attach it.
    this.pvPanel[a](this._parent.margins[a]);
    this.pvPanel[pvc.BasePanel.relativeAnchor[a]](this._parent.margins[pvc.BasePanel.relativeAnchor[a]]);

    // update margins
    if(a == "top" || a == "bottom"){
      this._parent.margins[this.anchor] += this.height;
    }
    else{
      this._parent.margins[a] += this.width;
    }

  },


  /**
   *
   * This is the method to be used for the extension points for the specific
   * contents of the chart.
   *
   * Goes through the list of options and, if it matches the prefix, execute that
   * method on the mark. WARNING: It's user's reponsability to make sure some
   * unexisting method won't blow this
   *
   */

  extend: function(mark, prefix){

    for (p in this.chart.options.extensionPoints){
      if (p.indexOf(prefix) == 0){
        var m = p.substring(prefix.length);
        mark[m](pvc.ev(this.chart.options.extensionPoints[p]));
      }

    }

  },

  /*
   * Sets the size for the panel, when he parent panel is undefined
   */

  setSize: function(w,h){
    this.width = w;
    this.height = h;

  },

  /*
   * returns the width of the Panel
   */
  getWidth: function(){
    return this.width
  },

  /*
   * returns the height of the Panel
   */
  getHeight: function(){
    return this.height
  },

  /*
   * Returns the underlying protovis Panel
   */
  getPvPanel: function(){
    return this.pvPanel
  }


},{
  // determine what is the associated method to call to position the labels
  // correctly

  relativeAnchor: {
    top: "left",
    bottom: "left",
    left: "bottom",
    right: "bottom"
  }

})


/*
 * Title panel. Generates the title. Specific options are:
 * <i>title</i> - text. Default: null
 * <i>titlePosition</i> - top / bottom / left / right. Default: top
 * <i>titleSize</i> - The size of the title in pixels. Default: 25
 *
 * Has the following protovis extension points:
 *
 * <i>title_</i> - for the title Panel
 * <i>titleLabel_</i> - for the title Label
 */
pvc.TitlePanel = pvc.BasePanel.extend({
  
  _parent: null,
  pvLabel: null,
  anchor: "top",
  titlePanel: null,
  title: null,
  titleSize: 25,
  titleAlign: "center",
  font: "14px sans-serif",



  constructor: function(chart, options){

    this.base(chart,options);

  },

  create: function(){

    // Size will depend on positioning and font size mainly
    
    if (this.anchor == "top" || this.anchor == "bottom"){
      this.width = this._parent.width;
      this.height = this.titleSize;
    }
    else{
      this.height = this._parent.height;
      this.width = this.titleSize;
    }


    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)

    // Extend title
    this.extend(this.pvPanel,"title_");

    var rotation = {
      top: 0,
      right: Math.PI/2,
      bottom: 0,
      left: -Math.PI/2
    };

    // label
    this.pvLabel = this.pvPanel.add(pv.Label)
    .text(this.title)
    .font(this.font)
    .textAlign("center")
    .textBaseline("middle")
    .bottom(this.height/2)
    .left(this.width/2)
    .textAngle(rotation[this.anchor]);

    // Cases:
    if(this.titleAlign == "center"){
      this.pvLabel    
      .bottom(this.height/2)
      .left(this.width/2)
    }
    else{

      this.pvLabel.textAlign(this.titleAlign);

      if ( this.anchor == "top" || this.anchor == "bottom"){

        this.pvLabel.bottom(null).left(null); // reset
        this.pvLabel[this.titleAlign](0)
        .bottom(this.height/2)

      }
      else if (this.anchor == "right"){
        this.titleAlign=="left"?this.pvLabel.bottom(null).top(0):this.pvLabel.bottom(0);
      }
      else if (this.anchor == "left"){
        this.titleAlign=="right"?this.pvLabel.bottom(null).top(0):this.pvLabel.bottom(0);
      }
    }


    // Extend title label
    this.extend(this.pvLabel,"titleLabel_");

  }


});




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
pvc.LegendPanel = pvc.BasePanel.extend({

  _parent: null,
  pvLabel: null,
  anchor: "bottom",
  legendPanel: null,
  legend: null,
  legendSize: 25,
  font: "9px sans-serif",



  constructor: function(chart, options){

    this.base(chart,options);

  },

  create: function(){

    // Size will depend on positioning and font size mainly

    if (this.anchor == "top" || this.anchor == "bottom"){
      this.width = this._parent.width;
      this.height = this.legendSize;
    }
    else{
      this.height = this._parent.height;
      this.width = this.legendSize;
    }


    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)

    // Extend legend
    this.extend(this.pvPanel,"legend_");


  }


});
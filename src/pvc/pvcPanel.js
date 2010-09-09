/**
 * The main component
 */


pvc.Base = Base.extend({

  options: {},
  isPreRendered: false,

  // data
  dataEngine: null,
  resultset:[],
  metadata: [],

  // panels
  basePanel: null,
  titlePanel: null,
  legendPanel: null,

  // options
  legendSource: "series",

  constructor: function(options){

    var _defaults = {
      canvas: null,
      width: 400,
      height: 300,
      originalWidth: 400,
      originalHeight: 300,
      crosstabMode: true,
      seriesInRows: false,

      title: null,
      titlePosition: "top", // options: bottom || left || right
      titleAlign: "center", // left / right / center
      legend: false,
      legendPosition: "bottom"

    };
    
    this.options = {},

    // Apply options
    $.extend(this.options, _defaults);


  },


  /**
   *
   * Building the visualization has 2 stages: First the preRender prepares and
   * build every object that will be used; Later
   *
   */

  preRender: function(){

    pvc.log("Prerendering in pvc");

    // Firt thing, we need to create the data engine nad initialize the translator
    this.dataEngine = new pvc.DataEngine(this,this.metadata,this.resultset);
    this.dataEngine.setCrosstabMode(this.options.crosstabMode);
    this.dataEngine.setSeriesInRows(this.options.seriesInRows);
    this.dataEngine.createTranslator();

    pvc.log(this.dataEngine.getInfo());


    // create the basePanel. Since we don't have a parent panel we need to
    // manually create the points

    this.basePanel = new pvc.BasePanel(this); // Base panel, no parent
    this.basePanel.setSize(this.options.width, this.options.height);
    this.basePanel.create();
    this.basePanel.getPvPanel().canvas(this.options.canvas);

    // Title
    if (this.options.title != null){
      this.titlePanel = new pvc.TitlePanel(this, {
        title: this.options.title,
        anchor: this.options.titlePosition,
        titleSize: this.options.titleSize,
        titleAlign: this.options.titleAlign
      });

      this.titlePanel.appendTo(this.basePanel); // Add it

    }


    // Legend
    if (this.options.legend){
      this.legendPanel = new pvc.LegendPanel(this, {
        anchor: this.options.legendPosition,
        legendSize: this.options.legendSize,
        align: this.options.legendAlign,
        minMarginX: this.options.legendMinMarginX,
        minMarginY: this.options.legendMinMarginY,
        textMargin: this.options.legendTextMargin,
        padding: this.options.legendPadding,
        textAdjust: this.options.legendTextAdjust,
        shape: this.options.legendShape,
        markerSize: this.options.legendMarkerSize,
        drawLine: this.options.legendDrawLine,
        drawMarker: this.options.legendDrawMarker
      });

      this.legendPanel.appendTo(this.basePanel); // Add it

    }

    this.isPreRendered = true;

  },

  /**
   *
   * Render the visualization. If not prerendered, do it now
   *
   */

  render: function(){

    if(!this.isPreRendered){
      this.preRender();
    }

    pvc.log("TODO: Rendering in pvc, canvas: " + this.options.canvas);
    this.basePanel.getPvPanel().render();

  },


  /**
   * Method to set the data to the chart. Expected object is the same as what
   * comes from the CDA: {metadata: [], resultset: []}
   */

  setData: function(data, options){
    this.setResultset(data.resultset);
    this.setMetadata(data.metadata);

    $.extend(this.options,options);
  },


  /**
   * Sets the resultset that will be used to build the chart
   */

  setResultset: function(resultset){

    this.resultset = resultset;
    if (resultset.length == 0){
      pvc.log("Warning: Resultset is empty")
    }

  },


  /**
   * Sets the metadata that, optionally, will give more information for building
   * the chart
   */

  setMetadata: function(metadata){

    this.metadata = metadata;
    if (metadata.length == 0){
      pvc.log("Warning: Metadata is empty")
    }

  }



});


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
  anchor: "top",
  pvPanel: null,
  fillColor: "red",
  margins: null,

  constructor: function(chart,options){

    this.chart = chart;
    $.extend(this,options);

    this.margins = {
      top:0,
      right: 0,
      bottom: 0,
      left: 0
    }

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
   *already ge a pie chart!
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
  },

  oppositeAnchor:{
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left"
  },

  paralelLength:{
    top: "width",
    bottom: "width",
    right: "height",
    left: "height"
  },

  orthogonalLength:{
    top: "height",
    bottom: "height",
    right: "width",
    left: "width"
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
 * <i>legend_</i> - for the legend Panel
 * <i>legendRule_</i> - for the legend line (when applicable)
 * <i>legendDot_</i> - for the legend marker (when applicable)
 * <i>legendLabel_</i> - for the legend label
 * 
 */
pvc.LegendPanel = pvc.BasePanel.extend({

  _parent: null,
  pvRule: null,
  pvDot: null,
  pvLabel: null,


  anchor: "bottom",
  align: "left",
  legendPanel: null,
  legend: null,
  legendSize: null,
  minMarginX: 8,
  minMarginY: 8,
  textMargin: 4,
  padding: 20,
  textAdjust: 7,
  shape: "square",
  markerSize: 15,
  drawLine: false,
  drawMarker: true,




  constructor: function(chart, options){

    this.base(chart,options);

  },

  create: function(){
    var myself = this;
    var c = pv.Colors.category20();
    var x,y;


    //pvc.log("Debug PMartins");

    var data = this.chart.labelSource=="series"?
      this.chart.dataEngine.getSeries():
      this.chart.dataEngine.getCategories();

    //determine the size of the biggest cell
    //Size will depend on positioning and font size mainly
    var maxtext = 0;
    for (i in data){
      maxtext = maxtext < data[i].length?data[i].length:maxtext;
    }
    var cellsize = this.markerSize + maxtext*this.textAdjust;

    var realxsize, realysize;


    if (this.anchor == "top" || this.anchor == "bottom"){
      this.width = this._parent.width;
      this.height = this.legendSize;
      var maxperline = data.length;

      //if the legend is bigger than the available size, multi-line and left align
      if(maxperline*(cellsize + this.padding) - this.padding + myself.minMarginX > this.width){
        this.align = "left";
        maxperline = Math.floor((this.width + this.padding - myself.minMarginX)/(cellsize + this.padding));
      }
      realxsize = maxperline*(cellsize + this.padding) + myself.minMarginX - this.padding;
      realysize = myself.padding*(Math.ceil(data.length/maxperline));

      if(this.heigth == null){
        this.height = realysize;
      }

      //changing margins if the alignment is not "left"
      if(this.align == "right"){
        myself.minMarginX = this.width - realxsize;
      }
      else if (this.align == "center"){
        myself.minMarginX = (this.width - realxsize)/2;
      }

      x = function(){
        var n = Math.ceil(this.index/maxperline);
        return (this.index%maxperline)*(cellsize + myself.padding) + myself.minMarginX;
      }
      myself.minMarginY = (myself.height - realysize)/2;
      y = function(){
        var n = Math.floor(this.index/maxperline); 
        return myself.height  - n*myself.padding - myself.minMarginY - myself.padding/2;
      }

    }
    else{
      this.height = this._parent.height;
      this.width = this.legendSize;
      realxsize = cellsize + this.minMarginX;
      realysize = myself.padding*data.length;
      if(this.align == "middle"){
        myself.minMarginY = (myself.height - realysize + myself.padding)/2  ;
      }
      else if (this.align == "bottom"){
        myself.minMarginY = myself.height - realysize;
      }
      x = myself.minMarginX;
      y = function(){return myself.height - this.index*myself.padding - myself.minMarginY;}
    }

    if(this.width == null){
      this.width = realxsize;
    }

    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)    

    //********** Markers and Lines ***************************


    if(this.drawLine == true && this.drawMarker == true){
      
      this.pvRule = this.pvPanel.add(pv.Rule)
      .data(data)
      .width(this.markerSize)
      .lineWidth(1)
      .strokeStyle(function(){return c(this.index);})
      .left(x)
      .bottom(y)

      this.pvDot = this.pvRule.anchor("center").add(pv.Dot)
      .size(this.markerSize)
      .shape(this.shape)
      .lineWidth(0)
      .fillStyle(function(){return c(this.index);})

      this.pvLabel = this.pvDot.anchor("right").add(pv.Label)
      .textMargin(myself.textMargin)
      .font("9px sans-serif")
    }
    else if(this.drawLine == true){
      
      this.pvRule = this.pvPanel.add(pv.Rule)
      .data(data)
      .width(this.markerSize)
      .lineWidth(1)
      .strokeStyle(function(){return c(this.index);})
      .left(x)
      .bottom(y)

      this.pvLabel = this.pvRule.anchor("right").add(pv.Label)
      .textMargin(myself.textMargin)
      .font("9px sans-serif")
    }
    else if(this.drawMarker == true){
      this.pvDot = this.pvPanel.add(pv.Dot)
      .data(data)
      .size(this.markerSize)
      .shape(this.shape)
      .lineWidth(0)
      .fillStyle(function(){return c(this.index);})
      .left(x)
      .bottom(y)

      this.pvLabel = this.pvDot.anchor("right").add(pv.Label)
      .data(data)
      .textMargin(myself.textMargin)
      .font("9px sans-serif")
    }


    // Extend legend
    this.extend(this.pvPanel,"legend_");
    this.extend(this.pvRule,"legendRule_");
    this.extend(this.pvDot,"legendDot_");
    this.extend(this.pvLabel,"legendLabel_");


  }


});


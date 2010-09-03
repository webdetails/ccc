
var pvc = {}

/**
 *
 *  Utility function for logging messages to the console
 *
 */

pvc.log = function(m){

  if (typeof console != "undefined"){
    console.log("[pvChart]: " + m);
  }
};

/**
 *
 * Evaluates x if it's a function or returns the value otherwise
 *
 */

pvc.ev = function(x){
  return typeof x == "function"?x():x;
};


/**
 * The main component
 */


pvc.Base = Base.extend({

  options: {},
  resultset:[],
  metadata: [],
  isPreRendered: false,

  // panels
  basePanel: null,
  titlePanel: null,
  legendPanel: null,

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
        legendSize: this.options.legendSize
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
 * xyAbstract is the base class for XY charts.
 */

pvc.XYAbstract = pvc.Base.extend({

  xyPanel : null,

  constructor: function(o){

    this.base();

    var _defaults = {
      xCaption: null,
      yCaption: null
    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    // TODO: Build it
    this.base();
    
    pvc.log("Prerendering in pvcXYAbstract");


  }

}
)

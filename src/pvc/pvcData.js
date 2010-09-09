
/**
 *
 * Base panel. A lot of them will exist here, with some common properties.
 * Each class that extends pvc.base will be responsible to know how to use it
 *
 */
pvc.DataEngine = Base.extend({

  chart: null,
  metadata: null,
  resultset: null,
  seriesInRows: false,
  crosstabMode: true,
  translator: null,
  series: null,
  categories: null,
  values: null,

  constructor: function(chart,metadata, resultset){

    this.chart = chart;
    this.metadata = metadata;
    this.resultset = resultset;

    
  },

  /**
   * Creates the appropriate translator
   */

  createTranslator: function(){

    // Create the appropriate translator
    if(this.crosstabMode){
      pvc.log("Creating CrosstabTranslator");
      this.translator = new pvc.CrosstabTranslator();
    }
    else{
      pvc.log("Creating RelationalTranslator");
      this.translator = new pvc.RelationalTranslator();
    }

    this.translator.setData(this.metadata, this.resultset);
    this.translator.prepare();
    if( this.seriesInRows ){
      pv.transpose(this.translator.getValues())
    }


  },

  /*
   * Returns some information on the data points
   */

  getInfo: function(){

    var out = "------------------------------------------\n";
    out+= "Dataset Information\n";

    out+= "  Series ( "+ this.getSeriesSize() +" ): " + this.getSeries().slice(0,10) +"\n";
    out+= "  Categories ( "+ this.getCategoriesSize() +" ): " + this.getCategories().slice(0,10) +"\n";
    out+= "------------------------------------------\n";

    return out;

  },

  /*
   * Returns the series on the underlying data
   *
   */

  getSeries: function(){
    return this.series || this.translator.getColumns();
  },

  /*
   * Returns the categories on the underlying data
   *
   */

  getCategories: function(){
    return this.categories || this.translator.getRows();
  },

  /*
   * Returns the values for the dataset
   */

  getValues: function(){


    if (this.values == null){
      this.values = this.translator.getValues();
    }
    return this.values;

  },

  /*
   * Returns the values for a given series idx
   *
   */

  getValuesForSeriesIdx: function(idx){
    return this.getValues().map(function(a){
      return a[idx];
    })
  },

  /*
   * Returns the values for a given category idx
   *
   */

  getValuesForCategoryIdx: function(idx){
    return this.getValues()[idx];
  },


  /*
   * Returns how many series we have
   */

  getSeriesSize: function(){
    return this.getSeries().length;
  },

  /*
   * Returns how many categories, or data points, we have
   */
  getCategoriesSize: function(){
    return this.getCategories().length;
  },

  /**
   * For every serie in the data, get the maximum of the sum of the category
   * values. If only one serie, gets the sum of the value. Useful to build
   * pieCharts
   *
   */

  getSeriesMaxSum: function(){

    var myself=this;
    return pv.max(pv.range(0,this.getSeriesSize()).map(function(idx){
      return pv.sum(myself.getValuesForSeriesIdx(idx))
    }));
  },

  /*
   * Get the maximum value in all series
   */
  getSeriesAbsoluteMax: function(){

    var myself=this;
    return pv.max(pv.range(0,this.getSeriesSize()).map(function(idx){
      return pv.max(myself.getValuesForSeriesIdx(idx))
    }));

  },

  /*
   * Get the minimum value in all series
   */
  getSeriesAbsoluteMin: function(){

    var myself=this;
    return pv.min(pv.range(0,this.getSeriesSize()).map(function(idx){
      return pv.min(myself.getValuesForSeriesIdx(idx))
    }));

  },


  setCrosstabMode: function(crosstabMode){
    this.crosstabMode = crosstabMode;
  },

  isCrosstabMode: function(){
    return this.crosstabMode;
  },

  setSeriesInRows: function(seriesInRows){
    this.seriesInRows = seriesInRows;
  },

  isSeriesInRows: function(){
    return this.seriesInRows;
  },

  resetDataCache: function(){
    this.series = null;
    this.categories = null;
    this.values = null;
  }

});



pvc.DataTranslator = Base.extend({

  metadata: null,
  resultset: null,
  values: null,

  constructor: function(){
  },


  setData: function(metadata, resultset){
    this.metadata = metadata;
    this.resultset = resultset;
  },


  getValues: function(){


    // Skips first row, skips first col.
    return this.values.slice(1).map(function(a){
      return a.slice(1);
    });
      

  },

  getColumns: function(){

    // First column of every row, skipping 1st entry
    return this.values[0].slice(1);
  },

  getRows: function(){


    // first element of every row, skipping 1st one
    return this.values.slice(1).map(function(d){
      return d[0];
    })


  },


  prepare: function(){
  // Specific code goes here - override me
  },

  sort: function(sortFunc){
  // Specify the sorting data - override me
  }


})


pvc.CrosstabTranslator = pvc.DataTranslator.extend({


  prepare: function(){
    
    // All we need to do is to prepend to the result's matrix the series
    // line

    var a1 = this.metadata.slice(1).map(function(d){
      return d.colName;
    });
    a1.splice(0,0,"x");

    this.values = this.resultset;
    this.values.splice(0,0,a1);

  }
  
});


pvc.RelationalTranslator = pvc.DataTranslator.extend({



  prepare: function(){

    var myself = this;

    if(this.metadata.length == 2){
      // Adding a static serie
      this.resultset.map(function(d){
        d.splice(0,0,"Serie");
      })
    }

    var tree = pv.tree(this.resultset).keys(function(d){
      return [d[0],d[1]]
    }).map();

    // Now, get series and categories:
    var numeratedSeries = pv.numerate(pv.keys(tree));
    var numeratedCategories = pv.numerate(pv.uniq(pv.blend(pv.values(tree).map(function(d){
      return pv.keys(d)
    }))))

    // Finally, itetate through the resultset and build the new values

    this.values = [];
    var categoriesLength = pv.keys(numeratedCategories).length;
    var seriesLength = pv.keys(numeratedSeries).length;

    // Initialize array
    pv.range(0,categoriesLength).map(function(d){
      myself.values[d] = new Array(seriesLength + 1);
      myself.values[d][0] = pv.keys(numeratedCategories)[d]
    })

    this.resultset.map(function(l){

      myself.values[numeratedCategories[l[1]]][numeratedSeries[l[0]] + 1] =
      pv.sumOrSet(myself.values[numeratedCategories[l[1]]][numeratedSeries[l[0]]+1], l[2]);
    })

    // Create an inicial line with the categories
    var l1 = pv.keys(numeratedSeries);
    l1.splice(0,0,"x");
    this.values.splice(0,0, l1)


  }


});
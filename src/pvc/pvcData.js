
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
      this.translator = new pvc.CrosstabTranslator();
    }
    else{
      this.translator = new pvc.RelationalTranslator();
    }

    this.translator.setData(this.metadata, this.resultset);
    this.translator.prepare();

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
    return this.series || (this.series = this.seriesInRows?this.translator.getRows():this.translator.getColumns());
  },

  /*
   * Returns the categories on the underlying data
   *
   */

  getCategories: function(){
    return this.categories || ( this.categories =  this.seriesInRows?this.translator.getColumns():this.translator.getRows());
  },

  /*
   * Returns the values for the dataset
   */

  getValues: function(){


    if (this.values == null){
      this.values = this.seriesInRows?pv.transpose(this.translator.getValues()):this.translator.getValues();
    }
    return this.values;

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

    return pv.max(this.getValues().map(function(a){
      return pv.sum(a);
    }))

  },

  getCategoriesAbsoluteMax: function(){


  },

  getCategoriesAbsoluteMin: function(){


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

  constructor: function(){
  },


  setData: function(metadata, resultset){
    this.metadata = metadata;
    this.resultset = resultset;
  },

  getValues: function(){
  // override me
  },

  getColumns: function(){
  // override me
  },

  getRows: function(){
  // override me
  },

  prepare: function(){
  // Specific code goes here - override me
  }


})


pvc.CrosstabTranslator = pvc.DataTranslator.extend({

  getColumns: function(){

    // In crosstab mode, series are on the metadata, skipping first row
    return this.metadata.slice(1).map(function(d){
      return d.colName;
    })

  },

  getRows: function(){

    // First column of every row
    return this.resultset.map(function(d){
      return d[0];
    })
  },

  getValues: function(){

    // Remove the first entry from each line

    return pv.transpose(this.resultset.map(function(a){
      return a.slice(1)
    }));

  }
  
});


pvc.RelationalTranslator = pvc.DataTranslator.extend({

  /*
   * 2 options: 3 rows or 2 rows only. On 3 rows, we have series on the first.
   * With 2 rows we have no series (or single serie)
   *
   */

  singleSerie: true,

  prepare: function(){

    if(this.metadata.length == 2){
      this.singleSerie = true;
    }
    else{
      this.singleSerie = false;
    }
  },

  getColumns: function(){

    if(this.singleSerie){
      return ['Serie'];
    }
    else{
      // First column of every row
      return pv.uniq(this.resultset.map(function(d){
        return d[0];
      }))
    }

  },
  

  getRows: function(){

    if(this.singleSerie){
      // First column of every row
      return pv.uniq(this.resultset.map(function(d){
        return d[0];
      }))
    }
    else{

      // Second column of every row
      return pv.uniq(this.resultset.map(function(d){
        return d[1];
      }))
    }

  },


  getValues: function(){

    if(this.singleSerie){

      // Only one series, data is on 2rd row
      return [this.resultset.map(function(d){
        return d[2];
      })]


    }
    else{
        alert("getValues on RelationalTranslator with singleSerie == false not done yet")
    }

  }

});
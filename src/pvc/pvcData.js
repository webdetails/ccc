
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


  createTranslator: function(){

    // Create the appropriate translator
    if(this.crosstabMode){
      this.translator = new pvc.CrosstabTranslator();
    }
    else{
      this.translator = new pvc.RelationalTranslator();
    }

    this.translator.setData(this.metadata, this.resultset);

  },



  getInfo: function(){

    var out = "------------------------------------------\n";
    out+= "Dataset Information\n";

    out+= "  Series ( "+ this.getSeriesSize() +" ): " + this.getSeries().slice(0,10) +"\n";
    out+= "  Categories ( "+ this.getCategoriesSize() +" ): " + this.getCategories().slice(0,10) +"\n";
    out+= "------------------------------------------\n";

    return out;

  },

  getSeries: function(){
    return this.series || (this.series = this.seriesInRows?this.translator.getRows():this.translator.getColumns());
  },

  getCategories: function(){
    return this.categories || ( this.categories =  this.seriesInRows?this.translator.getColumns():this.translator.getRows());
  },

  getValues: function(){
  
    if (this.values == null){
      this.values = this.seriesInRows?pv.transpose(this.translator.getValues()):this.translator.getValues();
    }
    return this.values;

  },


  getSeriesSize: function(){
    return this.getSeries().length;
  },

  getCategoriesSize: function(){
    return this.getCategories().length;
  },


  getCategoriesMaxSum: function(){


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
  }
  
});


pvc.RelationalTranslator = pvc.DataTranslator.extend({

  /*
   * 2 options: 3 rows or 2 rows only. On 3 rows, we have series on the first.
   * With 2 rows we have no series (or single serie)
   *
   */


  getColumns: function(){

    if(this.metadata.length == 2){
      return ['Serie'];
    }
    else{
      // First column of every row
      return pv.uniq(this.resultset.map(function(d){
        return d[0];
      }))
    }

    // In crosstab mode, series are on the metadata, skipping first row
    return this.metadata.slice(1).map(function(d){
      return d.colName;
    })

  },
  

  getRows: function(){

    if(this.metadata.length == 3){
      // Second column of every row
      return pv.uniq(this.resultset.map(function(d){
        return d[1];
      }))
    }
    else{
      // First column of every row
      return pv.uniq(this.resultset.map(function(d){
        return d[0];
      }))
    }

  }

});
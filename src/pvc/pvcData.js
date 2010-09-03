
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

    this.translator.setTranspose(this.seriesInRows);
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
    return this.translator.getSeries();
  },

  getCategories: function(){
    return this.translator.getCategories();
  },

  getSeriesSize: function(){
    return this.translator.getSeries().length;
  },

  getCategoriesSize: function(){
    return this.translator.getCategories().length;
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
  }



});


pvc.DataTranslator = Base.extend({

  series: [],
  categories: [],
  values: [],
  metadata: null,
  resultset: null,
  transpose: false,


  constructor: function(){
  },


  setData: function(metadata, resultset){
    this.metadata = metadata;
    this.resultset = resultset;
  },

  setTranspose: function(transpose){

    this.transpose = transpose;
  },

  getSeries: function(){
    return this.transpose?this.getRows():this.getColumns();
  },

  getCategories: function(){
    return this.transpose?this.getColumns():this.getRows();
  },
  
  getValues: function(){
    return this.values;
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

    return this.resultset.map(function(d){
      return d[0];
    })
  }
  
});


pvc.RelationalTranslator = pvc.DataTranslator.extend({


  });
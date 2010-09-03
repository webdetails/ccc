
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

    out+= "  Series ( "+ this.getSeries().length +"   ): " + this.getSeries().slice(0,10) +"\n";
    out+= "  Categories ( "+ this.getCategories().length +"   ): " + this.getCategories().slice(0,10) +"\n";
    out+= "------------------------------------------\n";

    return out;

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


  constructor: function(data){
    this.transformData(data);
  },


  setData: function(metadata, resultset){
    this.metadata = metadata;
    this.resultset = resultset;
  },

  setTranspose: function(transpose){

    this.transpose = transpose;
  },

  getSeries: function(){
    return this.series;

  },

  getCategories: function(){
    return this.categories;
  },
  
  getSeriesSize: function(){
    return this.series.length;

  },

  getCategoriesSize: function(){
    return this.categories.length;
  },

  getValues: function(){
    return this.values;
  }






})
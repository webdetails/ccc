
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

    this.createTranslator();
    
  },


  createTranslator: function(){

    // Create the appropriate translator
    if(this.crossTabMode){
      this.translator = new pvc.CrossTabTranslator();
    }
    else{
      this.translator = new pvc.RelationalTranslator();
    }

    this.translator.setTranspose(this.seriesInRows);
    this.translator.setData(this.metadata, this.resultset);

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
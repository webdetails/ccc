
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
    hiddenData: null,

    constructor: function(chart){

        this.chart = chart;
        this.hiddenData = {
            series:{},
            categories:{}
        }
      
    },

    setData: function( metadata, resultset){

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
            this.translator.transpose()
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
   * Returns a serie on the underlying data by an index
   *
   */

    getSerieByIndex: function(idx){
        return this.getSeries()[idx];
    },


    /*
   * Returns an array with the indexes for the series
   *
   */
    getSeriesIndexes: function(){
        // we'll just return everything
        return pv.range(this.getSeries().length)
    },

    /*
   * Returns an array with the indexes for the visible series
   *
   */
    getVisibleSeriesIndexes: function(){

        var myself=this;
        return pv.range(this.getSeries().length).filter(function(v){
            return !myself.hiddenData.series[v];
        });
    },

    /*
   * Returns an array with the visible categories. Use only when index information
   * is not required
   *
   */
    getVisibleSeries: function(){

        var myself = this;
        return this.getVisibleSeriesIndexes().map(function(idx){
            return myself.getSerieByIndex(idx);
        })
    },


    /*
   * Togles the serie visibility based on an index. Returns true if serie is now
   * visible, false otherwise.
   *
   */

    toggleSerieVisibility: function(idx){

        return this.toggleVisibility("series",idx);

    },


    /*
   * Returns the categories on the underlying data
   *
   */

    getCategories: function(){

        if( this.categories == null ){

            if(this.chart.options.timeSeries){
                var parser = pv.Format.date(this.chart.options.timeSeriesFormat);
                this.categories = this.translator.getRows().sort(function(a,b){
                    return parser.parse(a) - parser.parse(b)
                });

            }
            else{
                this.categories = this.translator.getRows()
            }

        }

        return this.categories;
    },

    /*
   * Returns the categories on the underlying data
   *
   */

    getCategoryByIndex: function(idx){
        return this.getCategories()[idx];
    },

    /*
   * Returns an array with the indexes for the categories
   *
   */
    getCategoriesIndexes: function(){
        // we'll just return everything
        return pv.range(this.getCategories().length)
    },

    /*
   * Returns an array with the indexes for the visible categories
   *
   */
    getVisibleCategoriesIndexes: function(){

        var myself=this;
        return pv.range(this.getCategories().length).filter(function(v){
            return !myself.hiddenData.categories[v];
        });
    },

    /*
   * Returns an array with the visible categories. Use only when index information
   * is not required
   *
   */
    getVisibleCategories: function(){
  
        var myself = this;
        return this.getVisibleCategoriesIndexes().map(function(idx){
            return myself.getCategoryByIndex(idx);
        })
    },

    /*
   * Togles the category visibility based on an index. Returns true if category is now
   * visible, false otherwise.
   *
   */

    toggleCategoryVisibility: function(idx){

        return this.toggleVisibility("categories",idx);

    },

    /*
   * Togles the visibility of category or series based on an index.
   * Returns true if is now visible, false otherwise.
   *
   */

    toggleVisibility: function(axis,idx){

        // Accepted values for axis: series|categories
        pvc.log("Toggling visibility of " + axis + "["+idx+"]");

        if (typeof this.hiddenData[axis][idx] == "undefined"){
            this.hiddenData[axis][idx] = true;
        }
        else{
            delete this.hiddenData[axis][idx];
        }

    },

    /*
   * Returns the visibility status of a category or series based on an index.
   * Returns true if is visible, false otherwise.
   *
   */
    isVisible: function(axis,idx){

        // Accepted values for axis: series|categories

        if (typeof this.hiddenData[axis][idx] != "undefined"){
            return !this.hiddenData[axis][idx];
        }
        else{
            return true;
        }

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
   * Returns the transposed values for the dataset
   */

    getTransposedValues: function(){


        return pv.transpose(pvc.cloneMatrix(this.getValues()));

    },


    /*
   * Returns the transposed values for the visible dataset
   */

    getVisibleTransposedValues: function(){
        var myself = this;
        return this.getVisibleSeriesIndexes().map(function(sIdx){
            return myself.getValuesForSeriesIndex(sIdx)
        })

    },

    /*
   * Returns the values for a given series idx
   *
   */

    getValuesForSeriesIndex: function(idx){
        return this.getValues().map(function(a){
            return a[idx];
        })
    },

    /*
   * Returns the visible values for a given category idx
   *
   */

    getVisibleValuesForSeriesIndex: function(idx){

        var series = this.getValuesForSeriesIndex(idx)
        return this.getVisibleCategoriesIndexes().map(function(idx){
            return series[idx]
        })
    },

    /*
   * Returns the object for a given series idx in the form {category: catName, value: val}
   *
   */

    getObjectsForSeriesIndex: function(idx, sortF){

        var myself = this;
        var ar = [];
        this.getValues().map(function(a,i){
            if(typeof a[idx] != "undefined" && a[idx] != null){
                ar.push({
                    serieIndex: idx,
                    category: myself.getCategories()[i],
                    value: a[idx]
                }) ;
            }
        })

        if (typeof sortF == "function"){
            return ar.sort(sortF)
        }
        else
            return ar;
    },

    /*
   * Returns the values for a given category idx
   *
   */

    getValuesForCategoryIndex: function(idx){
        return this.getValues()[idx];
    },

    /*
   * Returns the visible values for a given category idx
   *
   */

    getVisibleValuesForCategoryIndex: function(idx){

        var cats = this.getValuesForCategoryIndex(idx);
        return this.getVisibleSeriesIndexes().map(function(idx){
            return cats[idx]
        })
    },


    /*
   * Returns the object for a given category idx in the form {serie: value}
   *
   */

    getObjectsForCategoryIndex: function(idx){

        var myself = this;
        var ar=[];
        this.getValues()[idx].map(function(a,i){
            if(typeof a != "undefined" && a!= null){
                ar.push({
                    categoryIndex: idx,
                    serie: myself.getSeries()[i],
                    value: a
                }) ;
            }
        })
        return ar;
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
   * For every category in the data, get the maximum of the sum of the series
   * values.
   *
   */

    getCategoriesMaxSumOfVisibleSeries: function(){

        var myself=this;
        var max = pv.max(pv.range(0,this.getCategoriesSize()).map(function(idx){
            return pv.sum(myself.getVisibleValuesForCategoryIndex(idx).filter(pvc.nonEmpty))
        }));
        pvc.log("getCategoriesMaxSumOfVisibleSeries: " + max);
        return max;
    },

    /**
   * For every serie in the data, get the maximum of the sum of the category
   * values. If only one serie, gets the sum of the value. Useful to build
   * pieCharts
   *
   */

    getVisibleSeriesMaxSum: function(){

        var myself=this;
        var max = pv.max(this.getVisibleSeriesIndexes().map(function(idx){
            return pv.sum(myself.getValuesForSeriesIndex(idx).filter(pvc.nonEmpty))
        }));
        pvc.log("getVisibleSeriesMaxSum: " + max);
        return max;
    },

    /*
   * Get the maximum value in all series
   */
    getVisibleSeriesAbsoluteMax: function(){

        var myself=this;
        var max = pv.max(this.getVisibleSeriesIndexes().map(function(idx){
            return pv.max(myself.getValuesForSeriesIndex(idx).filter(pvc.nonEmpty))
        }));
        pvc.log("getVisibleSeriesAbsoluteMax: " + max);
        return max;
    },

    /*
   * Get the minimum value in all series
   */
    getVisibleSeriesAbsoluteMin: function(){

        var myself=this;
        var min = pv.min(this.getVisibleSeriesIndexes().map(function(idx){
            return pv.min(myself.getValuesForSeriesIndex(idx).filter(pvc.nonEmpty))
        }));
        pvc.log("getVisibleSeriesAbsoluteMin: " + min);
        return min;
    },


    setCrosstabMode: function(crosstabMode){
        this.crosstabMode = crosstabMode;
    },

    isCrosstabMode: function(){
        return this.crosstabMode;
        pv.range(0,this.getSeriesSize())
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

    transpose: function(){

        pv.transpose(this.values);
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

        this.values = pvc.cloneMatrix(this.resultset);
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
            this.metadata.splice(0,0,{
                "colIndex":2,
                "colType":"String",
                "colName":"Series"
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
            pvc.sumOrSet(myself.values[numeratedCategories[l[1]]][numeratedSeries[l[0]]+1], l[2]);
        })

        // Create an inicial line with the categories
        var l1 = pv.keys(numeratedSeries);
        l1.splice(0,0,"x");
        this.values.splice(0,0, l1)


    }


});

NoDataException = function() {};
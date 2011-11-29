
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
    secondAxisValues: null,
    hiddenData: null,
    secondAxis: false, // Do we have double axis?
    secondAxisIdx: 0,
    
    visibleCategoriesIndexes: undefined,
    visibleCategories: undefined,
    visibleSeriesIndexes: undefined,
    visibleSeries: undefined,
    
    //neu
    isMultiValued: false,
    valuesIndexes: null,

    constructor: function(chart){

        this.chart = chart;
        this.hiddenData = {
            series:{},
            categories:{}
        };
      
    },

    setData: function( metadata, resultset){

        this.metadata = metadata;
        this.resultset = resultset;

    },

    /**
     * Creates the appropriate translator
     */

    createTranslator: function(){
        
        if(this.isMultiValued){
            pvc.log("Creating MultiValueTranslator");
            this.translator = new pvc.MultiValueTranslator(this.valuesIndexes, this.crosstabMode, this.dataOptions);  //TODO: 
        }
        else if(this.crosstabMode){
            pvc.log("Creating CrosstabTranslator");
            this.translator = new pvc.CrosstabTranslator();
        }
        else{
            pvc.log("Creating RelationalTranslator");
            this.translator = new pvc.RelationalTranslator();
        }
        
        this.translator.setData(this.metadata, this.resultset);
        this.translator.prepare(this);

    },

    /*
     * Returns some information on the data points
     */

    getInfo: function(){

        var out = "------------------------------------------\n";
        out+= "Dataset Information\n";

        out+= "  Series ( "+ this.getSeriesSize() +" ): " + this.getSeries().slice(0,10) +"\n";
        out+= "  Categories ( "+ this.getCategoriesSize() +" ): " + this.getCategories().slice(0,10) +"\n";
        out+= "  `- secondAxis: " + this.chart.options.secondAxis + "; secondAxisIndex: " + this.chart.options.secondAxisIdx + "\n";
        out+= "------------------------------------------\n";

        return out;

    },

    /*
     * Returns the series on the underlying data
     *
     */

    getSeries: function(){
        var res = this.series || this.translator.getColumns();
        return res;
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

        if (typeof this.visibleSeriesIndexes === "undefined"){
            
            var myself=this;
            var res =  pv.range(this.getSeries().length).filter(function(v){
                return !myself.hiddenData.series[v];
            });
            this.visibleSeriesIndexes = res;
        }
        
        return this.visibleSeriesIndexes;

    },

    /*
     * Returns an array with the visible categories. Use only when index information
     * is not required
     *
     */
    getVisibleSeries: function(){



        if (typeof this.visibleSeries === "undefined"){
            var myself = this;
            var res = this.getVisibleSeriesIndexes().map(function(idx){
                return myself.getSerieByIndex(idx);
            });
            this.visibleSeries = res;
        }
        
        return this.visibleSeries;
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

    getCategoryMin: function() {
        var cat = this.getCategories();
        var min = cat[0];
        for(var i in cat)
            if (cat[i] < min)
                min = cat[i];
        return min;
    },

    getCategoryMax: function() {
        var cat = this.getCategories();
        var max = cat[0];
        for(var i in cat)
            if (cat[i] > max)
                max = cat[i];
        return max;
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
        
        if (typeof this.visibleCategoriesIndexes === "undefined"){
            var myself=this;
            var res = pv.range(this.getCategories().length).filter(function(v){
                return !myself.hiddenData.categories[v];
            });
            this.visibleCategoriesIndexes = res;
        }
        
        return this.visibleCategoriesIndexes;
    },

    /*
     * Returns an array with the visible categories. Use only when index information
     * is not required
     *
     */
    getVisibleCategories: function(){
  
        if (typeof this.visibleCategories === "undefined"){
            var myself = this;
            var res = this.getVisibleCategoriesIndexes().map(function(idx){
                return myself.getCategoryByIndex(idx);
            });
        
            this.visibleCategories = res;
        }
        
        return this.visibleCategories;
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
     * Clears the cache that's used for optimization
     *
     */

    clearDataCache: function(){
        
        this.visibleCategoriesIndexes = undefined;
        this.visibleCategories = undefined;
        this.visibleSeriesIndexes = undefined;
        this.visibleSeries = undefined;
    
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
     * Returns the values for the second axis of the dataset
     */

    getSecondAxisValues: function(){


        if (this.secondAxisValues == null){
            this.secondAxisValues = this.translator.getSecondAxisValues();
        }
        return this.secondAxisValues;

    },


    /*
     * Returns the object for the second axis in the form {category: catName, value: val}
     *
     */

    getObjectsForSecondAxis: function(sortF){

        var myself = this;
        var ar = [];
        this.getSecondAxisValues().map(function(v,i){
            if(typeof v != "undefined" /* && v != null */ ){
                ar.push({
                    category: myself.getCategories()[i],
                    value: v
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
     * Returns the maximum value for the second axis of the dataset
     */
    getSecondAxisMax:function(){

        return pv.max(this.getSecondAxisValues().filter(pvc.nonEmpty))
    },
    
    /*
     * Returns the minimum value for the second axis of the dataset
     */
    getSecondAxisMin:function(){

        return pv.min(this.getSecondAxisValues().filter(pvc.nonEmpty))
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
        var res = this.getVisibleSeriesIndexes().map(function(sIdx){
            return myself.getVisibleValuesForSeriesIndex(sIdx)
        });
        return res;
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
            if(typeof a[idx] != "undefined" /* && a[idx] != null */){
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
        var res = this.getVisibleSeriesIndexes().map(function(idx){
            return cats[idx]
        });
        return res;
    },


    /*
     * Returns the object for a given category idx in the form {serie: value}
     *
     */

    getObjectsForCategoryIndex: function(idx){

        var myself = this;
        var ar=[];
        this.getValues()[idx].map(function(a,i){
            if(typeof a != "undefined" /* && a!= null */){
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
        //pv.range(0,this.getSeriesSize());
    },

    setSeriesInRows: function(seriesInRows){
        this.seriesInRows = seriesInRows;
    },

    isSeriesInRows: function(){
        return this.seriesInRows;
    },
    
    setValuesIndexes: function(valuesIndexes){
        this.valuesIndexes = valuesIndexes;
    },
    
    setMultiValued: function(multiValue){
        this.isMultiValued = !! multiValue;
    },
    
    //TODO: in multiValued mode, have all options only related to data mapping in one object?
    setDataOptions: function(dataOptions){
        this.dataOptions = dataOptions;
    }

});


///*
// * DataEngine that deals with multiple measures
// */
//pvc.MultiValuedDataEngine = pvc.DataEngine.extend({
//    
//    
//});

pvc.DataTranslator = Base.extend({

    dataEngine: null,
    metadata: null,
    resultset: null,
    values: null,
    valuesMulti: null,
    secondAxisValues: null,

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

    getSecondAxisValues: function(){

        // Skips first row
        return this.secondAxisValues.slice(1);

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


    prepare: function(dataEngine){
        this.dataEngine = dataEngine;
        this.prepareImpl();
        this.postPrepare();
    },

    postPrepare: function(){

        if( this.dataEngine.seriesInRows ){
            this.transpose()
        }
        if(this.dataEngine.chart.options.secondAxis){
            var idx = this.dataEngine.chart.options.secondAxisIdx;
            if (idx>=0){
                idx++; // first row is cat name
            }

            // Transpose, splice, transpose back
            pv.transpose(this.values);
            this.secondAxisValues = this.values.splice(idx , 1)[0];
            pv.transpose(this.values);
        }

    },

    prepareImpl: function(){
    // Specific code goes here - override me
    },

    sort: function(sortFunc){
    // Specify the sorting data - override me
    }


})


pvc.CrosstabTranslator = pvc.DataTranslator.extend({


    prepareImpl: function(){
    
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



    prepareImpl: function(){

        var myself = this;

        if(this.metadata.length == 2){
            // Adding a static serie
            this.resultset.map(function(d){
                d.splice(0,0,"Series");
            })
            this.metadata.splice(0,0,{
                "colIndex":2,
                "colType":"String",
                "colName":"Series"
            })
        }

        /*
        var seenSeries = [],
        seenCategories = [],
        crossTab = [];

        for (r = 0; r < this.resultset.length;r ++) {
            var row = this.resultset[r],
            sIdx = ( idx = seenSeries.indexOf(row[0])) > -1 ? idx + 1: seenSeries.push(row[0]),
            cIdx = ( idx = seenCategories.indexOf(row[1])) > -1 ? idx : seenCategories.push(row[1]) - 1;
            //console.log(row);
            if(!crossTab[cIdx]) crossTab[cIdx] = [];
            crossTab[cIdx][sIdx] = (crossTab[cIdx][sIdx] || 0 ) + row[2];
            crossTab[cIdx][0] = row[1];
        }

        this.values = crossTab;

         */

        var tree = pv.tree(this.resultset).keys(function(d){
            return (d != null)? [d[0],d[1]] : [null, null];
        }).map();
        
        // Now, get series and categories:

        var series = pv.uniq(this.resultset.map(function(d){
            return (d != null)? d[0] : null;
        }));
        var numeratedSeries = pv.numerate(series);

        var categories = pv.uniq(this.resultset.map(function(d){
            return (d != null)? d[1] : null;
        }))
        var numeratedCategories = pv.numerate(categories);


        // Finally, iterate through the resultset and build the new values

        this.values = [];
        var categoriesLength = categories.length;
        var seriesLength = series.length;

        // Initialize array
        pv.range(0,categoriesLength).map(function(d){
            myself.values[d] = new Array(seriesLength + 1);
            myself.values[d][0] = categories[d]
        })

        this.resultset.map(function(l){

            myself.values[numeratedCategories[l[1]]][numeratedSeries[l[0]] + 1] =
            pvc.sumOrSet(myself.values[numeratedCategories[l[1]]][numeratedSeries[l[0]]+1], l[2]);
        })

        // Create an initial line with the categories
        var l1 = series;
        l1.splice(0,0,"x");
        this.values.splice(0,0, l1);
 
    },
    
    getValueFromResultSetRow : function(resultSetRow){
        return resultSetRow[2];
    }


});



pvc.MultiValueTranslator = pvc.DataTranslator.extend({
    
    constructor: function(valuesIndexes, crosstabMode, dataOptions)//measuresIdx , categoriesIndexes) //seriesIndexes, numMeasures(1), 
    {
        this.valuesIndexes = valuesIndexes;
        this.crosstabMode = crosstabMode;
        /*this.measuresIdx = measuresIdx; *///measuresIdx : when measures are normalized
        this.dataOptions = dataOptions;
        
        if(this.dataOptions == null) this.dataOptions = {};//TODO:
        
    },
    
    prepareImpl: function()
    {
        //TODO: hcoded:
        var separator = '~';
        
        //categories
        //var categoriesIdx = this.dataOptions.categoriesIdx;
        //if(categoriesIdx == null) { categoriesIdx = [0];}
       // else if(!$.isArray(categoriesIdx)) { categoriesIdx = [categoriesIdx]; }
        
        if(this.crosstabMode){
            
            //2 modes here:
            // 1) all measures in one column
            // 2) measures with separator mixed with series (TODO!) -- regular crosstab mode
            
            if(!this.dataOptions.categoriesCount){//default
                this.dataOptions.categoriesCount = 1;
            }
            
            if(this.dataOptions.measuresInColumns || this.dataOptions.measuresIdx == null) //TODO: 
            {//series1/measure1, series1/measure2...
                // line
                var lastColName = null;
                var colNames = [];
                var measures = null;
                var measuresStart = this.dataOptions.categoriesCount;
                
                var cols = this.metadata.slice(measuresStart).map(function(d){
                    return d.colName;
                });
                
                if(this.dataOptions.measuresInColumns){
                    //a1 now series1~measure1 | .. | series1~measureN | series2~measure1 |..| seriesM~measureN
                    for(var i = 0; i< cols.length; i++){
                        var col = cols[i];
                        var sepIdx = col.lastIndexOf(separator);
                        var colName = (sepIdx < 0)? '' : col.slice(0,sepIdx);
                        if(colName != lastColName) {
                            colNames.push(colName);
                            lastColName = colName;
                        }
                    }
                    var numMeasures = (cols.length) / colNames.length;
                    //TODO: merge series
                    
                    //TODO: more measures here, single val as is; multi: will need to iterate and merge values
                    this.values = this.mergeMeasuresInColumns(this.resultset, measuresStart, numMeasures);
                }
                else {
                    colNames = cols;
                    this.values = this.mergeMeasuresInColumns(this.resultset, measuresStart, 1);
                }
                
                for(var i=0;i<colNames.length;i++){
                    colNames[i] = colNames[i].split('~');
                }
                
                this.values = this.mergeColumnNames(this.values, 0, this.dataOptions.categoriesCount);
                //this.values = pvc.cloneMatrix(this.resultset).map(function(row){ return row.map(function(d){ return [d];}); });
                colNames.splice(0,0,"x");
                this.values.splice(0,0,colNames);
                
            }
            else {//if(this.dataOptions.denormalizedMeasures) {//TODO: refactor
            
                //TODO: PASS VARS
                var measuresIdx = this.dataOptions.measuresIdx;
                if(measuresIdx == null) { measuresIdx = 1;}
                var numMeasures = this.dataOptions.numMeasures;
                if (numMeasures == null) { numMeasures = 1; } 
                
                var a1 = this.metadata.slice(measuresIdx + 1).map(function(d){
                    return d.colName;
                });
                a1.splice(0,0,"x");
        
                //var values = pvc.cloneMatrix(this.resultset);
                this.values = [];
                var newRow = [];
                var row;
                for(var i=0; i<this.resultset.length; i++){
                    var rem = i % numMeasures;
                    row = this.resultset[i];
                    if(rem == 0)
                    {//first in measures batch
                        newRow = row.slice();//clone
                        //values = [];
                        newRow.splice(measuresIdx,1);//remove measures' titles column
                        for(var j=measuresIdx; j<newRow.length;j++){
                            newRow[j] = [];    //init measures
                        }
                    }
                    
                    //add values    
                    for(var j=measuresIdx; j<newRow.length;j++){
                       newRow[j].push(row[j+1]);//push measures
                    }
                    
                    if(rem == numMeasures -1){//measures batch complete
                        this.values.push(newRow);
                    }   
                }
                
                this.values.splice(0,0,a1);
            }
        }
        else {//TODO: refactor
        //relational mode
            var seriesIdx = 0;//TODO:hcoded, needs ref from chart?
            var categoriesIdx = 1;
    
            var tree = pv.tree(this.resultset).keys(function(d){
                return [d[seriesIdx],d[categoriesIdx]];
            }).map();
            
            // Now, get series and categories:
    
            var series = pv.uniq(this.resultset.map(function(d){
                return d[0];
            }));
            
    
            var categories = pv.uniq(this.resultset.map(function(d){
                return d[1];
            }))
            
            // Finally, iterate through the resultset and build the new values
    
            this.allValues = [];
    
            var l1 = series;//TODO:clone?
            //add table corner
            l1.splice(0,0,"x");
            
            var values = this.getMultiValuesFromResultSet(this.valuesIndexes, categories, series,categoriesIdx, seriesIdx);
            // Create an initial line with the categories
            values.splice(0,0, l1);
            this.allValues = values;
    
            //this.values = this.getValuesFromResultSet(measuresIndexes[0],categories, series,categoriesIdx, seriesIdx);
            //this.values.splice(0,0,l1);
            this.values = this.allValues;
        }

    },
    
    
    mergeColumnNames: function(values,start, count)
    {
        return values.map(function(row, rowIdx){
            var colNames = row.slice(start,start + count);
            var newRow = row.slice(start + count);
            newRow.splice(0,0,colNames);
            return newRow;
        });
    },
    
    mergeMeasuresInColumns: function(values, startIdx, numMeasures)
    {
      return values.map(function(row, rowIdx){
        var newRow = row.slice(0, startIdx);
        for(var i=startIdx;i<row.length;i+=numMeasures){
            var value = [];
            for(var j =0; j < numMeasures;j++){
                value.push(row[i+j]);
            }
            newRow.push(value);
        }
        return newRow;
      });
    },
    
    addSeriesToMetadata: function(){
        if(this.metadata.length == 2){
            // Adding a static serie
            this.resultset.map(function(d){
                d.splice(0,0,"Series");
            })
            this.metadata.splice(0,0,{
                "colIndex":2,
                "colType":"String",
                "colName":"Series"
            })
        }
    },
    
    //overridden
    getValues: function(idx){
        if(idx == null){//default to first
           // return this.values;
            return this.values.slice(1).map(function(a){
                return a.slice(1);
            });
        }
        else if(idx > this.allValues.length || idx < 0) { throw new NoDataException(); }
        else {
            //return this.allValues.map(function(d){
            //    return d[idx];
            //});
            return this.allValues.slice(1).map(function(a){
                return a.slice(1);
            }).map(function(d){
                return d[idx];
            });
            //return this.allValues[idx];
        }
    },
    
    sumOrSetVect: function(v1, v2){
         if (v1 == null || v1[0] === undefined) { return v2; }
        //TODO: check
        var res = [];
        for(var i=0;i<v1.length;i++){
            if(v1[i] == null) { res[i] = v2[i];}
            res[i] = v1[i] + v2[i];
        }
        return res;
    },
    
    //series with x
    getValuesFromResultSet: function(valueIndex, categories, series, categoriesIdx, seriesIdx)
    {
        var categoriesLength = categories.length;
        var seriesLength = series.length;
        var numeratedSeries = pv.numerate(series);
        var numeratedCategories = pv.numerate(categories);
        
        // Initialize array
        var values = [];                
        pv.range(0,categoriesLength).map(function(d){
            values[d] = new Array(seriesLength);
            values[d][0] = categories[d];
        });
        // Set array values
        this.resultset.map(function(row){
            var i = numeratedCategories[row[categoriesIdx]];
            var j = numeratedSeries[row[seriesIdx]];
            values[i][j] = pvc.sumOrSet(values[i][j], row[valueIndex]);
        });
        return values;
    },
    
    getMultiValuesFromResultSet: function(valueIndexes, categories, series, categoriesIdx, seriesIdx)
    {
        var categoriesLength = categories.length;
        var seriesLength = series.length;
        var numeratedSeries = pv.numerate(series);
        var numeratedCategories = pv.numerate(categories);
        
        var myself = this;
        // Initialize array
        var values = [];                
        pv.range(0,categoriesLength).map(function(d){
            values[d] = new Array(seriesLength);
            values[d][0] = categories[d];
        });
        // Set array values
        this.resultset.map(function(row){
            var i = numeratedCategories[row[categoriesIdx]];
            var j = numeratedSeries[row[seriesIdx]];
            
            var val = [];
            for(var k = 0; k < valueIndexes.length; k++){
                val.push( row[valueIndexes[k]]);
            }
            values[i][j] = myself.sumOrSetVect(values[i][j], val);
        });
        return values;
    }
    
});


NoDataException = function() {};

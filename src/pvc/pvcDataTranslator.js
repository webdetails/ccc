
pvc.DataTranslator = Base.extend({

    dataEngine: null,
    metadata: null,
    resultset: null,
    values: null,
    _data: null,
    secondAxisValues: null,

    //constructor: function(){
    //},

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
        return this.secondAxisValues.map(function(a){
            return a.slice(1);
        });
    },

    getSecondAxisSeries: function(){
        // Skips first row
        return this.secondAxisValues.map(function(a){
            return a[0];
        });
    },

    getColumns: function(){
        // First row, skipping 1st (dummy) element
        return this.values[0].slice(1);
    },

    getRows: function(){
        // First element of every row, skipping 1st row
        return this.values.slice(1).map(function(row){ return row[0]; });
    },

    getData: function(){
        if(!this._data){
            this._data = this._createData();
        }
        return this._data;
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

        if(this.dataEngine.seriesInRows){
            this.transpose();
        }

        var options = this.dataEngine.chart.options;
        if(options.secondAxis){
            var columnIndexes = pvc.toArray(options.secondAxisIdx)
                                    .sort();

            // Transpose, splice, transpose back
            this.transpose();
            
            this.secondAxisValues = [];
            for (var i = columnIndexes.length - 1 ; i >= 0 ; i--) {
                var columnIndex = Number(columnIndexes[i]);
                
                // TODO: Can a column index not be >= 0? NaN? In what cases?
                if(columnIndex >= 0){
                    columnIndex += 1;
                }
                
                this.secondAxisValues.unshift(this.values.splice(columnIndex, 1)[0]);
                
                // TODO: DCL - secondAxisValues remain untransposed??
            }
            
            this.transpose();
        }
    },

    prepareImpl: function(){
    // Specific code goes here - override me
    },

    sort: function(sortFunc){
    // Specify the sorting data - override me
    },

    _createData: function(){
        // Create data
        var data = [],
            //serRow,
            dimSeries = this.dataEngine.getDimension('series'),
            dimCategs = this.dataEngine.getDimension('category');
        
        // Crosstab to object/relational
        this.values.forEach(function(row, rowIndex){
            if(rowIndex === 0){
                // 1st row contains series
                //serRow = row;
            } else {
                // Remaining rows are 1 per category
                var catIndex = rowIndex - 1,
                    catElem  = dimCategs.getElement(catIndex);

                row.forEach(function(value, colIndex){
                    if(colIndex === 0){
                        // 1st column contains the category
                        // catValue = value;
                    } else if(value != null){
                        // Remaining columns the series values
                        var serIndex = colIndex - 1,
                            serElem  = dimSeries.getElement(serIndex),
                            datum = new pvc.Datum(
                                        this.dataEngine, 
                                        data.length,
                                        {series: serElem, category: catElem},
                                        value);
                       data.push(datum);
                    }
                }, this);
            }
        }, this);
        
        return data;
    }
});

pvc.CrosstabTranslator = pvc.DataTranslator.extend({

    prepareImpl: function(){
    
        // All we need to do is to prepend 
        // a row with the series to the result matrix 

        // Collect series values from meta data column names
        var seriesRow = this.metadata.slice(1).map(function(d){
            return d.colName;
        });
        
        // First column is dummy
        seriesRow.splice(0, 0, "x");

        this.values = pvc.cloneMatrix(this.resultset);
        
        this.values.splice(0, 0, seriesRow);
    }
});


/* Relational format:
 *    0         1        2
 * Series | Category | Value
 * ---------------------------
 *    T   |     A    |   12
 *    T   |     B    |   45
 *    Q   |     A    |   11
 *    Q   |     B    |   99
 *    Z   |     B    |   3
 * 
 * (if only 2 columns are present, 
 *  a 1st column with a fixed series is implied)
 * 
 * Is transformed to:
 *    
 *     0   1    2    3
 * 0   x | T  | Q  | Z    (<--- Series)
 *    -------------------
 * 1   A | 12 | 11 | null
 * 2   B | 45 | 99 | 3
 *    
 *     ^
 *     |
 *  (Categories)
 *  
 */
pvc.RelationalTranslator = pvc.DataTranslator.extend({

    prepareImpl: function(){

        // Special case
        if(this.metadata.length == 2){
            // Adding a static series
            
            // Add a 1st column with value 'Series' to every row
            // All rows will belong to the same series: 'Series'
            this.resultset.forEach(function(row){
                row.splice(0, 0, "Series");
            });
            
            // TODO: this metadata seems to be wrong...
            this.metadata.splice(0, 0, {
                "colIndex": 2,
                "colType":  "String",
                "colName":  "Series"
            });
        }
        
        // Unique series values in order of appearance in the resultset
        var series = pv.uniq(this.resultset.map(function(rowIn){
            return (rowIn != null) ? rowIn[0] : null;
        }));
        
        // Unique category values in order of appearance in the resultset
        var categories = pv.uniq(this.resultset.map(function(rowIn){
            return (rowIn != null) ? rowIn[1] : null;
        }));
        
        // -----------
        
        var categoriesLength = categories.length,
            seriesLength = series.length,
            values = this.values = new Array(categoriesLength + 1);
        
        // First row is the series row
        // 'x' is a dummy placeholder
        values[0] = ['x'].concat(series);
        
        // First column is the category
        new pvc.Range(0, categoriesLength).forEach(function(catIndex){
            var row = values[catIndex + 1] = new Array(seriesLength + 1);
            
            row[0] = categories[catIndex];
        });
        
        // Finally, iterate through the resultset and build the new values
        var seriesIndexByValue = pv.numerate(series),
            categoriesIndexByValue = pv.numerate(categories);
        
        this.resultset.forEach(function(rowIn){
            var j = seriesIndexByValue[rowIn[0]] + 1,
                i = categoriesIndexByValue[rowIn[1]] + 1,
                v = rowIn[2],
                row = values[i];
            
            row[j] = pvc.sum(row[j], v); // may end as null or undefined
        });
    }
});

pvc.MultiValueTranslator = pvc.DataTranslator.extend({
    
    constructor: function(valuesIndexes, crosstabMode, dataOptions){
        //measuresIdx , categoriesIndexes) //seriesIndexes, numMeasures(1), 

        this.crosstabMode  = crosstabMode;
        this.valuesIndexes = valuesIndexes;
        
        /*this.measuresIdx = measuresIdx; *///measuresIdx : when measures are normalized
        
        this.dataOptions = dataOptions || {}; // TODO:
    },
    
    prepareImpl: function(){
        var separator = this.dataOptions.separator || '~';
        
        if(this.crosstabMode){
            
            // TODO: DCL - somes drawings ilustrating the various formats would really help here!
            
            //2 modes here:
            // 1) all measures in one column right after categories
            // 2) measures with separator mixed with series
            
            if(this.dataOptions.categoriesCount == null){//default
                this.dataOptions.categoriesCount = 1;
            }
            
            if(this.dataOptions.measuresInColumns || this.dataOptions.measuresIdx == null){ 
                //series1/measure1, series1/measure2...
                // line
                var seriesNames,
                    measureCount;

                var measuresStart = this.dataOptions.categoriesCount,
                    colNames = this.metadata.slice(measuresStart).map(function(d){
                        return d.colName;
                    });

                if(this.dataOptions.measuresInColumns){
                    // series1~measure1 | .. | series1~measureN |
                    // series2~measure1 | .. | series2~measureN |
                    // ...
                    // seriesM~measure1 | .. | seriesM~measureN
                    //
                    // Each series name itself may be composed of
                    // multiple levels, separated by ~
                    seriesNames = [];
                    var lastSeriesName = null;
                    for(var i = 0; i < colNames.length; i++){
                        var colName  = colNames[i],
                            sepIndex = colName.lastIndexOf(separator),
                            seriesName = (sepIndex < 0) ? '' : colName.slice(0, sepIndex);
                        
                        if(seriesName !== lastSeriesName) {
                            seriesNames.push(seriesName);
                            lastSeriesName = seriesName;
                        }
                    }

                    measureCount = colNames.length / seriesNames.length;
                    //TODO: merge series
                    
                    //TODO: more measures here,
                    //single val as is;
                    //multi: will need to iterate and merge values
                } else {
                    measureCount = 1;
                    seriesNames = colNames;
                }

                // Split series names
                for(var j = 0, S = seriesNames.length ; j < S ; j++){
                    seriesNames[j] = seriesNames[j].split('~');
                }

                this.values = this.mergeCategoriesAndMeasuresColumns(
                                        this.resultset,
                                        measuresStart,
                                        measureCount);

                // Prepend the series names row
                seriesNames.splice(0, 0, "x"); // dummy top-left corner cell
                this.values.splice(0, 0, seriesNames);
                
            } else {//TODO:refactor? PLEASE!!!
                
                var measuresIdx = this.dataOptions.measuresIdx;
                if(measuresIdx == null) { measuresIdx = 1;}
                var measureCount = this.dataOptions.numMeasures;
                if (measureCount == null) { measureCount = 1; }
                
                var a1 = this.metadata.slice(measuresIdx + 1).map(function(d){
                    return d.colName;
                });
                a1.splice(0,0,"x");
        
                //var values = pvc.cloneMatrix(this.resultset);
                this.values = [];
                var newRow = [];
                var row;
                for(var i=0; i<this.resultset.length; i++){
                    var rem = i % measureCount;
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
                    
                    if(rem == measureCount -1){//measures batch complete
                        this.values.push(newRow);
                    }   
                }
                
                this.values.splice(0, 0, a1);
            }
        } else {
            // Relational mode
            var sers = pv.uniq(this.resultset.map(function(d){ return d[0]; })),
                cats = pv.uniq(this.resultset.map(function(d){ return d[1]; })),
                vals = this.getMultiValuesFromResultSet(cats, sers);
            
            // Create an initial line with the categories
            // Add table corner
            vals.splice(0, 0, ['x'].concat(sers));
            
            this.values = vals;
        }
    },

    mergeCategoriesAndMeasuresColumns: function(values, measuresStart, measureCount){
        return values.map(function(row){
            // Merge all categories into a single multi-level category.
            var newRow = [row.slice(0, measuresStart)];

            // Merge all measures of each series into one array value
            for(var c = measuresStart ; c < row.length ; c += measureCount){
                
                var value = [];
                for(var m = 0 ; m < measureCount ; m++){
                    value.push(row[c + m]);
                }
                newRow.push(value);
            }

            return newRow;
        });
    },
    
    // @override
    getValues: function(valueIndex){
        // TODO: improve so much copying!

        if(valueIndex == null){
            // Default to base implementation
            return this.values.slice(1).map(function(row){
                return row.slice(1);
            });
            
        } else if(valueIndex < 0 || valueIndex >= this.values.length - 1) { 
            throw new NoDataException(); 
        }
        
        return this.values.slice(1).map(function(row){
            return row.slice(1)[valueIndex];
        });
    },
    
    getMultiValuesFromResultSet: function(cats, sers){
        var sersLength = sers.length,
            numeratedSers = pv.numerate(sers),
            numeratedCats = pv.numerate(cats);
        
        // Initialize array
        var values = [];

        // Create one row per category
        // The 1st column of each row is the category name
        new pvc.Range(cats.length).forEach(function(catIndex){
            var row = new Array(sersLength + 1),
                c = cats[catIndex];
                
            row[0] = c;

            values[catIndex] = row;
        });
        
        // Place resultset values on i,j coordinates of values
        this.resultset.forEach(function(rowIn){
            var s = rowIn[0],
                c = rowIn[1],
                j = numeratedSers[s] + 1, // 1st column is category name
                i = numeratedCats[c],
                // collect values
                val = pv.permute(rowIn, this.valuesIndexes),
                row = values[i];

            row[j] = this.sumOrSetVect(row[j], val);
        }, this);
        
        return values;
    },

    // Sums element by element
    // Assumes v1 and v2, when both present, have the same length.
    sumOrSetVect: function(v1, v2){
        if (v1 == null) {
            return v2;
        }

        var res = [];
        for(var i = 0 ; i < v1.length ; i++){
            if(v1[i] == null) {
                res[i] = v2[i];
            } else if(v2[i] == null){
                res[i] = v1[i];
            } else {
                res[i] = v1[i] + v2[i];
            }
        }

        return res;
    }
    
    /* TODO: DCL - not used?
    //series with x
    getValuesFromResultSet: function(valueIndex, categories, series, categoriesIdx, seriesIdx){
        var categoriesLength = categories.length;
        var seriesLength = series.length;
        var numeratedSeries = pv.numerate(series);
        var numeratedCategories = pv.numerate(categories);

        // Initialize array
        var values = [];
        pv.range(0,categoriesLength).forEach(function(d){
            values[d] = new Array(seriesLength);
            values[d][0] = categories[d];
        });

        // Set array values
        this.resultset.forEach(function(row){
            var i = numeratedCategories[row[categoriesIdx]];
            var j = numeratedSeries[row[seriesIdx]];
            values[i][j] = pvc.sum(values[i][j], row[valueIndex]);
        });

        return values;
    },
    */

});
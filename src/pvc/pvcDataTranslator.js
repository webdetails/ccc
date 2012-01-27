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
        // First column of every row, skipping 1st entry
        return this.values[0].slice(1);
    },

    getRows: function(){
        // first element of every row, skipping 1st one
        return this.values.slice(1).map(function(d){
            return d[0];
        });
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
        
        // TODO: does not DataEngine itself has the fields secondAxis and secondAxisIdx?
        if(this.dataEngine.chart.options.secondAxis){
            var columnIndexes = pvc.toArray(this.dataEngine.chart.options.secondAxisIdx)
                                    .sort();

            // Transpose, splice, transpose back
            this.transpose();
            
            this.secondAxisValues = [];
            for (var i = columnIndexes.length - 1 ; i >= 0 ; i--) {
                var columnIndex = Number(columnIndexes[i]);
                
                // TODO: Can a column index be < 0 ? In what cases?
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
        // Create data table
        var data = [],
            serRow;
        
        // Crosstab to object/relational
        this.values.forEach(function(row, rowIndex){
            if(rowIndex === 0){
                // 1st row contains series
                serRow = row;
            } else {
                // Remaining rows are 1 per category
                var catValue,
                    catIndex = rowIndex - 1;

                row.forEach(function(value, colIndex){
                    if(colIndex === 0){
                        // 1st column contains the category
                        catValue = value;
                    } else {
                        // Remaining columns the series values
                        var serValue = serRow[colIndex],
                            serIndex = colIndex - 1,
                            datum = new pvc.Datum(
                                        this.dataEngine, 
                                        data.length,
                                        serIndex, 
                                        serValue, 
                                        catIndex, 
                                        catValue,
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
        
        // Unique series values
        var series = pv.uniq(this.resultset.map(function(rowIn){
            return (rowIn != null) ? rowIn[0] : null;
        }));
        
        // Unique categories values
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
            
            row[j] = pvc.sumOrSet(row[j], v);
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
        var separator = (this.dataOptions.separator != null) ? this.dataOptions.separator : '~';
        
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
                var lastColName = null;
                var colNames = [];
                //var measures = null;
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
                
            } else {//TODO:refactor?
                
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
        } else {
            //TODO: refactor?
            //relational mode
            var series = pv.uniq(this.resultset.map(function(d){ return d[0]; }));
            
            var categories = pv.uniq(this.resultset.map(function(d){ return d[1]; }));
            
            var values = this.getMultiValuesFromResultSet(categories, series);
            
            // Create an initial line with the categories
            // Add table corner
            values.splice(0,0, ['x'].concat(series));
            
            this.values = values;
        }

    },
    
    mergeColumnNames: function(values, start, count){
        return values.map(function(row){
            var colNames = row.slice(start, start + count);
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
            for(var j = 0 ; j < numMeasures ; j++){
                value.push(row[i+j]);
            }
            newRow.push(value);
            }
        return newRow;
        });
    },
    
    /* TODO: DCL not used?
    addSeriesToMetadata: function(){
        if(this.metadata.length == 2){
            // Adding a static series
            this.resultset.map(function(d){
                d.splice(0,0,"Series");
            });
            
            this.metadata.splice(0,0,{
                "colIndex":2,
                "colType":"String",
                "colName":"Series"
            });
        }
    },
    */
    
    // @override
    getValues: function(valueIndex){
        if(valueIndex == null){
            // Default to base implementation
            return this.values.slice(1).map(function(row){
                return row.slice(1);
            });
            
        } else if(valueIndex < 0 || valueIndex >= this.values.length - 1) { 
            throw new NoDataException(); 
        }
        
        // TODO: why 1st copy...
        // TODO: what is this operation? the nth series value?
        return this.values.slice(1).map(function(row){
            return row.slice(1)[valueIndex];
        });
    },
    
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
    },
    
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
            values[i][j] = pvc.sumOrSet(values[i][j], row[valueIndex]);
        });
        
        return values;
    },
    */
    
    getMultiValuesFromResultSet: function(categories, series){
        var categoriesLength = categories.length,
            seriesLength = series.length,
            numeratedSeries = pv.numerate(series),
            numeratedCategories = pv.numerate(categories);
        
        // Initialize array
        var values = [];
        
        new pvc.Range(categoriesLength).forEach(function(catIndex){
            var row = values[catIndex] = new Array(seriesLength);  
            
            row[0] = categories[catIndex];
        });
        
        // Set array values
        this.resultset.forEach(function(rowIn){
            var i = numeratedCategories[rowIn[1]],
                j = numeratedSeries[rowIn[0]] + 1,
                val = this.valuesIndexes.map(function(valueIndex){
                    return rowIn[valueIndex];
                }),
                row = values[i];
            
            
            row[j] = this.sumOrSetVect(row[j], val);
        }, this);
        
        return values;
    }
    
});
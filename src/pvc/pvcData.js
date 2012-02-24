
/**
 * Class of exception thrown when a chart has no data.
 * @class
 */
var NoDataException = function(){};

/**
 * The DataEngine controls access to data.
 * Adapts data from its original format to the internal format.
 * Maintains view-state relating visibility and selection.
 */
pvc.DataEngine = Base.extend({

    chart: null,
    metadata: null,
    resultset: null,
    seriesInRows: false,
    crosstabMode: true,
    translator: null,
    values: null,
    secondAxisValues: null,
    
    // neu
    isMultiValued: false,
    valuesIndexes: null,
    
    _dimensions: null,
    _dimensionList: null,
    
    // Selection control
    _selections: null,
    _selectedCount: 0,
    
    // Data list
    _data: null,
    
    // Data indexed by each dimension in turn
    _dataTree: null,
    
    constructor: function(chart){
        
        this.chart = chart;
        
        this._initDimensions();
        
        // HashTable of selected datums
        // datum.index -> datum
        this._selections = {};
        this._selectedCount = 0;
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
    
    setValuesIndexes: function(valuesIndexes){
        this.valuesIndexes = valuesIndexes;
    },
    
    setMultiValued: function(multiValue){
        this.isMultiValued = !!multiValue;
    },
    
    setData: function(metadata, resultset){
        this.metadata  = metadata;
        this.resultset = resultset;

        if(pvc.debug){
            pvc.log("ROWS");
            if(this.resultset){
                this.resultset.forEach(function(row, index){
                    pvc.log("row " + index + ": " + JSON.stringify(row));
                });
            }

            pvc.log("COLS");
            if(this.metadata){
                this.metadata.forEach(function(col){
                    pvc.log("column {" +
                        "index: " + col.colIndex +
                        ", name: "  + col.colName +
                        ", label: "  + col.colLabel +
                        ", type: "  + col.colType + "}"
                    );
                });
            }
        }
    },
    
    // TODO: in multiValued mode, have all options only related to data mapping in one object?
    setDataOptions: function(dataOptions){
        this.dataOptions = dataOptions;
    },
    
    /** 
     * Initializes the currently supported dimensions:
     * 'series' and 'category'.
     */
    _initDimensions: function(){
        // dimensionName -> state
        this._dimensions = {};
        this._dimensionList = [];
        
        var me = this,
            options = this.chart.options;
        
        // Must be first, to match the order in the values matrix (lines)
        this._defDimension('category', {
            fetchValues: function(){ return me._fetchCategories(); },
            calcLabel: options.getCategoryLabel,
            
            // When timeSeries=true, it is the category dimension that is the timeseries...
            timeSeries: options.timeSeries,
            timeSeriesFormat: options.timeSeriesFormat
        });
        
        this._defDimension('series', {
            fetchValues: function(){ return me._fetchSeries(); },
            calcLabel: options.getSeriesLabel
        });
    },
    
    _defDimension: function(name, definition){
        var index = this._dimensionList.length,
            dimension = new pvc.DataDimension(name, index, definition);
        
        this._dimensionList[index] = dimension;
        
        // TODO: can the name of a dimension be a number?
        // name or index lookup
        this._dimensions[name]  = dimension;
        this._dimensions[index] = dimension;
    },
    
    _fetchSeries: function(){
        return this.translator.getColumns();
    },
    
    _fetchCategories: function(){
        return this.translator.getRows();
    },
    
    /**
     * Obtains a data dimension given its name.
     * @returns {DataDimension} The desired data dimension.
     * @throws {Error} If the specified name is not defined.
     */
    getDimension: function(name){
        var dimension = this._dimensions[name];
        if(!dimension){
             throw new Error("Undefined dimension with name '" + name + "'");
        }
        
        return dimension;
    },
    
    /**
     * Obtains a data dimension given its index.
     * @returns {DataDimension} The desired data dimension.
     * @throws {Error} If the specified index is not defined.
     */
    getDimensionByIndex: function(index){
        var dimension = this._dimensionList[index];
        if(!dimension){
             throw new Error("Undefined dimension with index '" + index + "'");
        }
        
        return dimension;
    },
    
    /**
     * Creates and prepares the appropriate translator
     */
    createTranslator: function(){
        
        if(this.isMultiValued){
            pvc.log("Creating MultiValueTranslator");
            
            this.translator = new pvc.MultiValueTranslator(
                            this.valuesIndexes, 
                            this.crosstabMode, 
                            this.dataOptions);  //TODO:
        } else if(this.crosstabMode){
            pvc.log("Creating CrosstabTranslator");
            
            this.translator = new pvc.CrosstabTranslator();
        } else {
            pvc.log("Creating RelationalTranslator");
            
            this.translator = new pvc.RelationalTranslator();
        }

        this.prepareTranslator();
    },
    
    /**
     * Prepares a just created translator
     */
    prepareTranslator: function(){
        this.translator.setData(this.metadata, this.resultset);
        this.translator.prepare(this);
    },
    
    /**
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

    /**
     * Returns the unique values of a given dimension.
     */
    getDimensionValues: function(name){
        return this.getDimension(name).getValues();
    },
    
    /**
     * Returns the nth unique value of a given dimension.
     */
    getDimensionValue: function(name, index){
        return this.getDimension(name).getValue(index);
    },

    /**
     * Returns the index of the specified value in the specified dimension.
     * Returns -1 if the value is not found.
     */
    getDimensionValueIndex: function(name, value){
        return this.getDimension(name).getIndex(value);
    },
    
    /**
     * Returns the number of unique values of a given dimension.
     */
    getDimensionSize: function(name){
        return this.getDimension(name).getSize();
    },
    
    /**
     * Returns an array with the indexes of visible series values
     */
    getDimensionVisibleIndexes: function(name){
        return this.getDimension(name).getVisibleIndexes();
    },
    
    /**
     * Returns an array with the visible series values
     */
    getDimensionVisibleValues: function(name){
        return this.getDimension(name).getVisibleValues();
    },
        
    /**
     * Toggles the visibility of the nth value of the given dimension.
     * Returns 'undefined' only if 'index' does not exist, and true otherwise.
     */
    toggleDimensionVisible: function(name, index){
        return this.getDimension(name).toggleVisibleByIndex(index);
    },
    
    /**
     * Returns true if the nth value of the 
     * given dimension is visible and false otherwise.
     */
    isDimensionVisible: function(name, index){
        return this.getDimension(name).isVisibleByIndex(index);
    },
    
    /** 
     * Returns the index of a value of the gioven dimension, 
     * given its visible index.
     */
    translateDimensionVisibleIndex: function(name, visibleIndex){
        return this.getDimension(name).translateVisibleIndex(visibleIndex);
    },
    
    // -----------------
    
    /**
     * Returns the unique series values.
     */
    getSeries: function(){
        return this.getDimensionValues('series');
    },

    /**
     * Returns a series on the underlying data given its index.
     * @deprecated use dataEngine.getDimensionValue('series', idx)
     */
    getSerieByIndex: function(idx){
        return this.getSeries()[idx];
    },

    /**
     * Returns an array with the indexes for the series.
     * @deprecated use pv.Range(dataEngine.getDimensionSize('series'))
     */
    getSeriesIndexes: function(){
        // we'll just return everything
        return pv.range(this.getSeries().length);
    },

    /**
     * Returns an array with the indexes of the visible series values.
     */
    getVisibleSeriesIndexes: function(){
        return this.getDimensionVisibleIndexes('series');
    },

    /**
     * Returns an array with the visible categories.
     */
    getVisibleSeries: function(){
        return this.getDimensionVisibleValues('series');
    },

    /**
     * Togles the series visibility based on an index. 
     * Returns true if series is now visible, false otherwise.
     */
    toggleSerieVisibility: function(index){
        return this.toggleDimensionVisible("series", index);
    },
    
    /**
     * Returns the categories on the underlying data
     */
    getCategories: function(){
        return this.getDimensionValues('category');
    },

    getCategoryMin: function() {
        return this.getDimension('category').getMinValue();
    },

    getCategoryMax: function() {
        return this.getDimension('category').getMaxValue();
    },

    /**
     * Returns the categories on the underlying data
     * @deprecated use dataEngine.getDimensionValue('category', idx) instead
     */
    getCategoryByIndex: function(idx){
        return this.getCategories()[idx];
    },

    /**
     * Returns an array with the indexes for the categories
     * @deprecated use pv.Range(dataEngine.getDimensionSize('category'))
     */
    getCategoriesIndexes: function(){
        // we'll just return everything
        return pv.range(this.getCategories().length);
    },

    /**
     * Returns an array with the indexes for the visible categories
     */
    getVisibleCategoriesIndexes: function(){
        return this.getDimensionVisibleIndexes('category');
    },

    /**
     * Returns an array with the visible categories.
     */
    getVisibleCategories: function(){
        return this.getDimensionVisibleValues('category');
    },

    /**
     * Togles the category visibility based on an index. 
     * Returns true if category is now visible, false otherwise.
     */
    toggleCategoryVisibility: function(index){
        return this.toggleDimensionVisible('category', index);
    },
    
    // ---------------------
    
    /**
     * Returns the values for the dataset
     */
    getValues: function(){

        if (this.values == null){
            this.values = this.translator.getValues();
        }
        
        return this.values;
    },

    /**
     * Returns the values for the second axis of the dataset
     * NOTE: this.getSecondAxisValues() values are transposed
     */
    getSecondAxisValues: function(){

        if (this.secondAxisValues == null){
            this.secondAxisValues = this.translator.getSecondAxisValues();
        }
        return this.secondAxisValues;
    },
    
    // DO NOT confuse with setData,
    // which is quite different
    getData: function(){
        if(!this._data){
            this._data = this.translator.getData();
        }
    
        return this._data;
    },
    
    getSecondAxisSeries: function() {
       return this.translator.getSecondAxisSeries();
    },

    getSecondAxisIndices: function() {
        return Object.keys(this.getSecondAxisValues());
    },
    
    /**
     * Returns the object for the second axis 
     * in the form {category: catName, value: val}
     */
    getObjectsForSecondAxis: function(seriesIndex, sortF){
        seriesIndex = seriesIndex || 0;
        var result = [];
        
        // NOTE: this.getSecondAxisValues() values are transposed
        this.getSecondAxisValues()[seriesIndex].forEach(function(v, j){
            if(typeof v != "undefined" /* && v != null */ ){
                result.push({
                    serieIndex: seriesIndex,
                    category:   this.getCategories()[j],
                    value:      v
                });
            }
        }, this);

        if (typeof sortF == "function"){
            return result.sort(sortF);
        }
        
        return result;
    },
    
    /**
     * Returns the maximum value for the second axis of the dataset
     */
    getSecondAxisMax:function(){

        return pv.max(this.getSecondAxisValues()
          .reduce(function(a, b) {  
            return a.concat(b);
          })
          .filter(pvc.nonEmpty));
    },
    
    /**
     * Returns the minimum value for the second axis of the dataset.
     */
    getSecondAxisMin:function(){

        return pv.min(this.getSecondAxisValues()
          .reduce(function(a, b) {  
            return a.concat(b);
          })
          .filter(pvc.nonEmpty));
    },

    /**
     * Returns the transposed values for the dataset.
     */
    getTransposedValues: function(){
    	
        return pv.transpose(pvc.cloneMatrix(this.getValues()));
    },

    /**
     * Returns the transposed values for the visible dataset.
     */
    getVisibleTransposedValues: function(){
        return this.getVisibleSeriesIndexes().map(function(seriesIndex){
            return this.getVisibleValuesForSeriesIndex(seriesIndex);
        }, this);
    },

    /**
     * Returns the values for a given series idx
     */
    getValuesForSeriesIndex: function(idx){
        return this.getValues().map(function(a){
            return a[idx];
        });
    },

    /**
     * Returns the visible values for a given category idx
     */
    getVisibleValuesForSeriesIndex: function(idx){

        var series = this.getValuesForSeriesIndex(idx);
        return this.getVisibleCategoriesIndexes().map(function(idx){
            return series[idx];
        });
    },

    /**
     * Returns the object for a given series idx in the form:
     * <pre>
     * {serieIndex: index, category: categoryValue, value: value}
     * </pre>
     */
    getObjectsForSeriesIndex: function(seriesIndex, sortF){

        var result = [];
        var categories = this.getCategories();

        this.getValues().forEach(function(a, i){
            var value = a[seriesIndex];
            if(typeof value != "undefined" /* && a[seriesIndex] != null */){
                result.push({
                    serieIndex: seriesIndex,
                    category:   categories[i],
                    value:      value
                });
            }
        }, this);

        if (typeof sortF == "function"){
            return result.sort(sortF);
        }
        
        return result;
    },

    /**
     * Returns the values for a given category idx
     */
    getValuesForCategoryIndex: function(idx){
        return this.getValues()[idx];
    },

    /**
     * Returns the visible values for a given category idx
     */
    getVisibleValuesForCategoryIndex: function(idx){

        var cats = this.getValuesForCategoryIndex(idx);
        return this.getVisibleSeriesIndexes().map(function(idx){
            return cats[idx];
        });
    },

    /**
     * Returns the object for a given category idx in the form {serie: value}
     */
    getObjectsForCategoryIndex: function(idx){

        var ar = [];
        this.getValues()[idx].map(function(a,i){
            if(typeof a != "undefined" /* && a!= null */){
                ar.push({
                    categoryIndex: idx,
                    serie: this.getSeries()[i],
                    value: a
                });
            }
        }, this);
        
        return ar;
    },

    /**
     * Returns how many series we have
     */
    getSeriesSize: function(){
        return this.getDimensionSize('series');
    },

    /**
     * Returns how many categories, or data points, we have
     */
    getCategoriesSize: function(){
        return this.getDimensionSize('category');
    },

    /**
     * For every category in the data, 
     * get the maximum of the sum of the series values.
     */
    getCategoriesMaxSumOfVisibleSeries: function(){

        var max = pv.max(
            pv.range(0, this.getCategoriesSize())
            .map(function(idx){
                return pv.sum(
                        this.getVisibleValuesForCategoryIndex(idx)
                            .map(function(e){ return Math.max(0, pvc.number(e)); }));
            }, this));
        
        pvc.log("getCategoriesMaxSumOfVisibleSeries: " + max);
        
        return max;
    },

    /**
     * For every series in the data, 
     * get the maximum of the sum of the category values. 
     * If only one series, 
     * gets the sum of the value. 
     * Useful to build pieCharts.
     */
    getVisibleSeriesMaxSum: function(){

        var max = pv.max(this.getVisibleSeriesIndexes().map(function(idx){
            return pv.sum(this.getValuesForSeriesIndex(idx).filter(pvc.nonEmpty));
        }, this));
        
        pvc.log("getVisibleSeriesMaxSum: " + max);
        
        return max;
    },

    /**
     * Get the maximum value in all series
     */
    getVisibleSeriesAbsoluteMax: function(){

        var max = pv.max(this.getVisibleSeriesIndexes().map(function(idx){
            return pv.max(this.getValuesForSeriesIndex(idx).filter(pvc.nonEmpty));
        }, this));
        
        pvc.log("getVisibleSeriesAbsoluteMax: " + max);
        
        return max;
    },

    /**
     * Get the minimum value in all series
     */
    getVisibleSeriesAbsoluteMin: function(){

        var min = pv.min(this.getVisibleSeriesIndexes().map(function(idx){
            return pv.min(this.getValuesForSeriesIndex(idx).filter(pvc.nonEmpty));
        }, this));
        
        pvc.log("getVisibleSeriesAbsoluteMin: " + min);
        
        return min;
    },
    
    // --------------------------
    // For searching
    _getDataTree: function(){
        if(!this._dataTree){
            this._dataTree = this._createDataTree();
        }
    
        return this._dataTree;
    },
    
    // Indexes data on a hierarchical index,
    //  in the order of _dimensionList.
    // The values of key dimensions of datums
    //  must identify them.
    _createDataTree: function(){
        
        function recursive(parentDimNode, datum, dimIndex /* level*/){
            // parentDimNode has one child per != keyIndex 
            // that data have on this dimension, on this path.
            var dimName  = this._dimensionList[dimIndex].name,
                keyIndex = datum.elem[dimName].leafIndex,
                dimNode = parentDimNode[keyIndex];

            if(dimIndex === lastD){
                // Must be unique...
                if(parentDimNode[keyIndex]){
                    throw new Error("Non-unique dimension list.");
                }
                
                // Index datum!
                parentDimNode[keyIndex] = datum;
                
            } else {
                if(!dimNode){
                    dimNode = parentDimNode[keyIndex] = [];
                }
                
                recursive.call(this, dimNode, datum, dimIndex + 1);
            }
        }
        
        var tree = [],
            lastD = this._dimensionList.length - 1;
        
        this.getData().forEach(function(datum){
            recursive.call(this, tree, datum, 0);
        }, this);
        
        return tree;
    },
    
    /**
     * Finds a datum given a datum key.
     * If a matching datum cannot be found then,
     * if the argument 'createNull' is true,
     * a «null datum» is returned, 
     * otherwise, 
     * null is returned.
     * 
     * If an underspecified datum key is given, 
     * undefined is returned.
     * 
     * A datum key is an object 
     * with one property per data dimension.
     * 
     * The property name is the data dimension name,
     * and the property value is the index 
     * of the value in that dimension.
     * @example
     * <pre>
     * var datumKey = {
     *     series: 1,
     *     category: 23
     * };
     * </pre>
     */
    findDatum: function(datumKey, createNull){
        var parentDimNode = this._getDataTree();
        
        for(var d = 0, D = this._dimensionList.length ; d < D ; d++){
            
            var dimName  = this._dimensionList[d].name,
                keyIndex = datumKey[dimName];
            
            if(keyIndex == null){
                // Underspecified reference
                return; // undefined (or, could return more than one...)
            }
            
            var dimNode = parentDimNode[keyIndex];
            if(dimNode == null){
                return createNull ? 
                        this._createNullDatum(datumKey) : 
                        null; // not found
            }
            
            parentDimNode = dimNode;
        }
        
        // will be a datum
        return parentDimNode;
    },
    
    // TODO: are null datums really necessary?
    _createNullDatum: function(datumRef){
        // TODO: hardcoded for 2 dimensions
        return new pvc.Datum(
                    this, 
                    -1, 
                    {
                        series:   this._dimensions['series'].getElement(datumRef.series),
                        category: this._dimensions['category'].getElement(datumRef.category)
                    },
                    null);
    },
    
    // ---------------------
    // Selections - Many datums
    
    /**
     * Deselects any selected data.
     */
    clearSelections: function(){
         pvc.forEachOwn(this._selections, function(datum){
            datum._deselect();
        });
        
        this._selections = {};
        this._selectedCount = 0;
    },
    
    /**
     * Returned the number of selected datums.
     */
    getSelectedCount: function(){
        return this._selectedCount;
    },
    
    /**
     * Returns an array with the selected datums.
     * @return {Datum[]} The selected datums.
     */
    getSelections: function(){
        var selectionList = [];
        
        if(this._selections){
            pvc.forEachOwn(this._selections, function(datum){
                selectionList.push(datum);
            });
        }
        
        return selectionList;
    },
    
    /**
     * Changes the selected state of the given datums 
     * to the state 'select'.
     * @return {boolean} true if any datums changed their state.
     */
    setSelections: function(data, select){
        var anyChanged = false;
        
        if(data){
            data.forEach(function(datum){
                if(datum.setSelected(select)){
                    // already called _onDatumSelectedChanged, below
                    anyChanged = true;
                }
            });
        }
        
        return anyChanged;
    },
        
    /**
     * Pseudo-toggles the selected state of the given datums.
     * Deselects all if all were selected,
     * selects all otherwise.
     */
    toggleSelections: function(data){
        if(!this.setSelections(data, true)){
            this.setSelections(data, false);
        }
    },
    
    // Called by a Datum when its selected state changed
    _onDatumSelectedChanged: function(datum, selected){
        if(selected){
            this._selections[datum.index] = datum;
            this._selectedCount++;
        } else {
            delete this._selections[datum.index];
            this._selectedCount--;
        }
    },
    
    // ---------------------
    // Querying
    
    /**
     * Returns all the datums that 
     * satisfy the given 'where' specification.
     * @see #forEachWhere
     */
    getWhere: function(where, keyArgs){
        var data = [];
        
        this.forEachWhere(where, function(datum){
            data.push(datum);
        });
        
        var sorter = pvc.get(keyArgs, 'sorter');
        if(sorter){
            // Sorts in-place
            data.sort(sorter);
        }

        return data;
    },
    
    /**
     * Calls the specified function for each datum that 
     * satisfies the given 'where' specification.
     * 
     * The format of the where specification is:
     * where := [orWhere1, orWhere2, ...]
     * 
     * orWhere:= {
     *      // All of the dimension filters must match:
     *      andDimName1: [orBaseValue1, orBaseValue2, ...],
     *      andDimName2: [orBaseValue1, orBaseValue2, ...],
     *      ...
     * }
     * 
     * @example:
     * All the datums of the 'Green' series 
     * unioned with
     * all the datums of the 'Blue' series that have
     * the 'Bread' or the 'Butter' category.
     * <pre>
     * [
     *      {series: ['Green']}, // OR
     *      {series: ['Blue'], category: ['Bread', 'Butter']}
     * ]
     * </pre>
     */
    forEachWhere: function(where, fun, ctx){
        // DimA X DimB X DimC X ...

        var D = this._dimensionList.length,
            firstDimNode = this._getDataTree(),
            seen = {};
        
        // CROSS JOIN
        function recursive(dimNode, orWhere, d /* level */){
            if(d === D){ // one more
                // dimNode is a datum!
                var id = dimNode.index;
                if(!seen.hasOwnProperty(id)){
                    seen[id] = true;
                    fun.call(ctx, dimNode);
                }
            } else {
                var orIndexes = orWhere[d];
                if(orIndexes){
                    // Dimension is constrained by 'where'
                    orIndexes.forEach(function(orIndex){
                        // Index, along this path has any datums?
                        var childDimNode = dimNode[orIndex];
                        if(childDimNode){
                            recursive.call(this, childDimNode, orWhere, d + 1);
                        }
                    }, this);
                } else {
                    // Dimension is not constrained by 'where'
                    // Traverse only values' indexes that have datums, along this path
                    pvc.forEachOwn(dimNode, function(childDimNode /*, orIndexText*/){
                        
                        recursive.call(this, childDimNode, orWhere, d + 1);
                    });
                }
            }
        }
        
        // For each OR where clause
        where.forEach(function(orWhere){
            recursive.call(this, firstDimNode, this._expandOrWhereClause(orWhere), 0);
        }, this);
    },
    
    /*
     * orWhere: {
     *      // All of the dimension filters must match:
     *      andDimName1: [orBaseValue1, orBaseValue2, ...],
     *      andDimName2: [orBaseValue1, orBaseValue2, ...],
     *      ...
     * }
     * 
     * returns:
     * expandedOrWhere: [
     *      // All of the dimension filters must match:
     *      andDimIndex1: [orValueIndex1, orValueIndex2, orValueIndex3, ...],
     *      
     *      andDimIndex2: [orValueIndex1, orValueIndex2, ...],
     *      
     *      ...
     * ]
     */
    _expandOrWhereClause: function(orWhere){
        var expandedOrWhere = [];
        
        // Expand values
        pvc.forEachOwn(orWhere, function(orBaseValueList, andDimName){
            var dimension = this.getDimension(andDimName),
                orValueIndexList = expandedOrWhere[dimension.index] = [];
                
                // For each possible base value
                orBaseValueList.forEach(function(orBaseValue){
                    
                    // All descendant values of
                    dimension.forEachDescendantOrSelf(
                        orBaseValue, 
                        function(/* @ignore */orValue, orValueIndex){
                            orValueIndexList.push(orValueIndex);
                        });
                });
        }, this);
        
        return expandedOrWhere;
    }
});
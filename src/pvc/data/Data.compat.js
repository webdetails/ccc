pvc.data.Data
.add(/** @lends pvc.data.Data# */{
    /**
     * Returns some information on the data points
     */
    getInfo: function(){

        var out = ["\n------------------------------------------"];
        out.push("Dataset Information");
        
        def.forEachOwn(this.dimensions(), function(dimension, name){
            var count = dimension.count(),
                type = dimension.type,
                features = [];
            
            var typeName = "any";
            if(type.valueType) {
                var match = /^\s*function\s+([^\(]+)/.exec(''+type.valueType);
                if(match) {
                    typeName = match[1];
                }
            }
            
            features.push(typeName);
            if(type.isComparable) features.push("comparable");
            
            out.push(
                "  " + 
                name +
                " (" + features.join(', ') + ")" +
                " (" + count + ")\n\t" + 
                dimension.atoms().slice(0, 10).map(function(atom){ return atom.label; }).join(", ") + 
                (count > 10 ? "..." : ""));
        });
        
        out.push("------------------------------------------");

        return out.join("\n");
    },
    
    /**
     * Returns the values for the dataset
     * BoxPlot, DataTree, ParallelCoordinates
     * 
     * @deprecated
     */
    getValues: function(){
        /**
         * Values is the inner Vs matrix
         *  X | S1  | ... | S2  |
         * ----------------------
         * C1 | V11 | ... | VN1 |
         *  . |   .           .
         * CJ | V1J | ... | VNJ |
         */
         return pv.range(0, this.getCategoriesSize())
                  .map(function(categIndex){
                      return this._getValuesForCategoryIndex(categIndex);
                  }, this);
    },
    
    /**
     * Returns the unique values of a given dimension.
     * 
     * @deprecated
     */
    _getDimensionValues: function(name){
        return this.dimensions(name).atoms().map(function(atom){ return atom.value; });
    },

    /**
     * Returns the unique visible values of a given dimension.
     * 
     * @deprecated
     */
    _getDimensionVisibleValues: function(name){
        return this.dimensions(name).atoms({visible: true}).map(function(atom){ return atom.value; });
    },
    
    /**
     * Returns the unique series values.
     * @deprecated
     */
    getSeries: function(){
        return this._getDimensionValues('series');
    },

    /**
     * Returns an array with the indexes of the visible series values.
     * @deprecated
     */
    getVisibleSeriesIndexes: function(){
        return this.dimensions('series').indexes({visible: true});
    },
    
    /**
     * Returns an array with the indexes of the visible category values.
     * @deprecated
     */
    getVisibleCategoriesIndexes: function(){
        return this.dimensions('category').indexes({visible: true});
    },

    /**
     * Returns an array with the visible categories.
     * @deprecated
     */
    getVisibleSeries: function(){
        return this._getDimensionVisibleValues('series');
    },

    /**
     * Returns the categories on the underlying data
     * @deprecated
     */
    getCategories: function(){
        return this._getDimensionValues('category');
    },

    /**
     * Returns an array with the visible categories.
     * 
     * @deprecated
     */
    getVisibleCategories: function(){
        return this._getDimensionVisibleValues('category');
    },
    
    /**
     * Returns the values for a given series index.
     * 
     * @deprecated
     */
    _getValuesForSeriesIndex: function(seriesIdx){
        return this.getValues().map(function(a){
            return a[seriesIdx];
        });
    },

    /**
     * Returns the visible values for a given series index.
     * Bullet and Pie
     * @deprecated
     */
    getVisibleValuesForSeriesIndex: function(seriesIdx){
        var seriesAtom = this.dimensions('series').atoms()[seriesIdx];
        var datumsByCategKey = this.datums({series: seriesAtom}, {visible: true})
                                   .uniqueIndex(function(datum){ return datum.atoms.category.key; });
        
        // Sorted "visible" category atoms
        return this.dimensions('category')
                   .atoms({visible: true})
                   .map(function(atom){
                        var datum = def.getOwn(datumsByCategKey, atom.key);
                        return datum ? datum.atoms.value.value : null;
                    });
    },
    
    /**
     * Returns the values for a given category index
     * @deprecated
     */
    _getValuesForCategoryIndex: function(categIdx){
        var categAtom = this.dimensions('category').atoms()[categIdx];
        var datumsBySeriesKey = this.datums({category: categAtom})
                                    .uniqueIndex(function(datum){ return datum.atoms.series.key; });
        
        // Sorted series atoms
        return this.dimensions('series')
                   .atoms()
                   .map(function(atom){
                        var datum = def.getOwn(datumsBySeriesKey, atom.key);
                        return datum ? datum.atoms.value.value : null;
                    });
    },
    
    /**
     * Returns the visible values for a given category index
     * @deprecated
     */
    getVisibleValuesForCategoryIndex: function(categIdx){
        var categAtom = this.dimensions('category').atoms()[categIdx];
        var datumsBySeriesKey = this.datums({category: categAtom}, {visible: true})
                                    .uniqueIndex(function(datum){ return datum.atoms.series.key; });
        
        // Sorted "visible" series atoms
        return this.dimensions('series')
                   .atoms({visible: true})
                   .map(function(atom){
                        var datum = def.getOwn(datumsBySeriesKey, atom.key);
                        return datum ? datum.atoms.value.value : null;
                    });
    },
    
    /**
     * Returns the transposed values for the visible dataset.
     * HeatGrid and Stacked Lines and Bars
     * @deprecated
     */
    getVisibleTransposedValues: function(){
        return this.getVisibleSeriesIndexes().map(function(seriesIndex){
            return this.getVisibleValuesForSeriesIndex(seriesIndex);
        }, this);
    },

    /**
     * Returns how many series we have
     * @deprecated
     */
    getSeriesSize: function(){
        var dim = this.dimensions('series', {assertExists: false});
        return dim ? dim.count() : 0;
    },

    /**
     * Returns how many categories, or data points, we have
     * @deprecated
     */
    getCategoriesSize: function(){
        var dim = this.dimensions('category', {assertExists: false});
        return dim ? dim.count() : 0;
    },
    
    // -------
    
    /**
     * For every category in the data, 
     * get the maximum of the sum of the series positive values.
     * @deprecated
     */
    getCategoriesMaxSumOfVisibleSeries: function(){

        var max = pv.max(
                pv.range(0, this.getCategoriesSize())
                  .map(function(categIndex){
                        return pv.sum(
                                this.getVisibleValuesForCategoryIndex(categIndex)
                                    .map(function(e){ return Math.max(0, def.number(e)); }));
                  }, this));
        
        pvc.log("getCategoriesMaxSumOfVisibleSeries: " + max);
        
        return max;
    },

    /**
     * Get the maximum value in all visible series
     * @deprecated
     */
    getVisibleSeriesAbsoluteMax: function(){
        
        var max = pv.max(this.getVisibleSeriesIndexes().map(function(idx){
            return pv.max(this._getValuesForSeriesIndex(idx).filter(def.notNully));
        }, this));
        
        if(!isFinite(max)) { 
            max = undefined; 
        }
        
        
        pvc.log("getVisibleSeriesAbsoluteMax: " + max);
        
        return max;
    },

    /**
     * Get the minimum value in all visible series
     * @deprecated
     */
    getVisibleSeriesAbsoluteMin: function(){

        var min = pv.min(this.getVisibleSeriesIndexes().map(function(idx){
            return pv.min(this._getValuesForSeriesIndex(idx).filter(def.notNully));
        }, this));
        
        if(!isFinite(min)) { 
            min = undefined; 
        }
        
        pvc.log("getVisibleSeriesAbsoluteMin: " + min);
        
        return min;
    },
    
    getObjectsForSeriesIndex: function(seriesIndex, sortF){
        
        var result = [];
        var categories = this.getCategories();

        this.getValues().forEach(function(a, i){
            var value = a[seriesIndex];
            if(typeof value != "undefined"){
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
    }
});
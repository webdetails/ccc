
pvc.DataDimension = Base.extend(
/** 
 * @lends DataDimension# 
 */
{
    name:  null,
    index: null,
    
    // lazy loading of dimension values
    // function() -> [unique dimension values]
    _getValues: null,
    
    _values: null,
    
    _invisibleIndexes: null,
    _selectedIndexes: null,
    
    _valueKeyToIndex: null, // cache, immutable
    _visibleIndexes: null,  // cache
    _visibleValues:  null,  // cache
    _selectedValues:  null, // cache
    
    /**
     * A dimension of data.
     * @constructs
     */
    constructor: function(name, index, definition){
        this.name = name;
        this.index = index;
        this._values = null;
        this._invisibleIndexes = {},

        // translator -> [values]
        this._fetchValues = pvc.get(definition, 'fetchValues');
    },
    
    /**
     * Returns the unique values.
     */
    getValues: function(){
        if(!this._values){
            this._values = this._fetchValues.call(null);
        }
        
        return this._values;
    },
    
    /**
     * Returns the nth unique value.
     */
    getValue: function(index){
        return this.getValues()[index];
    },
    
    /**
     * Returns the number of unique values.
     */
    getSize: function(){
        return this.getValues().length;
    },
    
    /**
     * Returns an array with the indexes of the visible values.
     */
    getVisibleIndexes: function(){
        if(!this._visibleIndexes){
            this._visibleIndexes = [];
            
            new pvc.Range(this.getSize())
                .forEach(function(index){
                    if(!(index in this._invisibleIndexes)){
                        this._visibleIndexes.push(index);
                    }
                }, this);
        }
        
        return this._visibleIndexes;
    },
    
    /**
     * Returns an array with the visible values.
     */
    getVisibleValues: function(){
        if(!this._visibleValues){
            this._visibleValues = this.getValues()
                    .filter(function(/* @ignore */ value, index){
                        return !(index in this._invisibleIndexes);
                    }, this);
        }
        
        return this._visibleValues;
    },
       
     /**
     * Returns true if the value of the 
     * specified index is visible.
     */
    isVisibleByIndex: function(index){
        return !(index in this._invisibleIndexes);
    },
    
    /** 
     * Changes the visibility of a value, given its index.
     * Returns true if visibility changed.
     */
    setVisibleByIndex: function(index, visible){
        // NOTE: in some cases we call setVisibleByIndex
        // during a phase where the translator hasn't been initialized...
        // That's why we allo setting the visibility without forcing to get values...
        if(index < 0 || index > this.getValues().length - 1){
            throw new Error("Invalid index");
        }
        
        // Default and Normalize
        visible = (visible == null) || !!visible;
        
        if(this.isVisibleByIndex(index) === visible){
            return false;
        }
        
        if(visible){
            delete this._invisibleIndexes[index];
        } else {
            this._invisibleIndexes[index] = true;
        }
        
        // Clear visible cache
        this._visibleValues  = null;
        this._visibleIndexes = null;
        
        return true;
    },
    
    /** 
     * Toggles the visibility of a value, given its index.
     */
    toggleVisibleByIndex: function(index){
        this.setVisibleByIndex(index, !this.isVisibleByIndex(index));
    },
    
    /** 
     * Returns the index of a value, given its visible index.
     */
    translateVisibleIndex: function(visibleIndex){
        return this.getVisibleIndexes()[visibleIndex];
    },
    
    /** 
     * Returns the index of a given value.
     * When the specified value does not exist,
     * returns -1.
     */
    getIndex: function(value){
        
        if(!this._valueKeyToIndex){
            // Build the index
            this._valueKeyToIndex = {};
            
            this.getValues().forEach(function(value, index){
                // Not checking for duplicate keys...
                this._valueKeyToIndex[this.getKey(value)] = index;
            }, this);
        }
        
        var index = this._valueKeyToIndex[this.getKey(value)];
        return index != null ? index : -1;
    },
    
    /** 
     * Returns the string key of a given value.
     */
    getKey: function(value){
        // Works for arrays...
        return value + '';
    },
    
    /** 
     * Returns the minimum value of the dimension.
     * Most suitable for "linear" dimensions -
     * works with number, string and date value types.
     */
    getMinValue: function() {
        var min;
        this.getValues().forEach(function(value, index){
            if(index === 0 || value < min){
                min = value;
            }
        });
        
        return min;
    },

    /** 
     * Returns the maximum value of the dimension.
     * Most suitable for "linear" dimensions -
     * works with number, string and date value types.
     */
    getMaxValue: function() {
        var max;
        this.getValues().forEach(function(value, index){
            if(index === 0 || value > max){
                max = value;
            }
        });
        
        return max;
    },
    
    /** 
     * Given a value, if it is an array value, 
     * calls the given function once 
     * for each descendant value, 
     * and once for the given value, 
     * if it explicitly exists.
     * 
     * If the given value is not an array,
     * and the value exists, 
     * calls the given function with it.
     */
    forEachDescendantOrSelf: function(valueBase, fun, ctx){
        if(valueBase instanceof Array){
            // TODO: inneficient, perhaps a value tree?
            this.getValues().forEach(function(value, index){
                if(pvc.arrayStartsWith(value, valueBase)){
                    fun.call(ctx, value, index);
                }
            });
        } else {
            var index = this.getIndex(valueBase);
            if(index >= 0){
                fun.call(ctx, valueBase, index);
            }
        }
    }
});
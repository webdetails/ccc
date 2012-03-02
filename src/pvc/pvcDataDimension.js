
pvc.DataDimension = Base.extend(
/** 
 * @lends DataDimension# 
 */
{
    // lazy loading of dimension values
    // function() -> [unique dimension values]
    _getValues: null,

    // function(value, index) -> label
    _calcLabel: null,

    _values: null,
    _labels: null, // cache, immutable
    _elements: null, // cache, immutable
    _rootElement: null, // cache, immutable
    _maxDepth: 0, // cache, immutable
    
    _invisibleIndexes: null,
    _selectedIndexes:  null,
    
    _valueKeyToIndex: null, // cache, immutable
    _parsedValuesMap: null, // cache, immutable
    _visibleIndexes: null,  // cache
    _visibleValues:  null,  // cache
    _visibleElements: null, // cache
    _selectedValues:  null, // cache

    _timeSeries: false,
    _parser: null,
    _sorter: null,
    
    /**
     * A dimension of data.
     * @constructs
     */
    constructor: function(name, index, definition){
        this.name = name;
        this.index = index;

        this._invisibleIndexes = {};

        // translator -> [values]
        this._fetchValues = pvc.get(definition, 'fetchValues');
        this._calcLabel   = pvc.get(definition, 'calcLabel');
        this._timeSeries  = pvc.get(definition, 'timeSeries', false);
        if(this._timeSeries){
            var timeSeriesFormat = pvc.get(definition, 'timeSeriesFormat');
            if(timeSeriesFormat){
                this._parser = pv.Format.date(timeSeriesFormat);
                
                var me = this;
                this._sorter = function(a, b){ 
                    return me._parseRawValue(a) - me._parseRawValue(b);
                }; // works for numbers and dates
            }
        }
    },
    
    /**
     * Returns the unique values.
     */
    getValues: function(){
        if(!this._values){
            this._values = this._fetchValues.call(null);

            var parser = this._parser;
            if(parser){
                // each raw value's #toString is used as the map key
                this._parsedValuesMap = pv.dict(this._values, function(rawValue){
                    return parser.parse(rawValue);
                });
            }

            // TODO - does not support depth > 1
            var sorter = this._sorter;
            if(sorter){
                this._values.sort(sorter);
            }
        }
        
        return this._values;
    },

    /**
     * Parses a raw value with the
     * dimension's associated parser, if any.
     */
    _parseRawValue: function(value){
        return this._parsedValuesMap ? this._parsedValuesMap[value] : value;
    },
    
    /**
     * Returns the leaf elements.
     */
    getElements: function(){
        if(!this._elements){
            this.getElementTree();
        }

        return this._elements;
    },

    /**
     * Returns the root node of the elements tree.
     */
    getElementTree: function(){
        if(!this._rootElement){
            var treeInfo = this.createElementsTree();
            
            this._elements = treeInfo.elements;
            this._rootElement = treeInfo.root;
            this._maxDepth = treeInfo.maxDepth;
        }

        return this._rootElement;
    },

    /**
     * Returns the maximum depth.
     */
    getMaxDepth: function(){
        if(!this._elements){
            this.getElementTree();
        }

        return this._maxDepth;
    },

    /**
     * Creates a custom element tree.
     */
    createElementsTree: function(onlyVisible, reversed){
        var elements = [];
        var maxDepth = 0;

        // NOTE: The hierarchy need not be uniform.
        // Some leaf nodes may have depth 1, while others, depth 2.
        
        var root   = new pvc.DataElement(this),
            values = onlyVisible ? this.getVisibleValues() : this.getValues();

        if(reversed){
            // Do not to modify values
            // TODO: could avoid this - do the 'for' backwards
            values = values.slice();
            values.reverse();
        }

        for (var i = 0, L = values.length ; i < L ; i++) {
            var keys = pvc.toArray(values[i]),
                node = root;
            
            for (var k = 0, K = keys.length ; k < K ; k++){
                if(K > maxDepth){
                    maxDepth = K;
                }

                var key = keys[k];

                var child = node.childNodesByKey[key];
                if(!child){
                    // Only leaf nodes receive indexes
                    var index = k === K - 1 ? elements.length : -1;
                    child = new pvc.DataElement(this, key, node, index);
                }
                // Duplicate values are ignored
                // This happend because not all translators return distinct
                // per dimension values.
                // The crosstab translator does not check whether the provided
                // categories are unique when getCategories is called.
                // Duplicates happen, for example in Metric charts
                // (for example, see dataset 'testLDot2' in the pvMetricDots.html sample)

                node = child;
            }

            // Add the leaf node
            if(elements){
                elements.push(node);
            }
        }

        return {
            root:     root,
            maxDepth: maxDepth,
            elements: elements
        };
    },

    /**
     * Returns the nth unique value.
     */
    getValue: function(index){
        return this.getValues()[index];
    },

    /**
     * Returns the nth unique element.
     */
    getElement: function(index){
        return this.getElements()[index];
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
            this._visibleValues = pv.permute(
                            this.getValues(),
                            this.getVisibleIndexes());
        }
        
        return this._visibleValues;
    },

    /**
     * Returns the unique elements.
     */
    getVisibleElements: function(){
        if(!this._visibleElements){
            this._visibleElements = pv.permute(
                            this.getElements(),
                            this.getVisibleIndexes());
        }

        return this._visibleElements;
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
        this._visibleValues   = null;
        this._visibleIndexes  = null;
        this._visibleElements = null;
        
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
    getMinValue: function(key) {
        var min;
        this.getValues().forEach(function(value, index){
            var k = key ? key(value, index) : value;
            if(index === 0 || k < min){
                min = k;
            }
        });
        
        return min;
    },

    /** 
     * Returns the maximum value of the dimension.
     * Most suitable for "linear" dimensions -
     * works with number, string and date value types.
     */
    getMaxValue: function(key) {
        var max;
        this.getValues().forEach(function(value, index){
            var k = key ? key(value, index) : value;
            if(index === 0 || k > max){
                max = k;
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
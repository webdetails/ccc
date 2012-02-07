
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
    _visibleIndexes: null,  // cache
    _visibleValues:  null,  // cache
    _visibleElements: null, // cache
    _selectedValues:  null, // cache

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
        
        var root   = this._addElement(),
            values = onlyVisible ? this.getVisibleValues() : this.getValues();

        if(reversed){
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
                    child = this._addElement(key, node);
                }

                // Some data contains duplicates.
                // Such as in the category dimension of metric charts.
                // Try pvcMetricScatter.js
//                else if(k === K - 1)
//                {
//                    //throw new Error("Not-unique key data.");
//                }

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

    _addElement: function(key, parent){
        if(!parent){
            // Parent is a dummy root
            key = null;
        }
        
        var child = new pv.Dom.Node(key); // TODO: create subclass
        //child.nodeValue = key; // constructor does this
        child.value    = key;
        child.nodeName = key || "";
        child.childNodesByKey = {};
        child.toString = function(){ // TODO: share this function
            return this.value;
        };

        if(!parent){
            child.path     = [];
            child.absValue = null;
            child.label    = "";
            child.absLabel = "";
        } else {
            child.path     = parent.path.concat(key);
            child.absValue = pvc.join("~", parent.absValue, key);
            child.label    = "" + (this._calcLabel ? this._calcLabel(key) : key);
            child.absLabel = pvc.join(" ~ ", parent.absLabel, child.label);

            parent.appendChild(child);
            parent.childNodesByKey[key] = child;
        }

        return child;
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
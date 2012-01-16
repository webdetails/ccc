if(!Object.keys) {
	Object.keys = function(o){
		if (o !== Object(o)){
			throw new TypeError('Object.keys called on non-object');
		}
		
		var ret=[];
		for(var p in o) 
			if(Object.prototype.hasOwnProperty.call(o,p)) 
				ret.push(p);
		return ret;
	};
}

var pvc = {
  debug: false
};

// Begin private scope
(function(){
    
/**
 *  Utility function for logging messages to the console
 */
pvc.log = function(m){

    if (typeof console != "undefined" && pvc.debug){
        console.log("[pvChart]: " + m);
    }
};

/**
 * Evaluates x if it's a function or returns the value otherwise
 */
pvc.ev = function(x){
    return typeof x == "function"?x():x;
};

pvc.sumOrSet = function(v1,v2){
    return typeof v1 == "undefined"?v2:v1+v2;
};

pvc.nonEmpty = function(d){
    return d != null;
};

pvc.number = function(d, dv){
    var v = parseFloat(d);
    return isNaN(d) ? (dv || 0) : v;
};

pvc.padMatrixWithZeros = function(d){
    return d.map(function(v){
        return v.map(function(a){
            return typeof a == "undefined"?0:a;
        });
    });
};

pvc.padArrayWithZeros = function(a){
    return a.map(function(d){
        return d == null ? 0 : d;
    });
};

pvc.cloneMatrix = function(m){
    return m.map(function(d){
        return d.slice();
    });
};

/**
 *ex.: arrayStartsWith(['EMEA','UK','London'], ['EMEA']) -> true
 *     arrayStartsWith(a, a) -> true
 **/
pvc.arrayStartsWith = function(array, base){
    if(array.length < base.length) { 
		return false; 
	}
    
    for(var i=0; i<base.length;i++){
        if(base[i] != array[i]) {
            return false;
        }
    }
    
	return true;
};

/**
 * Equals for two arrays
 * func - needed if not flat array of comparables
 **/
pvc.arrayEquals = function(array1, array2, func)
{
  if(array1 == null){return array2 == null;}
  
  var useFunc = typeof(func) == 'function';
  
  for(var i=0;i<array1.length;i++)
  {
    if(useFunc){
        if(!func(array1[i],array2[i])){
            return false;
        }
    }
    else if(array1[i]!=array2[i]){
        return false;   
    }
  }
  return true;
};

/**
 * Converts something to an array if it is not one already
 *  an if it is not equal (==) to null.
*/
pvc.toArray = function(thing){
	return (thing instanceof Array) ? thing : ((thing != null) ? [thing] : null);
};

var arraySlice = pvc.arraySlice = Array.prototype.slice;

/**
 * Creates a color scheme based on the specified colors.
 * The default color scheme is "pv.Colors.category10", 
 * and is returned when null or an empty array is specified.
 */
pvc.createColorScheme = function(colors){
	if (colors == null || colors.length == 0){
		return pv.Colors.category10;
	}
	
	colors = pvc.toArray(colors);
	
	return function() {
		var scale = pv.colors(colors);
		scale.domain.apply(scale, arguments);
		return scale;
	};
};

pvc.removeTipsyLegends = function(){
    try {
        $('.tipsy').remove();
    } catch(e) {
        // Do nothing
    }
};

pvc.compareNatural = function(a, b){
	return (a < b) ? -1 : ((a > b) ? 1 : 0);
};

if(this.pv){
    /* Protovis Z-Order support */
    
    // Default values
    pv.Mark.prototype._zOrder = 0;
    
    pv.Panel.prototype._hasZOrderChild = false;
    pv.Panel.prototype._needChildSort  = false;
    
    pv.Mark.prototype.zOrder = function(zOrder) {
        if(!arguments.length){
            return this._zOrder;
        }
        
        if(this._zOrder !== zOrder){
            this._zOrder = zOrder;
            
            if(this.parent){
                this.parent._hasZOrderChild = 
                this.parent._needChildSort  = true;
            }
        }
        
        return this;
    };
    
    // Copy normal methods' version
    var markRender = pv.Mark.prototype.render,
        panelAdd   = pv.Panel.prototype.add;
    
    pv.Panel.prototype.add = function(){
        this._needChildSort = this._needChildSort || this._hasZOrderChild;
        
        return panelAdd.apply(this, arraySlice.call(arguments));
    };
    
    pv.Mark.prototype.render = function(){
        // ensure zOrder is up to date
        sortChildren.call(this);
        markRender.apply(this, arraySlice.call(arguments));
    };
    
    function sortChildren(){
        // Sort children by their Z-Order
        var children = this.children, L;
        if(children && (L = children.length)){
            var needChildSort = this._needChildSort;
            if(needChildSort){
                children.sort(function(m1, m2){
                    return pvc.compareNatural(m1._zOrder, m2._zOrder);
                });
                
                this._needChildSort = false;
            }
            
            // Fix childIndex and apply recursively
            for(var i = 0 ; i < L ; i++){
                var child = children[i]; 
                if(needChildSort) { 
                    child.childIndex = i; 
                }
                
                if(child instanceof pv.Panel){
                    sortChildren.call(child);
                }
            }
        }
    }
}

})(); // End private scope

/**
 *
 * Implements filter property if not implemented yet
 *
 */
if (!Array.prototype.filter){
    Array.prototype.filter = function(fun, thisp)
    {
        var len = this.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        var res = [];
        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
        {
            if (i in this)
            {
                var val = this[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, this))
                    res.push(val);
            }
        }

        return res;
    };
}


/**
 *
 * Implements support for svg detection
 *
 **/
(function($){
    $.support.svg = $.support.svg || document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
})(jQuery);
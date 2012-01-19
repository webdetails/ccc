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

pvc.get = function(o, p, dv){
    var v;
    return o && (v = o[p]) != null ? v : dv; 
};

pvc.number = function(d, dv){
    var v = parseFloat(d);
    return isNaN(d) ? (dv || 0) : v;
};

pvc.nullTo = function(v, dv){
    return v != null ? v : dv;
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

/* TICKS */
/**
 * An alternative implementation of QuantitativeScale#ticks
 * that ensures that:
 * (i) the returned ticks include the min. and max. domain values, 
 * (ii) the scale's domain is extended, 
 *      when the calculated ticks so demand and
 * (iii) the resulting ticks are cached.
 * <br/>
 * Only scales with numeric domains are treated specially.
 * The 'syncScale', when not null and falsy, 
 * makes every case be treated solely by the protovis implementation.
 * <br /> 
 * In any case, the default of desiredTickCount is 5
 * (which is different from that of the protovis implementation).
 */
pvc.scaleTicks = function(scale, syncScale, desiredTickCount, forceCalc){
    /* This implementation uses PROTOVIS's 
     * implementation of QuantitativeScale#ticks
     * as a way to not to deal with date scales
     * and to ensure that its internal field 'tickFormat'
     * is updated.
     * 
     * For the cases when the ticks do not fully enclose the domain,
     * this implementation copies & adapts PROTOVIS's
     * implementation, and, unfortunately, 
     * ends up doing the same work twice.
     * 
     * In either case, if the ticks domain is !=
     * from the scale's domain the later is updated to the former.
     */
    if(!desiredTickCount){
        desiredTickCount = 5;
    }
    
    var ticks,
        ticksCacheKey = syncScale + "|" + desiredTickCount;
    if(!forceCalc && 
       scale._ticksCache && 
       (ticks = scale._ticksCache[ticksCacheKey])){
        return ticks;
    }
    
    // Call PROTOVIS implementation
    var ticks = scale.ticks(desiredTickCount);
    
    if(syncScale != null && !syncScale){
        return ticks;
    }
    
    var T = ticks.length;
    
    // Treat only well-formed, finite, numeric domains
    if(T >= 2 && !(ticks[0] instanceof Date)){
        // Assume numeric domain
        
        // Check if scale's domain is "included" in the ticks domain
        var doma = scale.domain(),  // "doma/in"
            domaBeg = doma[0],
            domaEnd = doma[doma.length - 1],
            
            // Is is an ascending or descending scale?
            // Assuming the scale is monotonic...
            domaAsc = domaBeg < domaEnd,
            
            domaMin = domaAsc ? domaBeg : domaEnd,
            domaMax = domaAsc ? domaEnd : domaBeg,
            
            tickMin = domaAsc ? ticks[0]     : ticks[T - 1],
            tickMax = domaAsc ? ticks[T - 1] : ticks[0];
        
        if((tickMin > domaMin) || (domaMax > tickMax)){
            // Copied & Adapted PROTOVIS algorithm
            // To recalculate ticks that include the scale's domain
            // at both ends.
            
            var domaSize  = domaMax - domaMin,
                // 1, 10, 100, 1000, ...
                tickStep  = pv.logFloor(domaSize / desiredTickCount, 10),
                tickCount = (domaSize / tickStep);
                err = desiredTickCount / tickCount;
            
            if      (err <= .15) tickStep *= 10;
            else if (err <= .35) tickStep *= 5;
            else if (err <= .75) tickStep *= 2;
            
            // NOTE: this is the "BIG" change to
            //  PROTOVIS's implementation:
            // ceil  -> floor
            // floor -> ceil
            tickMin = Math.floor(domaMin / tickStep) * tickStep;
            tickMax = Math.ceil (domaMax / tickStep) * tickStep;
            
            // Overwrite PROTOVIS ticks
            ticks = pv.range(tickMin, tickMax + tickStep, tickStep);
            if(!domaAsc){
                ticks = ticks.reverse();
            }
        }
        
        if(tickMin < domaMin || domaMax < tickMax){
            /* Update the scale to reflect the new domain */
            if(doma.length !== 2){
                pvc.log("Ticks forced extending a linear scale's domain, " +
                        "but it is not possible to update the domain because " + 
                        "it has '" +  doma.length + "' elements.");
            } else {
                pvc.log("Ticks forced extending a linear scale's domain from [" +
                        [domaMin, domaMax] + "] to [" +
                        [tickMin, tickMax] + "]");
                
                scale.domain(tickMin, tickMax);
            }
        } // else === && ===
    }
    
    // Cache ticks
    (scale._ticksCache || (scale._ticksCache = {}))[ticksCacheKey] = ticks;
    
    return ticks;
};

pvc.roundScaleDomain = function(scale, roundMode, desiredTickCount){
    // Domain rounding
    if(roundMode){
        switch(roundMode){
            case 'none': 
                break;
                
            case 'nice':
                scale.nice();
                break;
            
            case 'tick':
                scale.nice();
                pvc.scaleTicks(scale, true, desiredTickCount);
                break;
                
            default:
                pvc.log("Invalid 'roundMode' argument: '" + roundMode + "'.");
        }
    }
};

/* PROPERTIES */
pv.Mark.prototype.getStaticPropertyValue = function(name) {
    var properties = this.$properties;
    for (var i = 0, L = properties.length; i < L; i++) {
        var property = properties[i]; 
        if (property.name == name) {
            return property.value;
        }
    }
    //return undefined;
};
  
/* ANCHORS */
/*
 * name = left | right | top | bottom
 * 
 * */
pv.Mark.prototype.addMargin = function(name, margin) {
    if(margin != 0){
        var staticValue = pvc.nullTo(this.getStaticPropertyValue(name), 0); 
            fMeasure    = pv.functor(staticValue);
        
        this[name](function(){
            return margin + fMeasure.apply(this, arraySlice.call(arguments));
        });
    }
    
    return this;
};

/*
 * margins = {
 *      all:
 *      left:
 *      right:
 *      top:
 *      bottom:
 * }
 * */
pv.Mark.prototype.addMargins = function(margins) {
    var all = pvc.get(margins, 'all', 0);
    
    this.addMargin('left',   pvc.get(margins, 'left',   all));
    this.addMargin('right',  pvc.get(margins, 'right',  all));
    this.addMargin('top',    pvc.get(margins, 'top',    all));
    this.addMargin('bottom', pvc.get(margins, 'bottom', all));
    
    return this;
};

/* BOUNDS */
pv.Mark.prototype.toScreenTransform = function(){
    var t = pv.Transform.identity;
    
    var parent = this.parent;
    if(parent){
        do {
            t = t.translate(parent.left(), parent.top())
                 .times(parent.transform());
        } while ((parent = parent.parent));
    }
    
    return t;
};

pv.Transform.prototype.transformHPosition = function(left){
    return this.x + (this.k * left);
};

pv.Transform.prototype.transformVPosition = function(top){
    return this.y + (this.k * top);
};

// width / height
pv.Transform.prototype.transformLength = function(length){
    return this.k * length;
};

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
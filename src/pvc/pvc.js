
// ECMAScript 5 shim
if(!Object.keys) {
    Object.keys = function(o){
        if (o !== Object(o)){
            throw new TypeError('Object.keys called on non-object');
        }

        var ret = [];
        for(var p in o){
            if(Object.prototype.hasOwnProperty.call(o,p)){
                ret.push(p);
            }
        }
        
        return ret;
    };
}

/**
 * Implements filter property if not implemented yet
 */
if (!Array.prototype.filter){
    Array.prototype.filter = function(fun, ctx)
    {
        var len = this.length >>> 0;
        if (typeof fun != "function"){
            throw new TypeError();
        }
        
        var res = [];
        for (var i = 0; i < len; i++){
            if (i in this){
                var val = this[i]; // in case fun mutates this
                if (fun.call(ctx, val, i, this))
                    res.push(val);
            }
        }

        return res;
    };
}

// ----------------------------

var pvc = {
    debug: false
};

// Begin private scope
(function(){

var arraySlice = pvc.arraySlice = Array.prototype.slice;

/**
 *  Utility function for logging messages to the console
 */
pvc.log = function(m){

    if (pvc.debug && typeof console != "undefined"){
        console.log("[pvChart]: " + m);
    }
};

pvc.logError = function(m){
    if (typeof console != "undefined"){
        console.log("[pvChart ERROR]: " + m);
    } else {
        throw new Error("[pvChart ERROR]: " + m);
    }
};

/**
 * Evaluates x if it's a function or returns the value otherwise
 */
pvc.ev = function(x){
    return typeof x == "function" ? x(): x;
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

// null or undefined to 'dv''
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
 * ex.: arrayStartsWith(['EMEA','UK','London'], ['EMEA']) -> true
 *      arrayStartsWith(a, a) -> true
 **/
pvc.arrayStartsWith = function(array, base){
    if(array.length < base.length) { 
        return false;
    }

    for(var i = 0; i < base.length ; i++){
        if(base[i] != array[i]) {
            return false;
        }
    }

    return true;
};

/**
 * Calls function <i>fun</i> with context <i>ctx</i>
 * for every own property of <i>o</i>.
 * Function <i>fun</i> is called with arguments:
 * value, property, object.
 */
pvc.forEachOwn = function(o, fun, ctx){
    if(o){
        for(var p in o){
            if(o.hasOwnProperty(p)){
                fun.call(ctx, o[p], p, o);
            }
        }
    }
};

pvc.mergeOwn = function(to, from){
    pvc.forEachOwn(from, function(v ,p){
        to[p] = v;
    });
    return to;
};

/*
pvc.forEachRange = function(min, max, fun, ctx){
    for(var i = min ; i < max ; i++){
        fun.call(ctx, i);
    }
};


pvc.arrayInsertMany = function(target, index, source){
    // TODO: is there a better way: without copying source?
    target.splice.apply(target, [index, 0].concat(other));
    return target;
};

pvc.arrayAppend = function(target, source){
    for(var i = 0, L = source.length, T = target.length ; i < L ; i++){
        target[T + i] = source[i];
    }
    return target;
};
*/

// Adapted from pv.range
pvc.Range = function(start, stop, step){
    if (arguments.length == 1) {
        stop  = start;
        start = 0;
    }
  
    if (step == null) {
        step = 1;
    }
    
    if ((stop - start) / step == Infinity) {
        throw new Error("range must be finite");
    }
  
    this.stop  = stop;//-= (stop - start) * 1e-10; // floating point precision!
    this.start = start;
    this.step  = step;
};

pvc.Range.prototype.forEach = function(fun, ctx){
    var i = 0, j;
    if (this.step < 0) {
        while((j = this.start + this.step * i++) > this.stop) {
            fun.call(ctx, j);
        }
    } else {
        while((j = this.start + this.step * i++) < this.stop) {
            fun.call(ctx, j);
        }
    }
};

/**
 * Equals for two arrays
 * func - needed if not flat array of comparables
 **/
pvc.arrayEquals = function(array1, array2, func){
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
        var scale = pv.colors(colors); // creates a color scale with a defined range
	scale.domain.apply(scale, arguments); // defines the domain of the color scale
	return scale;
    };
};

//convert to greyscale using YCbCr luminance conv
pvc.toGrayScale = function(color){
    var avg = Math.round( 0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
    //var avg = Math.round( (color.r + color.g + color.b)/3);
    return pv.rgb(avg,avg,avg,0.6).brighter();
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

pvc.createDateComparer = function(parser, key){
    if(!key){
        key = pv.identity;
    }
    
    return function(a, b){
        return parser.parse(key(a)) - parser.parse(key(b));
    };
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

// Copy original methods
var markRender = pv.Mark.prototype.render,
    panelAdd   = pv.Panel.prototype.add;

// @replace
pv.Panel.prototype.add = function(){
    this._needChildSort = this._needChildSort || this._hasZOrderChild;
    
    return panelAdd.apply(this, arraySlice.call(arguments));
};

// @replace
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
    ticks = scale.ticks(desiredTickCount);
    
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
                        "it has '" +  doma.length + "' element(s).");
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
/**
 * name = left | right | top | bottom
 * */
pv.Mark.prototype.addMargin = function(name, margin) {
    if(margin != 0){
        var staticValue = pvc.nullTo(this.getStaticPropertyValue(name), 0),
            fMeasure    = pv.functor(staticValue);
        
        this[name](function(){
            return margin + fMeasure.apply(this, arraySlice.call(arguments));
        });
    }
    
    return this;
};

/**
 * margins = {
 *      all:
 *      left:
 *      right:
 *      top:
 *      bottom:
 * }
 */
pv.Mark.prototype.addMargins = function(margins) {
    var all = pvc.get(margins, 'all', 0);
    
    this.addMargin('left',   pvc.get(margins, 'left',   all));
    this.addMargin('right',  pvc.get(margins, 'right',  all));
    this.addMargin('top',    pvc.get(margins, 'top',    all));
    this.addMargin('bottom', pvc.get(margins, 'bottom', all));
    
    return this;
};

/* SCENE */
/**
 * Iterates through all instances that
 * this mark has rendered.
 */
pv.Mark.prototype.forEachInstances = function(fun, ctx){
    var mark = this,
        indexes = [],
        instances = [];

    /* Go up to the root and register our way back.
     * The root mark never "looses" its scene.
     */
    while(mark.parent){
        indexes.unshift(mark.childIndex);
        mark = mark.parent;
    }

    // mark != null

    // root scene exists if rendered at least once
    var scene = mark.scene;
    if(scene){
        var L = indexes.length;

        function collectRecursive(scene, level, t){
            if(level === L){
                for(var i = 0, I = scene.length ; i < I ; i++){
                    fun.call(ctx, scene[i], t);
                }
            } else {
                var childIndex = indexes[level];
                for(var index = 0, D = scene.length ; index < D ; index++){
                    var instance = scene[index],
                        childScene = instance.children[childIndex];

                    // Some nodes might have not been rendered?
                    if(childScene){
                        var toChild = t.times(instance.transform)
                                       .translate(instance.left, instance.top);

                        collectRecursive(childScene, level + 1, toChild);
                    }
                }
            }
        }

        collectRecursive(scene, 0, pv.Transform.identity);
    }

    return instances;
};

/* BOUNDS */
pv.Mark.prototype.toScreenTransform = function(){
    var t = pv.Transform.identity;
    
    var parent = this.parent; // TODO : this.properties.transform ? this : this.parent
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
 * Equal to pv.Behavior.select but doesn't necessarily
 * force redraw of component it's in on mousemove, and sends event info
 * (default behavior matches pv.Behavior.select())
 * @param {boolean} autoRefresh refresh parent mark automatically
 * @param {pv.Mark} mark
 * @return {function mousedown
 **/
pv.Behavior.selector = function(autoRefresh, mark) {
  var scene, // scene context
      index, // scene context
      r, // region being selected
      m1, // initial mouse position
      redrawThis = (arguments.length > 0)?
                    autoRefresh : true; //redraw mark - default: same as pv.Behavior.select
    
  /** @private */
  function mousedown(d, e) {
    if(mark == null){
        index = this.index;
        scene = this.scene;
    } else {
        index = mark.index;
        scene = mark.scene;
    }
    
    m1 = this.mouse();
    
    r = d;
    r.x = m1.x;
    r.y = m1.y;
    r.dx = r.dy = 0;
    pv.Mark.dispatch("selectstart", scene, index, e);
  }

  /** @private */
  function mousemove(e) {
    if (!scene) return;
    scene.mark.context(scene, index, function() {
        // this === scene.mark
        var m2 = this.mouse();

        r.x = Math.max(0, Math.min(m1.x, m2.x));
        r.y = Math.max(0, Math.min(m1.y, m2.y));

        r.dx = Math.min(this.width(),  Math.max(m2.x, m1.x)) - r.x;
        r.dy = Math.min(this.height(), Math.max(m2.y, m1.y)) - r.y;

        if(redrawThis){
            this.render();
        }
      });

    pv.Mark.dispatch("select", scene, index, e);
  }

  /** @private */
  function mouseup(e) {
    if (!scene) return;
    pv.Mark.dispatch("selectend", scene, index, e);
    scene = null;
  }

  pv.listen(window, "mousemove", mousemove);
  pv.listen(window, "mouseup", mouseup);
  return mousedown;
};


/**
 *
 * Implements support for svg detection
 *
 **/
(function($){
    $.support.svg = $.support.svg || 
        document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
})(jQuery);
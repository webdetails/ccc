
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
    Array.prototype.filter = function(fun, ctx){
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

if(!Object.create){
    Object.create = (function(){

        function dummyKlass(){}
        var dummyProto = dummyKlass.prototype;

        function create(baseProto){
            dummyKlass.prototype = baseProto || {};
            var instance = new dummyKlass();
            dummyKlass.prototype = dummyProto;
            return instance;
        }

        return create;
    }());
}

// Basic JSON shim
if(!this.JSON){
    this.JSON = {};
}
if(!this.JSON.stringify){
    this.JSON.stringify = function(t){
        return '' + t;
    };
}

// ----------------------------

var pvc = {
    debug: false
};

// Begin private scope
(function(){

// goldenRatio proportion
// ~61.8% ~ 38.2%
pvc.goldenRatio = (1 + Math.sqrt(5)) / 2;

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

pvc.fail = function(failedMessage){
    throw new Error(failedMessage);
};

/**
 * Evaluates x if it's a function or returns the value otherwise
 */
pvc.ev = function(x){
    return typeof x == "function" ? x(): x;
};

/**
 * Sums two numbers.
 * 
 * If v1 is null or undefined, v2 is returned.
 * If v2 is null or undefined, v1 is returned.
 * Else the sum of the two is returned.
 */
pvc.sum = function(v1, v2){
    return v1 == null ? 
            v2 :
            (v1 == null ? v1 : (v1 + v2));
};

pvc.nonEmpty = function(d){
    return d != null;
};

pvc.get = function(o, p, dv){
    var v;
    return o && (v = o[p]) != null ? v : dv; 
};

pvc.scope = function(scopeFun, ctx){
    return scopeFun.call(ctx);
};

function asNativeObject(v){
        return v && typeof(v) === 'object' && v.constructor === Object ?
                v :
                undefined;
}

function asObject(v){
    return v && typeof(v) === 'object' ? v : undefined;
}

pvc.mixin = pvc.scope(function(){

    function pvcMixinRecursive(instance, mixin){
        for(var p in mixin){
            var vMixin = mixin[p];
            if(vMixin !== undefined){
                var oMixin,
                    oTo = asNativeObject(instance[p]);
                
                if(oTo){
                    oMixin = asObject(vMixin);
                    if(oMixin){
                        pvcMixinRecursive(oTo, oMixin);
                    }
                } else {
                    oMixin = asNativeObject(vMixin);
                    if(oMixin){
                        vMixin = Object.create(oMixin);
                    }
                    
                    instance[p] = vMixin;
                }
            }
        }
    }

    function pvcMixin(instance/*mixin1, mixin2, ...*/){
        for(var i = 1, L = arguments.length ; i < L ; i++){
            var mixin = arguments[i];
            if(mixin){
                mixin = asObject(mixin.prototype || mixin);
                if(mixin){
                    pvcMixinRecursive(instance, mixin);
                }
            }
        }

        return instance;
    }

    return pvcMixin;
});

// Creates an object whose prototype is the specified object.
pvc.create = pvc.scope(function(){

    function pvcCreateRecursive(instance){
        for(var p in instance){
            var vObj = asNativeObject(instance[p]);
            if(vObj){
                pvcCreateRecursive( (instance[p] = Object.create(vObj)) );
            }
        }
    }
    
    function pvcCreate(/* [deep, ] baseProto, mixin1, mixin2, ...*/){
        var mixins = arraySlice.call(arguments),
            deep = true,
            baseProto = mixins.shift();
        
        if(typeof(baseProto) === 'boolean'){
            deep = baseProto;
            baseProto = mixins.shift();
        }
        
        var instance = Object.create(baseProto);
        if(deep){
            pvcCreateRecursive(instance);
        }

        // NOTE: 
        if(mixins.length > 0){
            mixins.unshift(instance);
            pvc.mixin.apply(pvc, mixins);
        }

        return instance;
    }

    return pvcCreate;
});

pvc.define = pvc.scope(function(){

    function setBase(base){
        var proto = this.prototype = Object.create(base.prototype);
        proto.constructor = this;
        return this;
    }

    function mixin(/*mixin1, mixin2, ...*/){
        pvc.mixin.apply(pvc, pvc.arrayAppend([this.prototype], arguments));
        return this;
    }

    function defineIn(name, what){
        var namespace,
            parts = name.split('.');
        
        if(parts.length > 1){
            name = parts.pop();
            namespace = parts.join('.');
        }

        getNamespace(namespace)[name] = what;
    }

    return function(name, klass, base){
        klass.extend = mixin;
        klass.mixin  = mixin;

        if(base){
            setBase.call(klass, base);
        }
        klass.base = base || null;

        if(name){
            defineIn(name, klass);
            klass.name = name;
        }

        return klass;
    };
});

var global = this,
    namespaceStack = [],
    currentNamespace = global;

function getNamespace(name, base){
    var current = base || currentNamespace;
    if(name){
        var parts = name.split('.');
        for(var i = 0; i < parts.length ; i++){
            var part = parts[i];
            current = current[part] || (current[part] = {});
        }
    }

    return current;
}

pvc.namespace = function(name, definition){
    var namespace = getNamespace(name);
    if(definition){
        namespaceStack.push(currentNamespace);
        try{
            definition(namespace);
        } finally {
            currentNamespace = namespaceStack.pop();
        }
    }
    
    return namespace;
};

pvc.number = function(d, dv){
    var v = parseFloat(d);
    return isNaN(v) ? (dv || 0) : v;
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
 * Joins arguments other than null, undefined and ""
 * using the specified separator and their string representation.
 */
pvc.join = function(sep){
    var args = [],
        a = arguments;
    for(var i = 1, L = a.length ; i < L ; i++){
        var v = a[i];
        if(v != null && v !== ""){
            args.push("" + v);
        }
    }

    return args.join(sep);
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
    pvc.forEachOwn(from, function(v, p){
        to[p] = v;
    });
    return to;
};
/*
function merge(to, from){
    if(!to) {
        to = {};
    }

    if(from){
        for(var p in from){
            var vFrom = from[p];
            if(vFrom !== undefined){
                var oFrom = asObject(vFrom),
                    vTo   = to[p];

                if(oFrom){
                    vTo = merge(asObject(vTo), oFrom);
                } else if(vFrom !== undefined) {
                    vTo = vFrom;
                }

                to[p] = vTo;
            }
        }
    }

    return to;
}

pvc.merge = merge;
*/
// For treating an object as dictionary
// without danger of hasOwnProperty having been overriden.
var objectHasOwn = Object.prototype.hasOwnProperty;
pvc.hasOwn = function(o, p){
    return !!o && objectHasOwn.call(o, p);
};

pvc.mergeDefaults = function(to, defaults, from){
    pvc.forEachOwn(defaults, function(dv, p){
        var v;
        to[p] = (from && (v = from[p]) !== undefined) ? v : dv;
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
*/

pvc.arrayAppend = function(target, source, start){
    if(start == null){
        start = 0;
    }

    for(var i = 0, L = source.length, T = target.length ; i < L ; i++){
        target[T + i] = source[start + i];
    }
    return target;
};


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

pvc.Range.prototype.map = function(fun, ctx){
    var result = [];
    
    this.forEach(function(j){
        result.push(fun.call(ctx, j));
    });
    
    return result;
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
 * Creates an array of the specified length,
 * and, optionally, initializes it with the specified default value.
*/
pvc.newArray = function(len, dv){
    var a = new Array(len);
    if(dv !== undefined){
        for(var i = 0 ; i < len ; i++){
            a[i] = dv;
        }
    }
    return a;
};

/**
 * Creates a color scheme based on the specified colors.
 * The default color scheme is "pv.Colors.category10", 
 * and is returned when null or an empty array is specified.
*/

// variable to represent a default color scheme
//   (Added by CvK  febr. 2012)
pvc.defaultColorScheme = null;

pvc.createColorScheme = function(colors){
    if (colors == null || colors.length == 0){
        var cs = (pvc.defaultColorScheme === null) ?
            pv.Colors.category10 :pvc.defaultColorScheme;
        return cs;
    }

    colors = pvc.toArray(colors);

    return function() {
        var scale = pv.colors(colors); // creates a color scale with a defined range
        scale.domain.apply(scale, arguments); // defines the domain of the color scale
        return scale;
    };
};

/****
 * Install a default colorscheme. The parameter should be an array containing
 * approximately 10 colors.
 * If you pass colors==null  it will remove the default-color scheme and
 * use orginial default-colors.
 *    (Added by CvK  febr. 2012)
 ****/
pvc.setDefaultColorScheme = function(colors) {
   pvc.defaultColorScheme = (colors == null) ?
         null : pvc.createColorScheme(colors);
   return;
};



//convert to greyscale using YCbCr luminance conv
pvc.toGrayScale = function(color, alpha){
    var avg = Math.round( 0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
    //var avg = Math.round( (color.r + color.g + color.b)/3);
    return pv.rgb(avg, avg, avg, alpha != null ? alpha : 0.6).brighter();
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
    var mark = panelAdd.apply(this, arraySlice.call(arguments));

    // Detect new child with non-zero ZOrder
    if(!this._hasZOrderChild && mark._zOrder !== 0){
        this._hasZOrderChild = this._needChildSort  = true;
    }

    return mark;
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

/* Local Properties */
/**
 * Adapted from pv.Layout#property.
 * Defines a local property with the specified name and cast.
 * Note that although the property method is only defined locally,
 * the cast function is global,
 * which is necessary since properties are inherited!
 *
 * @param {string} name the property name.
 * @param {function} [cast] the cast function for this property.
 */
pv.Mark.prototype.localProperty = function(name, cast) {
  if (!this.hasOwnProperty("properties")) {
    this.properties = pv.extend(this.properties);
  }
  this.properties[name] = true;
  this.propertyMethod(name, false, pv.Mark.cast[name] = cast);
  return this;
};

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
                tickCount = (domaSize / tickStep),
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
/**
 * Returns the value of a property as specified upon definition,
 * and, thus, without evaluation.
 */
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

pv.Mark.prototype.intercept = function(prop, interceptor, extValue){
    if(extValue !== undefined){
        this[prop](extValue);
    }

    extValue = this.getStaticPropertyValue(prop);
        
    // Let undefined pass through as a sign of not-intercepted
    // A 'null' value is considered as an existing property value.
    if(extValue !== undefined){
        extValue = pv.functor(extValue);
    }
    
    function interceptProp(){
        var args  = pvc.arraySlice.call(arguments);
        return interceptor.call(this, extValue, args);
    }

    this[prop](interceptProp);

    (this._intercepted || (this._intercepted = {}))[prop] = true;

    return this;
};

pv.Mark.prototype.lock = function(prop, value){
    if(value !== undefined){
        this[prop](value);
    }

    (this._locked || (this._locked = {}))[prop] = true;
    
    return this;
};


pv.Mark.prototype.isIntercepted = function(prop){
    return this._intercepted && this._intercepted[prop];
};

pv.Mark.prototype.isLocked = function(prop){
    return this._locked && this._locked[prop];
};

/**
 * Function used to propagate a datum received, as a singleton list.
 * Use this to prevent re-evaluation of inherited data property functions!
 */
pv.dataIdentity = function(datum){
    return [datum];
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
pv.Mark.prototype.forEachInstance = function(fun, ctx){
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

// -----------

pv.Mark.prototype.getInstanceShape = function(instance){
    return new Rect(
            instance.left,
            instance.top,
            instance.width,
            instance.height);
};

pv.Dot.prototype.getInstanceShape = function(instance){
    var radius = instance.shapeRadius,
        cx = instance.left,
        cy = instance.top;

    // TODO: square and diamond break when angle is used
    switch(instance.shape){
        case 'diamond':
            radius *= Math.SQRT2;
            // NOTE fall through
        case 'square':
        case 'cross':
            return new Rect(
                cx - radius,
                cy - radius,
                2*radius,
                2*radius);
    }

    // 'circle' included
    return new Circle(cx, cy, radius);
};

pv.Area.prototype.getInstanceShape =
pv.Line.prototype.getInstanceShape = function(instance, nextInstance){
    return new Line(instance.left, instance.top, nextInstance.left, nextInstance.top);
};


// --------------------
function Shape(){}

pvc.define('pvc.Shape', Shape).mixin({
    transform: function(t){
        return this.clone().apply(t);
    }

    // clone
    // intersectsRect
});

// --------------------

function Rect(x, y, dx, dy){
    this.set(x, y, dx, dy);
}

pvc.define('pvc.Rect', Rect, Shape).mixin({
    set: function(x, y, dx, dy){
        this.x  = x  || 0;
        this.y  = y  || 0;
        this.dx = dx || 0;
        this.dy = dy || 0;
        this.calc();
    },

    calc: function(){
        this.x2  = this.x + this.dx;
        this.y2  = this.y + this.dy;
    },

    clone: function(){
        return new Rect(this.x, this.y, this.dx, this.dy);
    },

    apply: function(t){
        this.x  = t.transformHPosition(this.x);
        this.y  = t.transformVPosition(this.y);
        this.dx = t.transformLength(this.dx);
        this.dy = t.transformLength(this.dy);
        this.calc();
        return this;
    },

    intersectsRect: function(rect){
//        pvc.log("[" + [this.x, this.x2, this.y, this.y2] + "]~" +
//                "[" + [rect.x, rect.x2, rect.y, rect.y2] + "]");

        // rect is not trusted to be normalized...(line...)
        var minX = Math.min(rect.x, rect.x2),
            maxX = Math.max(rect.x, rect.x2),
            minY = Math.min(rect.y, rect.y2),
            maxY = Math.max(rect.y, rect.y2);

        return rect &&
                // Some intersection on X
                (this.x2 > minX) &&
                (this.x  < maxX) &&
                // Some intersection on Y
                (this.y2 > minY ) &&
                (this.y  < maxY);
    },

    getSides: function(){
        var x  = Math.min(this.x, this.x2),
            y  = Math.min(this.y, this.y2),
            x2 = Math.max(this.x, this.x2),
            y2 = Math.max(this.y, this.y2);

        /*
         *    x,y    A
         *     * ------- *
         *  D  |         |  B
         *     |         |
         *     * --------*
         *              x2,y2
         *          C
         */
        if(!this._sides){
            this._sides = [
                //x, y, x2, y2
                new Line(x,  y,  x2, y),
                new Line(x2, y,  x2, y2),
                new Line(x,  y2, x2, y2),
                new Line(x,  y,  x,  y2)
            ];
        }

        return this._sides;
    }
});

// ------

function Circle(x, y, radius){
    this.x = x || 0;
    this.y = y || 0;
    this.radius = radius || 0;
}

pvc.define('pvc.Circle', Circle, Shape).mixin({
    clone: function(){
        return new Circle(this.x, this.y, this.radius);
    },

    apply: function(t){
        this.x = t.transformHPosition(this.x);
        this.y = t.transformVPosition(this.y);
        this.radius = t.transformLength(this.radius);
        return this;
    },

    intersectsRect: function(rect){
        // Taken from http://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
        var dx2 = rect.dx / 2,
            dy2 = rect.dy / 2;

        var circleDistX = Math.abs(this.x - rect.x - dx2),
            circleDistY = Math.abs(this.y - rect.y - dy2);

        if ((circleDistX > dx2 + this.radius) ||
            (circleDistY > dy2 + this.radius)) {
            return false;
        }

        if (circleDistX <= dx2 || circleDistY <= dy2) {
            return true;
        }

        var sqCornerDistance = Math.pow(circleDistX - dx2, 2) +
                            Math.pow(circleDistY - dy2, 2);

        return sqCornerDistance <= (this.radius * this.radius);
    }
});

// -----

function Line(x, y, x2, y2){
    this.x  = x  || 0;
    this.y  = y  || 0;
    this.x2 = x2 || 0;
    this.y2 = y2 || 0;
}

pvc.define('pvc.Line', Line, Shape).mixin({
    clone: function(){
        return new pvc.Line(this.x, this.y, this.x2, this,x2);
    },

    apply: function(t){
        this.x  = t.transformHPosition(this.x );
        this.y  = t.transformVPosition(this.y );
        this.x2 = t.transformHPosition(this.x2);
        this.y2 = t.transformVPosition(this.y2);
        return this;
    },

    intersectsRect: function(rect){
        if(!rect) {
            return false;
        }
        var sides = rect.getSides();
        for(var i = 0 ; i < 4 ; i++){
            if(this.intersectsLine(sides[i])){
                return true;
            }
        }

        return false;
    },

    intersectsLine: function(b){
        // See: http://local.wasp.uwa.edu.au/~pbourke/geometry/lineline2d/
        var a = this,

            x21 = a.x2 - a.x,
            y21 = a.y2 - a.y,

            x43 = b.x2 - b.x,
            y43 = b.y2 - b.y,

            denom = y43 * x21 - x43 * y21;

        if(denom === 0){
            // Parallel lines: no intersection
            return false;
        }

        var y13 = a.y - b.y,
            x13 = a.x - b.x,
            numa = (x43 * y13 - y43 * x13),
            numb = (x21 * y13 - y21 * x13);

        if(denom === 0){
            // Both 0  => coincident
            // Only denom 0 => parallel, but not coincident
            return (numa === 0) && (numb === 0);
        }

        var ua = numa / denom;
        if(ua < 0 || ua > 1){
            // Intersection not within segment a
            return false;
        }

        var ub = numb / denom;
        if(ub < 0 || ub > 1){
            // Intersection not within segment b
            return false;
        }

        return true;
    }
});

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

    scene.mark.selectionRect = new pvc.Rect(m1.x, m1.y);
    
    pv.Mark.dispatch("selectstart", scene, index, e);
  }

  /** @private */
  function mousemove(e) {
    if (!scene) return;
    scene.mark.context(scene, index, function() {
        // this === scene.mark
        var m2 = this.mouse(),
            x = Math.max(0, Math.min(m1.x, m2.x)),
            y = Math.max(0, Math.min(m1.y, m2.y));
            
        scene.mark.selectionRect.set(
            x,
            y,
            Math.min(this.width(),  Math.max(m2.x, m1.x)) - x,
            Math.min(this.height(), Math.max(m2.y, m1.y)) - y);

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
    scene.mark.selectionRect = null;
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

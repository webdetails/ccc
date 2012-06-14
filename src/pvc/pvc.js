
/*global pvc:true */
var pvc = {
    // 0 - off
    // 1 - errors 
    // 2 - errors, warnings
    // 3 - errors, warnings, info
    // 4 - verbose
    debug: 0
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
        console.log("[pvChart]: " + 
          (typeof m === 'string' ? m : JSON.stringify(m)));
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

pvc.cloneMatrix = function(m){
    return m.map(function(d){
        return d.slice();
    });
};

pvc.mergeDefaults = function(to, defaults, from){
    def.eachOwn(defaults, function(dv, p){
        var v;
        to[p] = (from && (v = from[p]) !== undefined) ? v : dv;
    });
    
    return to;
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
 * Creates a color scheme based on the specified colors.
 * The default color scheme is "pv.Colors.category10", 
 * and is returned when null or an empty array is specified.
 */
pvc.createColorScheme = function(colors){
    if (colors == null || !colors.length){
        return pv.Colors.category10;
    }
	
    colors = def.array(colors);
	
    return function() {
        var scale = pv.colors(colors); // creates a color scale with a defined range
        scale.domain.apply(scale, arguments); // defines the domain of the color scale
        return scale;
    };
};

// Convert to Grayscale using YCbCr luminance conv.
pvc.toGrayScale = function(color, alpha, maxGrayLevel){
    color = pv.color(color);
    
    var avg = Math.round( 0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
    // Don't let the color get near white, or it becomes unperceptible in most monitors
    if(maxGrayLevel === undefined) {
        maxGrayLevel = 200;
    }
    
    if(maxGrayLevel != null && avg > maxGrayLevel) {
        avg = maxGrayLevel;
    }
    
    if(alpha == null){
        alpha = color.opacity;
        //alpha = 0.6;
    }
    
    //var avg = Math.round( (color.r + color.g + color.b)/3);
    return pv.rgb(avg, avg, avg, alpha != null ? alpha : 0.6);//.brighter();
};

pvc.removeTipsyLegends = function(){
    try {
        $('.tipsy').remove();
    } catch(e) {
        // Do nothing
    }
};

pvc.createDateComparer = function(parser, key){
    if(!key){
        key = pv.identity;
    }
    
    return function(a, b){
        return parser.parse(key(a)) - parser.parse(key(b));
    };
};

pv.Format.createParser = function(pvFormat) {
    
    function parse(value) {
        return pvFormat.parse(value);
    }
    
    return parse;
};

pv.Format.createFormatter = function(pvFormat) {
    
    function format(value) {
        return value != null ? pvFormat.format(value) : "";
    }
    
    return format;
};

/**
 * Creates a margins/sides object.
 * @constructor
 * @param {string|number|object} sides May be a css-like shorthand margin string.
 * 
 * <ol>
 *   <li> "1" - {all: '1'}</li>
 *   <li> "1 2" - {top: '1', left: '2', right: '2', bottom: '1'}</li>
 *   <li> "1 2 3" - {top: '1', left: '2', right: '2', bottom: '3'}</li>
 *   <li> "1 2 3 4" - {top: '1', right: '2', bottom: '3', left: '4'}</li>
 * </ol>
 */
pvc.Sides = function(sides){
    if(sides != null){
        this.setSides(sides);
    }
};

pvc.Sides.names = 'left right top bottom'.split(' ');
pvc.Sides.namesSet = pv.dict(pvc.Sides.names, def.constant(true));

pvc.Sides.prototype.setSides = function(sides){
    if(typeof sides === 'string'){
        var comps = sides.split(/\s+/).map(function(comp){
            return pvc.PercentValue.parse(comp);
        });
        
        switch(comps.length){
            case 1:
                this.set('all', comps[0]);
                return;
                
            case 2:
                this.set('top',    comps[0]);
                this.set('left',   comps[1]);
                this.set('right',  comps[1]);
                this.set('bottom', comps[0]);
                return;
                
            case 3:
                this.set('top',    comps[0]);
                this.set('left',   comps[1]);
                this.set('right',  comps[1]);
                this.set('bottom', comps[2]);
                return;
                
            case 4:
                this.set('top',    comps[0]);
                this.set('right',  comps[1]);
                this.set('bottom', comps[2]);
                this.set('left',   comps[3]);
                return;
                
            case 0:
                return;
        }
    } else if(typeof sides === 'number') {
        this.set('all', sides);
        return;
    } else if (typeof sides === 'object') {
        this.set('all', sides.all);
        for(var p in sides){
            if(p !== 'all'){
                this.set(p, sides[p]);
            }
        }
        return;
    }
    
    if(pvc.debug) {
        pvc.log("Invalid 'margins' option value: " + JSON.stringify(sides));
    }
};

pvc.Sides.prototype.set = function(prop, value){
    value = pvc.PercentValue.parse(value);
    if(value != null){
        if(prop === 'all'){
            // expand
            pvc.Sides.names.forEach(function(p){
                this[p] = value;
            }, this);
            
        } else if(def.hasOwn(pvc.Sides.namesSet, prop)){
            this[prop] = value;
        }
    }
};

pvc.Sides.prototype.resolve = function(width, height){
    if(typeof width === 'object'){
        height = width.height;
        width  = width.width;
    }
    
    var margins = {};
    
    pvc.Sides.names.forEach(function(p){
        var value  = 0;
        var margin = this[p];
        if(margin != null){
            if(typeof(margin) === 'number'){
                value = margin;
            } else {
                value = margin.resolve((p === 'left' || p === 'right') ? width : height);
            }
        }
        
        margins[p] = value;
    }, this);
    
    return margins;
};

pvc.PercentValue = function(pct){
    this.percent = pct;
};

pvc.PercentValue.prototype.resolve = function(total){
    return this.percent * total;
};

pvc.PercentValue.parse = function(value){
    if(value != null && value !== ''){
        switch(typeof value){
            case 'number': return value;
            case 'string':
                var match = value.match(/^(.+?)\s*(%)?$/);
                if(match){
                    var n = +match[1];
                    if(!isNaN(n)){
                        if(match[2]){
                            if(n >= 0){
                                return new pvc.PercentValue(n / 100);
                            }
                        } else {
                            return n;
                        }
                    }
                }
                break;
                
            case 'object':
                if(value instanceof pvc.PercentValue){
                    return value;
                }
                break;
        }
        
        if(pvc.debug){
            pvc.log(def.format("Invalid margins component '{0}'", [''+value]));
        }
    }
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
    /* For the first render, take it from the top. */
    if (this.parent && !this.root.scene) {
        this.root.render();
        return;
    }
    
    /* Ensure zOrder is up to date */
    sortChildren.call(this);
    
    /* Assign a new render id to the root mark */
    var rootId = this.root._rootId;
    if(rootId == null){
        rootId = this.root._rootId = def.nextId('rootMarks');
    }
    
    this.root._renderId = def.nextId("render" + rootId);
    
    if(pvc.debug >= 4){
        pvc.log("BEGIN RENDER " + this.root._renderId);
    }
    
    /* Render */
    markRender.apply(this, arguments);
    
    if(pvc.debug >= 4){
        pvc.log("END RENDER " + this.root._renderId);
    }
};

pv.Mark.prototype.renderId = function(){
    return this.root._renderId;
};

function sortChildren(){
    // Sort children by their Z-Order
    var children = this.children, L;
    if(children && (L = children.length)){
        var needChildSort = this._needChildSort;
        if(needChildSort){
            children.sort(function(m1, m2){
                return def.compare(m1._zOrder, m2._zOrder);
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

/* DOM */
/**
 * Inserts the specified child <i>n</i> at the given index. 
 * Any child from the given index onwards will be moved one position to the end. 
 * If <i>index</i> is null, this method is equivalent to
 * {@link #appendChild}. 
 * If <i>n</i> is already part of the DOM, it is first
 * removed before being inserted.
 *
 * @throws Error if <i>index</i> is non-null and greater than the current number of children.
 * @returns {pv.Dom.Node} the inserted child.
 */
pv.Dom.Node.prototype.insertAt = function(n, index) {
    var L;
    if (index == null || index === (L = this.childNodes.length)){     
        return this.appendChild(n);
    }
    
    if(index > L){
        throw new Error("Index out of range.");
    }
    
    if (n.parentNode) {
        n.parentNode.removeChild(n);
    }
    
    var r = this.childNodes[index];
    n.parentNode = this;
    n.nextSibling = r;
    n.previousSibling = r.previousSibling;
    if (r.previousSibling) {
        r.previousSibling.nextSibling = n;
    } else {
        if (r == this.lastChild) {
            this.lastChild = n;
        }
        this.firstChild = n;
    }
    this.childNodes.splice(index, 0, n);
    return n;
};

/**
 * Removes the child node at the specified index from this node.
 */
pv.Dom.Node.prototype.removeAt = function(i) {
  var n = this.childNodes[i];
  if(n){
      this.childNodes.splice(i, 1);
      if (n.previousSibling) { 
          n.previousSibling.nextSibling = n.nextSibling; 
      } else { 
          this.firstChild = n.nextSibling; 
      }
      
      if (n.nextSibling) {
          n.nextSibling.previousSibling = n.previousSibling;
      } else {
          this.lastChild = n.previousSibling;
      }
      
      delete n.nextSibling;
      delete n.previousSibling;
      delete n.parentNode;
  }
  return n;
};


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
 * The 'syncScale', when not nully and is falsy, 
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
            
            if      (err <= 0.15) { tickStep *= 10; }
            else if (err <= 0.35) { tickStep *= 5;  }
            else if (err <= 0.75) { tickStep *= 2;  }
            
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
                if(pvc.debug >= 2) {
                    pvc.log("Ticks forced extending a linear scale's domain, " +
                            "but it is not possible to update the domain because " + 
                            "it has '" +  doma.length + "' element(s).");
                }
            } else {
                if(pvc.debug >= 3) {
                    pvc.log("Ticks forced extending a linear scale's domain from [" +
                            [domaMin, domaMax] + "] to [" +
                            [tickMin, tickMax] + "]");
                }
                
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
        
        extValue = this.getStaticPropertyValue(prop);
    } else if(!this._intercepted || !this._intercepted[prop]) { // Don't intercept any previous interceptor...
        extValue = this.getStaticPropertyValue(prop);
    }
        
    // Let undefined pass through as a sign of not-intercepted
    // A 'null' value is considered as an existing property value.
    if(extValue !== undefined){
        extValue = pv.functor(extValue);
    }
    
    function interceptProp(){
        var args  = arraySlice.call(arguments);
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
 */
pv.Mark.prototype.addMargin = function(name, margin) {
    if(margin !== 0){
        var staticValue = def.nullyTo(this.getStaticPropertyValue(name), 0),
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
    var all = def.get(margins, 'all', 0);
    
    this.addMargin('left',   def.get(margins, 'left',   all));
    this.addMargin('right',  def.get(margins, 'right',  all));
    this.addMargin('top',    def.get(margins, 'top',    all));
    this.addMargin('bottom', def.get(margins, 'bottom', all));
    
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
        breakInstance = {
            isBreak: true,
            visible: false,
            datum: {}
        };

    /* Go up to the root and register our way back.
     * The root mark never "looses" its scene.
     */
    while(mark.parent){
        indexes.unshift(mark.childIndex);
        mark = mark.parent;
    }

    // mark != null

    // root scene exists if rendered at least once
    var rootScene = mark.scene;
    if(!rootScene){
        return;
    }
    
    var L = indexes.length;

    function collectRecursive(scene, level, toScreen){
        var isLastLevel = level === L, 
            childIndex;
        
        if(!isLastLevel) {
            childIndex = indexes[level];
        }
        
        for(var index = 0, D = scene.length; index < D ; index++){
            var instance = scene[index];
            if(level === L){
                fun.call(ctx, scene[index], toScreen);
            } else if(instance.visible) {
                var childScene = instance.children[childIndex];
                
                // Some nodes might have not been rendered?
                if(childScene){
                    var childToScreen = toScreen
                                            .times(instance.transform)
                                            .translate(instance.left, instance.top);
                    
                    collectRecursive(childScene, level + 1, childToScreen);
                }
            }
        }
        
        if(D > 0) {
            fun.call(ctx, breakInstance, null);
        }
    }

    collectRecursive(rootScene, 0, pv.Transform.identity);
};

pv.Mark.prototype.forEachSignumInstance = function(fun, ctx){
    this.forEachInstance(function(instance, t){
        if(instance.datum || instance.group){
            fun.call(ctx, instance, t);
        }
    });
};

/* BOUNDS */
pv.Mark.prototype.toScreenTransform = function(){
    var t = pv.Transform.identity;
    
    if(this instanceof pv.Panel) {
        t = t.translate(this.left(), this.top())
             .times(this.transform());
    }

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

pv.Label.prototype.getInstanceShape = function(instance){
    // TODO
    return new Rect(
            instance.left,
            instance.top,
            10,
            10);
};

pv.Wedge.prototype.getInstanceShape = function(instance){
    var midAngle  = instance.startAngle + (instance.angle / 2);
    var midRadius = (instance.outerRadius + instance.innerRadius) / 2;
    var dotLeft   = instance.left + midRadius * Math.cos(midAngle);
    var dotTop    = instance.top  + midRadius * Math.sin(midAngle);
    
    return new Circle(dotLeft, dotTop, 10);
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

var Size = def.type('pvc.Size')
.init(function(width, height){
    if(width instanceof Object) {
        this.width  = width.width  || 0;
        this.height = width.height || 0;
    } else {
        this.width  = width  || 0;
        this.height = height || 0;
    }
})
.add({
    clone: function(){
        return new Size(this.width, this.height);
    },
    
    intersect: function(size){
        return new Size(
               Math.min(this.width,  size.width), 
               Math.min(this.height, size.height));
    },
    
    setProp: function(prop, v){
        this[prop] = v || 0;
    }
});

// --------------------

var Shape = def.type('pvc.Shape')
.add({
    transform: function(t){
        return this.clone().apply(t);
    }

    // clone
    // intersectsRect
});

// --------------------

var Rect = def.type('pvc.Rect', Shape)
.init(function(x, y, dx, dy){
    this.set(x, y, dx, dy);
})
.add({
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
    
    containsPoint: function(x, y){
        return this.x < x && x < this.x2 && 
               this.y < y && y < this.y2;
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

var Circle = def.type('pvc.Circle', Shape)
.init(function(x, y, radius){
    this.x = x || 0;
    this.y = y || 0;
    this.radius = radius || 0;
})
.add({
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

var Line = def.type('pvc.Line', Shape)
.init(function(x, y, x2, y2){
    this.x  = x  || 0;
    this.y  = y  || 0;
    this.x2 = x2 || 0;
    this.y2 = y2 || 0;
})
.add({
    clone: function(){
        return new pvc.Line(this.x, this.y, this.x2, this.x2);
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

}()); // End private scope


/**
 * Equal to pv.Behavior.select but doesn't necessarily
 * force redraw of component it's in on mousemove, and sends event info
 * (default behavior matches pv.Behavior.select())
 * @param {boolean} autoRefresh refresh parent mark automatically
 * @param {pv.Mark} mark
 * @return {function} mousedown
 **/
pv.Behavior.selector = function(autoRefresh, mark) {
  var scene, // scene context
      index, // scene context
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
    if (!scene) {
        return;
    }
    
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
    if (!scene) { return; }
    pv.Mark.dispatch("selectend", scene, index, e);
    scene.mark.selectionRect = null;
    scene = null;
  }

  pv.listen(window, "mousemove", mousemove);
  pv.listen(window, "mouseup", mouseup);

  return mousedown;
};

/**
 * Implements support for svg detection
 */
(function($){
    $.support.svg = $.support.svg || 
        document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
}(jQuery));
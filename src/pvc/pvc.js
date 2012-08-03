
/*global pvc:true */
var pvc = def.globalSpace('pvc', {
    // 0 - off
    // 1 - errors 
    // 2 - errors, warnings
    // 3 - errors, warnings, info
    // 4 - verbose
    // 5 - trash
    // ...
    debug: 0
});

// Begin private scope
(function(){

// Check URL debug and debugLevel
(function(){
    if((typeof window.location) !== 'undefined'){
        var url = window.location.href;
        if(url && (/\bdebug=true\b/).test(url)){
            var m = /\bdebugLevel=(\d+)/.exec(url);
            pvc.debug = m ? (+m[1]) : 1;
        }
    }
}());

// goldenRatio proportion
// ~61.8% ~ 38.2%
pvc.goldenRatio = (1 + Math.sqrt(5)) / 2;

pvc.invisibleFill = 'rgba(127,127,127,0.00001)';

var arraySlice = pvc.arraySlice = Array.prototype.slice;

pvc.setDebug = function(level){
    level = +level;
    pvc.debug = isNaN(level) ? 0 : level;
    
    syncTipsyLog();
    
    return pvc.debug;
};

/**
 *  Utility function for logging messages to the console
 */
pvc.log = function(m){
    if (pvc.debug && typeof console !== "undefined"){
        console.log("[pvChart]: " + 
          (typeof m === 'string' ? m : JSON.stringify(m)));
    }
};

pvc.logError = function(e){
    if(e && typeof e === 'object' && e.message){
        e = e.message;
    }
    
    if (typeof console != "undefined"){
        console.log("[pvChart ERROR]: " + e);
    } else {
        throw new Error("[pvChart ERROR]: " + e);
    }
};

// Redirect protovis error handler
pv.error = pvc.logError;

function syncTipsyLog(){
    var tip = pv.Behavior.tipsy;
    if(tip && tip.setDebug){
        tip.setDebug(pvc.debug);
        tip.log = pvc.log;
    }
}

syncTipsyLog();

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
        var v, dvo;
        
        if(from){ 
            v = from[p];
        }
        
        if(v !== undefined){
            var vo = def.object.asNative(v);
            if(vo){
                dvo = def.object.asNative(dv);
                if(dvo){
                    v = def.create(dvo, vo);
                } // else, ignore dv
            } // else, simple value (null included) ignores dv
        }
        
        if(v === undefined){
            // Inherit default native objects
            dvo = def.object.asNative(dv);
            if(dvo){
                dv = Object.create(dvo);
            }
            v = dv;
        }
        
        to[p] = v;
    });
    
    return to;
};

/**
 * Extends a type created with {@link def.type}
 * with the properties in {@link exts}, 
 * possibly constrained to the properties of specified names.
 * <p>
 * The properties whose values are not functions
 * are converted to constant functions that return the original value.
 * </p>
 * @param {function} type
 *      The type to extend.
 * @param {object} [exts] 
 *      The extension object whose properties will extend the type.
 * @param {string[]} [names]
 *      The allowed property names. 
 */
pvc.extendType = function(type, exts, names){
    if(exts){
        var exts2;
        var addExtension = function(ext, name){
            if(ext !== undefined){
                if(!exts2){
                    exts2 = {};
                }
                exts2[name] = def.fun.to(ext);
            }
        };
        
        if(names){
            names.forEach(function(name){
                addExtension(exts[name], name);
            });
        } else {
            def.each(addExtension);
        }
        
        if(exts2){
           type.add(exts2);
        }
    }
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
 * The default color scheme used by charts.
 * <p>
 * Charts use the color scheme specified in the chart options 
 * {@link pvc.BaseChart#options.colors}
 * and 
 * {@link pvc.BaseChart#options.secondAxisColors}, 
 * for the main and second axis series, respectively, 
 * or, when any is unspecified, 
 * the default color scheme.
 * </p>
 * <p>
 * When null, the color scheme {@link pv.Colors.category10} is implied. 
 * To obtain the default color scheme call {@link pvc.createColorScheme}
 * with no arguments. 
 * </p>
 * <p>
 * To be generically useful, 
 * a color scheme should contain at least 10 colors.
 * </p>
 * <p>
 * A color scheme is a function that creates a {@link pv.Scale} color scale function
 * each time it is called. 
 * It sets as its domain the specified arguments and as range 
 * the pre-spcecified colors of the color scheme.
 * </p>
 * 
 * @readonly
 * @type function
 */
pvc.defaultColorScheme = null;

/**
 * Sets the colors of the default color scheme used by charts 
 * to a specified color array.
 * <p>
 * If null is specified, the default color scheme is reset to its original value.
 * </p>
 * 
 * @param {string|pv.Color|string[]|pv.Color[]|pv.Scale|function} [colors=null] Something convertible to a color scheme by {@link pvc.colorScheme}.
 * @return {null|pv.Scale} A color scale function or null.
 */
pvc.setDefaultColorScheme = function(colors){
    return pvc.defaultColorScheme = pvc.colorScheme(colors);
};

/**
 * Creates a color scheme if the specified argument is not one already.
 * 
 * @param {string|pv.Color|string[]|pv.Color[]|pv.Scale|function} [colors=null] A value convertible to a color scheme: 
 * a color string, 
 * a color object, 
 * an array of color strings or objects, 
 * a color scale function, 
 * or null.
 * 
 * @returns {null|function} A color scheme function or null.
 */
pvc.colorScheme = function(colors){
    if(colors == null){
        return null;
    }
    
    if(typeof colors === 'function') {
        if(!colors.hasOwnProperty('range')){
            // Assume already a color scheme (a color scale factory)
            return colors;
        }
        
        // A protovis color scale
        // Obtain its range colors array and discard the scale function.
        colors = colors.range();
    } else {
        colors = def.array.as(colors);
    }
    
    if(!colors.length){
        return null;
    }
    
    return function() {
        var scale = pv.colors(colors); // creates a color scale with a defined range
        scale.domain.apply(scale, arguments); // defines the domain of the color scale
        return scale;
    };
},

/**
 * Creates a color scheme based on the specified colors.
 * When no colors are specified, the default color scheme is returned.
 * 
 * @see pvc.defaultColorScheme 
 * @param {string|pv.Color|string[]|pv.Color[]|pv.Scale|function} [colors=null] Something convertible to a color scheme by {@link pvc.colorScheme}.
 * @type function
 */
pvc.createColorScheme = function(colors){
    return pvc.colorScheme(colors) ||
           pvc.defaultColorScheme  ||
           pv.Colors.category10;
};

// Convert to Grayscale using YCbCr luminance conv.
pvc.toGrayScale = function(color, alpha, maxGrayLevel, minGrayLevel){
    color = pv.color(color);
    
    var avg = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    // Don't let the color get near white, or it becomes unperceptible in most monitors
    if(maxGrayLevel === undefined) {
        maxGrayLevel = 200;
    } else if(maxGrayLevel == null){
        maxGrayLevel = 255; // no effect
    }
    
    if(minGrayLevel === undefined){
        minGrayLevel = 30;
    } else if(minGrayLevel == null){
        minGrayLevel = 0; // no effect
    }
    
    var delta = (maxGrayLevel - minGrayLevel);
    if(delta <= 0){
        avg = maxGrayLevel;
    } else {
        // Compress
        avg = minGrayLevel + (avg / 255) * delta;
    }
    
    if(alpha == null){
        alpha = color.opacity;
    } else if(alpha < 0){
        alpha = (-alpha) * color.opacity;
    }
    
    avg = Math.round(avg);
    
    return pv.rgb(avg, avg, avg, alpha);
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

pvc.parseAlign = function(side, align){
    var align2, isInvalid;
    if(side === 'left' || side === 'right'){
        align2 = align && pvc.BasePanel.verticalAlign[align];
        if(!align2){
            align2 = 'middle';
            isInvalid = !!align;
        }
    } else {
        align2 = align && pvc.BasePanel.horizontalAlign[align];
        if(!align2){
            align2 = 'center';
            isInvalid = !!align;
        }
    }
    
    if(isInvalid && pvc.debug >= 2){
        pvc.log(def.format("Invalid alignment value '{0}'. Assuming '{1}'.", [align, align2]));
    }
    
    return align2;
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

pvc.Sides.hnames = 'left right'.split(' ');
pvc.Sides.vnames = 'top bottom'.split(' ');
pvc.Sides.names = 'left right top bottom'.split(' ');
pvc.Sides.namesSet = pv.dict(pvc.Sides.names, def.retTrue);

pvc.Sides.prototype.setSides = function(sides){
    if(typeof sides === 'string'){
        var comps = sides.split(/\s+/).map(function(comp){
            return pvc.PercentValue.parse(comp);
        });
        
        switch(comps.length){
            case 1:
                this.set('all', comps[0]);
                return this;
                
            case 2:
                this.set('top',    comps[0]);
                this.set('left',   comps[1]);
                this.set('right',  comps[1]);
                this.set('bottom', comps[0]);
                return this;
                
            case 3:
                this.set('top',    comps[0]);
                this.set('left',   comps[1]);
                this.set('right',  comps[1]);
                this.set('bottom', comps[2]);
                return this;
                
            case 4:
                this.set('top',    comps[0]);
                this.set('right',  comps[1]);
                this.set('bottom', comps[2]);
                this.set('left',   comps[3]);
                return this;
                
            case 0:
                return this;
        }
    } else if(typeof sides === 'number') {
        this.set('all', sides);
        return this;
    } else if (typeof sides === 'object') {
        if(sides instanceof pvc.PercentValue){
            this.set('all', sides);
        } else {
            this.set('all', sides.all);
            for(var p in sides){
                if(p !== 'all' && sides.hasOwnProperty(p)){
                    this.set(p, sides[p]);
                }
            }
        }
        
        return this;
    }
    
    if(pvc.debug) {
        pvc.log("Invalid 'sides' value: " + JSON.stringify(sides));
    }
    
    return this;
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
    
    var sides = {};
    
    pvc.Sides.names.forEach(function(side){
        var value  = 0;
        var sideValue = this[side];
        if(sideValue != null){
            if(typeof(sideValue) === 'number'){
                value = sideValue;
            } else {
                value = sideValue.resolve((side === 'left' || side === 'right') ? width : height);
            }
        }
        
        sides[side] = value;
    }, this);
    
    sides.width  = sides.left   + sides.right;
    sides.height = sides.bottom + sides.top;
    
    return sides;
};

pvc.Sides.resolvedMax = function(a, b){
    var sides = {};
    
    pvc.Sides.names.forEach(function(side){
        sides[side] = Math.max(a[side] || 0, b[side] || 0);
    });
    
    return sides;
};

// -------------

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

pvc.PercentValue.resolve = function(value, total){
    return (value instanceof pvc.PercentValue) ? value.resolve(total) : value;
};

/* Protovis Z-Order support between sibling marks */

// Default values
pv.Mark.prototype._zOrder = 0;

pv.Panel.prototype._hasZOrderChild = false;
pv.Panel.prototype._needChildSort  = false;

pv.Mark.prototype.zOrder = function(zOrder) {
    var borderPanel = this.borderPanel;
    if(borderPanel && borderPanel !== this){
        return borderPanel.zOrder.apply(borderPanel, arguments);
    }
    
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
var markRenderCore = pv.Mark.prototype.renderCore,
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
pv.Mark.prototype.renderCore = function(){
    /* Ensure zOrder is up to date */
    sortChildren.call(this);
    
    /* Assign a new render id to the root mark */
    var root = this.root;
    root._renderId = (root._renderId || 0) + 1;
    
    if(pvc.debug >= 10){
        pvc.log("BEGIN RENDER " + root._renderId);
    }
    
    /* Render */
    markRenderCore.apply(this, arguments);
    
    if(pvc.debug >= 10){
        pvc.log("END RENDER " + root._renderId);
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

pv.Mark.prototype.intercept = function(prop, interceptor, extValue, noCast){
    if(extValue !== undefined){
        if(!noCast){
            this[prop](extValue);
        
            extValue = this.getStaticPropertyValue(prop);
        }
    } else if(!this._intercepted || !this._intercepted[prop]) { // Don't intercept any previous interceptor...
        extValue = this.getStaticPropertyValue(prop);
    }
        
    // Let undefined pass through as a sign of not-intercepted
    // A 'null' value is considered as an existing property value.
    if(extValue !== undefined){
        extValue = def.fun.to(extValue);
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
 * Used to prevent re-evaluation of inherited data property functions.
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

pv.Mark.prototype.getInstanceCenterPoint = function(instance){
    return pv.vector(
                instance.left + (instance.width  || 0) / 2,
                instance.top +  (instance.height || 0) / 2);
};

pv.Label.prototype.getInstanceShape = function(instance){
    var t = pvc.text;
    var size = t.getTextSize(instance.text, instance.font);
    
    return t.getLabelPolygon(
                size.width,
                size.height,
                instance.textAlign,
                instance.textBaseline,
                instance.textAngle,
                instance.textMargin)
            .apply(pv.Transform.identity.translate(instance.left, instance.top));
};

pv.Wedge.prototype.getInstanceCenterPoint = function(instance){
    var midAngle  = instance.startAngle + (instance.angle / 2);
    var midRadius = (instance.outerRadius + instance.innerRadius) / 2;
    var dotLeft   = instance.left + midRadius * Math.cos(midAngle);
    var dotTop    = instance.top  + midRadius * Math.sin(midAngle);
    
    return pv.vector(dotLeft, dotTop);
};

pv.Wedge.prototype.getInstanceShape = function(instance){
    var center = this.getInstanceCenterPoint(instance);

    // TODO: at a minimum, improve calculation of circle radius
    // to match the biggest circle within the wedge at that point
    
    return new Circle(center.x, center.y, 10);
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
    
    // Select dots only when the center is included
    return new Circle(cx, cy, radius);
};

pv.Dot.prototype.getInstanceCenterPoint = function(instance){
    return pv.vector(instance.left, instance.top);
};

pv.Area.prototype.getInstanceShape =
pv.Line.prototype.getInstanceShape = function(instance, nextInstance){
    return new Line(instance.left, instance.top, nextInstance.left, nextInstance.top);
};

pv.Area.prototype.getInstanceCenterPoint =
pv.Line.prototype.getInstanceCenterPoint = function(instance, nextInstance){
    return pv.vector(
            (instance.left + nextInstance.left) / 2, 
            (instance.top  + nextInstance.top ) / 2);
};

// --------------------

var Size = def.type('pvc.Size')
.init(function(width, height){
    if(arguments.length === 1){
        if(width != null){
            this.setSize(width);
        }
    } else {
        if(width != null){
            this.width  = width;
        }
        
        if(height != null){
            this.height = height;
        }
    }
})
.add({
    setSize: function(size, keyArgs){
        if(typeof size === 'string'){
            var comps = size.split(/\s+/).map(function(comp){
                return pvc.PercentValue.parse(comp);
            });
            
            switch(comps.length){
                case 1: 
                    this.set(def.get(keyArgs, 'singleProp', 'all'), comps[0]);
                    return this;
                    
                case 2:
                    this.set('width',  comps[0]);
                    this.set('height', comps[1]);
                    return this;
                    
                case 0:
                    return this;
            }
        } else if(typeof size === 'number') {
            this.set(def.get(keyArgs, 'singleProp', 'all'), size);
            return this;
        } else if (typeof size === 'object') {
            this.set('all', size.all);
            for(var p in size){
                if(p !== 'all'){
                    this.set(p, size[p]);
                }
            }
            return this;
        }
        
        if(pvc.debug) {
            pvc.log("Invalid 'size' value: " + JSON.stringify(size));
        }
        return this;
    },
    
    set: function(prop, value){
        if(value != null && def.hasOwn(pvc.Size.namesSet, prop)){
            value = pvc.PercentValue.parse(value);
            if(value != null){
                if(prop === 'all'){
                    // expand
                    pvc.Size.names.forEach(function(p){
                        this[p] = value;
                    }, this);
                    
                } else {
                    this[prop] = value;
                }
            }
        }
    },
    
    clone: function(){
        return new Size(this.width, this.height);
    },
    
    intersect: function(size){
        return new Size(
               Math.min(this.width,  size.width), 
               Math.min(this.height, size.height));
    },
    
    resolve: function(refSize){
        var size = {};
        
        pvc.Size.names.forEach(function(length){
            var lengthValue = this[length];
            if(lengthValue != null){
                if(typeof(lengthValue) === 'number'){
                    size[length] = lengthValue;
                } else if(refSize){
                    var refLength = refSize[length];
                    if(refLength != null){
                        size[length] = lengthValue.resolve(refLength);
                    }
                }
            }
        }, this);
        
        return size;
    }
});

pvc.Size.names = ['width', 'height'];
pvc.Size.namesSet = pv.dict(pvc.Size.names, def.retTrue);

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

def.mixin(pv.Vector.prototype, Shape.prototype, {
    set: function(x, y){
        this.x  = x  || 0;
        this.y  = y  || 0;
    },
    
    clone: function(){
        return new pv.Vector(this.x, this.y);
    },
    
    apply: function(t){
        this.x  = t.transformHPosition(this.x);
        this.y  = t.transformVPosition(this.y);
        return this;
    },

    intersectsRect: function(rect){
        // Does rect contain the point
        return (this.x >= rect.x) && (this.x <= rect.x2) &&
               (this.y >= rect.y) && (this.y <= rect.y2);
    }
});

// --------------------

var Rect = def.type('pvc.Rect', Shape)
.init(function(x, y, dx, dy){
    this.set(x, y, dx, dy);
})
.add({
    set: function(x, y, dx, dy){
        this.x  =  x || 0;
        this.y  =  y || 0;
        this.dx = dx || 0;
        this.dy = dy || 0;
        
        this.calc();
    },
    
    calc: function(){
        // Ensure normalized
        if(this.dx < 0){
            this.dx = -this.dx;
            this.x  = this.x - this.dx;
        }
        
        if(this.dy < 0){
            this.dy = -this.dy;
            this.y = this.y - this.dy;
        }
        
        this.x2  = this.x + this.dx;
        this.y2  = this.y + this.dy;
        
        this._sides = null;
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

        // rect is trusted to be normalized...

        return (this.x2 > rect.x ) &&  // Some intersection on X
               (this.x  < rect.x2) &&
               (this.y2 > rect.y ) &&  // Some intersection on Y
               (this.y  < rect.y2);
    },

    sides: function(){
        if(!this._sides){
            var x  = this.x,
                y  = this.y,
                x2 = this.x2,
                y2 = this.y2;
    
            /*
             *    x,y    A
             *     * ------- *
             *  D  |         |  B
             *     |         |
             *     * --------*
             *              x2,y2
             *          C
             */
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
        var sides = rect.sides();
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

// ----------------

var Polygon = def.type('pvc.Polygon', Shape)
.init(function(corners){
    this._corners = corners || [];
})
.add({
    _sides: null,
    _bbox:  null,
    
    corners: function(){
        return this._corners;
    },
    
    clone: function(){
        return new Polygon(this.corners().slice());
    },

    apply: function(t){
        delete this._sides;
        delete this._bbox;
        
        var corners = this.corners();
        for(var i = 0, L = corners.length; i < L ; i++){
            corners[i].apply(t);
        }
        
        return this;
    },
    
    intersectsRect: function(rect){
        // I - Any corner is inside the rect?
        var i, L;
        var corners = this.corners();
        
        L = corners.length;
        for(i = 0 ; i < L ; i++){
            if(corners[i].intersectsRect(rect)){
                return true;
            }
        }
        
        // II - Any side intersects the rect?
        var sides = this.sides();
        L = sides.length;
        for(i = 0 ; i < L ; i++){
            if(sides[i].intersectsRect(rect)){
                return true;
            }
        }
        
        return false;
    },

    sides: function(){
        var sides = this._sides;
        if(!sides){
            sides = this._sides = [];
            
            var corners = this.corners();
            var L = corners.length;
            if(L){
                var prevCorner = corners[0];
                for(var i = 1 ; i < L ; i++){
                    var corner = corners[i];
                    sides.push(
                        new Line(prevCorner.x, prevCorner.y,  corner.x, corner.y));
                }
            }
        }

        return sides;
    },
    
    bbox: function(){
        var bbox = this._bbox;
        if(!bbox){
            var min, max;
            this.corners().forEach(function(corner, index){
                if(min == null){
                    min = pv.vector(corner.x, corner.y);
                } else {
                    if(corner.x < min.x){
                        min.x = corner.x;
                    }
                    
                    if(corner.y < min.y){
                        min.y = corner.y;
                    }
                }
                
                if(max == null){
                    max = pv.vector(corner.x, corner.y);
                } else {
                    if(corner.x > max.x){
                        max.x = corner.x;
                    }
                    
                    if(corner.y > max.y){
                        max.y = corner.y;
                    }
                }
            });
            
            bbox = this._bbox = new pvc.Rect(min.x, min.y, max.x - min.x, max.y - min.y);
        }
        
        return this._bbox;
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
      mprev,
      inited,
      events,
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
    
    if(!events){
        // Staying close to canvas allows cancelling bubbling of the event in time 
        // for other ascendant handlers
        var root = this.root.scene.$g;
        
        events = [
            [root,     "mousemove", pv.listen(root, "mousemove", mousemove)],
            [root,     "mouseup",   pv.listen(root, "mouseup",   mouseup  )],
            
            // But when the mouse leaves the canvas we still need to
            // receive events...
            [document, "mousemove", pv.listen(document, "mousemove", mousemove)],
            [document, "mouseup",   pv.listen(document, "mouseup",   mouseup  )]
        ];
    }
    
    m1 = this.mouse();
    mprev = m1;
    this.selectionRect = new pvc.Rect(m1.x, m1.y);
    
    pv.Mark.dispatch("selectstart", scene, index, e);
  }
  
  /** @private */
  function mousemove(e) {
    if (!scene) {
        return;
    }
    
    e.stopPropagation();
    
    scene.mark.context(scene, index, function() {
        // this === scene.mark
        var m2 = this.mouse();
        if(mprev){
            var dx = m2.x - mprev.x;
            var dy = m2.y - mprev.y;
            var len = dx*dx + dy*dy;
            if(len <= 2){
                return;
            }
            mprev = m2;
        }
            
        var x = m1.x;
        var y = m1.y;
            
        this.selectionRect.set(x, y, m2.x - x, m2.y - y);
        
        if(redrawThis){
            this.render();
        }
        
        pv.Mark.dispatch("select", scene, index, e);
    });
  }

  /** @private */
  function mouseup(e) {
    var lscene = scene;
    if(lscene){
        if(events){
            events.forEach(function(registration){
                pv.unlisten.apply(pv, registration);
            });
            events = null;
        }
        
        e.stopPropagation();
        
        var lmark = lscene.mark;
        if(lmark){
            pv.Mark.dispatch("selectend", lscene, index, e);
        
            lmark.selectionRect = null;
        }
        mprev = null;
        scene = null;
    }
  }

  return mousedown;
};

/**
 * Implements support for svg detection
 */
(function($){
    $.support.svg = $.support.svg || 
        document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
}(jQuery));
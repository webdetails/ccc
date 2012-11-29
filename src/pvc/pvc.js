
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
        /*global window:true*/
        if((typeof window.location) !== 'undefined'){
            var url = window.location.href;
            if(url && (/\bdebug=true\b/).test(url)){
                var m = /\bdebugLevel=(\d+)/.exec(url);
                pvc.debug = m ? (+m[1]) : 3;
            }
        }
    }());
    
    // goldenRatio proportion
    // ~61.8% ~ 38.2%
    //pvc.goldenRatio = (1 + Math.sqrt(5)) / 2;
    
    pvc.invisibleFill = 'rgba(127,127,127,0.00001)';
    
    pvc.logSeparator = "------------------------------------------";
    
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
            /*global console:true*/
            console.log("[pvChart]: " + 
              (typeof m === 'string' ? m : pvc.stringify(m)));
        }
    };
    
    pvc.logError = function(e){
        if(e && typeof e === 'object' && e.message){
            e = e.message;
        }
        
        /*global console:true*/
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
     * Gets or sets the default CCC compatibility mode. 
     * <p>
     * Use <tt>Infinity</tt> for the <i>latest</i> version.
     * Use <tt>1</tt> for CCC version 1.
     * </p>
     * 
     * @param {number} [compatVersion] The new compatibility version.    
     */
    pvc.defaultCompatVersion = function(compatVersion){
        var defaults = pvc.BaseChart.prototype.defaults;
        if(compatVersion != null){
            return defaults.compatVersion = compatVersion;
        } 
        
        return defaults.compatVersion;
    };
    
    pvc.cloneMatrix = function(m){
        return m.map(function(d){
            return d.slice();
        });
    };
    
    pvc.stringify = function(t, keyArgs){
        var maxLevel = def.get(keyArgs, 'maxLevel') || 5;
        var ownOnly  = def.get(keyArgs, 'ownOnly', true);
        var funs     = def.get(keyArgs, 'funs',    false);
        var out = [];
        stringifyRecursive(out, t, maxLevel, ownOnly, funs);
        return out.join('');
    };
    
    function stringifyRecursive(out, t, remLevels, ownOnly, funs){
        if(remLevels > 0){
            remLevels--;
            switch(typeof t){
                case 'undefined': return out.push('undefined');
                case 'object':
                    if(!t){ 
                        out.push('null');
                        return true;
                    }
                    
                    if(t instanceof Array){
                        out.push('[');
                        t.forEach(function(item, index){
                            if(index){ out.push(', '); }
                            if(!stringifyRecursive(out, item, remLevels, ownOnly, funs)){
                                out.pop();
                            }
                        });
                        out.push(']');
                    } else if(t.constructor === Object){
                        out.push('{');
                        var first = true;
                        for(var p in t){
                            if(!ownOnly || def.hasOwnProp.call(t, p)){
                                if(!first){ out.push(', '); }
                                out.push(p + ': ');
                                if(!stringifyRecursive(out, t[p], remLevels, ownOnly, funs)){
                                    out.pop();
                                    if(!first){ out.pop(); }
                                } else if(first){
                                    first = false;
                                }
                            }
                        }
                        out.push('}');
                    } else {
                        out.push(JSON.stringify("'new ...'"));
                    }
                    return true;
                
                case 'number':
                case 'boolean': 
                    out.push(''+t);
                    return true;
                    
                case 'string': 
                    out.push(JSON.stringify(t));
                    return true;
                    
                case 'function':
                    if(funs){
                        out.push(JSON.stringify(t.toString().substr(0, 13) + '...'));
                        return true;
                    }
                    
                    return false;
            }
            
            out.push("'new ???'");
            return true;
        }
    } 
    
    pvc.orientation = {
        vertical:   'vertical',
        horizontal: 'horizontal'
    };
    
    /** 
     * To tag pv properties set by extension points
     * @type string 
     * @see pvc.BaseChart#extend
     */
    pvc.extensionTag = 'extension';
    
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
    
    pv.Mark.prototype.hasDelegateValue = function(name, tag) {
        var p = this.$propertiesMap[name];
        if(p){
            return (!tag || p.tag === tag);
        }
        
        // This mimics the way #bind works
        if(this.proto){
            return this.proto.hasDelegateValue(name, tag);
        }
        return false;
        // No delegates in the defaults...
        //return this.defaults.hasDelegateValue(name, tag);
    };
    
    // TODO: adapt to use def.Query.range
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
     * The default color scheme used by charts.
     * <p>
     * Charts use the color scheme specified in the chart options 
     * {@link pvc.BaseChart#options.colors}
     * and 
     * {@link pvc.BaseChart#options.color2AxisColorss}, 
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
    
    pvc.brighterColorTransform = function(color){
        return (color.rgb ? color : pv.color(color)).brighter(0.6);
    };
    
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
    
    pvc.defaultColor = pv.Colors.category10()('?');
    
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
    
    pvc.buildIndexedId = function(prefix, index){
        if(index === 0) {
            return prefix; // base, ortho, legend
        }
        
        return prefix + "" + (index + 1); // base2, ortho3,..., legend2
    };
    
    function unwrapExtensionOne(id, prefix){
        if(id){
            if(def.object.is(id)){
                return id.abs;
            }
            
            return prefix ? (prefix + def.firstUpperCase(id)) : id;
        }
        
        return prefix;
    }
    
    var oneNullArray = [null];
    
    pvc.makeExtensionAbsId = function(id, prefix){
        if(!id){
            return prefix;
        }
        
        return def
           .query(prefix || oneNullArray)
           .selectMany(function(oneprefix){
               return def
                   .query(id)
                   .select(function(oneid){
                       return unwrapExtensionOne(oneid, oneprefix);
                   });
           })
           .where(def.truthy)
           .array()
           ;
    };
    
    pvc.parseLegendClickMode = function(clickMode){
        if(!clickMode){
            clickMode = 'none';
        }
        
        switch(clickMode){
            case 'toggleSelected':
            case 'toggleVisible':
            case 'none':
                break;
                
            default:
                if(pvc.debug >= 2){
                    pvc.log("[Warning] Invalid 'legendClickMode' option value: '" + clickMode + "'. Assuming 'none'.");
                }
            
                clickMode = 'none';
                break;
        }
        
        return clickMode;
    };
    
    pvc.parseShape = function(shape){
        if(shape){
            switch(shape){
                case 'square':
                case 'circle':
                case 'diamond':
                case 'triangle':
                case 'cross':
                case 'bar':
                    break;
                default:
                    if(pvc.debug >= 2){
                        pvc.log("[Warning] Invalid 'shape' option value: '" + shape + "'.");
                    }
                
                    shape = null;
                    break;
            }
        }
        
        return shape;
    };
    
    pvc.parseContinuousColorScaleType = function(scaleType){
        if(scaleType){
            switch(scaleType){
                case 'linear':
                case 'normal':
                case 'discrete':
                    break;
                
                default:
                    if(pvc.debug >= 2){
                        pvc.log("[Warning] Invalid 'ScaleType' option value: '" + scaleType + "'.");
                    }
                
                scaleType = null;
                    break;
            }
        }
        
        return scaleType;  
    };
    
    pvc.parseDomainScope = function(scope, orientation){
        if(scope){
            switch(scope){
                case 'cell':
                case 'global':
                    break;
                
                case 'section': // row (for y) or col (for x), depending on the associated orientation
                    if(!orientation){
                        throw def.error.argumentRequired('orientation');
                    }
                    
                    scope = orientation === 'y' ? 'row' : 'column';
                    break;
                    
                case 'column':
                case 'row':
                    if(orientation && orientation !== (scope === 'row' ? 'y' : 'x')){
                        scope = 'section';
                        
                        if(pvc.debug >= 2){
                            pvc.log("[Warning] Invalid 'DomainScope' option value: '" + scope + "' for the orientation: '" + orientation + "'.");
                        }
                    }
                    break;
                
                default:
                    if(pvc.debug >= 2){
                        pvc.log("[Warning] Invalid 'DomainScope' option value: '" + scope + "'.");
                    }
                
                    scope = null;
                    break;
            }
        }
        
        return scope;
    };
    
    pvc.parseDomainRoundingMode = function(mode){
        if(mode){
            switch(mode){
                case 'none':
                case 'nice':
                case 'tick':
                    break;
                    
                default:
                    if(pvc.debug >= 2){
                        pvc.log("[Warning] Invalid 'DomainRoundMode' value: '" + mode + "'.");
                    }
                
                    mode = null;
                    break;
            }
        }
        
        return mode;
    };
    
    pvc.parseOverlappedLabelsMode = function(mode){
        if(mode){
            switch(mode){
                case 'leave':
                case 'hide':
                    break;
                
                default:
                    if(pvc.debug >= 2){
                        pvc.log("[Warning] Invalid 'OverlappedLabelsMode' option value: '" + mode + "'.");
                    }
                
                    mode = null;
                    break;
            }
        }
        
        return mode;
    };
    
    pvc.castNumber = function(value) {
        if(value != null) {
            value = +value; // to number
            if(isNaN(value)) {
                value = null;
            }
        }
        
        return value;
    };
    
    pvc.parseWaterDirection = function(value) {
        if(value){
            switch(value){
                case 'up':
                case 'down':
                    return value;
            }
            
            if(pvc.debug >= 2){
                pvc.log("[Warning] Invalid 'WaterDirection' value: '" + value + "'.");
            }
        }
    };
    
    pvc.parseTrendType = function(value) {
        if(value){
            if(value === 'none'){
                return value;
            }
            
            if(pvc.trends.has(value)){
                return value;
            }
            
            if(pvc.debug >= 2){
                pvc.log("[Warning] Invalid 'TrendType' value: '" + value + "'.");
            }
        }
    };
    
    pvc.parseNullInterpolationMode = function(value) {
        if(value){
            switch(value){
                case 'none':
                case 'linear':
                case 'zero':
                    return value;
            }
            
            if(pvc.debug >= 2){
                pvc.log("[Warning] Invalid 'NullInterpolationMode' value: '" + value + "'.");
            }
        }
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
    
    // suitable for protovis.anchor(..) of all but the Wedge mark... 
    pvc.parseAnchor = function(anchor){
        if(anchor){
            switch(anchor){
                case 'top':
                case 'left':
                case 'center':
                case 'bottom':
                case 'right':
                    return anchor;
            }
            
            if(pvc.debug >= 2){
                pvc.log(def.format("Invalid anchor value '{0}'.", [anchor]));
            }
        }
    };
    
    pvc.parseAnchorWedge = function(anchor){
        if(anchor){
            switch(anchor){
                case 'outer':
                case 'inner':
                case 'center':
                case 'start':
                case 'end':
                    return anchor;
            }
            
            if(pvc.debug >= 2){
                pvc.log(def.format("Invalid wedge anchor value '{0}'.", [anchor]));
            }
        }
    };
    
    pvc.unionExtents = function(result, range){
        if(!result) {
            if(!range){
                return null;
            }

            result = {min: range.min, max: range.max};
        } else if(range){
            if(range.min < result.min){
                result.min = range.min;
            }

            if(range.max > result.max){
                result.max = range.max;
            }
        }

        return result;
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
    
    pvc.parsePosition = function(side, defaultSide){
        if(side && !def.hasOwn(pvc.Sides.namesSet, side)){
            if(!defaultSide){
                defaultSide = 'left';
            }
            
            if(pvc.debug >= 2){
                pvc.log(def.format("Invalid position value '{0}. Assuming '{1}'.", [side, defaultSide]));
            }
            
            side = defaultSide;
        }
        
        return side;
    };
    
    pvc.Sides.as = function(v){
        if(v != null && !(v instanceof pvc.Sides)){
            v = new pvc.Sides().setSides(v);
        }
        
        return v;
    };
    
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
                    if(p !== 'all' && pvc.Sides.namesSet.hasOwnProperty(p)){
                        this.set(p, sides[p]);
                    }
                }
            }
            
            return this;
        }
        
        if(pvc.debug) {
            pvc.log("Invalid 'sides' value: " + pvc.stringify(sides));
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
        
        return pvc.Sides.updateSize(sides);
    };
    
    pvc.Sides.updateSize = function(sides){
        sides.width  = (sides.left   || 0) + (sides.right || 0);
        sides.height = (sides.bottom || 0) + (sides.top   || 0);
        
        return sides;
    };
    
    pvc.Sides.resolvedMax = function(a, b){
        var sides = {};
        
        pvc.Sides.names.forEach(function(side){
            sides[side] = Math.max(a[side] || 0, b[side] || 0);
        });
        
        return sides;
    };
    
    pvc.Sides.inflate = function(sides, by){
        var sidesOut = {};
        
        pvc.Sides.names.forEach(function(side){
            sidesOut[side] = (sides[side] || 0) + by;
        });
        
        return pvc.Sides.updateSize(sidesOut);
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
    
    /* Z-Order */
    
    // Backup original methods
    var markRenderCore = pv.Mark.prototype.renderCore,
        markZOrder = pv.Mark.prototype.zOrder;
    
    pv.Mark.prototype.zOrder = function(zOrder) {
        var borderPanel = this.borderPanel;
        if(borderPanel && borderPanel !== this){
            return markZOrder.call(borderPanel, zOrder);
        }
        
        return markZOrder.call(this, zOrder);
    };
    
    /* Render id */
    pv.Mark.prototype.renderCore = function(){
        /* Assign a new render id to the root mark */
        var root = this.root;
        
        root._renderId = (root._renderId || 0) + 1;
        
        if(pvc.debug >= 25){
            pvc.log("BEGIN RENDER " + root._renderId);
        }
        
        /* Render */
        markRenderCore.apply(this, arguments);
        
        if(pvc.debug >= 25){
            pvc.log("END RENDER " + root._renderId);
        }
    };
    
    pv.Mark.prototype.renderId = function(){
        return this.root._renderId;
    };
    
    /* PROPERTIES */
    pv.Mark.prototype.wrapper = function(wrapper){
        this._wrapper = wrapper;
        
        return this;
    };
    
    pv.Mark.prototype.wrap = function(f, m){
        if(f && def.fun.is(f) && this._wrapper && !f._cccWrapped){
            f = this._wrapper(f, m);
            
            f._cccWrapped = true;
        }
        
        return f;
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
    
    /* ANCHORS */
    /**
     * name = left | right | top | bottom
     */
    pv.Mark.prototype.addMargin = function(name, margin) {
        if(margin !== 0){
            var staticValue = def.nullyTo(this.propertyValue(name), 0),
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
    pv.Mark.prototype.eachInstanceWithData = function(fun, ctx){
        this.eachInstance(function(instance, t){
            if(instance.datum || instance.group){
                fun.call(ctx, instance, t);
            }
        });
    };
    
    /* BOUNDS */
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
                // the following comment is for jshint
                /* falls through */
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
                if(size instanceof pvc.PercentValue){
                    this.set(def.get(keyArgs, 'singleProp', 'all'), size);
                } else {
                    
                    this.set('all', size.all);
                    for(var p in size){
                        if(p !== 'all'){
                            this.set(p, size[p]);
                        }
                    }
                }
                return this;
            }
            
            if(pvc.debug) {
                pvc.log("Invalid 'size' value: " + pvc.stringify(size));
            }
            
            return this;
        },
        
        set: function(prop, value){
            if(value != null && (prop === 'all' || def.hasOwn(pvc.Size.namesSet, prop))){
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
            
            return this;
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
    
    pvc.Size.toOrtho = function(value, anchor){
        if(value != null){
            // Single size (a number or a string with only one number)
            // should be interpreted as meaning the orthogonal length.
            var a_ol;
            if(anchor){
                a_ol = pvc.BasePanel.orthogonalLength[anchor];
            }
            
            value = pvc.Size.to(value, {singleProp: a_ol});
            
            if(anchor){
                delete value[pvc.BasePanel.oppositeLength[a_ol]];
            }
        }
        
        return value;
    };
    
    pvc.Size.to = function(v, keyArgs){
        if(v != null && !(v instanceof Size)){
            v = new Size().setSize(v, keyArgs);
        }
        
        return v;
    };
    
    // --------------------
    
    var Offset = def.type('pvc.Offset')
    .init(function(x, y){
        if(arguments.length === 1){
            if(x != null){
                this.setOffset(x);
            }
        } else {
            if(x != null){
                this.x = x;
            }
            
            if(y != null){
                this.y = y;
            }
        }
    })
    .add({
        setOffset: function(offset, keyArgs){
            if(typeof offset === 'string'){
                var comps = offset.split(/\s+/).map(function(comp){
                    return pvc.PercentValue.parse(comp);
                });
                
                switch(comps.length){
                    case 1: 
                        this.set(def.get(keyArgs, 'singleProp', 'all'), comps[0]);
                        return this;
                        
                    case 2:
                        this.set('x', comps[0]);
                        this.set('y', comps[1]);
                        return this;
                        
                    case 0:
                        return this;
                }
            } else if(typeof offset === 'number') {
                this.set(def.get(keyArgs, 'singleProp', 'all'), offset);
                return this;
            } else if (typeof offset === 'object') {
                this.set('all', offset.all);
                for(var p in offset){
                    if(p !== 'all'){
                        this.set(p, offset[p]);
                    }
                }
                return this;
            }
            
            if(pvc.debug) {
                pvc.log("Invalid 'offset' value: " + pvc.stringify(offset));
            }
            return this;
        },
        
        set: function(prop, value){
            if(value != null && def.hasOwn(pvc.Offset.namesSet, prop)){
                value = pvc.PercentValue.parse(value);
                if(value != null){
                    if(prop === 'all'){
                        // expand
                        pvc.Offset.names.forEach(function(p){
                            this[p] = value;
                        }, this);
                        
                    } else {
                        this[prop] = value;
                    }
                }
            }
        },
        
        resolve: function(refSize){
            var offset = {};
            
            pvc.Size.names.forEach(function(length){
                var offsetProp  = pvc.Offset.namesSizeToOffset[length];
                var offsetValue = this[offsetProp];
                if(offsetValue != null){
                    if(typeof(offsetValue) === 'number'){
                        offset[offsetProp] = offsetValue;
                    } else if(refSize){
                        var refLength = refSize[length];
                        if(refLength != null){
                            offset[offsetProp] = offsetValue.resolve(refLength);
                        }
                    }
                }
            }, this);
            
            return offset;
        }
    });
    
    pvc.Offset.names = ['x', 'y'];
    pvc.Offset.namesSet = pv.dict(pvc.Offset.names, def.retTrue);
    pvc.Offset.namesSizeToOffset = {width: 'x', height: 'y'};
    pvc.Offset.namesSidesToOffset = {left: 'x', right: 'x', top: 'y', bottom: 'y'};
    
    pvc.Offset.as = function(v){
        if(v != null && !(v instanceof Offset)){
            v = new Offset().setOffset(v);
        }
        
        return v;
    };
    
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
            
            // But when the mouse leaves the canvas we still need to receive events...
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
    /*global document:true */
    $.support.svg = $.support.svg || 
        document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
}(/*global jQuery:true */jQuery));
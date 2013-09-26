/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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

// Check URL debug and debugLevel
(function() {
    /*global window:true*/
    if((typeof window !== 'undefined')  && window.location) {
        var urlIfHasDebug = function(url) { return url && (/\bdebug=true\b/).test(url) ? url : null; };
        var url = urlIfHasDebug(window.location.href) ||
                  urlIfHasDebug(window.top.location.href);
        if(url) {
            var m = /\bdebugLevel=(\d+)/.exec(url);
            pvc.debug = m ? (+m[1]) : 3;
        }
    }
}());

var pv_Mark = pv.Mark;

// goldenRatio proportion
// ~61.8% ~ 38.2%
//pvc.goldenRatio = (1 + Math.sqrt(5)) / 2;

pvc.invisibleFill = 'rgba(127,127,127,0.00001)';

pvc.logSeparator = "------------------------------------------";

var pvc_arraySlice = Array.prototype.slice;

pvc.setDebug = function(level) {
    level = +level;
    pvc.debug = isNaN(level) ? 0 : level;

    pvc_syncLog();
    pvc_syncTipsyLog();

    return pvc.debug;
};

/*global console:true*/

function pvc_syncLog() {
    if (pvc.debug > 0 && typeof console !== "undefined") {
        ['log', 'info', ['trace', 'debug'], 'error', 'warn', ['group', 'groupCollapsed'], 'groupEnd']
        .forEach(function(ps) {
            ps = ps instanceof Array ? ps : [ps, ps];

            pvc_installLog(pvc, ps[0],  ps[1],  '[pvChart]');
        });
    } else {
        if(pvc.debug > 1) { pvc.debug = 1; }

        ['log', 'info', 'trace', 'warn', 'group', 'groupEnd']
        .forEach(function(p) { pvc[p] = def.noop; });

        var _errorPrefix = "[pvChart ERROR]: ";

        pvc.error = function(e) {
            if(e && typeof e === 'object' && e.message) { e = e.message; }

            e = '' + def.nullyTo(e, '');
            if(e.indexOf(_errorPrefix) < 0) { e = _errorPrefix + e; }

            throw new Error(e);
        };
    }

    pvc.logError = pvc.error;

    // Redirect protovis error handler
    pv.error = pvc.error;
}

function pvc_syncTipsyLog() {
    var tip = pv.Behavior.tipsy;
    if(tip && tip.setDebug) {
        tip.setDebug(pvc.debug);
        tip.log = pvc.log;
    }
}

function pvc_installLog(o, pto, pfrom, prompt) {
    if(!pfrom) { pfrom = pto; }
    var c = console;
    var m = c[pfrom] || c.log;
    var fun;
    if(m) {
        var mask = prompt + ": %s";
        if(!def.fun.is(m)) {
            // For IE these are not functions...but simply objects
            // Bind is not available or may be a polyfill that won't work...

            var apply = Function.prototype.apply;
            fun = function() {
                apply.call(m, c, def.array.append([mask], arguments));
            };
        } else {
            // Calls to fun are like direct calls to m...
            // and capture file and line numbers correctly!
            fun = m.bind(c, mask);
        }
    }

    o[pto] = fun;
}

pvc.setDebug(pvc.debug);

/**
 * Gets or sets the default CCC compatibility mode.
 * <p>
 * Use <tt>Infinity</tt> for the <i>latest</i> version.
 * Use <tt>1</tt> for CCC version 1.
 * </p>
 *
 * @param {number} [compatVersion] The new compatibility version.
 */
pvc.defaultCompatVersion = function(compatVersion) {
    var defaults = pvc.BaseChart.prototype.defaults;
    if(compatVersion != null) {
        return defaults.compatVersion = compatVersion;
    }

    return defaults.compatVersion;
};

pvc.cloneMatrix = function(m) {
    return m.map(function(d) { return d.slice(); });
};

pvc.stringify = function(t, keyArgs) {
    var maxLevel = def.get(keyArgs, 'maxLevel') || 5;

    var out = [];
    pvc.stringifyRecursive(out, t, maxLevel, keyArgs);
    return out.join('');
};

pvc.stringifyRecursive = function(out, t, remLevels, keyArgs) {
    if(remLevels > 0) {
        remLevels--;
        switch(typeof t) {
            case 'undefined': return out.push('undefined');
            case 'object':
                if(!t) {
                    out.push('null');
                    return true;
                }

                if(def.fun.is(t.stringify)) {
                    return t.stringify(out, remLevels, keyArgs);
                }

                if(t instanceof Array) {
                    out.push('[');
                    t.forEach(function(item, index) {
                        if(index) { out.push(', '); }
                        if(!pvc.stringifyRecursive(out, item, remLevels, keyArgs)) {
                            out.pop();
                        }
                    });
                    out.push(']');
                } else {
                    var ownOnly = def.get(keyArgs, 'ownOnly', true);
                    if(t === def.global) {
                        out.push('<window>');
                        return true;
                    }

                    if(def.fun.is(t.cloneNode)) {
                        // DOM object
                        out.push('<dom #' + (t.id || t.name || '?') + '>');
                        return true;
                    }

                    if(remLevels > 1 && t.constructor !== Object) {
                        remLevels = 1;
                        ownOnly = true;
                    }

                    out.push('{');
                    var first = true;
                    for(var p in t) {
                        if(!ownOnly || def.hasOwnProp.call(t, p)) {
                            if(!first) { out.push(', '); }
                            out.push(p + ': ');
                            if(!pvc.stringifyRecursive(out, t[p], remLevels, keyArgs)) {
                                out.pop();
                                if(!first) { out.pop(); }
                            } else if(first) {
                                first = false;
                            }
                        }
                    }

                    if(first) {
                        var s = '' + t;
                        if(s !== '[object Object]') { // not very useful
                            out.push('{'+ s + '}');
                        }
                    }

                    out.push('}');
                }
//                    else {
//                        out.push(JSON.stringify("'new ...'"));
//                    }
                return true;

            case 'number':
                out.push(''+(Math.round(100000 * t) / 100000)); // 6 dec places max
                return true;

            case 'boolean':
                out.push(''+t);
                return true;

            case 'string':
                out.push(JSON.stringify(t));
                return true;

            case 'function':
                if(def.get(keyArgs, 'funs', false)) {
                    out.push(JSON.stringify(t.toString().substr(0, 13) + '...'));
                    return true;
                }

                return false;
        }

        out.push("'new ???'");
        return true;
    }
};

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
pvc.extendType = function(type, exts, names) {
    if(exts) {
        var exts2;
        var sceneVars = type.prototype._vars;
        var addExtension = function(ext, n) {
            if(ext !== undefined) {
                if(!exts2) { exts2 = {}; }
                if(sceneVars && sceneVars[n]) {
                    n = '_' + n + 'EvalCore';
                }

                exts2[n] = def.fun.to(ext);
            }
        };

        if(names) {
            names.forEach(function(n) { addExtension(exts[n], n); });
        } else {
            def.each(addExtension);
        }

        if(exts2) { type.add(exts2); }
    }
};

pv.Color.prototype.stringify = function(out, remLevels, keyArgs){
    return pvc.stringifyRecursive(out, this.key, remLevels, keyArgs);
};

pv_Mark.prototype.hasDelegateValue = function(name, tag) {
    var p = this.$propertiesMap[name];
    if(p){
        return (!tag || p.tag === tag);
    }

    // This mimics the way #bind works
    if(this.proto){
        return this.proto.hasDelegateValue(name, tag);
    }

    return false;
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
 * <p>
 * A color scheme function is a factory of protovis color scales.
 * Given the domain values, returns a protovis color scale.
 * The arguments of the function are suitable for passing
 * to a protovis scale's <tt>domain</tt> method.
 * </p>
 *
 * @param {string|pv.Color|string[]|pv.Color[]|pv.Scale|function} [colors=null] A value convertible to a color scheme:
 * a color string,
 * a color object,
 * an array of color strings or objects,
 * a protovis color scale function,
 * a color scale factory function (i.e. a color scheme),
 * or null.
 *
 * @returns {null|function} A color scheme function or null.
 */
pvc.colorScheme = function(colors){
    if(colors == null) { return null; }

    if(typeof colors === 'function') {
        // Assume already a color scheme (a color scale factory)
        if(!colors.hasOwnProperty('range')) { return colors; }

        // A protovis color scale
        // Obtain its range colors array and discard the scale function.
        colors = colors.range();
    } else {
        colors = def.array.as(colors);
    }

    if(!colors.length) { return null; }

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

// TODO: change the name of this
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

pvc.time = {
    intervals: {
        'y':   31536e6,

        'm':   2592e6,
        'd30': 2592e6,

        'w':   6048e5,
        'd7':  6048e5,

        'd':   864e5,
        'h':   36e5,
        'M':   6e4,
        's':   1e3,
        'ms':  1
    },

    withoutTime: function(t){
        return new Date(t.getFullYear(), t.getMonth(), t.getDate());
    },

    weekday: {
        previousOrSelf: function(t, toWd){
            var wd  = t.getDay();
            var difDays = wd - toWd;
            if(difDays){
                // Round to the previous wanted week day
                var previousOffset = difDays < 0 ? (7 + difDays) : difDays;
                t = new Date(t - previousOffset * pvc.time.intervals.d);
            }
            return t;
        },

        nextOrSelf: function(t, toWd){
            var wd  = t.getDay();
            var difDays = wd - toWd;
            if(difDays){
                // Round to the next wanted week day
                var nextOffset = difDays > 0 ? (7 - difDays) : -difDays;
                t = new Date(t + nextOffset * pvc.time.intervals.d);
            }
            return t;
        },

        closestOrSelf: function(t, toWd){
            var wd = t.getDay(); // 0 - Sunday, ..., 6 - Friday
            var difDays = wd - toWd;
            if(difDays){
                var D = pvc.time.intervals.d;
                var sign = difDays > 0 ? 1 : -1;
                difDays = Math.abs(difDays);
                if(difDays >= 4){
                    t = new Date(t.getTime() + sign * (7 - difDays) * D);
                } else {
                    t = new Date(t.getTime() - sign * difDays * D);
                }
            }
            return t;
        }
    }
};

pv.Format.createParser = function(pvFormat) {

    function parse(value) {
        return (value instanceof Date) ? value :
               def.number.is(value)    ? new Date(value) :
               pvFormat.parse(value);
    }

    return parse;
};

pv.Format.createFormatter = function(pvFormat) {

    function format(value) { return value != null ? pvFormat.format(value) : ""; }

    return format;
};

pvc.buildTitleFromName = function(name) {
    // TODO: i18n
    return def.firstUpperCase(name).replace(/([a-z\d])([A-Z])/, "$1 $2");
};

pvc.buildIndexedId = function(prefix, index) {
    if(index > 0) { return prefix + "" + (index + 1); } // base2, ortho3,..., legend2

    return prefix; // base, ortho, legend
};

/**
 * Splits an indexed id into its prefix and index.
 *
 * @param {string} indexedId The indexed id.
 *
 * @type Array
 */
pvc.splitIndexedId = function(indexedId){
    var match = /^(.*?)(\d*)$/.exec(indexedId);
    var index = null;

    if(match[2]) {
        index = Number(match[2]);
        if(index <= 1) {
            index = 1;
        } else {
            index--;
        }
    }

    return [match[1], index];
};

function pvc_unwrapExtensionOne(id, prefix){
    if(id){
        if(def.object.is(id)){
            return id.abs;
        }

        return prefix ? (prefix + def.firstUpperCase(id)) : id;
    }

    return prefix;
}

var pvc_oneNullArray = [null];

pvc.makeExtensionAbsId = function(id, prefix) {
    if(!id) { return prefix; }

    var result = [];

    prefix = def.array.to(prefix) || pvc_oneNullArray;
    id     = def.array.to(id);
    for(var i = 0, I = prefix.length ; i < I ; i++) {
        for(var j = 0, J = id.length ; j < J ; j++) {
            var absId = pvc_unwrapExtensionOne(id[j], prefix[i]);
            if(absId) { result.push(absId); }
        }
    }

    return result;
};

pvc.makeEnumParser = function(enumName, hasKey, dk) {
    if(def.array.is(hasKey)) {
        var keySet = {};
        hasKey.forEach(function(k) { if(k) { keySet[k.toLowerCase()] = k; }});
        hasKey = function(k) { return def.hasOwn(keySet, k); };
    }
    
    if(dk) { dk = dk.toLowerCase(); }

    return function(k) {
        if(k) { k = (''+k).toLowerCase(); }

        if(!hasKey(k)) {
            if(k && pvc.debug >= 2) {
                pvc.warn("Invalid '" + enumName + "' value: '" + k + "'. Assuming '" + dk + "'.");
            }

            k = dk;
        }

        return k;
    };
};

pvc.parseDistinctIndexArray = function(value, min, max){
    value = def.array.as(value);
    if(value == null) { return null; }

    if(min == null) { min = 0; }

    if(max == null) { max = Infinity; }

    var a = def
        .query(value)
        .select(function(index) { return +index; }) // to number
        .where(function(index) { return !isNaN(index) && index >= min && index <= max; })
        .distinct()
        .array();

    return a.length ? a : null;
};

pvc.parseMultiChartOverflow =
    pvc.makeEnumParser('multiChartOverflow', ['grow', 'fit', 'clip'], 'grow');

pvc.parseLegendClickMode =
    pvc.makeEnumParser('legendClickMode', ['toggleSelected', 'toggleVisible', 'none'], 'toggleVisible');

pvc.parseTooltipAutoContent =
    pvc.makeEnumParser('tooltipAutoContent', ['summary', 'value'], 'value');

pvc.parseSelectionMode =
    pvc.makeEnumParser('selectionMode', ['rubberBand', 'focusWindow'], 'rubberBand');

pvc.parseClearSelectionMode =
    pvc.makeEnumParser('clearSelectionMode', ['emptySpaceClick', 'manual'], 'emptySpaceClick');

// ['square', 'circle', 'diamond', 'triangle', 'cross', 'bar']
pvc.parseShape = pvc.makeEnumParser('shape', pv.Scene.hasSymbol, null);

pvc.parseTreemapColorMode =
    pvc.makeEnumParser('colorMode', ['byParent', 'bySelf'], 'byParent');

pvc.parseTreemapLayoutMode =
    pvc.makeEnumParser('layoutMode', ['squarify', 'slice-and-dice', 'slice', 'dice'], 'squarify');

pvc.parseContinuousColorScaleType = function(scaleType) {
    if(scaleType) {
        scaleType = (''+scaleType).toLowerCase();
        switch(scaleType) {
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
        scope = (''+scope).toLowerCase();
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
        mode = (''+mode).toLowerCase();
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
        mode = (''+mode).toLowerCase();
        switch(mode){
            case 'leave':
            case 'hide':
            case 'rotatethenhide':
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
        value = (''+value).toLowerCase();
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
        value = (''+value).toLowerCase();
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
        value = (''+value).toLowerCase();
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
    if(align){ align = (''+align).toLowerCase(); }
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
        anchor = (''+anchor).toLowerCase();
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
        anchor = (''+anchor).toLowerCase();
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
var pvc_Sides = pvc.Sides = function(sides) {
    if(sides != null) { this.setSides(sides); }
};

pvc_Sides.hnames = 'left right'.split(' ');
pvc_Sides.vnames = 'top bottom'.split(' ');
pvc_Sides.names = 'left right top bottom'.split(' ');
pvc_Sides.namesSet = pv.dict(pvc_Sides.names, def.retTrue);

pvc.parsePosition = function(side, defaultSide){
    if(side){
        side = (''+side).toLowerCase();

        if(!def.hasOwn(pvc_Sides.namesSet, side)){
            var newSide = defaultSide || 'left';

            if(pvc.debug >= 2){
                pvc.log(def.format("Invalid position value '{0}. Assuming '{1}'.", [side, newSide]));
            }

            side = newSide;
        }
    }

    return side || defaultSide || 'left';
};

pvc_Sides.as = function(v){
    if(v != null && !(v instanceof pvc_Sides)){
        v = new pvc_Sides().setSides(v);
    }

    return v;
};

pvc_Sides.prototype.stringify = function(out, remLevels, keyArgs){
    return pvc.stringifyRecursive(out, def.copyOwn(this), remLevels, keyArgs);
};

pvc_Sides.prototype.setSides = function(sides){
    if(typeof sides === 'string'){
        var comps = sides.split(/\s+/).map(function(comp){
            return pvc_PercentValue.parse(comp);
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
        if(sides instanceof pvc_PercentValue){
            this.set('all', sides);
        } else {
            this.set('all', sides.all);
            for(var p in sides){
                if(p !== 'all' && pvc_Sides.namesSet.hasOwnProperty(p)){
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

pvc_Sides.prototype.set = function(prop, value){
    value = pvc_PercentValue.parse(value);
    if(value != null){
        if(prop === 'all'){
            // expand
            pvc_Sides.names.forEach(function(p){
                this[p] = value;
            }, this);

        } else if(def.hasOwn(pvc_Sides.namesSet, prop)){
            this[prop] = value;
        }
    }
};

pvc_Sides.prototype.resolve = function(width, height){
    if(typeof width === 'object'){
        height = width.height;
        width  = width.width;
    }

    var sides = {};

    pvc_Sides.names.forEach(function(side){
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

    return pvc_Sides.updateSize(sides);
};

pvc_Sides.updateSize = function(sides){
    sides.width  = (sides.left   || 0) + (sides.right || 0);
    sides.height = (sides.bottom || 0) + (sides.top   || 0);

    return sides;
};

pvc_Sides.resolvedMax = function(a, b){
    var sides = {};

    pvc_Sides.names.forEach(function(side){
        sides[side] = Math.max(a[side] || 0, b[side] || 0);
    });

    return sides;
};

pvc_Sides.inflate = function(sides, by){
    var sidesOut = {};

    pvc_Sides.names.forEach(function(side){
        sidesOut[side] = (sides[side] || 0) + by;
    });

    return pvc_Sides.updateSize(sidesOut);
};

// -------------

var pvc_PercentValue = pvc.PercentValue = function(pct){
    this.percent = pct;
};

pvc_PercentValue.prototype.resolve = function(total){
    return this.percent * total;
};

pvc_PercentValue.parse = function(value){
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
                                return new pvc_PercentValue(n / 100);
                            }
                        } else {
                            return n;
                        }
                    }
                }
                break;

            case 'object':
                if(value instanceof pvc_PercentValue){
                    return value;
                }
                break;
        }

        if(pvc.debug){
            pvc.log(def.format("Invalid margins component '{0}'", [''+value]));
        }
    }
};

pvc_PercentValue.resolve = function(value, total){
    return (value instanceof pvc_PercentValue) ? value.resolve(total) : value;
};

/* Z-Order */

// Backup original methods
var pvc_markRenderCore = pv_Mark.prototype.renderCore,
    pvc_markZOrder = pv_Mark.prototype.zOrder;

pv_Mark.prototype.zOrder = function(zOrder) {
    var borderPanel = this.borderPanel;
    if(borderPanel && borderPanel !== this){
        return pvc_markZOrder.call(borderPanel, zOrder);
    }

    return pvc_markZOrder.call(this, zOrder);
};

/* Render id */
pv_Mark.prototype.renderCore = function() {
    /* Assign a new render id to the root mark */
    var root = this.root;

    root._renderId = (root._renderId || 0) + 1;

    if(pvc.debug >= 25) { pvc.log("BEGIN RENDER " + root._renderId); }

    /* Render */
    pvc_markRenderCore.call(this);

    if(pvc.debug >= 25) { pvc.log("END RENDER " + root._renderId); }
};

pv_Mark.prototype.renderId = function() { return this.root._renderId; };

/* PROPERTIES */
pv_Mark.prototype.wrapper = function(wrapper) {
    this._wrapper = wrapper;
    return this;
};

pv_Mark.prototype.wrap = function(f, m) {
    if(f && def.fun.is(f) && this._wrapper && !f._cccWrapped) {
        f = this._wrapper(f, m);

        f._cccWrapped = true;
    }

    return f;
};

pv_Mark.prototype.lock = function(prop, value){
    if(value !== undefined) {
        this[prop](value);
    }

    (this._locked || (this._locked = {}))[prop] = true;

    return this;
};

pv_Mark.prototype.isIntercepted = function(prop) {
    return this._intercepted && this._intercepted[prop];
};

pv_Mark.prototype.isLocked = function(prop){
    return this._locked && this._locked[prop];
};

pv_Mark.prototype.ensureEvents = function(defEvs) {
    // labels and other marks don't receive events by default
    var events = this.propertyValue('events', /*inherit*/ true);
    if(!events || events === 'none') {
        this.events(defEvs || 'all');
    }
    return this;
};

/* ANCHORS */
/**
 * name = left | right | top | bottom
 */
pv_Mark.prototype.addMargin = function(name, margin) {
    if(margin !== 0) {
        var staticValue = def.nullyTo(this.propertyValue(name), 0),
            fMeasure    = pv.functor(staticValue);

        this[name](function() {
            return margin + fMeasure.apply(this, pvc_arraySlice.call(arguments));
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
pv_Mark.prototype.addMargins = function(margins) {
    var all = def.get(margins, 'all', 0);

    this.addMargin('left',   def.get(margins, 'left',   all));
    this.addMargin('right',  def.get(margins, 'right',  all));
    this.addMargin('top',    def.get(margins, 'top',    all));
    this.addMargin('bottom', def.get(margins, 'bottom', all));

    return this;
};

/* SCENE */
pv_Mark.prototype.eachInstanceWithData = function(fun, ctx) {
    this.eachInstance(function(scenes, index, t) {
        if(scenes.mark.sign && scenes[index].data) {
            fun.call(ctx, scenes, index, t);
        }
    });
};

pv_Mark.prototype.eachSceneWithDataOnRect = function(rect, fun, ctx, selectionMode) {
    var me   = this;
    var sign = me.sign;
    if(sign && !sign.selectable()) { return; } // TODO: shouldn't it be selectableByRubberband?

    // center, partial and total (not implemented)
    if(selectionMode == null) {
        selectionMode = me.rubberBandSelectionMode || 'partial';
    }

    var useCenter = (selectionMode === 'center');

    me.eachInstanceWithData(function(scenes, index, toScreen) {
        // Apply size reduction to tolerate user unprecise selections
        var shape = me.getShape(scenes, index, /*inset margin each side*/0.15);

        shape = (useCenter ? shape.center() : shape).apply(toScreen);

        processShape(shape, scenes[index], index);
    });

    function processShape(shape, instance, index) {
        if (shape.intersectsRect(rect)) {
            var cccScene = instance.data; // exists for sure (ensured by eachInstanceWithData)
            if(cccScene && cccScene.datum) { fun.call(ctx, cccScene); }
        }
    }
};

pv_Mark.prototype.eachDatumOnRect = function(rect, fun, ctx, selectionMode) {
    var me   = this;
    var sign = me.sign;
    if(sign && !sign.selectable()) { return; }

    // center, partial and total (not implemented)
    if(selectionMode == null) {
        selectionMode = me.rubberBandSelectionMode || 'partial';
    }

    var useCenter = (selectionMode === 'center');

    me.eachInstanceWithData(function(scenes, index, toScreen) {
        // Apply size reduction to tolerate user unprecise selections
        var shape = me.getShape(scenes, index, /*inset margin each side*/0.15);

        shape = (useCenter ? shape.center() : shape).apply(toScreen);

        processShape(shape, scenes[index], index);
    });

    function processShape(shape, instance, index) {
        if (shape.intersectsRect(rect)) {
            var cccScene = instance.data; // exists for sure (ensured by eachInstanceWithData)
            if(cccScene && cccScene.datum) {
                cccScene
                    .datums()
                    .each(function(datum) { if(!datum.isNull) { fun.call(ctx, datum); } });
            }
        }
    }
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

// --------------------

var pvc_Size = def.type('pvc.Size')
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
    stringify: function(out, remLevels, keyArgs){
        return pvc.stringifyRecursive(out, def.copyOwn(this), remLevels, keyArgs);
    },

    setSize: function(size, keyArgs){
        if(typeof size === 'string'){
            var comps = size.split(/\s+/).map(function(comp){
                return pvc_PercentValue.parse(comp);
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
            if(size instanceof pvc_PercentValue){
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
        if(value != null && (prop === 'all' || def.hasOwn(pvc_Size.namesSet, prop))){
            value = pvc_PercentValue.parse(value);
            if(value != null){
                if(prop === 'all'){
                    // expand
                    pvc_Size.names.forEach(function(p){
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
        return new pvc_Size(this.width, this.height);
    },

    intersect: function(size){
        return new pvc_Size(
               Math.min(this.width,  size.width),
               Math.min(this.height, size.height));
    },

    resolve: function(refSize){
        var size = {};

        pvc_Size.names.forEach(function(length){
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

pvc_Size.names = ['width', 'height'];
pvc_Size.namesSet = pv.dict(pvc_Size.names, def.retTrue);

pvc_Size.toOrtho = function(value, anchor){
    if(value != null){
        // Single size (a number or a string with only one number)
        // should be interpreted as meaning the orthogonal length.
        var a_ol;
        if(anchor){
            a_ol = pvc.BasePanel.orthogonalLength[anchor];
        }

        value = pvc_Size.to(value, {singleProp: a_ol});

        if(anchor){
            delete value[pvc.BasePanel.oppositeLength[a_ol]];
        }
    }

    return value;
};

pvc_Size.to = function(v, keyArgs){
    if(v != null && !(v instanceof pvc_Size)){
        v = new pvc_Size().setSize(v, keyArgs);
    }

    return v;
};

// --------------------

var pvc_Offset =
def
.type('pvc.Offset')
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
    stringify: function(out, remLevels, keyArgs){
        return pvc.stringifyRecursive(out, def.copyOwn(this), remLevels, keyArgs);
    },

    setOffset: function(offset, keyArgs){
        if(typeof offset === 'string'){
            var comps = offset.split(/\s+/).map(function(comp){
                return pvc_PercentValue.parse(comp);
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
        if(value != null && def.hasOwn(pvc_Offset.namesSet, prop)){
            value = pvc_PercentValue.parse(value);
            if(value != null){
                if(prop === 'all'){
                    // expand
                    pvc_Offset.names.forEach(function(p){
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

        pvc_Size.names.forEach(function(length){
            var offsetProp  = pvc_Offset.namesSizeToOffset[length];
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

pvc_Offset
.addStatic({ names: ['x', 'y'] })
.addStatic({
    namesSet: pv.dict(pvc_Offset.names, def.retTrue),
    namesSizeToOffset: {width: 'x', height: 'y'},
    namesSidesToOffset: {left: 'x', right: 'x', top: 'y', bottom: 'y'},
    as: function(v) {
        if(v != null && !(v instanceof pvc_Offset)) {
            v = new pvc_Offset().setOffset(v);
        }

        return v;
    }
});

/**
 * Implements support for svg detection
 */
(function($) {
    /*global document:true */
    jQuery.support.svg = jQuery.support.svg ||
        document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
}(/*global jQuery:true */jQuery));

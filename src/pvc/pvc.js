/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc:true */

def.globalSpace('pvc', pvc);

/**
 * @expose
 * 0 - off
 * 1 - errors
 * 2 - errors, warnings
 * 3 - errors, warnings, info
 * 4 - verbose
 * 5 - trash
 * ...
 */
pvc.debug = 0;

// Check URL debug and debugLevel
(function() {
    /*global window:true*/
    if((typeof window.location) !== 'undefined') {
        var url = window.location.href;
        if(url && (/\bdebug=true\b/).test(url)) {
            var m = /\bdebugLevel=(\d+)/.exec(url);
            pvc.debug = m ? (+m[1]) : 3;
        }
    }
}());

var pv_Mark = pv.Mark;

// goldenRatio proportion
// ~61.8% ~ 38.2%
//pvc.goldenRatio = (1 + Math.sqrt(5)) / 2;

/** @expose */
pvc.invisibleFill = 'rgba(127,127,127,0.00001)';

pvc.logSeparator = "------------------------------------------";

var pvc_arraySlice = Array.prototype.slice;

/** @expose */
pvc.setDebug = function(level) {
    level = +level;
    pvc.debug = isNaN(level) ? 0 : level;

    pvc_syncLog();
    pvc_syncTipsyLog();

    return pvc.debug;
};

/*global console:true*/

function pvc_syncLog() {
    if (pvc.debug && typeof console !== "undefined") {
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
 * @expose
 */
pvc.defaultCompatVersion = function(compatVersion) {
    var defaults = pvc.BaseChart.prototype.defaults;
    if(compatVersion != null) { return (defaults.compatVersion = compatVersion); }

    return defaults.compatVersion;
};

/** @expose */
pvc.cloneMatrix = function(m) {
    return m.map(function(d) { return d.slice(); });
};

var J_stringify = typeof JSON !== 'undefined' ? JSON.stringify : String;

/** @expose */
pvc.stringify = function(t, keyArgs) {
    var maxLevel = def.get(keyArgs, 'maxLevel') || 5;
    var out = [];
    pvc.stringifyRecursive(out, t, maxLevel, keyArgs);
    return out.join('');
};

/** @expose */
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

                var f = t.stringify;
                if(def.fun.is(f)) { return f.call(t, out, remLevels, keyArgs); }

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
                return true;

            case 'number':
                out.push(''+(Math.round(100000 * t) / 100000)); // 6 dec places max
                return true;

            case 'boolean':
                out.push(''+t);
                return true;

            case 'string':
                out.push(J_stringify(t));
                return true;

            case 'function':
                if(def.get(keyArgs, 'funs'/*, false*/)) {
                    out.push(J_stringify(t.toString().substr(0, 13) + '...'));
                    return true;
                }

                return false;
        }

        out.push("'new ???'");
        return true;
    }
};

/** @expose */
pvc.orientation = {
    'vertical':   'vertical',
    'horizontal': 'horizontal'
};

/**
 * To tag pv properties set by extension points
 * @type {string}
 * @see pvc.BaseChart#extend
 * @private
 */
var pvc_extensionTag = 'extension';

/**
 * Extends a type created with {@link def.type}
 * with the properties in {@link exts},
 * possibly constrained to the properties of specified names.
 * <p>
 * The properties whose values are not functions
 * are converted to constant functions that return the original value.
 * </p>
 * @param {Function} type
 *      The type to extend.
 * @param {object} [exts]
 *      The extension object whose properties will extend the type.
 * @param {Array.<string>} [names]
 *      The allowed property names.
 *
 * @private
 */
var pvc_extendType = function(type, exts, names) {
    if(exts) {
        var exts2;
        var sceneVars = type.prototype._vars;
        var addExtension = function(ext, n) {
            if(ext !== undefined) {
                if(!exts2) { exts2 = {}; }
                if(sceneVars && sceneVars[n]) { n = '_' + n + 'EvalCore'; }

                exts2[n] = def.fun.to(ext);
            }
        };

        if(names) { names.forEach(function(n) { addExtension(exts[n], n); }); }
        else      { def.each(addExtension); }

        if(exts2) { type.add(exts2); }
    }
};

/** @expose */
pv.Color.prototype.stringify = function(out, remLevels, keyArgs) {
    return pvc.stringifyRecursive(out, this.key, remLevels, keyArgs);
};

/** @expose */
pv_Mark.prototype.hasDelegateValue = function(name, tag) {
    var p = this.$propertiesMap[name];
    if(p) { return (!tag || p.tag === tag); }

    // This mimics the way #bind works
    return !!this.proto && this.proto.hasDelegateValue(name, tag);
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
 * @type {Function}
 * @expose
 */
pvc.defaultColorScheme = null;

/** @expose */
pvc.brighterColorTransform = function(color) {
    return (color.rgb ? color : pv.color(color)).brighter(0.6);
};

/**
 * Sets the colors of the default color scheme used by charts
 * to a specified color array.
 * <p>
 * If null is specified, the default color scheme is reset to its original value.
 * </p>
 *
 * @param {string|pv.Color|Array.<string>|Array.<pv.Color>|pv.Scale|Function} [colors=null] Something convertible to a color scheme by {@link pvc.colorScheme}.
 * @return {null|pv.Scale} A color scale function or null.
 * @expose
 */
pvc.setDefaultColorScheme = function(colors) {
    return (pvc.defaultColorScheme = pvc.colorScheme(colors));
};

/** @expose */
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
 * @param {string|pv.Color|Array.<string>|Array.<pv.Color>|pv.Scale|Function} [colors=null] A value convertible to a color scheme:
 * a color string,
 * a color object,
 * an array of color strings or objects,
 * a protovis color scale function,
 * a color scale factory function (i.e. a color scheme),
 * or null.
 *
 * @returns {null|Function} A color scheme function or null.
 * @expose
 */
pvc.colorScheme = function(colors) {
    if(colors == null) { return null; }

    if(def.fun.is(colors)) {
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
 * @param {string|pv.Color|Array.<string>|Array.<pv.Color>|pv.Scale|Function} [colors=null]
 *     Something convertible to a color scheme by {@link pvc.colorScheme}.
 * @return {Function} the color scheme.
 * @expose
 * @see {pvc.defaultColorScheme}
 */
pvc.createColorScheme = function(colors) {
    return pvc.colorScheme(colors) ||
           pvc.defaultColorScheme  ||
           pv.Colors.category10;
};

// Convert to Grayscale using YCbCr luminance conv.
/** @expose */
pvc.toGrayScale = function(color, alpha, maxGrayLevel, minGrayLevel) {
    color = pv.color(color);

    var avg = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    // Don't let the color get near white, or it becomes unperceptible in most monitors
    if(maxGrayLevel === undefined) { maxGrayLevel = 200; }
    else if(maxGrayLevel == null)  { maxGrayLevel = 255; } // no effect

    if(minGrayLevel === undefined) { minGrayLevel = 30; }
    else if(minGrayLevel == null)  { minGrayLevel = 0;  } // no effect

    var delta = (maxGrayLevel - minGrayLevel);
    if(delta <= 0) { avg = maxGrayLevel; }
    else           { avg = minGrayLevel + (avg / 255) * delta; } // Compress

    if(alpha == null)  { alpha = color.opacity; }
    else if(alpha < 0) { alpha = (-alpha) * color.opacity; }

    avg = Math.round(avg);

    return pv.rgb(avg, avg, avg, alpha);
};

// TODO: change the name of this
/** @expose */
pvc.removeTipsyLegends = function() {
    try {
        $('.tipsy').remove();
    } catch(e) {
        // Do nothing
    }
};

/** @expose */
pvc.time = {
    'intervals': {
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

    'withoutTime': function(t) {
        return new Date(t.getFullYear(), t.getMonth(), t.getDate());
    },

    'weekday': {
        'previousOrSelf': function(t, toWd) {
            var wd  = t.getDay();
            var difDays = wd - toWd;
            if(difDays) {
                // Round to the previous wanted week day
                var previousOffset = difDays < 0 ? (7 + difDays) : difDays;
                t = new Date(t - previousOffset * pvc.time.intervals.d);
            }
            return t;
        },

        'nextOrSelf': function(t, toWd) {
            var wd  = t.getDay();
            var difDays = wd - toWd;
            if(difDays) {
                // Round to the next wanted week day
                var nextOffset = difDays > 0 ? (7 - difDays) : -difDays;
                t = new Date(t + nextOffset * pvc.time.intervals.d);
            }
            return t;
        },

        'closestOrSelf': function(t, toWd) {
            var wd = t.getDay(); // 0 - Sunday, ..., 6 - Friday
            var difDays = wd - toWd;
            if(difDays) {
                var D = pvc.time.intervals.d;
                var sign = difDays > 0 ? 1 : -1;
                difDays = Math.abs(difDays);
                if(difDays >= 4) {
                    t = new Date(t.getTime() + sign * (7 - difDays) * D);
                } else {
                    t = new Date(t.getTime() - sign * difDays * D);
                }
            }
            return t;
        }
    }
};

var pv_format_createParser = function(pvFormat) {
    return function(value) { return pvFormat.parse(value); };
};

var pv_format_createFormatter = function(pvFormat) {
    return function(value) { return value != null ? pvFormat.format(value) : ""; }
};

var pvc_buildTitleFromName = function(name) {
    // TODO: i18n
    return def.firstUpperCase(name).replace(/([a-z\d])([A-Z])/, "$1 $2");
};

var pvc_buildIndexedId = function(prefix, index) {
    if(index > 0) { return prefix + "" + (index + 1); } // base2, ortho3,..., legend2
    return prefix; // base, ortho, legend
};

/**
 * Splits an indexed id into its prefix and index.
 *
 * @param {string} indexedId The indexed id.
 * @return {Array.<*>}
 */
var pvc_splitIndexedId = function(indexedId) {
    var match = /^(.*?)(\d*)$/.exec(indexedId);
    var index = null;

    if(match[2]) {
        index = Number(match[2]);
        if(index <= 1) { index = 1; }
        else           { index--;   }
    }

    return [match[1], index];
};

var pvc_unwrapExtensionOne = function(id, prefix) {
    return !id               ? prefix :
           def.object.is(id) ? id['abs'] :
           prefix            ? (prefix + def.firstUpperCase(id)) :
           id;
};

var pvc_oneNullArray = [null];

var pvc_makeExtensionAbsId = function(id, prefix) {
    if(!id) { return prefix; }

    return def
       .query(prefix || pvc_oneNullArray)
       .selectMany(function(oneprefix) {
           return def
               .query(id)
               .select(function(oneid) { return pvc_unwrapExtensionOne(oneid, oneprefix); });
       })
       .where(def.truthy)
       .array();
};

var pvc_makeEnumParser = function(enumName, keys, dk) {
    var keySet = {};
    keys.forEach(function(k){ if(k) { keySet[k.toLowerCase()] = k; }});
    if(dk) { dk = dk.toLowerCase(); }

    return function(k) {
        if(k) { k = (''+k).toLowerCase(); }

        if(!def.hasOwn(keySet, k)) {
            if(k && pvc.debug >= 2) {
                pvc.log("[Warning] Invalid '" + enumName + "' value: '" + k + "'. Assuming '" + dk + "'.");
            }

            k = dk;
        }

        return k;
    };
};

var pvc_parseDistinctIndexArray = function(value, min, max) {
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

var pvc_parseLegendClickMode =
    pvc_makeEnumParser('legendClickMode', ['toggleSelected', 'toggleVisible', 'none'], 'toggleVisible');

var pvc_parseLegendClickMode =
    pvc_makeEnumParser('tooltipAutoContent', ['summary', 'value'], 'value');

var pvc_parseSelectionMode =
    pvc_makeEnumParser('selectionMode', ['rubberBand', 'focusWindow'], 'rubberBand');

var pvc_parseClearSelectionMode =
    pvc_makeEnumParser('clearSelectionMode', ['emptySpaceClick', 'manual'], 'emptySpaceClick');

var pvc_parseShape =
    pvc_makeEnumParser('shape', ['square', 'circle', 'diamond', 'triangle', 'cross', 'bar'], null);

var pvc_parseTreemapColorMode =
    pvc_makeEnumParser('colorMode', ['byParent', 'bySelf'], 'byParent');

var pvc_parseTreemapLayoutMode =
    pvc_makeEnumParser('layoutMode', ['squarify', 'slice-and-dice', 'slice', 'dice'], 'squarify');

var pvc_parseContinuousColorScaleType = function(scaleType) {
    if(scaleType) {
        scaleType = (''+scaleType).toLowerCase();
        switch(scaleType) {
            case 'linear':
            case 'normal':
            case 'discrete':
                break;

            default:
                if(pvc.debug >= 2) {
                    pvc.log("[Warning] Invalid 'ScaleType' option value: '" + scaleType + "'.");
                }

                scaleType = null;
                break;
        }
    }

    return scaleType;
};

var pvc_parseDomainScope = function(scope, orientation) {
    if(scope) {
        scope = (''+scope).toLowerCase();
        switch(scope) {
            case 'cell':
            case 'global':
                break;

            case 'section': // row (for y) or col (for x), depending on the associated orientation
                if(!orientation) { throw def.error.argumentRequired('orientation'); }

                scope = orientation === 'y' ? 'row' : 'column';
                break;

            case 'column':
            case 'row':
                if(orientation && orientation !== (scope === 'row' ? 'y' : 'x')) {
                    scope = 'section';

                    if(pvc.debug >= 2) {
                        pvc.log("[Warning] Invalid 'DomainScope' option value: '" + scope + "' for the orientation: '" + orientation + "'.");
                    }
                }
                break;

            default:
                if(pvc.debug >= 2) {
                    pvc.log("[Warning] Invalid 'DomainScope' option value: '" + scope + "'.");
                }

                scope = null;
                break;
        }
    }

    return scope;
};

var pvc_parseDomainRoundingMode = function(mode) {
    if(mode) {
        mode = (''+mode).toLowerCase();
        switch(mode) {
            case 'none':
            case 'nice':
            case 'tick':
                break;

            default:
                if(pvc.debug >= 2) {
                    pvc.log("[Warning] Invalid 'DomainRoundMode' value: '" + mode + "'.");
                }

                mode = null;
                break;
        }
    }

    return mode;
};

var pvc_parseOverlappedLabelsMode = function(mode) {
    if(mode) {
        mode = (''+mode).toLowerCase();
        switch(mode) {
            case 'leave':
            case 'hide':
            case 'rotatethenhide':
                break;

            default:
                if(pvc.debug >= 2) {
                    pvc.log("[Warning] Invalid 'OverlappedLabelsMode' option value: '" + mode + "'.");
                }

                mode = null;
                break;
        }
    }

    return mode;
};

var pvc_castNumber = function(value) {
    if(value != null) {
        value = +value; // to number
        if(isNaN(value)) { value = null; }
    }
    return value;
};

var pvc_parseWaterDirection = function(value) {
    if(value) {
        value = (''+value).toLowerCase();
        switch(value) {
            case 'up':
            case 'down': return value;
        }

        if(pvc.debug >= 2) { pvc.log("[Warning] Invalid 'WaterDirection' value: '" + value + "'."); }
    }
};

var pvc_parseTrendType = function(value) {
    if(value) {
        value = (''+value).toLowerCase();
        if(value === 'none') { return value; }
        if(pvc.trends.has(value)) { return value; }
        if(pvc.debug >= 2) { pvc.log("[Warning] Invalid 'TrendType' value: '" + value + "'."); }
    }
};

var pvc_parseNullInterpolationMode = function(value) {
    if(value) {
        value = (''+value).toLowerCase();
        switch(value) {
            case 'none':
            case 'linear':
            case 'zero': return value;
        }

        if(pvc.debug >= 2) { pvc.log("[Warning] Invalid 'NullInterpolationMode' value: '" + value + "'."); }
    }
};

var pvc_parseAlign = function(side, align) {
    if(align){ align = (''+align).toLowerCase(); }
    var align2, isInvalid;
    if(side === 'left' || side === 'right') {
        align2 = align && pvc.BasePanel.verticalAlign[align];
        if(!align2) {
            align2 = 'middle';
            isInvalid = !!align;
        }
    } else {
        align2 = align && pvc.BasePanel.horizontalAlign[align];
        if(!align2) {
            align2 = 'center';
            isInvalid = !!align;
        }
    }

    if(isInvalid && pvc.debug >= 2) {
        pvc.log(def.format("Invalid alignment value '{0}'. Assuming '{1}'.", [align, align2]));
    }

    return align2;
};

// suitable for protovis.anchor(..) of all but the Wedge mark...
var pvc_parseAnchor = function(anchor) {
    if(anchor) {
        anchor = (''+anchor).toLowerCase();
        switch(anchor) {
            case 'top':
            case 'left':
            case 'center':
            case 'bottom':
            case 'right': return anchor;
        }

        if(pvc.debug >= 2) { pvc.log(def.format("Invalid anchor value '{0}'.", [anchor])); }
    }
};

var pvc_parseAnchorWedge = function(anchor) {
    if(anchor) {
        anchor = (''+anchor).toLowerCase();
        switch(anchor) {
            case 'outer':
            case 'inner':
            case 'center':
            case 'start':
            case 'end': return anchor;
        }

        if(pvc.debug >= 2) { pvc.log(def.format("Invalid wedge anchor value '{0}'.", [anchor])); }
    }
};

var pvc_unionExtents = function(result, range) {
    if(!result) {
        if(!range) { return null; }
        result = {'min': range.min, 'max': range.max};
    } else if(range) {
        if(range.min < result.min) { result.min = range.min; }
        if(range.max > result.max) { result.max = range.max; }
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
var pvc_Sides =

    /** @expose */
    pvc.Sides = function(sides) { if(sides != null) { this.setSides(sides); } };

var pvc_Sides_hnames = 'left right'.split(' ');
var pvc_Sides_vnames = 'top bottom'.split(' ');
var pvc_Sides_names  = 'left right top bottom'.split(' ');
var pvc_Sides_namesSet = pv.dict(pvc_Sides_names, def.retTrue);

pvc.parsePosition = function(side, defaultSide) {
    if(side) {
        side = (''+side).toLowerCase();

        if(!def.hasOwn(pvc_Sides_namesSet, side)) {
            var newSide = defaultSide || 'left';

            if(pvc.debug >= 2) {
                pvc.log(def.format("Invalid position value '{0}. Assuming '{1}'.", [side, newSide]));
            }

            side = newSide;
        }
    }

    return side || defaultSide || 'left';
};

/** @expose */
pvc_Sides.as = function(v) {
    if(v != null && !(v instanceof pvc_Sides)) {
        v = new pvc_Sides().setSides(v);
    }

    return v;
};

/** @expose */
pvc_Sides.prototype.stringify = function(out, remLevels, keyArgs) {
    return pvc.stringifyRecursive(out, def.copyOwn(this), remLevels, keyArgs);
};

/** @expose */
pvc_Sides.prototype.setSides = function(sides) {
    if(def.string.is(sides)) {
        var cs = sides.split(/\s+/) // comps
            .map(function(c) { return pvc_PercentValue.parse(c); });

        switch(cs.length) {
            case 1: return this.set('all', cs[0]);
            case 2: return this.set('top', cs[0]).set('left',  cs[1]).set('right',  cs[1]).set('bottom', cs[0]);
            case 3: return this.set('top', cs[0]).set('left',  cs[1]).set('right',  cs[1]).set('bottom', cs[2]);
            case 4: return this.set('top', cs[0]).set('right', cs[1]).set('bottom', cs[2]).set('left',   cs[3]);
            case 0: return this;
        }
    } else if(def.number.is(sides)) {
        return this.set('all', sides);
    } else if (sides == null || def.object.is(sides)) {
        if(sides instanceof pvc_PercentValue) {
            this.set('all', sides);
        } else {
            this.set('all', sides.all);
            for(var p in sides) { // tolerates null
                if(p !== 'all' && pvc_Sides_namesSet.hasOwnProperty(p)) {
                    this.set(p, sides[p]);
                }
            }
        }

        return this;
    }

    if(pvc.debug) { pvc.log("Invalid 'sides' value: " + pvc.stringify(sides)); }

    return this;
};

/** @expose */
pvc_Sides.prototype.set = function(prop, value) {
    value = pvc_PercentValue.parse(value);
    if(value != null) {
        if(prop === 'all') {
            // expand
            pvc_Sides_names.forEach(function(p) { this[p] = value; }, this);
        } else if(def.hasOwn(pvc_Sides_namesSet, prop)) {
            this[prop] = value;
        }
    }
    return this;
};

/** @expose */
pvc_Sides.prototype.resolve = function(width, height) {
    if(typeof width === 'object') {
        height = width.height;
        width  = width.width;
    }

    var sides = {};

    pvc_Sides_names.forEach(function(side) {
        var value  = 0;
        var sideValue = this[side];
        if(sideValue != null) {
            if(typeof(sideValue) === 'number') {
                value = sideValue;
            } else {
                value = sideValue.resolve((side === 'left' || side === 'right') ? width : height);
            }
        }

        sides[side] = value;
    }, this);

    return pvc_Sides.updateSize(sides);
};

pvc_Sides.updateSize = function(sides) {
    sides.width  = (sides.left   || 0) + (sides.right || 0);
    sides.height = (sides.bottom || 0) + (sides.top   || 0);
    return sides;
};

pvc_Sides.resolvedMax = function(a, b) {
    var sides = {};

    pvc_Sides_names.forEach(function(side) {
        sides[side] = Math.max(a[side] || 0, b[side] || 0);
    });

    return sides;
};

pvc_Sides.inflate = function(sides, by) {
    var sidesOut = {};
    pvc_Sides_names.forEach(function(side) { sidesOut[side] = (sides[side] || 0) + by; });
    return pvc_Sides.updateSize(sidesOut);
};

// -------------

var pvc_PercentValue =
    /** @expose */
    pvc.PercentValue = function(pct) {
        /** @expose */
        this.percent = pct;
    };

/** @expose */
pvc_PercentValue.prototype.resolve = function(total) { return this.percent * total; };

/** @expose */
pvc_PercentValue.parse = function(value) {
    if(value != null && value !== '') {
        switch(typeof value) {
            case 'number': return value;
            case 'string':
                var match = value.match(/^(.+?)\s*(%)?$/);
                if(match) {
                    var n = +match[1];
                    if(!isNaN(n)) {
                        if(match[2]) {
                            if(n >= 0) { return new pvc_PercentValue(n / 100); }
                        } else {
                            return n;
                        }
                    }
                }
                break;

            case 'object': if(value instanceof pvc_PercentValue) { return value; } break;
        }

        if(pvc.debug) { pvc.log(def.format("Invalid margins component '{0}'", [''+value])); }
    }
};

/** @expose */
pvc_PercentValue.resolve = function(value, total) {
    return (value instanceof pvc_PercentValue) ? value.resolve(total) : value;
};

/* Z-Order */

// Backup original methods
var pvc_markRenderCore = pv_Mark.prototype.renderCore,
    pvc_markZOrder = pv_Mark.prototype.zOrder;

/** @expose */
pv_Mark.prototype.zOrder = function(zOrder) {
    var borderPanel = this.borderPanel;
    return (borderPanel && borderPanel !== this)
        ? pvc_markZOrder.call(borderPanel, zOrder)
        : pvc_markZOrder.call(this, zOrder);
};

/* Render id */
pv_Mark.prototype.renderCore = function() {
    /* Assign a new render id to the root mark */
    var root = this.root;

    root._renderId = (root._renderId || 0) + 1;

    /* Render */
    pvc_markRenderCore.call(this);
};

/** @expose */
pv_Mark.prototype.renderId = function() { return this.root._renderId; };

/**
 * @expose
 * @type {pvc.visual.BasicSign}
 */
pv_Mark.prototype.sign;

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

pv_Mark.prototype.lock = function(prop, value) {
    if(value !== undefined) { this[prop](value); }

    (this._locked || (this._locked = {}))[prop] = true;

    return this;
};

pv_Mark.prototype.isIntercepted = function(prop) {
    return this._intercepted && this._intercepted[prop];
};

pv_Mark.prototype.isLocked = function(prop) {
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

    return this
        .addMargin('left',   def.get(margins, 'left',   all))
        .addMargin('right',  def.get(margins, 'right',  all))
        .addMargin('top',    def.get(margins, 'top',    all))
        .addMargin('bottom', def.get(margins, 'bottom', all));
};

/* SCENE */

/**
 * A protovis scene whose mark has a corresponding sign.
 * @typedef {{
 *     data: pvc.visual.Scene,
 *     sign: pvc.visual.Sign
 * }} SceneOfMarkWithSign
 */

/**
 * A protovis scenes object whose mark has a corresponding sign.
 * @typedef {Array.<SceneOfMarkWithSign>} ScenesOfMarkWithSign
 * @property {pv.Mark} mark the mark to ehich the scenes belong.
 */

/**
 * Enumerates every protovis scene of the mark that has data.
 * @param {function(ScenesOfMarkWithSign, number, pv.Transform)} fun
 *     function to call on each protovis scene instance.
 * @param {object=} ctx object on which to call function.
 */
pv_Mark.prototype.eachInstanceWithData = function(fun, ctx) {
    this.eachInstance(function(scenes, index, toScreen) {
        if(scenes.mark.sign && scenes[index].data) {
            fun.call(ctx, scenes, index, toScreen);
        }
    });
};

/**
 * Enumerates every instance of the mark that has data and intersects a given rectangle.
 * @param {!pv.Shape.Rect} rect rectangle that encompasses the scene instances.
 * @param {function(pvc.visual.Scene)} fun function to call on each intersecting CCC's scene.
 * @param {object=} ctx object on which to call function.
 * @param {?string=} [selectionMode='partial'] specified a default intersection selection mode,
 * for using when a mark does not specify one.
 */
pv_Mark.prototype.eachSceneWithDataOnRect = function(rect, fun, ctx, selectionMode) {
    var me   = this;
    var sign = me.sign;
    if(sign && !sign.selectable()) { return; } // TODO: shouldn't it be selectableByRubberband?

    // center, partial and total (not implemented)
    if(selectionMode == null) { selectionMode = me.rubberBandSelectionMode || 'partial'; }

    var useCenter = (selectionMode === 'center');

    me.eachInstanceWithData(function(scenes, index, toScreen) {
        // Apply size reduction to tolerate user unprecise selections
        var shape = me.getShape(scenes, index, /*inset margin each side*/0.15);

        shape = (useCenter ? shape.center() : shape).apply(toScreen);

        processShape(shape, scenes[index], index);
    });

    /**
     * Detects if the shape of an instance intersects the rectangle.
     * @param {!pv.Shape} shape the shape to process.
     * @param {!SceneOfMarkWithSign} instance the protovis instance.
     * @param {number} index the index of the instance.
     */
    function processShape(shape, instance, index) {
        if (shape.intersectsRect(rect)) {
            var cccScene = instance.data; // exists for sure (ensured by eachInstanceWithData)
            if(cccScene.datum) { fun.call(ctx, cccScene); }
        }
    }
};

/* BOUNDS */
pv.Transform.prototype.transformHPosition = function(left) { return this.x + (this.k * left); };
pv.Transform.prototype.transformVPosition = function(top ) { return this.y + (this.k * top ); };

// width / height
pv.Transform.prototype.transformLength = function(length) { return this.k * length; };

// --------------------
var pv_DomNode = pv.Dom.Node;

/**
 * Obtains a query enumerable of the child nodes.
 * @type def.Query.<pv.Dom.Node>
 * @expose
 */
pv_DomNode.prototype.children = function() {
    var cs = this.childNodes;
    return cs.length ? def.query(cs) : def.query();
};

/**
 * Obtains the number of children.
 * @type {number}
 * @expose
 */
pv_DomNode.prototype.childCount = function() {
    return this.childNodes.length;
};


// --------------------

/**
 * @typedef {{
 *  width:  ?(number|string),
 *  height: ?(number|string),
 *  all:    ?(number|string),
 * }} pvc.SizeStruct
 */

/**
 * @typedef {(pvc.SizeStruct | pvc.Size)} pvc.SizeLike
 */

/**
 * @typedef {{
 *  singleProp: ?string
 * }} pvc.SetSizeArgs
 */


var pvc_Size = def.type('pvc.Size').init(
/**
 * @name pvc.Size
 * @constructor
 * @param {?(string|number|pvc.SizeLike)} width the width of the size object or
 *      an object containing width and height properties.
 * @param {?number=} height the height of the size object.
 * @expose
 */
function(width, height) {
    if(arguments.length === 1) {
        if(width != null) { this.setSize(width); }
    } else {
        if(width  != null) { this.width  = width;  }
        if(height != null) { this.height = height; }
    }
})
.add({
    /**
     * Builds a string representation of the size object.
     * @returns {boolean} indicates that a string representation is
     *      defined and is not to be cancelled.
     * @expose
     */
    stringify: function(out, remLevels, keyArgs) {
        return pvc.stringifyRecursive(out, def.copyOwn(this), remLevels, keyArgs);
    },


    /**
     * @param {!(string|number|pvc.SizeLike)} size the size specification.
     * @param {pvc.SetSizeArgs} keyArgs keyword arguments.
     * @expose
     */
    setSize: function(size, keyArgs) {
        if(typeof size === 'string') {
            var cs = size.split(/\s+/)
                .map(function(comp) { return pvc_PercentValue.parse(comp); });

            switch(cs.length) {
                case 1: return this.set(def.get(keyArgs, 'singleProp', 'all'), cs[0]);
                case 2: return this.set('width', cs[0]).set('height', cs[1]);
                case 0: return this;
            }
        } else if(typeof size === 'number') {
            return this.set(def.get(keyArgs, 'singleProp', 'all'), size);
        } else if (typeof size === 'object') {
            if(size instanceof pvc_PercentValue){
                this.set(def.get(keyArgs, 'singleProp', 'all'), size);
            } else {
                this.set('all', size.all);
                for(var p in size) { if(p !== 'all') { this.set(p, size[p]); } }
            }
            return this;
        }

        if(pvc.debug) { pvc.log("Invalid 'size' value: " + pvc.stringify(size)); }

        return this;
    },

    /** @expose */
    set: function(prop, value) {
        if(value != null && (prop === 'all' || def.hasOwn(pvc_Size.namesSet, prop))) {
            value = pvc_PercentValue.parse(value);
            if(value != null) {
                if(prop === 'all') {
                    // expand
                    pvc_Size.names.forEach(function(p) { this[p] = value; }, this);
                } else {
                    this[prop] = value;
                }
            }
        }

        return this;
    },

    /** @expose */
    clone: function() { return new pvc_Size(this.width, this.height); },

    /** @expose */
    intersect: function(size) {
        return new pvc_Size(
               Math.min(this.width,  size.width),
               Math.min(this.height, size.height));
    },

    /** @expose */
    resolve: function(refSize) {
        var size = {};

        pvc_Size.names.forEach(function(length) {
            var lengthValue = this[length];
            if(lengthValue != null) {
                if(typeof(lengthValue) === 'number') {
                    size[length] = lengthValue;
                } else if(refSize) {
                    var refLength = refSize[length];
                    if(refLength != null) {
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

pvc_Size.toOrtho = function(value, anchor) {
    if(value != null) {
        // Single size (a number or a string with only one number)
        // should be interpreted as meaning the orthogonal length.
        var a_ol;
        if(anchor) { a_ol = pvc.BasePanel.orthogonalLength[anchor]; }
        value = pvc_Size.to(value, {singleProp: a_ol});
        if(anchor) { delete value[pvc.BasePanel.oppositeLength[a_ol]]; }
    }
    return value;
};

pvc_Size.to = function(v, keyArgs) {
    if(v != null && !(v instanceof pvc_Size)) {
        v = new pvc_Size().setSize(v, keyArgs);
    }

    return v;
};

// --------------------

var pvc_Offset =
/**
 * @name pvc.Offset
 * @expose
 */
def
.type('pvc.Offset')
.init(function(x, y) {
    if(arguments.length === 1) {
        if(x != null) { this.setOffset(x); }
    } else {
        if(x != null) { this.x = x; }
        if(y != null) { this.y = y; }
    }
})
.add({
    /** @expose */
    stringify: function(out, remLevels, keyArgs) {
        return pvc.stringifyRecursive(out, def.copyOwn(this), remLevels, keyArgs);
    },

    /** @expose */
    setOffset: function(offset, keyArgs) {
        if(typeof offset === 'string') {
            var cs = offset.split(/\s+/)
                .map(function(comp) { return pvc_PercentValue.parse(comp); });

            switch(cs.length) {
                case 1: return this.set(def.get(keyArgs, 'singleProp', 'all'), cs[0]);
                case 2: return this.set('x', cs[0]).set('y', cs[1]);
                case 0: return this;
            }
        } else if(typeof offset === 'number') {
            return this.set(def.get(keyArgs, 'singleProp', 'all'), offset);
        } else if (typeof offset === 'object') {
            this.set('all', offset.all);
            for(var p in offset) { if(p !== 'all') { this.set(p, offset[p]); } }
            return this;
        }

        if(pvc.debug) { pvc.log("Invalid 'offset' value: " + pvc.stringify(offset)); }
        return this;
    },

    /** @expose */
    set: function(prop, value) {
        if(value != null && def.hasOwn(pvc_Offset.namesSet, prop)) {
            value = pvc_PercentValue.parse(value);
            if(value != null) {
                if(prop === 'all') {
                    // expand
                    pvc_Offset.names.forEach(function(p) { this[p] = value; }, this);
                } else {
                    this[prop] = value;
                }
            }
        }
        return this;
    },

    /** @expose */
    resolve: function(refSize) {
        var offset = {};

        pvc_Size.names.forEach(function(length) {
            var offsetProp  = pvc_Offset.namesSizeToOffset[length];
            var offsetValue = this[offsetProp];
            if(offsetValue != null) {
                if(typeof(offsetValue) === 'number') {
                    offset[offsetProp] = offsetValue;
                } else if(refSize) {
                    var refLength = refSize[length];
                    if(refLength != null) {
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

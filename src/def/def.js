/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/** @private */
var arraySlice = Array.prototype.slice;

/** @private */
var objectHasOwn = Object.prototype.hasOwnProperty;

// Also requires:
// Array.prototype.filter
// Array.prototype.forEach

if(!Object.keys) {
    /** @ignore */
    Object.keys = function(o) {
        /* Object function not being used as a constructor */
        /*jshint newcap:false */
        if (o !== Object(o)) { throw new TypeError('Object.keys called on non-object'); }

        var ret = [];
        for(var p in o) { if(objectHasOwn.call(o,p)) { ret.push(p); } }
        return ret;
    };
}

if(!Object.create) {
    /** @ignore */
    Object.create = (function() {

        var Klass = function() {},
            proto = Klass.prototype;

        /** @private */
        function create(baseProto) {
            Klass.prototype = baseProto || {};
            var instance = new Klass();
            Klass.prototype = proto;

            return instance;
        }

        return create;
    }());
}

if (!Function.prototype.bind) {
    Function.prototype.bind = function (ctx) {
        var staticArgs = arraySlice.call(arguments, 1);
        var fToBind = this;

        return function (){
            return fToBind.apply(ctx, staticArgs.concat(arraySlice.call(arguments)));
        };
    };
}

// ------------------------

/**
 * @name def
 * @namespace The 'definition' library root namespace.
 * @export
 */
var def = /** @lends def */{
    /**
     * The JavaScript global object.
     * @type {object}
     * @expose
     */
    global: (new Function('return this;'))(),

    /**
     * Gets the value of an existing, own or inherited, and not "nully", property of an object,
     * or if unsatisfied, a specified default value.
     *
     * @param {object} [o] The object whose property value is desired.
     * @param {string} p The desired property name.
     * If the value is not a string,
     * it is converted to one, as if String(p) were used.
     * @param [dv=undefined] The default value.
     *
     * @returns {any} The satisfying property value or the specified default value.
     *
     * @see def.getOwn
     * @see def.nully
     * @expose
     */
    get: function(o, p, dv) {
        var v;
        return o && (v = o[p]) != null ? v : dv;
    },

    /**
     * Obtains a list properties from a given object and returns their values.
     * @param {!object} o the object whose properties are to be read.
     * @param {Array.<string>} props the property names.
     * @return {Array.<?>} the values of the desired properties.
     * @expose
     */
    gets: function(o, props) { return props.map(function(p){ return o[p]; }); },

    /**
     * Obtains the value of a property path of an object.
     * If desired, the path can also be created, when unexistent.
     * <p>A part of a path is considered to unexistent when its value is nully.</p>
     *
     * @param {?object=} o the object whose property path is to be read/created.
     * @param {(?string)|(?Array.<string>)=} path a string, or array of strings,
     *     with the property path to read/create.
     * @param {?=} [dv] The default value to return when the property path doesn't exist.
     * @param {?boolean=} create indicates if the path or part of it
     *     should be created when unexistent. When <tt>true</tt>, a literal object
     *     is created to fill the nully property path parts. If the argument {@link dv}
     *     contains a number or numeric string value, then the nully parts are filled
     *     with empty arrays instead.
     * @returns {?} the value of the specified property path when existent,
     *     the specified default value when not existent and {@link create} is <tt>false</tt>,
     *     or the empty object or array created for the last part of the path.
     *
     * @expose
     */
    getPath: function(o, path, dv, create) {
        if(!o) { return dv; }

        if(path != null) {
            var parts = def.array.is(path) ? path : path.split('.');
            var L = parts.length;
            if(L) {
                var i = 0;
                while(i < L) {
                    var part = parts[i++];
                    var value = o[part];
                    if(value == null) {
                        if(!create) { return dv; }
                        value = o[part] = (dv == null || isNaN(+dv)) ? {} : [];
                    }

                    o = value;
                }
            }
        }

        return o;
    },

    /**
     * Sets the value of a property path of an object.
     * If the path does not fully exist, the missing parts are created
     * by filling the nully properties with empty objects.
     *
     * <p>A part of a path is considered to unexistent when its value is nully.</p>
     *
     * @param {?object=} o the object whose property path is to be set.
     * @param {(?string)|(?Array.<string>)=} path a string, or array of strings,
     *     with the property path to set.
     *     <p>If the last part is numeric, and it does not exist,
     *        an array will be created for it instead.
     *     </p>
     * @param {?=} [v] The value to set in the specified property path.
     * @returns {object} the object specified in {@link o}.
     *
     * @expose
     */
    setPath: function(o, path, v) {
        if(o && path != null) {
            var parts = def.array.is(path) ? path : path.split('.');
            if(parts.length) {
                var pLast = parts.pop();
                o = def.getPath(o, parts, pLast, true);
                if(o != null) { o[pLast] = v; }
            }
        }
        return o;
    },

    /**
     * @typedef {function(?object=):*} pvc.PropertyGetter
     *
     * Gets the value of a pre-specified property of a given thing.
     * - param {?object=} o the <i>thing</i> whose pre-specified property is to be read.
     * - returns {?}
     *    If the specified {@link o} is not "nully",
     *    returns the value of the pre-specified property on it;
     *    otherwise, returns the pre-specified default value.
     */

    /**
     * Creates a property getter function,
     * for a specified property name.
     *
     * @param {string} name The name of the property.
     * @param [dv=undefined]
     * The default value to return
     * if the property would be accessed on null or undefined.
     * @return {pvc.PropertyGetter} a property getter for
     *    the specified property and default value
     */
    propGet: function(p, dv) {
        p = '' + p;
        return function(o) { return o ? o[p] : dv; };
    },

    // TODO: propSet ?

    /**
     * Gets the value of an existing, own, and not "nully", property of an object,
     * or if unsatisfied, a specified default value.
     *
     * @param {?object=} o The object whose property value is desired.
     * @param {string} p The desired property name.
     * If the value is not a string,
     * it is converted to one, as if String(p) were used.
     * @param {?=} [dv] The default value.
     *
     * @returns {?} The satisfying property value or the specified default value.
     *
     * @see def.get
     * @see def.hasOwn
     * @see def.nully
     * @expose
     */
    getOwn: function(o, p, dv){
        var v;
        return o && objectHasOwn.call(o, p) && (v = o[p]) != null ? v : dv;
    },

    /**
     * Indicates if an object contains a property locally.
     * @param {?object=} o the object.
     * @param {string} p the desired property name.
     * If the value is not a string,
     * it is converted to one, as if String(p) were used.
     * @return {boolean}
     * @expose
     */
    hasOwn: function(o, p) { return !!o && objectHasOwn.call(o, p); },

    /** @expose */
    hasOwnProp: objectHasOwn,

    /**
     * Sets properties and values on an object.
     * @param {?object=} o the object; when nully, one is created.
     * @param {...?} args a list of pairs of property name and value.
     * @return {!object} the specified object or a created one.
     * @expose
     */
    set: function(o) {
        if(!o) { o = {}; }
        var a = arguments;
        for(var i = 1, A = a.length - 1 ; i < A ; i += 2) { o[a[i]] = a[i+1]; }
        return o;
    },

    /** @expose */
    setDefaults: function(o, o2) {
        if(!o) { o = {}; }

        var a = arguments;
        var A = a.length;
        var p;
        if(A === 2 && def.object.is(o2)){
            for(p in o2){
                if(o[p] == null){
                    o[p] = o2[p];
                }
            }
        } else {
            A--;
            for(var i = 1 ; i < A ; i += 2) {
                p = a[i];
                if(o[p] == null){
                    o[p] = a[i+1];
                }
            }
        }

        return o;
    },

    /** @expose */
    setUDefaults: function(o, o2) {
        if(!o) { o = {}; }

        var a = arguments;
        var A = a.length;
        var p;
        if(A === 2 && def.object.is(o2)){
            for(p in o2){
                if(o[p] === undefined){
                    o[p] = o2[p];
                }
            }
        } else {
            A--;
            for(var i = 1 ; i < A ; i += 2) {
                p = a[i];
                if(o[p] === undefined){
                    o[p] = a[i+1];
                }
            }
        }

        return o;
    },

    /**
     * @typedef {function(*, string, object):boolean|*} pvc.ObjectPropertyMapper
     *
     * An object property mapper function.
     * - param {?} value the value of the property.
     * - param {string} name the name of the property.
     * - param {object} o the object whose property is being read.
     * - return {boolean|?} returning <tt>false</tt> stops the mapping.
     */

    /**
     * Calls a function for every <i>own</i> property of a specified object.
     *
     * @param {?object=} o the object whose own properties are traversed.
     * @param {pvc.ObjectPropertyMapper} fun property mapper function.
     * @param {?object=} ctx the context object on which to call {@link fun}.
     * @return {boolean} <tt>true</tt> if all properties were mapped,
     *     and <tt>false</tt> otherwise.
     * @expose
     */
    eachOwn: function(o, fun, ctx) {
        if(o) {
            for(var p in o) {
                if(objectHasOwn.call(o, p)) {
                    if(fun.call(ctx, o[p], p, o) === false) { return false; }
                }
            }
        }
        return true;
    },

    /**
     * Calls a function for every property of an object, own or inherited.
     *
     * @param {?object=} o the object whose properties are traversed.
     * @param {pvc.ObjectPropertyMapper} fun property mapper function.
     * @param {?object=} ctx the context object on which to call {@link fun}.
     * @return {boolean} <tt>true</tt> if all properties were mapped,
     *     and <tt>false</tt> otherwise.
     * @expose
     */
    each: function(o, fun, ctx) {
        if(o) {
            for(var p in o) {
                if(fun.call(ctx, o[p], p, o) === false) { return false; }
            }
        }
        return true;
    },

    /** @expose */
    copyOwn: function(a, b) {
        var to, from;
        if(arguments.length >= 2) {
            to = a || {};
            from = b;
        } else {
            to   = {};
            from = a;
        }

        if(from){
            for(var p in from){
                if(objectHasOwn.call(from, p)){
                    to[p] = from[p];
                }
            }
        }

        return to;
    },

    /** @expose */
    copy: function(a, b){
        var to, from;
        if(arguments.length >= 2) {
            to = a || {};
            from = b;
        } else {
            to   = {};
            from = a;
        }

        if(from) {
            for(var p in from) {
                to[p] = from[p];
            }
        }

        return to;
    },

    /** @expose */
    copyProps: function(a, b, props){
        var to, from;
        if(arguments.length >= 3) {
            to = a || {};
            from = b;
        } else {
            to    = {};
            from  = a;
            props = b;
        }

        if(props) {
            if(from){
                props.forEach(function(p){ to[p] = from[p];   });
            } else {
                props.forEach(function(p){ to[p] = undefined; });
            }
        }

        return to;
    },

    /** @expose */
    keys: function(o){
        var keys = [];
        for(var p in o) {
            keys.push(p);
        }

        return keys;
    },

    /** @expose */
    values: function(o){
        var values = [];
        for(var p in o) {
            values.push(o[p]);
        }

        return values;
    },

    /** @expose */
    uniqueIndex: function(o, key, ctx){
        var index = {};

        for(var p in o){
            var v = key ? key.call(ctx, o[p]) : o[p];
            if(v != null && !objectHasOwn.call(index, v)){
                index[v] = p;
            }
        }

        return index;
    },

    /** @expose */
    ownKeys: Object.keys,

    /** @expose */
    own: function(o, f, ctx){
        var keys = Object.keys(o);
        return f ?
                keys.map(function(key){ return f.call(ctx, o[key], key); }) :
                keys.map(function(key){ return o[key]; });
    },

    /** @expose */
    scope: function(scopeFun, ctx){
        return scopeFun.call(ctx);
    },

    // Bit -------------
    /** @expose */
    bit: {
        /** @expose */
        set: function(bits, set, on){ return (on || on == null) ? (bits | set) : (bits & ~set); }
    },

    // Special functions ----------------

    /**
     * The natural order comparator function.
     * @field
     * @type {function(?,?) : boolean}
     * @expose
     */
    compare: function(a, b){
        /* Identity is favored because, otherwise,
         * comparisons like: compare(NaN, 0) would return 0...
         * This isn't perfect either, because:
         * compare(NaN, 0) === compare(0, NaN) === -1
         * so sorting may end in an end or the other...
         */
        return (a === b) ? 0 : ((a > b) ? 1 : -1);
        //return (a < b) ? -1 : ((a > b) ? 1 : 0);
    },

    /** @expose */
    compareReverse: function(a, b) {
        return (a === b) ? 0 : ((a > b) ? -1 : 1);
    },

    /** @expose */
    methodCaller: function(p, x) {
        if(x) { return function() { return x[p].apply(x, arguments); }; }

        /* floating method */
        return function() { return this[p].apply(this, arguments); };
    },

    /**
     * The identity function.
     * @param {?T=} x the argument.
     * @return {?T|undefined} the argument or undefined.
     * @template T
     */
    identity: function(x) { return x; },

    /** @expose */
    add: function(a, b) { return a + b; },

    // negate?
    /** @expose */
    negate: function(f) {
        return function() {
            return !f.apply(this, arguments);
        };
    },

    /** @expose */
    sqr: function(v){ return v * v;},

    // Constant functions ----------------

    /**
     * The NO OPeration function.
     * @param {...*} var_arg any arguments.
     * @return {undefined}
     * @expose
     */
    noop: function noop(){ /* NOOP */ },

    /** @expose */
    retTrue:  function(){ return true;  },
    /** @expose */
    retFalse: function(){ return false; },

    // Type namespaces ----------------

    /** @expose */
    number: {
        /** @expose */
        is: function(v){
            return typeof v === 'number';
        },

        /** @expose */
        as: function(d, dv){
            var v = parseFloat(d);
            return isNaN(v) ? (dv || 0) : v;
        },

        /** @expose */
        to: function(d, dv){
            var v = parseFloat(d);
            return isNaN(v) ? (dv || 0) : v;
        }
    },

    /** @expose */
    array: {

        /** @expose */
        is: function(v){
            return (v instanceof Array);
        },

        // TODO: def.array.like.is
        /** @expose */
        isLike: function(v) {
            return v && (v.length != null) && (typeof v !== 'string');
        },

        // TODO: this should work as other 'as' methods...
        /**
         * Converts something to an array if it is not one already,
         * and if it is not nully.
         *
         * @param thing A thing to convert to an array.
         * @returns {Array}
         * @expose
         */
        as: function(thing){
            return (thing instanceof Array) ? thing : ((thing != null) ? [thing] : null);
        },

        /** @expose */
        to: function(thing){
            return (thing instanceof Array) ? thing : ((thing != null) ? [thing] : null);
        },

        /** @expose */
        lazy: function(scope, p, f, ctx){
            return scope[p] || (scope[p] = (f ? f.call(ctx, p) : []));
        },

        /** @expose */
        copy: function(al/*, start, end*/){
            return arraySlice.apply(al, arraySlice.call(arguments, 1));
        }
    },

    /** @expose */
    object: {
        /** @expose */
        is: function(v){
            return v && typeof(v) === 'object'; // Is (v instanceof Object) faster?
        },

        /** @expose */
        isNative: function(v){
            // Sightly faster, but may cause boxing?
            return (!!v) && /*typeof(v) === 'object' &&*/ v.constructor === Object;
        },

        /** @expose */
        as: function(v){
            return v && typeof(v) === 'object' ? v : null;
        },

        /** @expose */
        asNative: function(v){
            // Sightly faster, but may cause boxing?
            return v && /*typeof(v) === 'object' &&*/ v.constructor === Object ?
                    v :
                    null;
        },

        /** @expose */
        lazy: function(scope, p, f, ctx){
            return scope[p] ||
                  (scope[p] = (f ? f.call(ctx, p) : {}));
        }
    },

    /** @expose */
    string: {
        /** @expose */
        is: function(v){
            return typeof v === 'string';
        },

        /** @expose */
        to: function(v, ds){
            return v != null ? ('' + v) : (ds || '');
        },

        /** @expose */
        join: function(sep){
            var a = arguments;
            var L = a.length;
            var v, v2;

            switch(L){
                case 3:
                    v  = a[1];
                    v2 = a[2];
                    if(v != null && v !== ""){
                        if(v2 != null && v2 !== "") {
                            return (""+v) + sep + (""+v2);
                        }
                        return (""+v);
                    } else if(v2 != null && v2 !== "") {
                        return (""+v2);
                    }

                    return "";

                case 2:
                    v = a[1];
                    return v != null ? (""+v) : "";

                case 1:
                case 0: return "";
            }

            // general case

            var args = [];
            for(var i = 1 ; i < L ; i++){
                v = a[i];
                if(v != null && v !== ""){
                    args.push("" + v);
                }
            }

            return args.join(sep);
        },

        /** @expose */
        padRight: function(s, n, p) {
            if(!s) { s = ''; }
            if(p == null) { p = ' '; }

            var k = ~~((n - s.length) / p.length);
            return k > 0 ? (s + new Array(k + 1).join(p)) : s;
        }
    },

    /** @expose */
    fun: {
        /** @expose */
        is: function(v){
            return typeof v === 'function';
        },

        /** @expose */
        as: function(v){
            return typeof v === 'function' ? v : null;
        },

        /** @expose */
        to: function(v){
            return typeof v === 'function' ? v : def.fun.constant(v);
        },

        /** @expose */
        constant: function(v){
            return function(){ return v; };
        }
    },

    // nully to 'dv'
    /** @expose */
    nullyTo: function(v, dv){
        return v != null ? v : dv;
    },

    /** @expose */
    between: function(v, min, max){
        return Math.max(min, Math.min(v, max));
    },

    // Predicates ----------------

    // === null || === undefined
    /** @expose */
    nully: function(v){
        return v == null;
    },

    // !== null && !== undefined
    /** @expose */
    notNully: function(v){
        return v != null;
    },

    // !== undefined
    /** @expose */
    notUndef: function(v){
        return v !== undefined;
    },

    /** @expose */
    empty: function(v){
        return v == null || v === '';
    },

    /** @expose */
    notEmpty: function(v){
        return v != null && v !== '';
    },

    /**
     * The truthy function.
     * @field
     * @type {function(?=) : boolean}
     * @expose
     */
    truthy: function(x) { return !!x; },

    /**
     * The falsy function.
     * @field
     * @type function(?=) : boolean
     * @expose
     */
    falsy: function(x){ return !x; },

    // -----------------

    /* Ensures the first letter is upper case */
    /** @expose */
    firstUpperCase: function(s) {
        if(s) {
            var c  = s.charAt(0),
                cU = c.toUpperCase();
            if(c !== cU) {
                s = cU + s.substr(1);
            }
        }
        return s;
    },

    /** @expose */
    firstLowerCase: function(s) {
        if(s) {
            var c  = s.charAt(0),
                cL = c.toLowerCase();
            if(c !== cL) {
                s = cL + s.substr(1);
            }
        }
        return s;
    },

    /**
     * Formats a string by replacing
     * place-holder markers, of the form "{foo}",
     * with the value of corresponding properties
     * of the specified scope argument.
     *
     * @param {string} mask The string to format.
     * @param {object|function(string):*} [scope] The scope object or function.
     * @param {object=} ctx The context object for a scope function.
     *
     * @example
     * <pre>
     * def.format("The name '{0}' is undefined.", ['foo']);
     * // == "The name 'foo' is undefined."
     *
     * def.format("The name '{foo}' is undefined, and so is '{what}'.", {foo: 'bar'});
     * // == "The name 'bar' is undefined, and so is ''."
     *
     * def.format("The name '{{foo}}' is undefined.", {foo: 'bar'});
     * // == "The name '{{foo}}' is undefined."
     * </pre>
     *
     * @returns {string} The formatted string.
     * @expose
     */
    format: function(mask, scope, ctx) {
        if(mask == null || mask === '') { return ""; }

        var isScopeFun = scope && def.fun.is(scope);

        return mask.replace(/(^|[^{])\{([^{}]+)\}/g, function($0, before, prop) {
            var value = !scope     ? null :
                        isScopeFun ? scope.call(ctx, prop) :
                        scope[prop];

            // NOTE: calls .toString() of value as a side effect of the + operator
            // NOTE2: when value is an object, that contains a valueOf method,
            // valueOf is called instead, and toString is called on that result only.
            // Using String(value) ensures toString() is called on the object itself.
            return before + (value == null ? "" : String(value));
        });
    },

    // --------------

    /**
     * Binds a list of types with the specified values, by position.
     * <p>
     * A null value is bindable to any type.
     * <p>
     * <p>
     * When a value is of a different type than the type desired at a given position
     * the position is bound to <c>undefined</c> and
     * the unbound value is passed to the next position.
     * </p>
     * @param {Array.<string>} types the array of type names (as by typeof operator)
     * @param {Array.<*>} values the array of values to bind with types.
     * @returns {Array.<*>} An array representing the binding,
     *     with the values bound to each type.
     * @expose
     */
    destructuringTypeBind: function(types, values) {
        var T = types.length;
        var result = new Array(T);
        if(T && values) {
            var V = values.length;
            if(V) {
                var v = 0;
                var t = 0;
                do {
                    var value = values[v];

                    // any type matches null
                    if(value == null || typeof value === types[t]) {
                        // bind value to type
                        result[t] = value;
                        v++;
                    }
                    t++;
                } while(t < T && v < V);
            }
        }

        return result;
    },

    // --------------
    /** @expose */
    error: function(error){
        return (error instanceof Error) ? error : new Error(error);
    },
    /** @expose */
    fail: function(error){
        throw def.error(error);
    },
    /** @expose */
    assert: function(msg, scope){
        throw def.error.assertionFailed(msg, scope);
    }
};


var AL = /** @expose */def.array.like = def.copyOwn(
    function(v){ return AL.is(v) ? v : [v]; },

    /**@lends {def.array.like} */{
    /** @expose */
    is: function(v) { return v && (v.length != null) && (typeof v !== 'string'); },
    /** @expose */
    as: function(v){ return AL.is(v) ? v : null; }
});
/** @expose */
AL.to = AL;

/** @expose */
def.lazy = def.object.lazy;

// Adapted from
// http://www.codeproject.com/Articles/133118/Safe-Factory-Pattern-Private-instance-state-in-Jav/
/** @expose */
def.shared = function() {
    var _channel = null;

    /** @private */
    function create(value) {
        /** @private */
        function safe() { _channel = value; }
        return safe;
    }

    /** @private */
    function opener(safe) {
        if(_channel != null){ throw new Error("Access denied."); }

        safe();

        var value;
        value = _channel;
        _channel = null;
        return value;
    }

    /** @expose */
    opener.safe = create;

    return opener;
};

var errors =
    /** @lends {def.error} */
{
    /** @expose */
    operationInvalid: function(msg, scope){
        return def.error(def.string.join(" ", "Invalid operation.", def.format(msg, scope)));
    },

    /** @expose */
    notImplemented: function(){
        return def.error("Not implemented.");
    },

    /** @expose */
    argumentRequired: function(name){
        return def.error(def.format("Required argument '{0}'.", [name]));
    },

    /** @expose */
    argumentInvalid: function(name, msg, scope){
        return def.error(
                   def.string.join(" ",
                       def.format("Invalid argument '{0}'.", [name]),
                       def.format(msg, scope)));
    },

    /** @expose */
    assertionFailed: function(msg, scope){
        return def.error(
                   def.string.join(" ",
                       "Assertion failed.",
                       def.format(msg, scope)));
    }
};

def.copyOwn(def.error, errors);

/* Create direct fail versions of errors */
// TODO: compiler/doc description
def.eachOwn(errors, function(errorFun, name){
    def.fail[name] = function(){
        throw errorFun.apply(null, arguments);
    };
});

// -----------------------

/** @private */
var currentNamespace = def, // at the end of the file it is set to def.global
    globalNamespaces = {}, // registered global namespaces by name: globalName -> object
    namespaceStack   = [];

/** @private */
function globalSpace(name, space){
    return globalNamespaces[name] = space;
}

/** @private */
function getNamespace(name, base){
    var current = base || currentNamespace;
    if(name){
        var parts = name.split('.');
        var L = parts.length;
        if(L){
            var i = 0;
            var part;
            if(current === def.global){
                part = parts[0];
                var globalNamespace = def.getOwn(globalNamespaces, part);
                if(globalNamespace){
                    current = globalNamespace;
                    i++;
                }
            }

            while(i < L){
                part = parts[i++];
                current = current[part] || (current[part] = {});
            }
        }
    }

    return current;
}

/**
 * Ensures a namespace exists given its name and, optionally, its base namespace.
 * If a definition function is specified,
 * it is executed having the namespace as current namespace.
 *
 * @param {string} name the namespace name.
 * @param {object=} base the base namespace object.
 * @param {?function(object):void=} definition the namespace definition function.
 * @return {object} the namespace
 *
 * @private
 */
function createSpace(name, base, definition) {
    if(def.fun.is(base)) {
        definition = base;
        base = null;
    }

    var namespace = getNamespace(name, base);

    if(definition) {
        namespaceStack.push(currentNamespace);
        try     { definition(namespace); }
        finally { currentNamespace = namespaceStack.pop(); }
    }

    return namespace;
}

/** @private */
function defineName(namespace, name, value){
    /*jshint expr:true */
    !def.hasOwn(namespace, name) ||
        def.fail.operationInvalid("Name '{0}' is already defined in namespace.", [name]);

    return namespace[name] = value;
}

/**
 * Defines a relative namespace with
 * name <i>name</i> on the current namespace.
 *
 * <p>
 * Namespace declarations may be nested.
 * </p>
 * <p>
 * The current namespace can be obtained by
 * calling {@link def.space} with no arguments.
 * The current namespace affects other nested declarations, such as {@link def.type}.
 * </p>
 * <p>
 * A composite namespace name contains dots, ".", separating its elements.
 * </p>
 * @example
 * <pre>
 * def.space('foo.bar', function(space){
 *     space.hello = 1;
 * });
 * </pre>
 *
 * @function
 *
 * @param {String} name The name of the namespace to obtain.
 * If nully, the current namespace is implied.
 *
 * @param {Function} definition
 * A function that is called whith the desired namespace
 * as first argument and while it is current.
 *
 * @returns {object} The namespace.
 *
 * @expose
 */
def.space = createSpace;

/**
 * Registers a name and an object as a global namespace.
 * @param {string} name The name of the global namespace component to register.
 * @param {object} space The object that represents the namespace.
 * @returns {object} the registered namespace object.
 * @expose
 */
def.globalSpace = globalSpace;

// -----------------------

/** @expose */
def.mixin = createMixin(Object.create);
def.copyOwn(def.mixin, /**@lends {def.mixin}*/{
    /** @expose */
    custom:  createMixin,
    /** @expose */
    inherit: def.mixin,
    /** @expose */
    copy:    createMixin(def.copy),
    /** @expose */
    share:   createMixin(def.identity)
});

/** @private */
function createMixin(protectNativeObject){
    return function(instance/*mixin1, mixin2, ...*/){
        return mixinMany(instance, arraySlice.call(arguments, 1), protectNativeObject);
    };
}

/** @private */
function mixinMany(instance, mixins, protectNativeObject){
    for(var i = 0, L = mixins.length ; i < L ; i++){
        var mixin = mixins[i];
        if(mixin){
            mixin = def.object.as(mixin.prototype || mixin);
            if(mixin){
                mixinRecursive(instance, mixin, protectNativeObject);
            }
        }
    }

    return instance;
}

/** @private */
function mixinRecursive(instance, mixin, protectNativeObject){
    for(var p in mixin){
        mixinProp(instance, p, mixin[p], protectNativeObject);
    }
}

/** @private */
function mixinProp(instance, p, vMixin, protectNativeObject){
    if(vMixin !== undefined){
        var oMixin,
            oTo = def.object.asNative(instance[p]);

        if(oTo){
            oMixin = def.object.as(vMixin);
            if(oMixin){
                // If oTo is inherited, don't change it
                // Inherit from it and assign it locally.
                // It will be the target of the mixin.
                if(!objectHasOwn.call(instance, p)){
                    instance[p] = oTo = Object.create(oTo);
                }

                // Mixin the two objects
                mixinRecursive(oTo, oMixin, protectNativeObject);
            } else {
                // Overwrite oTo with a simple value
                instance[p] = vMixin;
            }
        } else {
            // Target property does not contain a native object.
            oMixin = def.object.asNative(vMixin);
            if(oMixin){
                // Should vMixin be set directly in instance[p] ?
                // Should we copy its properties into a fresh object ?
                // Should we inherit from it ?
                vMixin = (protectNativeObject || Object.create)(oMixin);
            }

            instance[p] = vMixin;
        }
    }
}

// -----------------------

/** @private */
function createRecursive(instance){
    for(var p in instance){
        var vObj = def.object.asNative(instance[p]);
        if(vObj){
            createRecursive( (instance[p] = Object.create(vObj)) );
        }
    }
}

// Creates an object whose prototype is the specified object.
/** @expose */
def.create = function(/*[deep,] baseProto, mixin1, mixin2, ...*/){
    var mixins = arraySlice.call(arguments),
        deep = true,
        baseProto = mixins.shift();

    if(typeof(baseProto) === 'boolean') {
        deep = baseProto;
        baseProto = mixins.shift();
    }

    var instance = baseProto ? Object.create(baseProto) : {};
    if(deep) { createRecursive(instance); }

    // NOTE:
    if(mixins.length > 0) {
        mixins.unshift(instance);
        def.mixin.apply(def, mixins);
    }

    return instance;
};

// -----------------------

def.scope(function(){
    var shared = def.shared();

    /** @private */
    function typeLocked(){
        return def.error.operationInvalid("Type is locked.");
    }

    /** @ignore */
    var typeProto = {
        /** @expose */
        init: function(init) {
            /*jshint expr:true */

            init || def.fail.argumentRequired('init');

            var state = shared(this.safe);

            !state.locked || def.fail(typeLocked());

            // NOTE: access to init inherits baseState's init!
            // Before calling init or postInit, baseState.initOrPost is inherited as well.
            var baseInit = state.init;
            if(baseInit){
                init = override(init, baseInit);
            }

            state.init = init;
            state.initOrPost = true;

            return this;
        },

        /** @expose */
        postInit: function(postInit){
            /*jshint expr:true */

            postInit || def.fail.argumentRequired('postInit');

            var state = shared(this.safe);

            !state.locked || def.fail(typeLocked());

            // NOTE: access to post inherits baseState's post!
            // Before calling init or postInit, baseState.initOrPost is inherited as well.
            var basePostInit = state.post;
            if(basePostInit){
                postInit = override(postInit, basePostInit);
            }

            state.post = postInit;
            state.initOrPost = true;

            return this;
        },

        /** @expose */
        add: function(mixin){
            var state = shared(this.safe);

            /*jshint expr:true */
            !state.locked || def.fail(typeLocked());

            var proto = this.prototype;
            var baseState = state.base;

            def.each(mixin.prototype || mixin, function(value, p){
                // filter props/methods
                switch(p){
                    case 'base':
                    case 'constructor': // don't let overwrite 'constructor' of prototype
                        return;

                    case 'toString':
                        if(value === toStringMethod){
                            return;
                        }
                        break;

                    case 'override':
                        if(value === overrideMethod){
                            return;
                        }
                        break;
                }

                if(value){
                    // Try to convert to method
                    var method = asMethod(value);
                    if(method) {
                        var baseMethod;

                        // Check if it is an override

                        // Exclude inherited stuff from Object.prototype
                        var bm = state.methods[p];
                        if(bm && (bm instanceof Method)){
                            baseMethod = bm;
                        } else if(baseState) {
                            bm = baseState.methods[p];
                            if(bm && (bm instanceof Method)){
                                baseMethod = bm;
                            }
                        }

                        state.methods[p] = method;

                        if(baseMethod){
                            // Replace value with an override function
                            // that intercepts the call and sets the correct
                            // 'base' property before calling the original value function
                            value = baseMethod.override(method);
                        }

                        proto[p] = value;
                        return;
                    }
                }

                mixinProp(proto, p, value, /*protectNativeValue*/def.identity); // Can use native object value directly
            });

            return this;
        },

        /** @expose */
        getStatic: function(p){
            return getStatic(shared(this.safe), p);
        },

        /** @expose */
        addStatic: function(mixin){
            var state = shared(this.safe);

            /*jshint expr:true */
            !state.locked || def.fail(typeLocked());

            for(var p in mixin){
                if(p !== 'prototype'){
                    var v1 = def.getOwn(this, p);

                    var v2 = mixin[p];
                    var o2 = def.object.as(v2);
                    if(o2){
                        var v1Local = (v1 !== undefined);
                        if(!v1Local){
                            v1 = getStatic(state.base, p);
                        }

                        var o1 = def.object.asNative(v1);
                        if(o1){
                            if(v1Local){
                                def.mixin(v1, v2);
                                continue;
                            }

                            v2 = def.create(v1, v2); // Extend from v1 and mixin v2
                        }
                    } // else v2 smashes anything in this[p]

                    this[p] = v2;
                }
            }

            return this;
        }
    };

    function getStatic(state, p){
        if(state){
            do{
                var v = def.getOwn(state.constructor, p);
                if(v !== undefined){
                    return v;
                }
            } while((state = state.base));
        }
    }

    // TODO: improve this code with indexOf
    /** @expose */
    function TypeName(full) {
        var parts;
        if(full) {
            if(full instanceof Array){
                parts = full;
                full  = parts.join('.');
            } else {
                parts = full.split('.');
            }
        }

        if(parts && parts.length > 1){
            /** @expose */
            this.name           = parts.pop();
            /** @expose */
            this.namespace      = parts.join('.');
            /** @expose */
            this.namespaceParts = parts;
        } else {
            /** @expose */
            this.name = full || null;
            /** @expose */
            this.namespace = null;
            /** @expose */
            this.namespaceParts = [];
        }
    }

    TypeName.prototype.toString = function() {
        return def.string.join('.', this.namespace + '.' + this.name);
    };

    /** @expose */
    function Method(spec) {
        this.fun = spec.as;
        if(spec) {
            if(spec.isAbstract) {
                this.isAbstract = true;
            }
        }
    }

    def.copyOwn(Method.prototype, /**@lends {Method} */{
        /** @expose */
        isAbstract: false,

        /** @expose */
        override: function(method){
            // *this* is the base method
            if(this.isAbstract) {
                // Abstract base methods do not maintain 'base' property.
                // Interception is not needed.
                return method.fun;
            }

            var fun2 = override(method.fun, this.fun);
            // replacing the original function with the wrapper function
            // makes sure that multiple (> 1) overrides work
            method.fun = fun2;

            return fun2;
        }
    });

    /** @private */
    function asMethod(fun) {
        if(fun) {
            if(def.fun.is(fun)) {
                return new Method({as: fun});
            }

            if(fun instanceof Method) {
                return fun;
            }

            if(def.fun.is(fun.as)) {
                return new Method(fun);
            }

            if(fun.isAbstract) {
                return new Method({isAbstract: true, as: def.fail.notImplemented });
            }
        }

        return null;
    }

    /** @private */
    function method(fun) {
        return asMethod(fun) || def.fail.argumentInvalid('fun');
    }

    // -----------------

    /** @expose */
    function rootType(){ }

    var rootProto = rootType.prototype;

    // Unfortunately, creates an enumerable property in every instance

    /** @expose */
    rootProto.base = undefined;

    var rootState = {
        /** @expose */
        locked:      true,
        /** @expose */
        init:        undefined,
        /** @expose */
        postInit:    undefined,
        /** @expose */
        initOrPost:  false,
        /** @expose */
        methods:     {},
        /** @expose */
        constructor: rootType
    };

    /** @expose */
    rootType.safe = shared.safe(rootState);

    // -----------------

    /** @expose */
    function override(method, base) {
        return function() {
            var prevBase = rootProto.base; rootProto.base = base;
            try     { return method.apply(this, arguments); }
            finally { rootProto.base = prevBase;            }
        };
    }

    function overrideMethod(mname, method) {
        this[mname] = override(method, this[mname]);
        return this;
    }

    function toStringMethod() {
        return '' + this.constructor;
    }

    // -----------------

    /** @private */
    function inherits(type, base){
     // Inherit
        var proto = type.prototype = Object.create(base.prototype);
        // Unfortunately, creates an enumerable property in every instance
        proto.constructor = type;

        return proto;
    }

    // -----------------

    /** @private */
    function createConstructor(state) {

//        function constructor(){
//            /*jshint expr:true */
//            var method;
//            if(state.initOrPost){
//                (method = state.init) && method.apply(this, arguments);
//                (method = state.post) && method.apply(this, arguments);
//            }
//        }

        // Slightly faster version
//        var init, post;
//        var start = function(){
//            start = null;
//            if(state.initOrPost){
//                init = state.init;
//                post = state.post;
//            }
//        };
//
//        function constructor(){
//            /*jshint expr:true */
//            start && start();
//
//            init && init.apply(this, arguments);
//            post && post.apply(this, arguments);
//        }

        // Even faster, still
        var S = 1;
        /** @expose */
        var steps = [
            // Start up class step
            function() {
                S = 0;
                if(state.initOrPost) {
                    steps.length = 0;
                    if(state.init) { steps.push(state.init); S++; }
                    if(state.post) { steps.push(state.post); S++; }
                    // Call constructor recursively
                    constructor.apply(this, arguments);
                    return false; // stop initial constructor from running postInit again...
                }
                steps = null;
            }
        ];

        /** @expose */
        function constructor() {
            if(S) {
                var i = 0;
                while(steps[i].apply(this, arguments) !== false && ++i < S){}
            }
        }

        return constructor;
    }

    /** @private The type of the arguments of the {@link def.type} function. */
    var _typeFunArgTypes = ['string', 'function', 'object'];

    /**
     * Constructs a type with the specified name in the current namespace.
     *
     * @param {string} [name] The new type name, relative to the base argument.
     * When unspecified, an anonymous type is created.
     * The type is not published in any namespace.
     *
     * @param {object} [baseType] The base type.
     * @param {object} [space] The namespace where to define a named type.
     * The default namespace is the current namespace.
     * @expose
     */
    function type(/* name[, baseType[, space]] | baseType[, space] | space */){

        var args = def.destructuringTypeBind(_typeFunArgTypes, arguments);

        return typeCore.apply(this, args);
    }

    function typeCore(name, baseType, space){
        var typeName = new TypeName(name);

        // ---------------

        var baseState;
        if(baseType){
            baseState = (baseType.safe && shared(baseType.safe)) ||
                         def.fail.operationInvalid("Invalid \"foreign\" base type.");
            baseState.locked = true;
        } else {
            baseType  = rootType;
            baseState = rootState;
        }

        // ---------------

        var state = Object.create(baseState);
        /** @expose */
        state.locked  = false;
        /** @expose */
        state.base    = baseState;
        /** @expose */
        state.methods = Object.create(baseState.methods);

        // ---------------

        var constructor = createConstructor(state);

        def.copyOwn(constructor, typeProto);
        /** @expose */
        constructor.name     = typeName.name;
        /** @expose */
        constructor.typeName = typeName;
        /** @expose */
        constructor.safe     = shared.safe(state);

        constructor.toString = function(){ return (''+this.typeName) || "Anonymous type"; };

        var proto = inherits(constructor, baseType);

        state.constructor = constructor;

        // ---------------
        // Default methods (can be overwritten with Type#add)

        /** @expose */
        proto.override = overrideMethod;

        proto.toString = toStringMethod;

        // ---------------

        if(typeName.name){
            defineName(def.space(typeName.namespace, space),
                       typeName.name,
                       constructor);
        }

        return constructor;
    }

    /** @expose */
    def.type   = type;

    /** @expose */
    def.method = method;
});

/** @expose */
def.makeEnum = function(a) {
    var i = 1;
    var e = {};
    a.forEach(function(p) {
        e[p] = i;
        i = i << 1;
    });
    return e;
};

// ----------------------

def.copyOwn(def.array, /** @lends def.array */{
    /**
     * Creates an array of the specified length,
     * and, optionally, initializes it with the specified default value.
     * @expose
     */
    create: function(len, dv){
        var a = len >= 0 ? new Array(len) : [];
        if(dv !== undefined){
            for(var i = 0 ; i < len ; i++){
                a[i] = dv;
            }
        }

        return a;
    },

    /** @expose */
    append: function(target, source, start){
        if(start == null){
            start = 0;
        }

        for(var i = 0, L = source.length, T = target.length ; i < L ; i++){
            target[T + i] = source[start + i];
        }

        return target;
    },

    /** @expose */
    appendMany: function(target){
        var a = arguments;
        var S = a.length;
        if(S > 1){
            var t = target.length;
            for(var s = 1 ; s < S ; s++){
                var source = a[s];
                if(source){
                    var i = 0;
                    var L = source.length;
                    while(i < L){
                        target[t++] = source[i++];
                    }
                }
            }
        }

        return target;
    },

    /** @expose */
    prepend: function(target, source, start){
        if(start == null){
            start = 0;
        }

        for(var i = 0, L = source.length ; i < L ; i++){
            target.unshift(source[start + i]);
        }

        return target;
    },

    /** @expose */
    removeAt: function(array, index){
        return array.splice(index, 1)[0];
    },

    /** @expose */
    insertAt: function(array, index, elem){
        array.splice(index, 0, elem);
        return array;
    },

    /** @expose */
    binarySearch: function(array, item, comparer, key){
        if(!comparer) { comparer = def.compare; }

        var low  = 0, high = array.length - 1;
        while(low <= high) {
            var mid = (low + high) >> 1; // <=>  Math.floor((l+h) / 2)

            var result = comparer(item, key ? key(array[mid]) : array[mid]);
            if (result < 0) {
                high = mid - 1;
            } else if (result > 0) {
                low = mid + 1;
            } else {
                return mid;
            }
        }

        /* Item was not found but would be inserted at ~low */
        return ~low; // two's complement <=> -low - 1
    },

    /**
     * Inserts an item in an array,
     * previously sorted with a specified comparer,
     * if the item is not already contained in it.
     *
     * @param {Array} array A sorted array.
     * @param item An item to insert in the array.
     * @param {Function} [comparer] A comparer function.
     *
     * @returns {Number}
     * If the item is already contained in the array returns its index.
     * If the item was not contained in the array returns the two's complement
     * of the index where the item was inserted.
     * @expose
     */
    insert: function(array, item, comparer){

        var index = def.array.binarySearch(array, item, comparer);
        if(index < 0){
            // Insert at the two's complement of index
            array.splice(~index, 0, item);
        }

        return index;
    },

    /** @expose */
    remove: function(array, item, comparer) {
        var index = def.array.binarySearch(array, item, comparer);
        if(index >= 0) {
            return array.splice(index, 1)[0];
        }
        // return undefined;
    }
});

// -----------------

var nextGlobalId  = 1,
    nextIdByScope = {};

/** @expose */
def.nextId = function(scope){
    if(scope) {
        var nextId = def.getOwn(nextIdByScope, scope) || 1;
        nextIdByScope[scope] = nextId + 1;
        return nextId;
    }

    return nextGlobalId++;
};

// --------------------

def.type('Set')
.init(function(source, count) {
    /** @expose */
    this.source = source || {};
    /** @expose */
    this.count  = source ? (count != null ? count : def.ownKeys(source).length) : 0;
})
.add({
    /** @expose */
    has: function(p){
        return objectHasOwn.call(this.source, p);
    },

    /** @expose */
    add: function(p){
        var source = this.source;
        if(!objectHasOwn.call(source, p)) {
            this.count++;
            source[p] = true;
        }

        return this;
    },

    /** @expose */
    rem: function(p){
        if(objectHasOwn.call(this.source, p)) {
            delete this.source[p];
            this.count--;
        }

        return this;
    },

    /** @expose */
    clear: function(){
        if(this.count) {
            this.source = {};
            this.count  = 0;
        }
        return this;
    },

    /** @expose */
    members: function(){
        return def.ownKeys(this.source);
    }
});

// ---------------

def.type('Map')
.init(
/**
 * @constructor
 * @name def.Map
 * @param {?object=} source the source object.
 * @param {?number=} count the source object.
 */
function(source, count){
    /** @expose */
    this.source = source || {};
    /** @expose */
    this.count  = source ? (count != null ? count : def.ownKeys(source).length) : 0;
})
.add(/** @lends {def.Map#} */{
    /** @expose */
    has: function(p){
        return objectHasOwn.call(this.source, p);
    },

    /** @expose */
    get: function(p){
        return objectHasOwn.call(this.source, p) ?
               this.source[p] :
               undefined;
    },

    /** @expose */
    set: function(p, v){
        var source = this.source;
        if(!objectHasOwn.call(source, p)) {
            this.count++;
        }

        source[p] = v;
        return this;
    },

    /** @expose */
    rem: function(p){
        if(objectHasOwn.call(this.source, p)) {
            delete this.source[p];
            this.count--;
        }

        return this;
    },

    /** @expose */
    clear: function(){
        if(this.count) {
            this.source = {};
            this.count  = 0;
        }
        return this;
    },

    /** @expose */
    copy: function(other){
        // Add other to this one
        def.eachOwn(other.source, function(value, p){
            this.set(p, value);
        }, this);
    },

    /** @expose */
    values: function(){
        return def.own(this.source);
    },

    /** @expose */
    keys: function(){
        return def.ownKeys(this.source);
    },

    /** @expose */
    clone: function(){
        return new def.Map(def.copy(this.source), this.count);
    },

    /**
     * The union of the current map with the specified
     * map minus their intersection.
     * <pre>
     * (A U B) \ (A /\ B)
     * (A \ B) U (B \ A)
     * </pre>
     * @param {def.Map} other the map with which to perform the operation.
     * @return {def.Map}
     * @expose
     */
    symmetricDifference: function(other) {
        if(!this.count ) { return other.clone(); }
        if(!other.count) { return this.clone(); }

        var result = {};
        var count  = 0;

        var as = this.source;
        var bs = other.source;

        def.eachOwn(as, function(a, p){
            if(!objectHasOwn.call(bs, p)){
                result[p] = a;
                count++;
            }
        });

        def.eachOwn(bs, function(b, p){
            if(!objectHasOwn.call(as, p)){
                result[p] = b;
                count++;
            }
        });

        return new def.Map(result, count);
    },

    /** @expose */
    intersect: function(other, result){
        if(!result){
            result = new def.Map();
        }

        def.eachOwn(this.source, function(value, p){
            if(other.has(p)) {
                result.set(p, value);
            }
        });

        return result;
    }
});

// --------------------

//---------------

def.type('OrderedMap')
.init(function(){
    this._list = [];
    this._map  = {};
})
.add({
    /** @expose */
    has: function(key){
        return objectHasOwn.call(this._map, key);
    },

    /** @expose */
    count: function(){
        return this._list.length;
    },

    /** @expose */
    get: function(key){
        var bucket = def.getOwn(this._map, key);
        if(bucket) {
            return bucket.value;
        }
    },

    /** @expose */
    at: function(index){
        var bucket = this._list[index];
        if(bucket){
            return bucket.value;
        }
    },

    /** @expose */
    add: function(key, v, index){
        var map = this._map;
        var bucket = def.getOwn(map, key);
        if(!bucket){
            bucket = map[key] = {
                key:   key,
                value: v
            };

            if(index == null){
                this._list.push(bucket);
            } else {
                def.array.insertAt(this._list, index, bucket);
            }
        } else if(bucket.value !== v){
            bucket.value = v;
        }

        return this;
    },

    /** @expose */
    rem: function(key){
        var bucket = def.getOwn(this._map, key);
        if(bucket){
            // Find it
            var index = this._list.indexOf(bucket);
            this._list.splice(index, 1);
            delete this._map[key];
        }

        return this;
    },

    /** @expose */
    clear: function(){
        if(this._list.length) {
            this._map = {};
            this._list.length = 0;
        }

        return this;
    },

    /** @expose */
    keys: function(){
        return def.ownKeys(this._map);
    },

    /** @expose */
    forEach: function(fun, ctx){
        return this._list.forEach(function(bucket){
            fun.call(ctx, bucket.value, bucket.key);
        });
    }
});

// --------------------

/** @expose */
def.html = {
    // TODO: lousy multipass implementation!
    /** @expose */
    escape: function(str){
        return def
            .string.to(str)
            .replace(/&/gm, "&amp;")
            .replace(/</gm, "&lt;")
            .replace(/>/gm, "&gt;")
            .replace(/"/gm, "&quot;");
    }
};

// --------------------

/**
 * A query object.
 * @class
 * @name def.Query
 */
def
.type('Query')
.add( /** @lends {def.Query#} */{
    /** @expose */
    index: -1,

    /** @expose */
    item: undefined,

    /** @expose */
    next: function() {
        var index = this.index;
        // already was finished
        if(index === -2){
            return false;
        }

        index++;
        if(!this._next(index)){
            this.index = -2;
            this.item  = undefined;
            return false;
        }

        this.index = index;
        return true;
    },

    /**
     * @name _next
     * @function
     * @param {number} nextIndex The index of the next item, if one exists.
     * @member def.Query#
     * @returns {boolean} truthy if there is a next item, falsy otherwise.
     * @expose
     */
    _next: def.method({isAbstract: true}),

    /** @expose */
    _finish: function() {
        this.index = -2;
        this.item  = undefined;
    },

    // ------------

    /** @expose */
    each: function(fun, ctx) {
        while(this.next()){
            if(fun.call(ctx, this.item, this.index) === false) {
                return true;
            }
        }

        return false;
    },

    /** @expose */
    array: function(){
        var array = [];
        while(this.next()){
            array.push(this.item);
        }
        return array;
    },

    /** @expose */
    sort: function(compare, by){
        if(!compare){
            compare = def.compare;
        }

        if(by){
            var keyCompare = compare;
            compare = function(a, b){
                return keyCompare(by(a), by(b));
            };
        }

        var sorted = this.array().sort(compare);

        return new def.ArrayLikeQuery(sorted);
    },

    /**
     * Consumes the query and fills an object with its items.
     * <p>
     * A property is created per item in the query.
     * The default name of each property is the string value of the item.
     * The default value of the property is the item itself.
     * </p>
     * <p>
     * In the case where two items have the same key,
     * the last one overwrites the first.
     * </p>
     *
     * @param {?object=}  keyArgs keyword arguments.
     * @param {?function(*, number):(string|object)=} keyArgs.value A function that computes the value of each property.
     * @param {?(function(*, number):*)=} keyArgs.name a function that computes the name of each property.
     * @param {?object=}  keyArgs.context the context object on which <tt>keyArgs.name</tt> and <tt>keyArgs.value</tt>
     *     are called.
     * @param {?object=}  keyArgs.target the object that is to receive the properties,
     * instead of a new one being creating.
     *
     * @returns {object} A newly created object, or the specified <tt>keyArgs.target</tt> object,
     * filled with properties.
     * @expose
     */
    object: function(keyArgs){
        var target   = def.get(keyArgs, 'target') || {},
            nameFun  = def.get(keyArgs, 'name' ),
            valueFun = def.get(keyArgs, 'value'),
            ctx      = def.get(keyArgs, 'context');

        while(this.next()){
            var name = String(nameFun ? nameFun.call(ctx, this.item, this.index) : this.item);
            target[name] = valueFun ? valueFun.call(ctx, this.item, this.index) : this.item;
        }

        return target;
    },

    /** @expose */
    reduce: function(accumulator/*, [initialValue]*/){
        var i = 0,
            result;

        if(arguments.length < 2) {
            if(!this.next()) {
                throw new TypeError("Length is 0 and no second argument");
            }

            result = this.item;
        } else {
            result = arguments[1];
        }

        while(this.next()) {
            result = accumulator(result, this.item, this.index);

            ++i;
        }

        return result;
    },

    /**
     * Consumes the query and obtains the number of items.
     *
     * @type {number}
     * @expose
     */
    count: function(){
        var count = 0;

        while(this.next()){ count++; }

        return count;
    },

    /**
     * Returns the first item that satisfies a specified predicate.
     * <p>
     * If no predicate is specified, the first item is returned.
     * </p>
     *
     * @param {?(function(*,number):(boolean|*))=} pred a predicate to apply to every item.
     * @param {?object=} ctx the context object on which to call <tt>pred</tt>.
     * @param {*=} dv The value returned in case no item exists or satisfies the predicate.
     * @return {*} the first element.
     * @expose
     */
    first: function(pred, ctx, dv) {
        while(this.next()) {
            if(!pred || pred.call(ctx, this.item, this.index)) {
                var item = this.item;
                this._finish();
                return item;
            }
        }

        return dv;
    },

    /**
     * Returns the last item that satisfies a specified predicate.
     * <p>
     * If no predicate is specified, the last item is returned.
     * </p>
     *
     * @param {?(function(*,number):(boolean|*))=} pred a predicate to apply to every item.
     * @param {?object=} ctx the context object on which to call <tt>pred</tt>.
     * @param {*=} dv The value returned in case no item exists or satisfies the predicate.
     *
     * @return {*} the last element
     * @expose
     */
    last: function(pred, ctx, dv){
        var theItem = dv;
        while(this.next()){
            if(!pred || pred.call(ctx, this.item, this.index)) {
                theItem = this.item;
            }
        }

        return theItem;
    },

    /**
     * Returns <tt>true</tt> if there is at least one item satisfying a specified predicate.
     * <p>
     * If no predicate is specified, returns <tt>true</tt> if there is at least one item.
     * </p>
     *
     * @param {?(function(*,number):(boolean|*))=} pred a predicate to apply to every item.
     * @param {?object=} ctx the context object on which to call <tt>pred</tt>.
     * @return {boolean} indicates if any element satisfied the predicate.
     * @expose
     */
    any: function(pred, ctx){
        while(this.next()){
            if(!pred || pred.call(ctx, this.item, this.index)) {
                this._finish();
                return true;
            }
        }

        return false;
    },

    /**
     * Returns <tt>true</tt> if all the query items satisfy the specified predicate.
     *
     * @param {?(function(*,number):(boolean|*))=} pred a predicate to apply to every item.
     * @param {?object=} ctx the context object on which to call <tt>pred</tt>.
     *
     * @return {boolean} indicates if all elements satisfie the predicate.
     * @expose
     */
    all: function(pred, ctx){
        while(this.next()){
            if(!pred.call(ctx, this.item, this.index)) {
                this._finish();
                return false;
            }
        }

        return true;
    },

    /** @expose */
    min: function(){
        var min = null;
        while(this.next()){
            if(min === null || this.item < min) {
                min = this.item;
            }
        }

        return min;
    },

    /** @expose */
    max: function(){
        var max = null;
        while(this.next()){
            if(max === null || this.item > max) {
                max = this.item;
            }
        }

        return max;
    },

    /** @expose */
    range: function(){
        var min = null,
            max = null;

        while(this.next()){
            var item = this.item;
            if(min === null) {
                min = max = item;
            } else {
                if(item < min) {
                    min = item;
                }
                if(item > max) {
                    max = item;
                }
            }
        }

        return min != null ? {min: min, max: max} : null;
    },

    /** @expose */
    multipleIndex: function(keyFun, ctx){
        var keyIndex = {};

        this.each(function(item){
            var key = keyFun ? keyFun.call(ctx, item) : item;
            if(key != null) {
                var sameKeyItems = def.getOwn(keyIndex, key) || (keyIndex[key] = []);

                sameKeyItems.push(item);
            }
        });

        return keyIndex;
    },

    /** @expose */
    uniqueIndex: function(keyFun, ctx){
        var keyIndex = {};

        this.each(function(item){
            var key = keyFun ? keyFun.call(ctx, item) : item;
            if(key != null && !def.hasOwn(keyIndex, key)) {
                keyIndex[key] = item;
            }
        });

        return keyIndex;
    },

    // ---------------
    // Query -> Query

    // deferred map
    /** @expose */
    select: function(fun, ctx) { return new def.SelectQuery(this, fun, ctx); },

    /** @expose */
    prop: function(p) {
        return new def.SelectQuery(this, function(item) { if(item) { return item[p]; }});
    },

    /** @expose */
    selectMany: function(fun, ctx) { return new def.SelectManyQuery(this, fun, ctx); },

    /** @expose */
    union: function(/*others*/) {
        var a = arguments;
        if(a.length === 1 && a[0] == null) { return this; }
        var queries = def.array.append([this], a);
        return new def.SelectManyQuery(new def.ArrayLikeQuery(queries));
    },

    // deferred filter
    /** @expose */
    where: function(fun, ctx) { return new def.WhereQuery(this, fun, ctx); },

    /** @expose */
    distinct: function(fun, ctx) { return new def.DistinctQuery(this, fun, ctx); },

    /** @expose */
    skip: function(n) { return new def.SkipQuery(this, n); },

    /** @expose */
    take: function(n) {
        if(n <= 0) { return new def.NullQuery(); }

        if(!isFinite(n)) { return this; } // all

        return new def.TakeQuery(this, n);
    },

    /** @expose */
    whayl: function(pred, ctx) { return new def.WhileQuery(this, pred, ctx); },

    /** @expose */
    reverse: function() { return new def.ReverseQuery(this); }
});

/**
 * @class
 * @name def.NullQuery
 * @extends def.Query
 * @expose
 */
def.type('NullQuery', def.Query)
.add(/** @lends {def.NullQuery#} */{
    /**
     * @override
     * @expose
     */
    _next: function(/*nextIndex*/){}
});

/**
 * @class
 * @name def.AdhocQuery
 * @extends def.Query
 * @expose
 */
def.type('AdhocQuery', def.Query)
.init(
/**
 * @constructor
 * @name def.AdhocQuery
 */
function(next) {
    /** @expose
     *  @override
     */
    this._next = next;
});

/**
 * @class
 * @name def.ArrayLikeQuery
 * @extends def.Query
 * @expose
 */
def.type('ArrayLikeQuery', def.Query)
.init(
/**
 * @constructor
 * @name def.ArrayLikeQuery
 */
function(list) {
    this._list  = def.array.isLike(list) ? list : [list];
    this._count = this._list.length;
})
.add(/** @lends {def.ArrayLikeQuery#} */{
    /**
     * @override
     * @expose
     */
    _next: function(nextIndex) {
        var count = this._count;
        if(nextIndex < count){
            var list = this._list;

            while(!objectHasOwn.call(list, nextIndex)){
                nextIndex++;
                if(nextIndex >= count){
                    return 0;
                }
                this._count--;
            }

            this.item = list[nextIndex];
            return 1;
        }
    },

    /**
     * Obtains the number of items of a query.
     *
     * This is a more efficient implementation for the array-like class.
     * @type {number}
     * @override
     * @expose
     */
    count: function(){
        // Count counts remaining items
        var remaining = this._count;
        if(this.index >= 0){
            remaining -= (this.index + 1);
        }

        // Count consumes all remaining items
        this._finish();

        return remaining;
    }
});

/**
 * @class
 * @name def.RangeQuery
 * @extends def.Query
 * @expose
 */
def.type('RangeQuery', def.Query)
.init(
/**
 * @constructor
 * @name def.RangeQuery
 */
function(start, count, step){
    this._index = start;
    this._count = count; // may be infinte
    this._step  = step == null ? 1 : step;
})
.add(/** @lends {def.RangeQuery#} */{
    /**
     * @override
     * @expose
     */
    _next: function(nextIndex){
        if(nextIndex < this._count){
            this.item = this._index;
            this._index += this._step;
            return 1;
        }
    },

    /**
     * Obtains the number of items of a query.
     * This is a more efficient implementation.
     * @type {number}
     * @override
     * @expose
     */
    count: function(){
        // Count counts remaining items
        var remaining = this._count;
        if(this.index >= 0){
            remaining -= (this.index + 1);
        }

        // Count consumes all remaining items
        this._finish();

        return remaining;
    }
});

/**
 * @class
 * @name def.WhereQuery
 * @extends def.Query
 * @expose
 */
def.type('WhereQuery', def.Query)
.init(
/**
 * @constructor
 * @name def.WhereQuery
 */
function(source, where, ctx){
    this._where  = where;
    this._ctx    = ctx;
    this._source = source;
})
.add(/** @lends {def.WhereQuery#} */{
    /**
     * @override
     * @expose
     */
    _next: function(nextIndex){
        var source = this._source;
        while(source.next()){
            var nextItem = source.item;
            if(this._where.call(this._ctx, nextItem, source.index)){
                this.item = nextItem;
                return 1;
            }
        }
    }
});

/**
 * @class
 * @name def.WhileQuery
 * @extends def.Query
 * @expose
 */
def.type('WhileQuery', def.Query)
.init(
/**
 * @constructor
 * @name def.WhileQuery
 */
function(source, pred, ctx){
    this._pred  = pred;
    this._ctx    = ctx;
    this._source = source;
})
.add(/** @lends {def.WhileQuery#} */{
    /**
     * @override
     * @expose
     */
    _next: function(nextIndex){
        while(this._source.next()){
            var nextItem = this._source.item;
            if(this._pred.call(this._ctx, nextItem, this._source.index)){
                this.item = nextItem;
                return 1;
            }
            return 0;
        }
    }
});

/**
 * @class
 * @name def.SelectQuery
 * @extends def.Query
 * @expose
 */
def.type('SelectQuery', def.Query)
.init(
/**
 * @constructor
 * @name def.SelectQuery
 */
function(source, select, ctx){
    this._select = select;
    this._ctx    = ctx;
    this._source = source;
})
.add(/** @lends {def.SelectQuery#} */{
    /**
     * @override
     * @expose
     */
    _next: function(nextIndex){
        if(this._source.next()){
            this.item = this._select.call(this._ctx, this._source.item, this._source.index);
            return 1;
        }
    }
});

/**
 * @class
 * @name def.SelectManyQuery
 * @extends def.Query
 * @expose
 */
def.type('SelectManyQuery', def.Query)
.init(
/**
 * @constructor
 * @name def.SelectManyQuery
 */
function(source, selectMany, ctx) {
    this._selectMany = selectMany;
    this._ctx    = ctx;
    this._source = source;
    this._manySource = null;
})
.add(/** @lends {def.SelectManyQuery#} */{
    /**
     * @override
     * @expose
     */
    _next: function(nextIndex) {
        while(true) {
            // Consume all of existing manySource
            if(this._manySource) {
                if(this._manySource.next()) {
                    this.item = this._manySource.item;
                    return 1;
                }

                this._manySource = null;
            }

            if(!query_nextMany.call(this)) { break; }
        }
    }
});

function query_nextMany() {
    while(this._source.next()) {
        var manySource = this._selectMany ?
                            this._selectMany.call(this._ctx, this._source.item, this._source.index) :
                            this._source.item;
        if(manySource != null) {
            this._manySource = def.query(manySource);
            return 1;
        }
    }
}

/**
 * @class
 * @name def.DistinctQuery
 * @extends def.Query
 * @expose
 */
def.type('DistinctQuery', def.Query)
.init(
/**
 * @constructor
 * @name def.DistinctQuery
 */
function(source, key, ctx){
    this._key    = key;
    this._ctx    = ctx;
    this._source = source;
    this._keys   = {};
})
.add(/** @lends {def.DistinctQuery#} */{
    /**
     * @override
     * @expose
     */
    _next: function(nextIndex){
        while(this._source.next()){
            var nextItem = this._source.item,
                keyValue = this._key ?
                           this._key.call(this._ctx, nextItem, this._source.index) :
                           nextItem;

            // items with null keys are ignored!
            if(keyValue != null && !def.hasOwn(this._keys, keyValue)){
                this._keys[keyValue] = true;
                this.item = nextItem;
                return 1;
            }
        }
    }
});

/**
 * @class
 * @name def.SkipQuery
 * @extends def.Query
 * @expose
 */
def.type('SkipQuery', def.Query)
.init(
/**
 * @constructor
 * @name def.SkipQuery
 */
function(source, skip){
    this._source = source;
    this._skip = skip;
})
.add(/** @lends {def.SkipQuery#} */{
    /**
     * @override
     * @expose
     */
    _next: function(nextIndex){
        while(this._source.next()){
            if(this._skip > 0){
                this._skip--;
            } else {
                this.item = this._source.item;
                return 1;
            }
        }
    }
});

/**
 * @class
 * @name def.TakeQuery
 * @extends def.Query
 * @expose
 */
def.type('TakeQuery', def.Query)
.init(
/**
 * @constructor
 * @name def.TakeQuery
 */
function(source, take){
    this._source = source;
    this._take = take;
})
.add(/** @lends {def.TakeQuery#} */{
    /**
     * @override
     * @expose
     */
    _next: function(nextIndex){
        if(this._take > 0 && this._source.next()){
            this._take--;
            this.item = this._source.item;
            return 1;
        }
    }
});

/**
 * @class
 * @name def.ReverseQuery
 * @extends def.Query
 * @expose
 */
def.type('ReverseQuery', def.Query)
.init(
/**
 * @constructor
 * @name def.ReverseQuery
 */
function(source) {
    this._source = source;
})
.add(/** @lends {def.ReverseQuery#} */{
    /**
     * @override
     * @expose
     */
    _next: function(nextIndex) {
        if(!nextIndex) {
            if(this._source instanceof def.Query) {
                if(this._source instanceof def.ArrayLikeQuery){
                    this._source = this._source._list;
                } else {
                    this._source = this._source.array();
                }
            } // else assume array-like

            this._count  = this._source.length;
        }

        var count = this._count;
        if(nextIndex < count){
            var index = count - nextIndex - 1;
            var source = this._source;

            while(!objectHasOwn.call(source, index)){
                if(--index < 0){
                    return 0;
                }
                this._count--;
            }

            this.item = source[index];
            return 1;
        }
    }
});


// -------------------

/** @expose */
def.query = function(q) {
    if(q === undefined)        { return new def.NullQuery(); }
    if(q instanceof def.Query) { return q; }
    if(def.fun.is(q))          { return new def.AdhocQuery(q); }
    return new def.ArrayLikeQuery(q);
};

/** @expose */
def.range = function(start, count, step) { return new def.RangeQuery(start, count, step); };

// -------------------

/** @expose */
def.disposable = {
    /** @expose */
    is: function(disp) {
        var m;
        return !!(disp && (m = disp.dispose)) && def.fun.is(m);
    },
    /** @expose */
    as: function(disp) { return this.is(disp) ? disp : null; }
};

/**
 * @class
 * @name def.Disposable
 * @expose
 */
var Disp = def
.type('Disposable')
.addStatic( /** @lends def.Disposable */{
    /** @expose */
    dispose: function(disp, ctx) {
        disp = def.disposable.as(disp)
        disp && disp.dispose(ctx);
    },
    /** @expose */
    disposeMany: function(q, ctx) {
        q && def.query(q).each(function(disp) { Disp.dispose(disp, ctx); });
    }
})
.add(/**@lends def.Disposable*/ {
    /**
     * Indicates if the object has been disposed.
     *
     * @type {boolean}
     * @private
     */
    _disposed: false,

    /**
     * Disposes the object, if it isn't disposed yet.
     * @type {undefined}
     */
    dispose: function(ctx) {
        if(!this._disposed) {
            this._disposed = true;
            this._disposeCore(ctx);
        }
    },

    /**
     * Indicates if an object is disposed.
     * @type {boolean}
     * @expose
     */
    isDisposed: function() { return this._disposed; },

    /**
     * Actually disposes the object.
     * The default implementation disposes any
     * contained disposables.
     *
     * @protected
     * @expose
     */
    _disposeCore: function(ctx) { this._disposeDisposables(ctx); },

    /**
     * @protected
     * @expose
     */
    _disposeDisposables: function(ctx) {
        Disp.disposeMany(this._disposables(), ctx);
    },

    /**
     * @protected
     * @expose
     */
    _disposables: function() {},

    /**
     * @protected
     * @expose
     */
    _assertNotDisposed: function() {
        this._disposed && def.fail.operationInvalid("Object is disposed.");
    }
});

// Reset namespace to global, instead of 'def'
currentNamespace = def.global;
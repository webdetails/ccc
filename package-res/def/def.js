/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/** @private */
var arraySlice = Array.prototype.slice;

if(!Object.keys) {
    /** @ignore */
    Object.keys = function(o) {
        /* Object function not being used as a constructor */
        /*jshint newcap:false */
        if(o !== Object(o)) throw new TypeError('Object.keys called on non-object');

        var ret = [];
        for(var p in o)
            if(Object.prototype.hasOwnProperty.call(o,p))
                ret.push(p);
        return ret;
    };
}

if(!Array.prototype.some) {
  Array.prototype.some = function(fun /*, thisArg */) {
    'use strict';

    //if(this === void 0 || this === null) throw new TypeError();

    var t = Object(this),
        len = t.length >>> 0;
    //if(typeof fun !== 'function') throw new TypeError();

    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for(var i = 0; i < len; i++) if(i in t && fun.call(thisArg, t[i], i, t)) return true;
    return false;
  };
}

//protovis has it
//if(!Array.prototype.filter) {
//    /** @ignore */
//    Array.prototype.filter = function(fun, ctx) {
//        var len = this.length >>> 0;
//        if(typeof fun !== 'function') {
//            throw new TypeError();
//        }
//
//        var res = [];
//        for(var i = 0; i < len; i++) {
//            if(i in this) {
//                var val = this[i]; // in case fun mutates this
//                if(fun.call(ctx, val, i, this)) {
//                    res.push(val);
//                }
//            }
//        }
//
//        return res;
//    };
//}

//protovis has it
//if(!Array.prototype.forEach) {
//    Array.prototype.forEach = function(fun, ctx) {
//        for(var i = 0, len = this.length; i < len; ++i) {
//            fun.call(ctx, this[i], i, this);
//        }
//    };
//}

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

if(!Function.prototype.bind) {
    Function.prototype.bind = function(ctx) {
        var staticArgs = arraySlice.call(arguments, 1);
        var fToBind = this;

        return function() {
            return fToBind.apply(ctx, staticArgs.concat(arraySlice.call(arguments)));
        };
    };
}

// Basic JSON shim
if(!this.JSON) this.JSON = {};
if(!this.JSON.stringify) this.JSON.stringify = function(t) { return String(t); };

// ------------------------

/** @private */
var objectHasOwn = Object.prototype.hasOwnProperty;

/**
 * @name def
 * @namespace The 'definition' library root namespace.
 */
var def = /** @lends def */{
    /**
     * The JavaScript global object.
     * @type {object}
     */
    global: this,

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
     */
    get: function(o, p, dv) {
        var v;
        return o && (v = o[p]) != null ? v : dv;
    },

    gets: function(o, props) {
        return props.map(function(p) { return o[p]; });
    },

    getPath: function(o, path, dv, create) {
        if(!o) return dv;

        if(path != null) {
            var parts = def.array.is(path) ? path : path.split('.'),
                L = parts.length;
            if(L) {
                var i = 0;
                while(i < L) {
                    var part = parts[i++],
                        value = o[part];
                    if(value == null) {
                        if(!create) return dv;
                        value = o[part] = (dv == null || isNaN(+dv)) ? {} : [];
                    }
                    o = value;
                }
            }
        }

        return o;
    },

    setPath: function(o, path, v) {
        if(o && path != null) {
            var parts = def.array.is(path) ? path : path.split('.');
            if(parts.length) {
                var pLast = parts.pop();
                o = def.getPath(o, parts, pLast, true);
                if(o != null) o[pLast] = v;
            }
        }
        return o;
    },

    /**
     * Creates a property getter function,
     * for a specified property name.
     *
     * @param {string} p The name of the property.
     * @param [dv=undefined]
     * The default value to return
     * if the property would be accessed on null or undefined.
     * @type function
     */
    propGet: function(p, dv) {
        p = '' + p;

        /**
         * Gets the value of a prespecified property
         * of a given thing.
         *
         * @param [o] The <i>thing</i> whose prespecified property is to be read.
         * <p>
         * If {@link o} is not "nully",
         * but is not of type 'object',
         * the function behaves equivalently to:
         * </p>
         * <pre>
         * return Object(o)[propName];
         * </pre>
         *
         * @returns {any}
         * If the specified {@link o} is not "nully",
         * returns the value of the prespecified property on it;
         * otherwise, returns the prespecified default value.
         *
         * @private
         */
        return function(o) { return o ? o[p] : dv; };
    },

    // TODO: propSet ?

    /**
     * Gets the value of an existing, own, and not "nully", property of an object,
     * or if unsatisfied, a specified default value.
     *
     * @param {object} [o] The object whose property value is desired.
     * @param {string} p The desired property name.
     * If the value is not a string,
     * it is converted to one, as if String(p) were used.
     * @param dv The default value.
     *
     * @returns {any} The satisfying property value or the specified default value.
     *
     * @see def.get
     * @see def.hasOwn
     * @see def.nully
     */
    getOwn: function(o, p, dv) {
        var v;
        return o && objectHasOwn.call(o, p) && (v = o[p]) != null ? v : dv;
    },

    hasOwn: function(o, p) {
        return !!o && objectHasOwn.call(o, p);
    },

    hasOwnProp: objectHasOwn,

    set: function(o) {
        // Not assigning to arguments variable allows optimizations.
        var oo = o || {},
            a  = arguments;
        for(var i = 1, A = a.length - 1 ; i < A ; i += 2) oo[a[i]] = a[i+1];
        return oo;
    },

    setDefaults: function(o, o2) {
        // Not assigning to arguments variable allows optimizations.
        var oo = o || {},
            a = arguments,
            A = a.length,
            p;
        if(A === 2 && def.object.is(o2)) {
            for(p in o2) if(oo[p] == null) oo[p] = o2[p];
        } else {
            A--;
            for(var i = 1 ; i < A ; i += 2) {
                p = a[i];
                if(oo[p] == null) oo[p] = a[i+1];
            }
        }
        return oo;
    },

    setUDefaults: function(o, o2) {
        // Not assigning to arguments variable allows optimizations.
        var oo = o || {},
            a = arguments,
            A = a.length,
            p;
        if(A === 2 && def.object.is(o2)) {
            for(p in o2) if(oo[p] === undefined) oo[p] = o2[p];
        } else {
            A--;
            for(var i = 1 ; i < A ; i += 2) {
                p = a[i];
                if(oo[p] === undefined) oo[p] = a[i+1];
            }
        }
        return oo;
    },

    /**
     * Calls a function
     * for every <i>own</i> property of a specified object.
     *
     * @param {object} [o] The object whose own properties are traversed.
     * @param {function} [fun] The function to be called once per own property of <i>o</i>.
     * The signature of the function is:
     * <pre>
     * function(value, property : string, o : object) : any
     * </pre>
     *
     * @param {object} [ctx=null] The context object on which to call <i>fun</i>.
     *
     * @type undefined
     */
    eachOwn: function(o, fun, ctx) {
        for(var p in o) if(objectHasOwn.call(o, p)) fun.call(ctx, o[p], p, o);
    },

    /**
     * Calls a function
     * for every property of a specified object, own or inherited.
     *
     * @param {object} [o] The object whose own properties are traversed.
     * @param {function} [fun] The function to be called once per own property of <i>o</i>.
     * The signature of the function is:
     * <pre>
     * function(value, property : string, o : object) : any
     * </pre>
     *
     * @param {object} [ctx=null] The context object on which to call <i>fun</i>.
     *
     * @type undefined
     */
    each: function(o, fun, ctx) {
        for(var p in o) fun.call(ctx, o[p], p, o);
    },

    copyOwn: function(a, b) {
        var to, from;
        if(arguments.length >= 2)
            to = (a || {}), from = b;
        else
            to = {}, from = a;

        for(var p in from) if(objectHasOwn.call(from, p)) to[p] = from[p];

        return to;
    },

    copy: function(a, b) {
        var to, from;
        if(arguments.length >= 2)
            to = (a || {}), from = b;
        else
            to = {}, from = a;

        for(var p in from) to[p] = from[p];

        return to;
    },

    copyProps: function(a, b, props) {
        var to, from;
        if(arguments.length >= 3)
            to = (a || {}), from = b;
        else
            to = {}, from  = a, props = b;

        if(props) {
            if(from)
                props.forEach(function(p) { to[p] = from[p];   });
            else
                props.forEach(function(p) { to[p] = undefined; });
        }

        return to;
    },

    keys: function(o) {
        var keys = [];
        for(var p in o) keys.push(p);
        return keys;
    },

    values: function(o) {
        var values = [];
        for(var p in o) values.push(o[p]);
        return values;
    },

    uniqueIndex: function(o, key, ctx) {
        var index = {};
        for(var p in o) {
            var v = key ? key.call(ctx, o[p]) : o[p];
            if(v != null && !objectHasOwn.call(index, v)) index[v] = p;
        }
        return index;
    },

    ownKeys: Object.keys,

    own: function(o, f, ctx) {
        var keys = Object.keys(o);
        return f
            ? keys.map(function(key) { return f.call(ctx, o[key], key); })
            : keys.map(function(key) { return o[key]; });
    },

    firstDefined: function(funs, args, x) {
        var v, i = 0, L = funs.length;
        if(!args) args = [];
        while(i < L) if((v = funs[i++].apply(x, args)) !== undefined) return v;
    },

    scope: function(scopeFun, ctx) {
        return scopeFun.call(ctx);
    },

    // Bit -------------
    bit: {
        set: function(bits, set, on) { return (on || on == null) ? (bits | set) : (bits & ~set); }
    },

    // Special functions ----------------

    /**
     * The natural order comparator function.
     * @field
     * @type function
     */
    compare: function(a, b) {
        /* Identity is favored because, otherwise,
         * comparisons like: compare(NaN, 0) would return 0...
         * This isn't perfect either, because:
         * compare(NaN, 0) === compare(0, NaN) === -1
         * so sorting may end in an end or the other...
         */
        return (a === b) ? 0 : ((a > b) ? 1 : -1);
        //return (a < b) ? -1 : ((a > b) ? 1 : 0);
    },

    compareReverse: function(a, b) {
        return (a === b) ? 0 : ((a > b) ? -1 : 1);
    },

    methodCaller: function(p, x) {
        return x
            ? function() { return    x[p].apply(x,    arguments); }
            // floating method
            : function() { return this[p].apply(this, arguments); };
    },

    /**
     * The identity function.
     * @field
     * @type function
     */
    identity: function(x) { return x; },

    add: function(a, b) { return a + b; },

    // negate?
    negate: function(f) {
        return function() { return !f.apply(this, arguments); };
    },

    sqr: function(v) { return v * v; },

    // Constant functions ----------------

    /**
     * The NO OPeration function.
     * @field
     * @type function
     */
    noop: function noop() { /* NOOP */ },

    retTrue:  function() { return true;  },
    retFalse: function() { return false; },

    // Type namespaces ----------------

    number: {
        is: function(v) { return typeof v === 'number'; },

        as: function(d, dv) {
            var v = parseFloat(d);
            return isNaN(v) ? (dv || 0) : v;
        },

        to: function(d, dv) {
            var v = parseFloat(d);
            return isNaN(v) ? (dv || 0) : v;
        }
    },

    array: {
        empty: function(v) { return !(v && v.length); },

        is: function(v) { return (v instanceof Array); },

        // TODO: def.array.like.is
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
         */
        as: function(thing) {
            return (thing instanceof Array) ? thing : ((thing != null) ? [thing] : null);
        },

        to: function(thing) {
            return (thing instanceof Array) ? thing : ((thing != null) ? [thing] : null);
        },

        lazy: function(scope, p, f, ctx) {
            return scope[p] || (scope[p] = (f ? f.call(ctx, p) : []));
        },

        copy: function(al/*, start, end*/) {
            return arraySlice.apply(al, arraySlice.call(arguments, 1));
        }
    },

    object: {
        is: function(v) {
            return (!!v) && typeof(v) === 'object'; // Is (v instanceof Object) faster?
        },

        isNative: function(v) {
            // Sightly faster, but may cause boxing?
            return (!!v) && /*typeof(v) === 'object' &&*/ v.constructor === Object;
        },

        as: function(v) {
            return v && typeof(v) === 'object' ? v : null;
        },

        asNative: function(v) {
            // Sightly faster, but may cause boxing?
            return v && /*typeof(v) === 'object' &&*/ v.constructor === Object
                ? v
                : null;
        },

        lazy: function(scope, p, f, ctx) {
            return scope[p] ||
                  (scope[p] = (f ? f.call(ctx, p) : {}));
        }
    },

    string: {
        is: function(v) { return typeof v === 'string'; },

        to: function(v, ds) { return v != null ? String(v) : (ds || ''); },

        join: function(sep) {
            var a = arguments,
                L = a.length,
                v, v2;

            switch(L) {
                case 3:
                    v  = a[1];
                    v2 = a[2];
                    if(v != null && v !== "")
                        return (v2 != null && v2 !== "")
                            ? ((""+v) + sep + (""+v2))
                            : (""+v);

                    if(v2 != null && v2 !== "") return (""+v2);

                    return "";

                case 2:
                    v = a[1];
                    return v != null ? (""+v) : "";

                case 1:
                case 0: return "";
            }

            // general case

            var args = [];
            for(var i = 1 ; i < L ; i++) {
                v = a[i];
                if(v != null && v !== "") args.push("" + v);
            }

            return args.join(sep);
        },

        padRight: function(s, n, p) {
            if(!s) s = '';
            if(p == null) p = ' ';

            var k = ~~((n - s.length) / p.length);
            return k > 0 ? (s + new Array(k + 1).join(p)) : s;
        }
    },

    fun: {
        is: function(v) { return typeof v === 'function'; },

        as: function(v) { return typeof v === 'function' ? v : null; },

        to: function(v) { return typeof v === 'function' ? v : def.fun.constant(v); },

        constant: function(v) { return function() { return v; }; }
    },

    // nully to 'dv'
    nullyTo: function(v, dv) { return v != null ? v : dv; },

    between: function(v, min, max) { return Math.max(min, Math.min(v, max)); },

    // Predicates ----------------

    // === null || === undefined
    nully: function(v) { return v == null; },

    // !== null && !== undefined
    notNully: function(v) { return v != null; },

    // !== undefined
    notUndef: function(v) { return v !== undefined; },

    empty: function(v) { return v == null || v === ''; },

    notEmpty: function(v) { return v != null && v !== ''; },

    /**
     * The truthy function.
     * @field
     * @type function
     */
    truthy: function(x) { return !!x; },

    /**
     * The falsy function.
     * @field
     * @type function
     */
    falsy: function(x) { return !x; },

    // -----------------

    /* Ensures the first letter is upper case */
    firstUpperCase: function(s) {
        if(s) {
            var c  = s.charAt(0),
                cU = c.toUpperCase();
            if(c !== cU) s = cU + s.substr(1);
        }
        return s;
    },

    firstLowerCase: function(s) {
        if(s) {
            var c  = s.charAt(0),
                cL = c.toLowerCase();
            if(c !== cL) s = cL + s.substr(1);
        }
        return s;
    },

    titleFromName: function(name) {
        // TODO: i18n
        return def.firstUpperCase(name).replace(/([a-z\d])([A-Z])/, "$1 $2");
    },

    indexedId: function(prefix, index) {
        return (index > 0)
            ? (prefix + "" + (index + 1)) // base2, ortho3,..., legend2
            : prefix; // base, ortho, legend
    },

    splitIndexedId: function(indexedId) {
        var match = /^(.*?)(\d*)$/.exec(indexedId),
            index = null;
        if(match[2]) {
            index = Number(match[2]);
            if(index <= 1)
                index = 1;
            else
                index--;
        }
        return [match[1], index];
    },

/**
     * Formats a string by replacing
     * place-holder markers, of the form "{foo}",
     * with the value of corresponding properties
     * of the specified scope argument.
     *
     * @param {string} mask The string to format.
     * @param {object|function} [scope] The scope object or function.
     * @param {object} [ctx] The context object for a scope function.
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
     */
    format: function(mask, scope, ctx) {
        if(mask == null || mask === '') return "";

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
     *
     * @returns {any[]} An array representing the binding, with the values bound to each type.
     */
    destructuringTypeBind: function(types, values) {
        var T = types.length,
            result = new Array(T), V;
        if(T && values && (V = values.length)) {
            var v = 0, t = 0;
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
        return result;
    },

    // --------------

    error: function(error) { return (error instanceof Error) ? error : new Error(error); },

    fail: function(error) { throw def.error(error); },

    assert: function(msg, scope) { throw def.error.assertionFailed(msg, scope); }
};

def.ascending  = def.compare;
def.descending = def.compareReverse;

var AL = def.array.like = def.copyOwn(
    function(v) { return AL.is(v) ? v : [v]; }, {

    is: function(v) { return v && (v.length != null) && (typeof v !== 'string'); },

    as: function(v) { return AL.is(v) ? v : null; }
});
AL.to = AL;

def.lazy = def.object.lazy;

// Adapted from
// http://www.codeproject.com/Articles/133118/Safe-Factory-Pattern-Private-instance-state-in-Jav/
def.shared = function() {
    var _channel = undefined;

    /** @private */
    function create(value) {

        /** @private */
        function safe() { _channel = value; }

        return safe;
    }

    /** @private */
    function opener(safe) {
        if(_channel !== undefined) throw new Error("Access denied.");

        // 1 - calling `safe` places its secret in the `_channel`.
        // 2 - read and return the value in `_channel`.
        // 3 - clear `_channel` to avoid memory leak.
        var secret = (safe(), _channel); // Do NOT remove the parenthesis!
        return (_channel = undefined), secret;
    }

    opener.safe = create;
    opener.property = createSafeProp;
    return opener;
};

function createSafeProp(p) {
    var opener = this;

    // Creates a safe containing the specified `secret`.
    // Stores the safe in property `p` of the specified `inst`.
    function instInit(inst, secret) {
        inst[p] = opener.safe(secret);
        return secret;
    }

    // Given an instance, obtains the safe stored in
    // property `p` and opens it with the
    // original `key` function.
    function propKey(inst) { return opener(inst[p]); }

    propKey.init = instInit;
    propKey.propertyName = p;

    return propKey;
}

var errors = {
    operationInvalid: function(msg, scope) {
        return def.error(def.string.join(" ", "Invalid operation.", def.format(msg, scope)));
    },

    notImplemented: function() { return def.error("Not implemented."); },

    argumentRequired: function(name) {
        return def.error(def.format("Required argument '{0}'.", [name]));
    },

    argumentInvalid: function(name, msg, scope) {
        return def.error(
                   def.string.join(" ",
                       def.format("Invalid argument '{0}'.", [name]),
                       def.format(msg, scope)));
    },

    assertionFailed: function(msg, scope) {
        return def.error(
                   def.string.join(" ",
                       "Assertion failed.",
                       def.format(msg, scope)));
    }
};

def.copyOwn(def.error, errors);

/* Create direct fail versions of errors */
def.eachOwn(errors, function(errorFun, name) {
    def.fail[name] = function() {
        throw errorFun.apply(null, arguments);
    };
});

// -----------------------

/** @private */
var currentNamespace = def, // at the end of the file it is set to def.global
    globalNamespaces = {}, // registered global namespaces by name: globalName -> object
    namespaceStack   = [];

/** @private */
function globalSpace(name, space) {
    return globalNamespaces[name] = space;
}

/** @private */
function getNamespace(name, base) {
    var current = base || currentNamespace;
    if(name) {
        var parts = name.split('.'),
            L = parts.length;
        if(L) {
            var i = 0, part;
            if(current === def.global) {
                part = parts[0];
                var globalNamespace = def.getOwn(globalNamespaces, part);
                if(globalNamespace) {
                    current = globalNamespace;
                    i++;
                }
            }

            while(i < L) {
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
 * @param {string} name The namespace name.
 * @param {object} [base] The base namespace object.
 * @param {function} [definition] The namespace definition function.
 * @type object
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
        try {
            definition(namespace);
        } finally {
            currentNamespace = namespaceStack.pop();
        }
    }

    return namespace;
}

/** @private */
function defineName(namespace, name, value) {
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
 * def.space('foo.bar', function(space) {
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
 * A function that is called within the desired namespace
 * as first argument and while it is current.
 *
 * @returns {object} The namespace.
 */
def.space = createSpace;

/**
 * Registers a name and an object as a global namespace.
 * @param {string} name The name of the global namespace component to register.
 * @param {object} space The object that represents the namespace.
 * @returns {object} the registered namespace object.
 */
def.globalSpace = globalSpace;

// -----------------------

def.mixin = createMixin(Object.create);
def.copyOwn(def.mixin, {
    custom:  createMixin,
    inherit: def.mixin,
    copy:    createMixin(def.copy),
    share:   createMixin(def.identity)
});

/** @private */
function createMixin(protectNativeObject) {
    return function(instance/*mixin1, mixin2, ...*/) {
        return mixinMany(instance, arraySlice.call(arguments, 1), protectNativeObject);
    };
}

/** @private */
function mixinMany(instance, mixins, protectNativeObject) {
    var mixin, i = 0, L = mixins.length;

    while(i < L) if((mixin = mixins[i++])) {
        mixin = def.object.as(mixin.prototype || mixin);
        if(mixin) mixinRecursive(instance, mixin, protectNativeObject);
    }

    return instance;
}

/** @private */
function mixinRecursive(instance, mixin, protectNativeObject) {
    for(var p in mixin) mixinProp(instance, p, mixin[p], protectNativeObject);
}

/** @private */
function mixinProp(instance, p, vMixin, protectNativeObject) {
    if(vMixin !== undefined) {
        var oMixin,
            oTo = def.object.asNative(instance[p]);

        if(oTo) {
            oMixin = def.object.as(vMixin);
            if(oMixin) {
                // If oTo is inherited, don't change it
                // Inherit from it and assign it locally.
                // It will be the target of the mixin.
                if(!objectHasOwn.call(instance, p)) instance[p] = oTo = Object.create(oTo);

                // Mixin the two objects
                mixinRecursive(oTo, oMixin, protectNativeObject);
            } else {
                // Overwrite oTo with a simple value
                instance[p] = vMixin;
            }
        } else {
            // Target property does not contain a native object.
            oMixin = def.object.asNative(vMixin);
            // Should vMixin be set directly in instance[p] ?
            // Should we copy its properties into a fresh object ?
            // Should we inherit from it ?
            if(oMixin) vMixin = (protectNativeObject || Object.create)(oMixin);

            instance[p] = vMixin;
        }
    }
}

// -----------------------

/** @private */
function createRecursive(instance) {
    var p, vObj;
    for(p in instance)
        if((vObj = def.object.asNative(instance[p])))
            createRecursive( (instance[p] = Object.create(vObj)) );
}

// Creates an object whose prototype is the specified object.
def.create = function(/*[deep,] baseProto, mixin1, mixin2, ...*/) {
    var mixins = arraySlice.call(arguments),
        deep = true,
        baseProto = mixins.shift();

    if(typeof(baseProto) === 'boolean') {
        deep = baseProto;
        baseProto = mixins.shift();
    }

    var instance = baseProto ? Object.create(baseProto) : {};
    if(deep) createRecursive(instance);

    // NOTE:
    if(mixins.length > 0) {
        mixins.unshift(instance);
        def.mixin.apply(def, mixins);
    }

    return instance;
};

// -----------------------

def.scope(function() {
    var shared = def.shared();

    /** @private */
    function typeLocked() {
        return def.error.operationInvalid("Type is locked.");
    }

    /** @ignore */
    var typeProto = /** lends def.type# */{
        init: function(init) {
            /*jshint expr:true */

            init || def.fail.argumentRequired('init');

            var state = shared(this.safe);

            !state.locked || def.fail(typeLocked());

            // NOTE: access to init inherits baseState's init!
            // Before calling init or postInit, baseState.initOrPost is inherited as well.
            var baseInit = state.init;
            if(baseInit) init = override(init, baseInit);

            state.init = init;
            state.initOrPost = true;

            return this;
        },

        postInit: function(postInit) {
            /*jshint expr:true */

            postInit || def.fail.argumentRequired('postInit');

            var state = shared(this.safe);

            !state.locked || def.fail(typeLocked());

            // NOTE: access to post inherits baseState's post!
            // Before calling init or postInit, baseState.initOrPost is inherited as well.
            var basePostInit = state.post;
            if(basePostInit) postInit = override(postInit, basePostInit);

            state.post = postInit;
            state.initOrPost = true;

            return this;
        },

        add: function(mixin) {
            var state = shared(this.safe);

            /*jshint expr:true */
            !state.locked || def.fail(typeLocked());

            var proto = this.prototype,
                baseState = state.base;

            def.each(mixin.prototype || mixin, function(value, p) {
                // filter props/methods
                switch(p) {
                    case 'base':
                    case 'constructor': // don't let overwrite 'constructor' of prototype
                        return;

                    case 'toString':
                        if(value === toStringMethod) return;
                        break;

                    case 'override':
                        if(value === overrideMethod) return;
                        break;
                }

                if(value) {
                    // Try to convert to method
                    var method = asMethod(value);
                    if(method) {
                        var baseMethod;

                        // Check if it is an override

                        // Exclude inherited stuff from Object.prototype
                        var bm = state.methods[p];
                        if(bm && (bm instanceof Method)) {
                            baseMethod = bm;
                        } else if(baseState) {
                            bm = baseState.methods[p];
                            if(bm && (bm instanceof Method)) baseMethod = bm;
                        }

                        state.methods[p] = method;

                        // Replace value with an override function
                        // that intercepts the call and sets the correct
                        // 'base' property before calling the original value function
                        if(baseMethod) value = baseMethod.override(method);

                        proto[p] = value;
                        return;
                    }
                }

                mixinProp(proto, p, value, /*protectNativeValue*/def.identity); // Can use native object value directly
            });

            return this;
        },

        getStatic: function(p) {
            return getStatic(shared(this.safe), p);
        },

        addStatic: function(mixin) {
            var state = shared(this.safe);

            /*jshint expr:true */
            !state.locked || def.fail(typeLocked());

            for(var p in mixin) {
                if(p !== 'prototype') {
                    var v2 = mixin[p],
                        o2 = def.object.as(v2);
                    if(o2) {
                        var v1 = def.getOwn(this, p),
                            v1Local = (v1 !== undefined);

                        if(!v1Local) v1 = getStatic(state.base, p);

                        var o1 = def.object.asNative(v1);
                        if(o1) {
                            if(v1Local) {
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

    function getStatic(state, p) {
        var v;
        if(state) {
            do {
                if((v = def.getOwn(state.constructor, p)) !== undefined) return v;
            } while((state = state.base));
        }
    }

    // TODO: improve this code with indexOf
    function TypeName(full) {
        var parts;
        if(full) {
            if(full instanceof Array) {
                parts = full;
                full  = parts.join('.');
            } else {
                parts = full.split('.');
            }
        }

        if(parts && parts.length > 1) {
            this.name           = parts.pop();
            this.namespace      = parts.join('.');
        } else {
            this.name = full || null;
            this.namespace = null;
        }
    }

    TypeName.prototype.toString = function() {
        return def.string.join('.', this.namespace + '.' + this.name);
    };

    function Method(spec) {
        this.fun = spec.as;
        this.isAbstract = !!spec.isAbstract;
    }

    def.copyOwn(Method.prototype, {
        override: function(method) {
            // *this* is the base method

            // Abstract base methods do not maintain 'base' property.
            // Interception is not needed.
            if(this.isAbstract) return method.fun;

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
            if(def.fun.is(fun))       return new Method({as: fun});
            if(fun instanceof Method) return fun;
            if(def.fun.is(fun.as))    return new Method(fun);
            if(fun.isAbstract)        return new Method({isAbstract: true, as: def.fail.notImplemented });
        }

        return null;
    }

    /** @private */
    function method(fun) {
        return asMethod(fun) || def.fail.argumentInvalid('fun');
    }

    // -----------------

    function RootType() { }

    var rootProto = RootType.prototype;
    // Unfortunately, creates an enumerable property in every instance
    rootProto.base = undefined;

    var rootState = {
        locked:      true,
        init:        undefined,
        postInit:    undefined,
        initOrPost:  false,
        methods:     {},
        constructor: RootType
    };

    RootType.safe = shared.safe(rootState);

    // -----------------

    /** @private */
    function override(method, base) {

        return function() {
            var prevBase = rootProto.base;
            rootProto.base = base;
            try {
                return method.apply(this, arguments);
            } finally {
                rootProto.base = prevBase;
            }
        };
    }

    function overrideMethod(mname, method) {
        this[mname] = override(method, this[mname]);
        return this;
    }

    function toStringMethod() {
        return String(this.constructor);
    }

    // -----------------

    /** @private */
    function inherits(type, base) {
        var proto = type.prototype = Object.create(base.prototype);
        // Unfortunately, creates an enumerable property in every instance
        proto.constructor = type;
        return proto;
    }

    // -----------------

    /** @private */
    function createConstructor(state) {

//        function constructor() {
//            /*jshint expr:true */
//            var method;
//            if(state.initOrPost) {
//                (method = state.init) && method.apply(this, arguments);
//                (method = state.post) && method.apply(this, arguments);
//            }
//        }

        // Slightly faster version
//        var init, post;
//        var start = function() {
//            start = null;
//            if(state.initOrPost) {
//                init = state.init;
//                post = state.post;
//            }
//        };
//
//        function constructor() {
//            /*jshint expr:true */
//            start && start();
//
//            init && init.apply(this, arguments);
//            post && post.apply(this, arguments);
//        }

        // Even faster, still
        var S = 1,
            steps = [
            // Start up class step
            function() {
                S = 0;
                if(state.initOrPost) {
                    steps.length = 0;
                    if(state.init) steps.push(state.init), S++;
                    if(state.post) steps.push(state.post), S++;
                    // Call constructor recursively
                    //  and stop initial constructor from running postInit again
                    //  by returning false
                    return constructor.apply(this, arguments), false;
                }
                steps = null;
            }
        ];

        function constructor() {
            if(S) {
                var i = 0;
                while(steps[i].apply(this, arguments) !== false && ++i < S) {}
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
     */
    function type(/* name[, baseType[, space]] | baseType[, space] | space */) {

        var args = def.destructuringTypeBind(_typeFunArgTypes, arguments);

        return typeCore.apply(this, args);
    }

    function typeCore(name, baseType, space) {
        var typeName = new TypeName(name);

        // ---------------

        var baseState;
        if(baseType) {
            baseState = (baseType.safe && shared(baseType.safe)) ||
                         def.fail.operationInvalid("Invalid \"foreign\" base type.");
            baseState.locked = true;
        } else {
            baseType  = RootType;
            baseState = rootState;
        }

        // ---------------

        var state = Object.create(baseState);
        state.locked  = false;
        state.base    = baseState;
        state.methods = Object.create(baseState.methods);

        // ---------------

        var constructor = createConstructor(state);

        def.copyOwn(constructor, typeProto);

        constructor.name     = typeName.name;
        constructor.typeName = typeName;
        constructor.safe     = shared.safe(state);
        constructor.toString = function() { return (''+this.typeName) || "Anonymous type"; };

        var proto = inherits(constructor, baseType);

        state.constructor = constructor;

        // ---------------
        // Default methods (can be overwritten with Type#add)

        proto.override = overrideMethod;
        proto.toString = toStringMethod;

        // ---------------

        if(typeName.name) defineName(def.space(typeName.namespace, space), typeName.name, constructor);

        return constructor;
    }

    def.type   = type;
    def.method = method;
});

def.makeEnum = function(a, ka) {
    var i = 1, all = 0, e = {}, allItem = def.get(ka, 'all');
    a.forEach(function(p) {
        e[p] = i;
        if(allItem) all |= i;
        i = i << 1;
    });
    if(allItem) e[allItem] = all;
    return e;
};

// ------------------------------

var def_configGenBlackList = {tryConfigure: 1, configure: 1};

def.copyOwn(def, {
    // ----------------
    // Class convention

    /**
     * Classifies an object value in a given class.
     *
     * @param {object} v The value whose class being stated.
     * @param {function} Class The class of the value.
     * @return {object} The value in <i>v</i>.
     * @see def.classOf
     */
    classify: function(v, Class) {
        v._class = Class;
        return v;
    },

    /**
     * Obtains the class of a value, returning <tt>undefined</tt>, when there is none.
     *
     * Two kinds of "classes" are considered.
     *
     * The most obvious one is that of classes represented by a <i>constructor</i> function.
     * Instances of this kind of class are created by explicitly using the <tt>new</tt> operator,
     * as in <tt>var inst = new ClassConstructor()</tt>.
     * Unless explicitly changed, the class of an instance
     * created this way is present in its <i>constructor</i> property.
     *
     * The other less obvious one is that of classes represented by a <i>factory</i> function.
     * Factory functions are called directly and not using the <tt>new</tt> operator.
     * A factory function abstracts the code from the actual provenance of the instances it returns.
     * Additionally, a factory function is not required to create a new instance, every time it is called
     * (actually, constructor functions also have this ability, but it's non-recommended pattern).
     * Knowledge of this kind of class relies on explicit annotation of an instance
     * by use of the {@link def.classify} function.
     *
     * This function gives precedence to the annotated class of an instance, when there is one,
     * falling back to the value of the <i>constructor</i> property, when not.
     * Lastly, when the value is not an object, or has no defined constructor,
     * the value <tt>undefined</tt> is returned.
     *
     * @param {any} v The value whose class is to be obtained.
     * @return {function|undefined} The class of the value, or <tt>undefined</tt>, when there is none.
     */
    classOf: function(v) {
        return (v && (v._class || v.constructor)) || undefined;
    },

    /**
     * Indicates whether a value is an instance of a class.
     *
     * @param {any} v The value to test.
     * @param {function} Class The class function to test.
     *
     * @return {boolean}
     * <tt>true</tt>, if it is and instance,
     * <tt>false</tt>, if not.
     */
    is: function(v, Class) {
        return !!v && ((v._class && v._class === Class) || (v instanceof Class));
    },

    /**
     * Returns
     * the <i>v</i> argument, when it is an instance of the provided class, or,
     * the <i>fv</i> argument, otherwise.
     *
     * @param {any} v The value to test.
     * @param {function} Class The class function to test.
     * @param {any} [fv=undefined] The value to return when the value is
     *     <i>not</i> an instance of the provided class.
     * @return {boolean}
     * <tt>true</tt>, if it is an instance,
     * <tt>false</tt>, if not.
     */
    as: function(v, Class, fv) {
        return def.is(v, Class) ? v : fv;
    },

    /**
     * Creates a predicate "is" function
     * that tests if values are of the here specified class.
     * @param {function} Class The class that the predicate will test.
     * @return {function} The created predicate function.
     * @see def.is
     */
    createIs: function(Class) {
        function isClass(v) {
            return def.is(v, Class);
        }
        return isClass;
    },

    /**
     * Creates an "as" function
     * that "filters" values of a here specified class.
     * @param {function} Class The class that the "as" function will test.
     * @return {function} The created function.
     * @see def.as
     */
    createAs: function(Class) {
        function asClass(v) {
            return def.as(v, Class);
        }
        return asClass;
    },

    // ----------------
    // Factory convention
    // (config, proto) -> instance
    // As first argument, a configuration value.
    // As second argument, the proto instance, if any.
    factoryArgsConfig: function(args) { return (args && args.length     && args[0]) || null; },
    factoryArgsProto:  function(args) { return (args && args.length > 1 && args[1]) || null; },

    /**
     * Initializes an object that is an instance of a factory-class.
     *
     * @param {object} inst The instance object.
     * @param {function} factory The factory-class function that "created" <i>inst</i>.
     * @param {function} [sharedProp] A shared property function used to store the private fields object
     * in a (public) property of <i>inst</i>.
     * When not specified,
     * it is the responsibility of the caller to somehow associate the returned "fields" object with <i>inst</i>.
     *
     * Note that the accessor functions created by {@link def.classAccessors} depend on the fields object
     * to be stored with each instance this way.
     * The prototype instance feature also depends on being able to recover the "fields" object of an instance
     * by calling a <i>sharedProp</i> function(or alike) on it.
     *
     * @param {object[]} [args] An arguments object (or array-like) following the factory function convention.
     *      The initial configuration of the instance and the prototype instance feature
     *      require this argument to be specified.
     *
     *      For more information on the structure of <i>args</i>,
     *      see {@link def.factoryArgsConfig} and {@link def.factoryArgsProto}.
     *
     * @param {object<string, object|function>} [specs]  A map of property names to instance accessor specifications.
     *      Instead of a full accessor specification object,
     *      the factory of a property's value type can be specified.
     *
     *      An accessor function is created and set on <i>inst</i> for each property in the map.
     *
     *      For further information about the structure of an accessor specification, see {@link def.accessor}.
     *
     * @return {object} The created fields object.
     */
    instance: function(inst, factory, sharedProp, args, specs) {
        // Support class convention
        def.classify(inst, factory);

        var fields = def.instanceFields(inst, factory, sharedProp, args);

        specs && def.instanceAccessors(inst, fields, specs);

        var config = def.factoryArgsConfig(args);
        if(config) def.configure(inst, config);

        return fields;
    },

    instanceFields: function(inst, factory, sharedProp, args) {
        // Obtain proto instance to connect to.
        // Either a second argument, or the factory's defaults
        // (which will be undefined when creating the class defaults instance itself).
        // Note that the prototype instance is only valid if from the same class.
        var proto = def.factoryArgsProto(args);
        if(!proto || !def.is(proto, factory)) proto = factory.defaults;

        var protoFields = sharedProp && proto && sharedProp(proto);

        // Create the local fields object, inheriting from the `proto` instance, if any.
        var fields = protoFields ? Object.create(protoFields) : {};
        fields._proto = proto;

        // Share the fields object as a safe property,
        // to allow other instances to inherit from `inst`,
        // and return it.
        return sharedProp ? sharedProp.init(inst, fields) : fields;
    },

    classAccessors: function(classOrProto, sharedProp, specs) {
        var classProto = classOrProto.prototype || classOrProto;
        for(var name in specs) classProto[name] = def.accessor(null, name, sharedProp, specs[name]);
        return def;
    },

    instanceAccessors: function(inst, fields, specs) {
        var getFields = def.fun.constant(fields);
        for(var name in specs) inst[name] = def.accessor(inst, name, getFields, specs[name]);
        return def;
    },

    accessor: function(pub, name, getFields, spec) {
        if(def.fun.is(spec)) spec = {factory: spec};

        // If the field has a factory, it is configurable by default.
        // A field that does not have a factory can still be configurable,
        //  and it will be, effectively, as long as the value is local.
        // Most fields not having a factory will most likely be of non-object types,
        //  and these can never be configurable.
        var factory      = def.get(spec, "factory"),
            configurable = def.get(spec, "configurable", !!factory),
            change       = def.get(spec, "change" ),
            cast         = def.get(spec, "cast"   ),
            fail         = def.get(spec, "fail"   ),
            msg;

        spec = null;

        return accessor;

        function accessor(v2) {
            var inst = pub || this, fields = getFields(inst);

            return arguments.length
                ? setter.call(inst, fields, v2)
                // GET
                : fields[name];
        }

        function setter(fields, v2) {
            // In setter semantics, `undefined` means "no operation".
            if(v2 !== undefined) {
                // Current value
                var v1 = fields[name];

                // The `null` value means discarding a local value,
                // letting the prototype instance's inherited value, if any, show-through.
                // If the object has no prototype instance, then just ignore the reset command.
                if(v2 === null) {
                    if(fields._proto && objectHasOwn.call(fields, name)) {
                        delete fields[name];
                        v2 = fields[name];
                        if(change && v2 !== v1) change(v2, v1, this, name);
                    }
                } else if(v2 !== v1) {
                    if(fail && (msg = fail(v2))) throw new def.error.argumentInvalid(name, def.string.is(msg) ? msg : "");

                    // If `convert` returns a nully, it means don't do the set.
                    if(cast) v2 = convert.call(this, fields, v2, v1);

                    if(v2 != null) { // wasting a null test, when no cast...
                        fields[name] = v2;
                        if(change) change(v2, v1, this, name);
                    }
                }
            }
            return this;
        }

        function convert(fields, v2, v1) {
            // Use `cast` to obtain a value admissible by the field.
            //   `cast` validates if the value is of an admissible type.
            //   If it is, that value is returned.
            //   If not, and if possible, converts it to a value of an admissible type.
            //   If there is no possible conversion, returns a nully value.
            // No `cast` function means that every value can be set in the field,
            //   and so, no implicit configuration is possible by using the setter.
            var vSet = cast(v2, this);

            // If there is no possible conversion, for v2,
            // we can only make use of it for configuration purposes.
            if(vSet == null) {
                // If this field or its current value are not configurable,
                // then v2 is considered invalid and ignored.
                if(!configurable) return;

                // Otherwise, the current value, v1, is configured with the configuration value v2.
                // However, note that only a local value is allowed to be configured.
                if(objectHasOwn.call(fields, name)) {
                    // Configure existing local value
                    def.configure(v1, /*config*/v2);
                    return;
                }

                // If the field does not have a `factory`,
                // ignore the configuration value.
                if(!factory) return;

                // If the field has a `factory`, it can be used to
                // automatically create an instance (of some preferred type)
                // to set locally on the field.
                // The new instance will already be configured with the
                // configuration value provided to the factory.
                // Inherited from the initially inherited value v1, and
                // configure it with v2.
                vSet = factory(/*config*/v2, /*proto*/v1);

                // assert vSet != null && vSet !== v1 && vSet === cast(vSet, this)
            }
            return vSet;
        }
    },

    /**
     * Configures an object given a configuration object.
     *
     * If the object being configured implements a method named "configure", then that method is called,
     * otherwise, configuration is handled by the generic configuration function, {@link def.configureGeneric}.
     *
     * @param {object} pub An object to configure.
     * @param {object} [config] A configuration object.
     * If it is a direct instance of <tt>Object</tt> (like objects created using literals),
     * then its own and inherited properties are used to configure <i>pub</i>.
     *
     * If it is an instance of the same class, or one derived thereof,
     * as the <i>pub</i> object,
     * and the class has a <i>tryConfigure</i> method,
     * then that method is used to (try to) configure <i>pub</i>.
     *
     * @return {object} The configured object, <i>pub</i>.
     */
    configure: function(pub, config) {
        if(config) {
            var cfg = pub.configure;
            if(def.fun.is(cfg) && cfg.length === 1)
                cfg.call(pub, config);
            else
                def.configureGeneric(pub, config);
        }
        return pub;
    },

    /**
     * Configures an object, given a configuration object, in a generic way.
     *
     * This function is used when the object being configured does not directly implement
     * a "configure" method.
     *
     * @param {object} pub An object to configure.
     * @param {object} [config] A configuration object.
     * If it is a direct instance of <tt>Object</tt> (like objects created using literals),
     * then its own and inherited properties are used to configure <i>pub</i>.
     *
     * If it is an instance of the same class, or one derived thereof,
     * as the <i>pub</i> object,
     * and the class has a <i>tryCopyFrom</i> method,
     * then that method is used to copy
     * the configurations from one object to the other.
     *
     * @return {object} The configured object, <i>pub</i>.
     */
    configureGeneric: function(pub, config) {
        var m;
        if(config) {
            if(config.constructor === Object)
                def.configureSetters(pub, config);
            else if(pub !== config && (m = pub.tryConfigure) && def.fun.is(m) && m.call(pub, config))
                ; // noop
            // TODO: else log ignored
        }
        return pub;
    },

    /**
     * Configures an object, given a configuration object,
     * by passing the values of its properties to correspondingly named setters of another.
     *
     * @param {object} pub An object to configure.
     * @param {object} [config] A configuration object whose own and inherited properties are used to configure <i>pub</i>.
     * @return {object} The configured object, <i>pub</i>.
     */
    configureSetters: function(pub, config) {
        var n, v, m;
        for(n in config) {
            if(n && n.charAt(0) !== '_' &&
               !objectHasOwn.call(def_configGenBlackList, n) &&
               (v = config[n]) !== undefined &&
               typeof (m = pub[n]) === 'function' &&
               m.length >= 1) {
                m.call(pub, v);
            } // TODO: else log ignored
        }
        return pub;
    }
});

// ----------------------

def.copyOwn(def.array, /** @lends def.array */{
    /**
     * Creates an array of the specified length,
     * and, optionally, initializes it with the specified default value.
     */
    create: function(len, dv) {
        var a = len >= 0 ? new Array(len) : [];
        if(dv !== undefined) for(var i = 0 ; i < len ; i++) a[i] = dv;
        return a;
    },

    append: function(target, source, start) {
        if(start == null) start = 0;
        for(var i = 0, L = source.length, T = target.length ; i < L ; i++) target[T + i] = source[start + i];
        return target;
    },

    appendMany: function(target) {
        var a = arguments, S = a.length, source;
        if(S > 1) {
            for(var s = 1 ; s < S ; s++) {
                if((source = def.array.to(a[s]))) {
                    var i = 0, L = source.length;
                    while(i < L) target.push(source[i++]);
                }
            }
        }
        return target;
    },

    prepend: function(target, source, start) {
        if(start == null) start = 0;
        for(var i = 0, L = source.length ; i < L ; i++) target.unshift(source[start + i]);
        return target;
    },

    removeAt: function(array, index) { return array.splice(index, 1)[0]; },

    insertAt: function(array, index, elem) {
        array.splice(index, 0, elem);
        return array;
    },

    removeIf: function(array, p, x) {
        var i = 0, L = array.length;
        while(i < L) {
            if(p.call(x, array[i], i)) {
                L--;
                array.splice(i, 1);
            } else {
                i++;
            }
        }
        return array;
    },

    binarySearch: function(array, item, comparer, key) {
        if(!comparer) comparer = def.compare;

        var low  = 0, high = array.length - 1;
        while(low <= high) {
            var mid = (low + high) >> 1; // <=>  Math.floor((l+h) / 2)

            var result = comparer(item, key ? key(array[mid]) : array[mid]);
            if(result < 0)
                high = mid - 1;
            else if(result > 0)
                low = mid + 1;
            else
                return mid;
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
     */
    insert: function(array, item, comparer) {

        var index = def.array.binarySearch(array, item, comparer);
        // Insert at the two's complement of index
        if(index < 0) array.splice(~index, 0, item);
        return index;
    },

    remove: function(array, item, comparer) {
        var index = def.array.binarySearch(array, item, comparer);
        if(index >= 0) return array.splice(index, 1)[0];
        // return undefined;
    }
});

// -----------------

var nextGlobalId  = 1,
    nextIdByScope = {};
def.nextId = function(scope) {
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
    this.source = source || {};
    this.count  = source ? (count != null ? count : def.ownKeys(source).length) : 0;
})
.add({
    has: function(p) {
        return objectHasOwn.call(this.source, p);
    },

    add: function(p) {
        var source = this.source;
        if(!objectHasOwn.call(source, p)) {
            this.count++;
            source[p] = true;
        }

        return this;
    },

    rem: function(p) {
        if(objectHasOwn.call(this.source, p)) {
            delete this.source[p];
            this.count--;
        }

        return this;
    },

    clear: function() {
        if(this.count) {
            this.source = {};
            this.count  = 0;
        }
        return this;
    },

    members: function() {
        return def.ownKeys(this.source);
    }
});

// ---------------

def.type('Map')
.init(function(source, count) {
    this.source = source || {};
    this.count  = source ? (count != null ? count : def.ownKeys(source).length) : 0;
})
.add({
    has: function(p) { return objectHasOwn.call(this.source, p); },

    get: function(p) {
        return objectHasOwn.call(this.source, p) ?
               this.source[p] :
               undefined;
    },

    set: function(p, v) {
        var source = this.source;
        if(!objectHasOwn.call(source, p)) this.count++;

        source[p] = v;
        return this;
    },

    rem: function(p) {
        if(objectHasOwn.call(this.source, p)) {
            delete this.source[p];
            this.count--;
        }

        return this;
    },

    clear: function() {
        if(this.count) {
            this.source = {};
            this.count  = 0;
        }
        return this;
    },

    copy: function(other) {
        // Add other to this one
        def.eachOwn(other.source, function(value, p) {
            this.set(p, value);
        }, this);
    },

    values: function() { return def.own(this.source); },

    keys: function() { return def.ownKeys(this.source); },

    clone: function() { return new def.Map(def.copy(this.source), this.count); },

    /**
     * The union of the current map with the specified
     * map minus their intersection.
     *
     * (A U B) \ (A /\ B)
     * (A \ B) U (B \ A)
     * @param {def.Map} other The map with which to perform the operation.
     * @type {def.Map}
     */
    symmetricDifference: function(other) {
        if(!this .count) return other.clone();
        if(!other.count) return this.clone();

        var result = {},
            count  = 0,
            as = this.source,
            bs = other.source;

        def.eachOwn(as, function(a, p) {
            if(!objectHasOwn.call(bs, p)) {
                result[p] = a;
                count++;
            }
        });

        def.eachOwn(bs, function(b, p) {
            if(!objectHasOwn.call(as, p)) {
                result[p] = b;
                count++;
            }
        });

        return new def.Map(result, count);
    },

    intersect: function(other, result) {
        if(!result) result = new def.Map();
        def.eachOwn(this.source, function(value, p) {
            if(other.has(p)) result.set(p, value);
        });
        return result;
    }
});

// --------------------

//---------------

def.type('OrderedMap')
.init(function() {
    this._list = [];
    this._map  = {};
})
.add({
    has: function(key) { return objectHasOwn.call(this._map, key); },

    count: function() { return this._list.length; },

    get: function(key) {
        var map = this._map;
        return objectHasOwn.call(map, key) ? map[key].value : undefined;
    },

    at: function(index) {
        var bucket = this._list[index];
        return bucket ? bucket.value : undefined;
    },

    add: function(key, v, index) {
        var map = this._map;
        var bucket = objectHasOwn.call(map, key) && map[key];
        if(!bucket) {
            bucket = map[key] = {
                key:   key,
                value: v
            };

            if(index == null)
                this._list.push(bucket);
            else
                def.array.insertAt(this._list, index, bucket);
        } else if(bucket.value !== v) {
            bucket.value = v;
        }

        return this;
    },

    rem: function(key) {
        var map = this._map;
        var bucket = objectHasOwn.call(map, key) && map[key];
        if(bucket) {
            // Find it
            var index = this._list.indexOf(bucket);
            this._list.splice(index, 1);
            delete this._map[key];
        }
        return this;
    },

    clear: function() {
        if(this._list.length) {
            this._map = {};
            this._list.length = 0;
        }
        return this;
    },

    keys: function() { return def.ownKeys(this._map); },

    forEach: function(fun, ctx) {
        return this._list.forEach(function(bucket) {
            fun.call(ctx, bucket.value, bucket.key);
        });
    }
});

// --------------------

def.html = {
    // TODO: lousy multipass implementation!
    escape: function(str) {
        return def
            .string.to(str)
            .replace(/&/gm, "&amp;")
            .replace(/</gm, "&lt;")
            .replace(/>/gm, "&gt;")
            .replace(/"/gm, "&quot;");
    },

    tag: function(name, attrs) {
        if(attrs)
            attrs = def.ownKeys(attrs).map(function(n) {
                var v = attrs[n];
                return def.empty(v) ?  '' : (' ' + n + '="' + String(v) + '"');
            }).join('');
        else
            attrs = '';

        var content = arguments.length > 2
            ? arraySlice.call(arguments, 2).map(function(cont) {
                    if(cont != null) {
                        if(def.fun.is(cont)) cont = cont();

                        if(def.array.is(cont)) cont = cont.map(def.string.to).join('');
                        else cont = def.string.to(cont);
                    }
                    return cont || '';
                }).join('')
            : '';

        return '<' + name + attrs + '>' + content + '</' + name + '>';
    },

    classes: function(prefix) {
        prefix = prefix ? (prefix + '-') : '';
        var out = [];
        arraySlice.call(arguments, 1)
            .forEach(function(s, i) {
                if(!def.empty(s)) out.push(prefix + def.css.escapeClass(s));
            });
        return out.join(' ');
    }
};

def.css = {
    // TODO: very basic implementation
    escapeClass: function(name) {
        return (name||'').replace(/\s/g, "_");
    }
}

// --------------------

def.type('Query')
.add({
    index: -1,
    item: undefined,
    next: function() {
        var me = this, index = me.index;

        // already was finished
        if(index === -2) return false;

        index++;
        if(!me._next(index)) {
            me._finish();
            return false;
        }

        me.index = index;
        return true;
    },

    /**
     * @name _next
     * @function
     * @param {number} nextIndex The index of the next item, if one exists.
     * @member def.Query#
     * @returns {boolean} truthy if there is a next item, falsy otherwise.
     */
    _next: def.method({isAbstract: true}),

    _finish: function() {
        var me = this;
        if(me.index > -2) {
            me.next  = def.retFalse;
            me.index = -2;
            delete me.item;
        }
    },

    // ------------

    each: function(f, x) {
        var me = this;
        while(me.next()) if(f.call(x, me.item, me.index) === false) return true;
        return false;
    },

    array: function(to) {
        var array = to || [], me = this;
        while(me.next()) array.push(me.item);
        return array;
    },

    sort: function(compare, by) {
        if(!compare) compare = def.compare;

        if(by) {
            var keyCompare = compare;
            compare = function(a, b) { return keyCompare(by(a), by(b)); };
        }

        var sorted = this.array().sort(compare);

        return new def.ArrayLikeQuery(sorted);
    },

    /**
     * Consumes the query and fills an object
     * with its items.
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
     * @param {object}   [keyArgs] Keyword arguments.
     * @param {function} [keyArgs.value] A function that computes the value of each property.
     * @param {function} [keyArgs.name]  A function that computes the name of each property.
     * @param {object}   [keyArgs.context] The context object on which <tt>keyArgs.name</tt> and <tt>keyArgs.value</tt>
     * are called.
     * @param {object}   [keyArgs.target] The object that is to receive the properties,
     * instead of a new one being creating.
     *
     * @returns {object} A newly created object, or the specified <tt>keyArgs.target</tt> object,
     * filled with properties.
     */
    object: function(keyArgs) {
        var target   = def.get(keyArgs, 'target') || {},
            nameFun  = def.get(keyArgs, 'name' ),
            valueFun = def.get(keyArgs, 'value'),
            ctx      = def.get(keyArgs, 'context');

        while(this.next()) {
            var name = '' + (nameFun ? nameFun.call(ctx, this.item, this.index) : this.item);
            target[name] = valueFun ? valueFun.call(ctx, this.item, this.index) : this.item;
        }

        return target;
    },

    reduce: function(accumulator/*, [initialValue]*/) {
        var i = 0, result;

        if(arguments.length < 2) {
            if(!this.next()) throw new TypeError("Length is 0 and no second argument");
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
     * @type number
     */
    count: function() {
        var count = 0;
        while(this.next()) count++;
        return count;
    },

    /**
     * Returns the first item that satisfies a specified predicate.
     * <p>
     * If no predicate is specified, the first item is returned.
     * </p>
     *
     * @param {function} [pred] A predicate to apply to every item.
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     * @param {any} [dv=undefined] The value returned in case no item exists or satisfies the predicate.
     *
     * @type any
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
     * @param {function} [pred] A predicate to apply to every item.
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     * @param {any} [dv=undefined] The value returned in case no item exists or satisfies the predicate.
     *
     * @type any
     */
    last: function(pred, ctx, dv) {
        var theItem = dv;
        while(this.next()) {
            if(!pred || pred.call(ctx, this.item, this.index)) theItem = this.item;
        }
        return theItem;
    },

    /**
     * Returns <tt>true</tt> if there is at least one item satisfying a specified predicate.
     * <p>
     * If no predicate is specified, returns <tt>true</tt> if there is at least one item.
     * </p>
     *
     * @param {function} [pred] A predicate to apply to every item.
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     *
     * @type boolean
     */
    any: function(pred, ctx) {
        while(this.next()) if(!pred || pred.call(ctx, this.item, this.index)) return this._finish(), true;
        return false;
    },

    /**
     * Returns <tt>true</tt> if all the query items satisfy the specified predicate.
     * @param {function} pred A predicate to apply to every item.
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     *
     * @type boolean
     */
    all: function(pred, ctx) {
        while(this.next()) if(!pred.call(ctx, this.item, this.index)) return this._finish(), false;
        return true;
    },

    min: function() {
        var min = null;
        while(this.next()) if(min === null || this.item < min) min = this.item;
        return min;
    },

    max: function() {
        var max = null;
        while(this.next()) if(max === null || this.item > max) max = this.item;
        return max;
    },

    range: function() {
        var min = null, max = null;

        while(this.next()) {
            var item = this.item;
            if(min === null) {
                min = max = item;
            } else {
                if(item < min) min = item;
                if(item > max) max = item;
            }
        }

        return min != null ? {min: min, max: max} : null;
    },

    multipleIndex: function(keyFun, ctx) {
        var keyIndex = {};
        this.each(function(item) {
            var key = keyFun ? keyFun.call(ctx, item) : item;
            if(key != null) {
                var sameKeyItems = def.getOwn(keyIndex, key) || (keyIndex[key] = []);
                sameKeyItems.push(item);
            }
        });
        return keyIndex;
    },

    uniqueIndex: function(keyFun, ctx) {
        var keyIndex = {};
        this.each(function(item) {
            var key = keyFun ? keyFun.call(ctx, item) : item;
            if(key != null && !objectHasOwn.call(keyIndex, key)) keyIndex[key] = item;
        });
        return keyIndex;
    },

    // ---------------
    // Query -> Query

    // deferred map
    select: function(fun, ctx) { return new def.SelectQuery(this, fun, ctx); },

    prop: function(p) {
        return new def.SelectQuery(this, function(item) { if(item) return item[p]; });
    },

    selectMany: function(fun, ctx) { return new def.SelectManyQuery(this, fun, ctx); },

    union: function(/*others*/) {
        var queries = def.array.append([this], arguments);
        return new def.SelectManyQuery(new def.ArrayLikeQuery(queries));
    },

    // deferred filter
    where: function(fun, ctx) { return new def.WhereQuery(this, fun, ctx); },

    distinct: function(fun, ctx) { return new def.DistinctQuery(this, fun, ctx); },

    skip: function(n) { return new def.SkipQuery(this, n); },

    take: function(n) {
        if(n <= 0) return new def.NullQuery();
        if(!isFinite(n)) return this; // all
        return new def.TakeQuery(this, n);
    },

    whayl: function(pred, ctx) { return new def.WhileQuery(this, pred, ctx); },

    reverse: function() { return new def.ReverseQuery(this); }
});

def.type('NullQuery', def.Query)
.add({ next: def.retFalse });

def.type('AdhocQuery', def.Query)
.init(function(next) {
    this._next = next;
});

def.type('ArrayLikeQuery', def.Query)
.init(function(list) {
    var me = this;

    if(!def.array.isLike(list)) { list = [list]; }

    me._list  = list;
    me._count = list.length;

    var i  = -1, I = list.length;
    me.next = arraLike_next;

    function arraLike_next() {
        while(++i < I) if(objectHasOwn.call(list, i)) {
            me.index = i;
            me.item  = list[i];
            return true;
        }

        me._finish();
        return false;
    }
})
.add({
    /**
     * Obtains the number of items of a query.
     *
     * This is a more efficient implementation for the array-like class.
     * @type number
     */
    count: function() {
        // Count counts remaining items
        var remaining = this._count;
        if(this.index >= 0) remaining -= (this.index + 1);
        // Count consumes all remaining items
        this._finish();
        return remaining;
    }
});

def.type('RangeQuery', def.Query)
.init(function(start, count, step) {
    this._index = start;
    this._count = count; // may be infinte
    this._step  = step == null ? 1 : step;
})
.add({
    _next: function(nextIndex) {
        if(nextIndex < this._count) {
            this.item = this._index;
            this._index += this._step;
            return true;
        }
    },

    /**
     * Obtains the number of items of a query.
     * This is a more efficient implementation.
     * @type number
     */
    count: function() {
        // Count counts remaining items
        var remaining = this._count;
        if(this.index >= 0) remaining -= (this.index + 1);
        // Count consumes all remaining items
        this._finish();
        return remaining;
    }
});

def.type('WhereQuery', def.Query)
.init(function(source, p, x) {
    var me = this, i = -1;

    me.next = where_next;

    function where_next() {
        while(source.next()) {
            var e = source.item;
            if(p.call(x, e, source.index)) {
                me.item  = e;
                me.index = ++i;
                return true;
            }
        }
        me._finish();
        return false;
    }
});

def.type('WhileQuery', def.Query)
.init(function(s, p, x) {
    var me = this, i = -1;

    me.next = while_next;

    function while_next() {
        if(s.next()) {
            var e = s.item;
            if(p.call(x, e, s.index)) {
                me.item  = e;
                me.index = ++i;
                return true;
            }
        }
        me._finish();
        return false;
    }
});

def.type('SelectQuery', def.Query)
.init(function(s, f, x) {
    var me = this, i = -1;

    me.next = select_next;

    function select_next() {
        if(s.next()) {
            me.item  = f.call(x, s.item, s.index);
            me.index = ++i;
            return true;
        }
        me._finish();
        return false;
    }
});

def.type('SelectManyQuery', def.Query)
.init(function(source, selectMany, ctx) {
    this._selectMany = selectMany;
    this._ctx    = ctx;
    this._source = source;
    this._manySource = null;
})
.add({
    _next: function(nextIndex) {
        while(true) {
            // Consume all of existing manySource
            if(this._manySource) {
                if(this._manySource.next()) {
                    this.item = this._manySource.item;
                    return true;
                }
                this._manySource = null;
            }
            if(!query_nextMany.call(this)) break;
        }
    }
});

function query_nextMany() {
    while(this._source.next()) {
        var manySource = this._selectMany
            ? this._selectMany.call(this._ctx, this._source.item, this._source.index)
            : this._source.item;
        if(manySource != null) {
            this._manySource = def.query(manySource);
            return true;
        }
    }
}

def.type('DistinctQuery', def.Query)
.init(function(s, k, x) {
    var me = this,
        i  = -1,
        ks = {};

    me.next = distinct_next;

    function distinct_next() {
        while(s.next()) {
            // null key items are ignored!
            var e = s.item,
                v = k ? k.call(x, e, s.index) : e;
            if(v != null && !objectHasOwn.call(ks, v)) {
                me.item  = e;
                me.index = ++i;
                return (ks[v] = true);
            }
        }
        me._finish();
        return false;
    }
});

def.type('SkipQuery', def.Query)
.init(function(source, skip) {
    this._source = source;
    this._skip = skip;
})
.add({
    _next: function(nextIndex) {
        while(this._source.next()) {
            if(this._skip > 0) {
                this._skip--;
            } else {
                this.item = this._source.item;
                return true;
            }
        }
    }
});

def.type('TakeQuery', def.Query)
.init(function(source, take) {
    this._source = source;
    this._take = take;
})
.add({
    _next: function(nextIndex) {
        if(this._take > 0 && this._source.next()) {
            this._take--;
            this.item = this._source.item;
            return true;
        }
    }
});

def.type('ReverseQuery', def.Query)
.init(function(source) {
    this._source = source;
})
.add({
    _next: function(nextIndex) {
        if(!nextIndex) {
            if(this._source instanceof def.Query) {
                this._source = (this._source instanceof def.ArrayLikeQuery)
                    ? this._source._list
                    : this._source.array();
            } // else assume array-like
            this._count  = this._source.length;
        }

        var count = this._count;
        if(nextIndex < count) {
            var index = count - nextIndex - 1,
                source = this._source;

            while(!objectHasOwn.call(source, index)) {
                if(--index < 0) return false;
                this._count--;
            }
            this.item = source[index];
            return true;
        }
    }
});


// -------------------

def.query = function(q) {
    if(q === undefined)        return new def.NullQuery();
    if(q instanceof def.Query) return q;
    if(def.fun.is(q))          return new def.AdhocQuery(q);
    return new def.ArrayLikeQuery(q);
};

def.range = function(start, count, step) { return new def.RangeQuery(start, count, step); };

// -------------------

def.textTable = function(C) {
    var rows = [],
        contPad = " ",
        colsMaxLen = new Array(C),
        rowSepMarkerFirst = def.array.create(C, ""),
        rowSepMarker = rowSepMarkerFirst.slice(),
        rowSepMarkerLast = rowSepMarkerFirst.slice(),
        rowSep;

    function table() {
        return rows.map(function(r) {
            switch(r) {
                case rowSepMarkerFirst: return renderRow(r, "\u2564", "\u2550", "\u2554", "\u2557");
                case rowSepMarker:      return (rowSep || (rowSep = renderRow(r, "\u253c", "\u2500", "\u255f", "\u2562")));
                case rowSepMarkerLast:  return renderRow(r, "\u2567", "\u2550", "\u255a", "\u255d");
            }
            return renderRow(r, "\u2502", " ", "\u2551", "\u2551");
        }).join("\n");
    }

    table.row = function() {
        var args = arguments, i = -1, v, s, r = new Array(C);
        while(++i < C) {
            v = args[i];
            s = r[i] = contPad + (v === undefined ? "" : String(v)) + contPad;
            colsMaxLen[i] = Math.max(colsMaxLen[i] || 0, s.length);
        }
        rows.push(r);
        return table;
    };

    table.rowSep = function(isLast) {
        rows.push(!rows.length ? rowSepMarkerFirst : isLast ? rowSepMarkerLast : rowSepMarker);
        return table;
    };

    function renderRow(r, colSep, pad, first, last) {
        return first + r.map(function(s, i) {
            return def.string.padRight(s || "", colsMaxLen[i], pad);
        }).join(colSep) + last;
    }

    return table;
};

// -------------------

function mult10(value, exponent) {
    if(!exponent) return value;
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exponent) : exponent));
}

// Adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
def.round10 = function(value, places) {
    if(!places) return Math.round(value);

    value = +value;

    // If the value is not a number or the exp is not an integer...
    if(isNaN(value) || !(typeof places === 'number' && places % 1 === 0)) return NaN;

    // Shift & round
    value = Math.round(mult10(value, places));

    // Shift back
    return mult10(value, -places);
};

def.mult10 = function(value, exponent) {
    return !exponent ? value : mult10(+value, exponent);
};

// ---------------------

// Reset namespace to global, instead of 'def'
currentNamespace = def.global;
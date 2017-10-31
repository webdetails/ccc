def.copyOwn(def, /** @lends def */{

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
        return o && O_hasOwn.call(o, p) && (v = o[p]) != null ? v : dv;
    },

    hasOwn: function(o, p) {
        return !!o && O_hasOwn.call(o, p);
    },

    // See also def.fun.inherit.
    protoOf: Object.getPrototypeOf || function(o) {
        return o.__proto__ || (o.constructor &&  o.constructor.prototype);
    },

    rootProtoOf: function(inst) {
        var proto  = null,
            proto2 = def.protoOf(inst);

        // At the root type, proto.constructor.prototype === proto.
        while(proto2 &&
            proto2 !== O_proto &&
            proto2 !== proto)
            proto2 = def.protoOf((proto = proto2));

        return proto;
    },

    hasOwnProp: O_hasOwn,

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
            def.each(o2, function(v, p) { if(oo[p] == null) oo[p] = v; });
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
            def.each(o2, function(v, p) { if(oo[p] === undefined) oo[p] = v; });
        } else {
            A--;
            for(var i = 1 ; i < A ; i += 2) {
                p = a[i];
                if(oo[p] === undefined) oo[p] = a[i+1];
            }
        }
        return oo;
    },

    setNonEnum: (function() {
        if(!O_defProp)
            return function(o, p, v) {
                o[p] = v;
                return o;
            };

        var nonEnumDesc = {enumerable: false, configurable: true, writable: true, value: undefined};
        return function(o, p, v) {
            nonEnumDesc.value = v;
            O_defProp(o, p, nonEnumDesc);
            nonEnumDesc.value = null;
            return o;
        };
    }()),

    setConst: (function() {
        if(!O_defProp)
            return function(o, p, v) {
                o[p] = v;
                return o;
            };

        var constDesc = {enumerable: false, configurable: false, writable: false, value: undefined};
        return function(o, p, v) {
            constDesc.value = v;
            O_defProp(o, p, constDesc);
            constDesc.value = null;
            return o;
        };
    }()),

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
        for(var p in o) if(O_hasOwn.call(o, p)) fun.call(ctx, o[p], p, o);

        if(o && O_needEnumProps) O_needEnumProps.forEach(function(p) {
            if(O_hasOwn.call(o, p)) fun.call(ctx, o[p], p, o);
        });
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

        if(o && O_needEnumProps) O_needEnumProps.forEach(function(p) {
            if(O_hasOwn.call(o, p)) fun.call(ctx, o[p], p, o);
        });
    },

    copy: function(a, b) {
        var to, from;
        if(arguments.length >= 2) {
            to = (a || {}); from = b;
        } else {
            to = {}; from = a;
        }

        def.each(from, function(v, p) { to[p] = v; });

        return to;
    },

    copyx: function(to, from, keyArgs) {
        var where = def.get(keyArgs, 'where'),
            set   = def.get(keyArgs, 'set'  );

        def.each(from, function(v, p) {
            if(!where || where(from, p, to)) {
                if(set) set(to, p, v); else  to[p] = v;
            }
        });

        return to;
    },

    copyProps: function(a, b, props) {
        var to, from;
        if(arguments.length >= 3)
            to = (a || {}), from = b;
        else
            to = {}, from  = a, props = b;

        if(props) {
            var i = -1;
            var L = props.length;
            if(from) {
                var prop;
                while(++i < L) to[(prop = props[i])] = from[prop];
            } else {
                while(++i < L) to[props[i]] = undefined;
            }
        }

        return to;
    },

    keys: function(o) {
        var keys = [];
        for(var p in o) keys.push(p);
        if(o && O_needEnumProps) O_needEnumProps.forEach(function(p) { keys.push(p); }); // append
        return keys;
    },

    values: function(o) {
        var values = [];
        def.each(o, function(v) { values.push(v); });
        return values;
    },

    uniqueIndex: function(o, key, ctx) {
        var index = {};
        def.each(o, function(v, p) {
            if(key) v = key.call(ctx, v);
            if(v != null && !O_hasOwn.call(index, v)) index[v] = p;
        });
        return index;
    },

    ownKeys: Object.keys,

    own: function(o, f, ctx) {
        var keys = Object.keys(o);
        return f
            ? keys.map(function(key) { return f.call(ctx, o[key], key); })
            : keys.map(function(key) { return o[key]; });
    },

    /**
     * Constructs an instance of a class,
     * from a an array of arguments.
     * @alias make
     * @memberOf def
     * @param {function} Ctor The constructor function.
     * @param {Array} [args] The array of arguments, or arguments object.
     * @return {*} The constructed instance.
     */
    make: function(Ctor, args) {
        var inst = Object.create(Ctor.prototype);
        return Ctor.apply(inst, args || A_empty) || inst;
    },

    isPropPrivate: function(p) {
        return !!p && p.charAt(0) === '_';
    },

    whiteList: function(o, ps) {
        var o2 = null;
        if(o) {
            var L = ps.length;
            var i = -1;
            while(++i < L) {
                var p = ps[i];
                if(p in o) {
                    if(o2 == null) o2 = {};
                    o2[p] = o[p];
                }
            }
        }

        return o2;
    }
});

def.object = {
    is: function(v) {
        return (!!v) && typeof v === 'object'; // Is (v instanceof Object) faster?
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
};

def.lazy = def.object.lazy;

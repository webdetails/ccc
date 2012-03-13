// ECMAScript 5 shim
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

        var klass = function(){},
            proto = klass.prototype;
        
        function create(baseProto){
            klass.prototype = baseProto || {};
            var instance = new klass();
            klass.prototype = proto;
            
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

// ------------------------

this.def = (function(){

// All or nothing.
// Mount in local object.
var def = {};

def.get = function(o, p, dv){
    var v;
    return o && (v = o[p]) != null ? v : dv;
};

def.scope = function(scopeFun, ctx){
    return scopeFun.call(ctx);
};

def.compare = function(a, b){
    return (a < b) ? -1 : ((a > b) ? 1 : 0);
};

def.identity = function(x){
    return x;
};

// !== null && !== undefined
def.notNully = function(v){
    return v != null;
};

var arraySlice = Array.prototype.slice;

// Adapted from
// http://www.codeproject.com/Articles/133118/Safe-Factory-Pattern-Private-instance-state-in-Jav/
def.shared = function(){
    var _channel;

    function create(value){

        function safe(){
            _channel = value;
        }

        return safe;
    }

    function opener(safe){
        if(_channel != null){ throw new Error("Access denied."); }

        safe();

        var value;
        return value = _channel, _channel = null, value;
    }

    opener.safe = create;

    return opener;
};

/**
 * Calls function <i>fun</i> with context <i>ctx</i>
 * for every own property of <i>o</i>.
 * Function <i>fun</i> is called with arguments:
 * value, property, object.
 */
def.forEachOwn = function(o, fun, ctx){
    if(o){
        for(var p in o){
            if(o.hasOwnProperty(p)){
                fun.call(ctx, o[p], p, o);
            }
        }
    }
};

var objectHasOwn = Object.prototype.hasOwnProperty;
def.hasOwn = function(o, p){
    return !!o && objectHasOwn.call(o, p);
};


def.copyOwn = function(to, from){
    def.forEachOwn(from, function(v, p){
        to[p] = v;
    });
    
    return to;
};

def.join = function(sep){
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

def.error = function(error){
    return (error instanceof Error) ? error : new Error(error);
};

def.copyOwn(def.error, {
    operationInvalid: function(msg){
        return def.error(def.join(". ", "Invalid operation", msg));
    },

    notImplemented: function(){
        return def.error("Not implemented");
    },

    argumentRequired: function(name){
        return def.error("Required argument '" + name + "'.");
    },

    argumentInvalid: function(name, msg){
        return def.error(def.join(". ", "Invalid argument '" + name + "'.", msg));
    },

    assertionFailed: function(msg){
        return def.error(def.join(". ", "Assertion failed", msg));
    }
});

def.fail = function(error){
    throw def.error(error);
};

def.assert = function(msg){
    throw def.error.assertionFailed(msg);
};

// -----------------------

def.global = this;

var namespaceStack = [],
    currentNamespace = def.global;

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

function createSpace(name, definition){
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
}

function defineName(namespace, name, value){
    !def.hasOwn(namespace, name) ||
        def.fail(def.error.operationInvalid("Name '" + name + "' is already defined in namespace."));

    return namespace[name] = value;
}

/**
 * Defines a relative namespace with name {@link name}
 * on the current namespace.
 * 
 * <p>
 * Namespace declarations may be nested.
 * </p>
 * <p>
 * The current namespace can be obtained by calling {@link def.space}
 * with no {@link name} argument.
 * The current namespace affects other nested declarations, such as {@link def.type}.
 * </p>
 * <p>
 * A composite namespace name is a name that contains dots ".".
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
 */
def.space = createSpace;

// -----------------------

function asNativeObject(v){
    return v && typeof(v) === 'object' && v.constructor === Object ?
            v :
            undefined;
}

function asObject(v){
    return v && typeof(v) === 'object' ? v : undefined;
}

function mixinRecursive(instance, mixin){
    for(var p in mixin){
        var vMixin = mixin[p];
        if(vMixin !== undefined){
            var oMixin,
                oTo = asNativeObject(instance[p]);

            if(oTo){
                oMixin = asObject(vMixin);
                if(oMixin){
                    mixinRecursive(oTo, oMixin);
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

def.mixin = function(instance/*mixin1, mixin2, ...*/){
    for(var i = 1, L = arguments.length ; i < L ; i++){
        var mixin = arguments[i];
        if(mixin){
            mixin = asObject(mixin.prototype || mixin);
            if(mixin){
                mixinRecursive(instance, mixin);
            }
        }
    }

    return instance;
};

// -----------------------

function createRecursive(instance){
    for(var p in instance){
        var vObj = asNativeObject(instance[p]);
        if(vObj){
            createRecursive( (instance[p] = Object.create(vObj)) );
        }
    }
}
    
// Creates an object whose prototype is the specified object.
def.create = function(/* [deep, ] baseProto, mixin1, mixin2, ...*/){
    var mixins = arraySlice.call(arguments),
        deep = true,
        baseProto = mixins.shift();

    if(typeof(baseProto) === 'boolean'){
        deep = baseProto;
        baseProto = mixins.shift();
    }

    var instance = Object.create(baseProto);
    if(deep){
        createRecursive(instance);
    }

    // NOTE:
    if(mixins.length > 0){
        mixins.unshift(instance);
        def.mixin.apply(def, mixins);
    }

    return instance;
};

// -----------------------

def.type = def.scope(function(){
    var shared = def.shared();

    function typeLocked(){
        return def.error.operationInvalid("Type is locked.");
    }

    var typeProto = {
        base: function(base){
            base || def.fail(def.error.argumentRequired('base'));
            
            var state = shared(this.safe);
            
            !state.locked     || def.fail(typeLocked());
            !state.base       || def.fail(def.error.operationInvalid("base type already set"));
            !state.baseLocked || def.fail(def.error.operationInvalid("base is locked"));
            
            state.base = base;

            var proto = this.prototype = Object.create(base.prototype);
            proto.constructor = this;
            
            // Get base's init and postInit
            var baseState = shared(base.safe);
            
            baseState.locked = true;
            
            state.baseInit = baseState.init || baseState.baseInit;
            state.basePost = baseState.post || baseState.basePost;
            
            return this;
        },

        init: function(init){
            var state = shared(this.safe);
            !state.locked || def.fail(typeLocked());

            state.init = init;
            return this;
        },

        postInit: function(postInit){
            var state = shared(this.safe);
            !state.locked || def.fail(typeLocked());

            state.post = postInit;
            return this;
        },
        
        add: function(mixin){
            var state = shared(this.safe);
            !state.locked || def.fail(typeLocked());

            state.baseLocked = true;

            var proto = this.prototype,
                baseProto = state.base && state.base.prototype;

            def.forEachOwn(mixin.prototype || mixin, function(value, p){
                if(value !== undefined){
                    if(baseProto && typeof value === 'function'){
                        var baseValue = baseProto[p];
                        if(typeof baseValue === 'function'){
                            value = override(value, baseValue);
                        }
                    }
                    
                    proto[p] = value;
                }
            });

            return this;
        }
    };

    // TODO: improve this code
    function TypeName(full){
        var parts;
        if(full instanceof Array){
            parts = full;
            full  = parts.join('.');
        } else {
            parts = full.split('.');
        }
        
        if(parts.length > 1){
            this.name           = parts.pop();
            this.namespace      = parts.join('.');
            this.namespaceParts = parts;
        } else {
            this.name = full;
            this.namespace = null;
            this.namespaceParts = [];
        }
    }

    function withBase(base, method, ctx, args){
        var prevBase = def.base;
            def.base = base !== method ? base : null;
        try{
            return method.apply(ctx, args);
        } finally {
            def.base = prevBase;
        }
    }

    function override(method, base){
        return function(){
            return withBase(base, method, this, arguments);
        };
    }
    
    function createType(name){
        var state = {},
            safe = shared.safe(state),
            typeName  = new TypeName(name);
        
        function createInstance(){
            var method = state.init || state.baseInit;
            if(method){
                withBase(state.baseInit, method, this, arguments);
            }

            method = state.post || state.basePost;
            if(method){
                withBase(state.basePost, method, this, arguments);
            }
        }
        
        createInstance.typeName = typeName;
        createInstance.safe = safe;
        def.copyOwn(createInstance, typeProto);
        
        defineName(def.space(typeName.namespace), typeName.name, createInstance);
        
        return createInstance;
    }

    return createType;
});

// ----------------------

def.number = function(d, dv){
    var v = parseFloat(d);
    return isNaN(v) ? (dv || 0) : v;
};

// null or undefined to 'dv'
def.nullTo = function(v, dv){
    return v != null ? v : dv;
};

/**
 * Converts something to an array if it is not one already
 * an if it is not nully.
 */
def.array = function(thing){
    return (thing instanceof Array) ? thing : ((thing != null) ? [thing] : null);
};

def.copyOwn(def.array, {
    /**
     * Creates an array of the specified length,
     * and, optionally, initializes it with the specified default value.
     */
    create: function(len, dv){
        var a = new Array(len);
        if(dv !== undefined){
            for(var i = 0 ; i < len ; i++){
                a[i] = dv;
            }
        }
        
        return a;
    },

    append: function(target, source, start){
        if(start == null){
            start = 0;
        }

        for(var i = 0, L = source.length, T = target.length ; i < L ; i++){
            target[T + i] = source[start + i];
        }

        return target;
    },

    insert: function(array, index, elem){
        array.splice(index, 0, elem);
        return array;
    },

    binarySearch: function(array, value, comparer){
        var low  = 0,
            high = array.length - 1,
            midpoint = 0,
            dif;

        while ((dif = high - low) >= 0){
            if(dif <= 1){
                midpoint = low;
            } else {
                midpoint = low + Math.floor(dif / 2);
            }

            var compared = comparer(value, array[midpoint]);
            // Check to see if value is equal to item in array
            if (!compared){
                return midpoint;
            }

            // Not an exact match, but nothing else to compare with
            if(dif === 0){
                return ~(midpoint + 1);
            }

            if (compared < 0)
                high = midpoint - 1;
            else
                low = midpoint + 1;
        }

        // No items, insert at 0
        return ~0;
    },


    /**
     * Inserts an item in an array, 
     * previously sorted with the specified comparer,
     * if the item is not already contained in it.
     *
     * @param {Array} array A sorted array.
     * @param item An item to insert in the array.
     * @param {Function} comparer A comparer function.
     * 
     * @returns {Number}
     * If the item is already contained in the array returns its index.
     * If the item was not contained in the array returns the two's complement
     * of the index where the item was inserted.
     */
    insertSorted: function(array, item, comparer){
        var index;
        if(!comparer){
            index = ~array.length; // TODO: confirm this works
            array.push(item);
        } else {
            index = def.array.binarySearch(array, item, comparer);
            if(index < 0){
                // Insert at the two's complement of index
                def.array.insert(array, ~index, item);
            }
        }

        return index;
    }
});

return def;

}());
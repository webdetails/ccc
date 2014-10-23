
// Based on prototype's library https://github.com/sstephenson/prototype/blob/master/src/prototype/lang/class.js
var IS_DONTENUM_BUGGY = (function() {
        for(var p in {toString: 1}) if(p === 'toString') return false;
        return true;
    })(),
    O_proto  = Object.prototype, // moved to shim.js
    O_hasOwn = O_proto.hasOwnProperty,
    O_needEnumProps = IS_DONTENUM_BUGGY ? ['toString', 'valueOf'] : null;

if(!Object.keys) {
    /** @ignore */
    Object.keys = function(o) {
        /* Object function not being used as a constructor */
        /*jshint newcap:false */
        if(o !== Object(o)) throw new TypeError('Object.keys called on non-object');

        var ret = [];
        for(var p in o) if(O_hasOwn.call(o, p)) ret.push(p);

        if(O_needEnumProps) O_needEnumProps.forEach(function(p) { if(O_hasOwn.call(o, p)) ret.push(p); });

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
    Function.prototype.bind = (function(A_slice) {
        return function(ctx) {
            var staticArgs = A_slice.call(arguments, 1);
            var fToBind = this;

            return function() {
                return fToBind.apply(ctx, staticArgs.concat(A_slice.call(arguments)));
            };
        }
    }(Array.prototype.slice));
}

// Basic JSON shim
if(!this.JSON) this.JSON = {};
if(!this.JSON.stringify) this.JSON.stringify = function(t) { return String(t); };


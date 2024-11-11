/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

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

if (!Array.prototype.map) Array.prototype.map = function(f, o) {
  var n = this.length;
  var result = new Array(n);
  for (var i = 0; i < n; i++) {
    if (i in this) {
      result[i] = f.call(o, this[i], i, this);
    }
  }
  return result;
};

if (!Array.prototype.filter) Array.prototype.filter = function(f, o) {
  var n = this.length;
  var result = new Array();
  for (var i = 0; i < n; i++) {
    if (i in this) {
      var v = this[i];
      if (f.call(o, v, i, this)) result.push(v);
    }
  }
  return result;
};

if (!Array.prototype.forEach) Array.prototype.forEach = function(f, o) {
  var n = this.length >>> 0;
  for (var i = 0; i < n; i++) {
    if (i in this) f.call(o, this[i], i, this);
  }
};

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


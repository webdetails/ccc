
if(!Array.prototype.every) Array.prototype.every = function(fun /*, thisArg */) {
    'use strict';

    if(this == null) throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if(typeof fun !== 'function') throw new TypeError();

    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for(var i = 0; i < len; i++) if(i in t && !fun.call(thisArg, t[i], i, t)) return false;
    return true;
};
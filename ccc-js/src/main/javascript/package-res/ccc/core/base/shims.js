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
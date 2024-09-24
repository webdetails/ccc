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
def.number = {
    is: function(v) { return typeof v === 'number'; },

    as: function(v, dv) {
        return typeof v === 'number' ? v : dv;
    },

    to: function(v, dv) {
        if(v == null) return dv;

        var v2 = +v;
        return isNaN(v2) ? dv : v2;
    },

    toPositive: function(v, dv) {
        v = def.number.to(v);
        return (v != null && !(v > 0)) ? dv : v;
    },

    toNonNegative: function(v, dv) {
        v = def.number.to(v);
        return (v != null && v < 0) ? dv : v;
    },

    toBetween: function(v, vmin, vmax, dv) {
        var v2 = def.number.to(v);
        if(v2 == null) return dv;
        return Math.max(vmin, Math.min(vmax, v2));
    }
};

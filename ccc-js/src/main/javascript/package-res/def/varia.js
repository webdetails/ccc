/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
def.copyOwn(def, /** @lends def */{
    scope: function(scopeFun, ctx) {
        return scopeFun.call(ctx);
    },

    firstDefined: function(funs, args, x) {
        var v, i = 0, L = funs.length;
        if(!args) args = [];
        while(i < L) if((v = funs[i++].apply(x, args)) !== undefined) return v;
    },

    // -----------------

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

    // --------------

    parseDistinctIndexArray: function(value, min, max) {
        value = def.array.as(value);
        if(value == null) return null;
        if(min == null) min = 0;
        if(max == null) max = Infinity;

        var a = def
            .query(value)
            .select(function(index) { return +index; }) // to number
            .where (function(index) { return !isNaN(index) && index >= min && index <= max; })
            .distinct()
            .array();

        return a.length ? a : null;
    },

    // --------------

    /**
     * Binds a list of types with the specified values, by position.
     * <p>
     * A nully value is bindable to any type.
     * <p>
     * <p>
     * When a value is of a different type than the type desired at a given position
     * the position is bound to <c>undefined</c> and
     * the unbound value is passed to the next position.
     * </p>
     *
     * @returns {any[]} An array representing the binding, with the values bound to each type.
     */
    argumentsTypeBind: function(types, values) {
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

    argumentsTypeBound: function(types, fun) {
        return function() {
            var args = def.argumentsTypeBind(types, arguments);
            return fun.apply(this, args);
        };
    }
});

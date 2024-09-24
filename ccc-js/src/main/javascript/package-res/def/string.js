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
def.string = {
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
};

def.copyOwn(def, /** @lends def */{
    // Ensures the first letter is upper case
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
        return def.firstUpperCase(name).replace(/([a-z\d])([A-Z])/g, "$1 $2");
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
    }
});

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
def.describe = function(t, keyArgs) {
    var maxLevel = def.get(keyArgs, 'maxLevel') || 5,
        out = [];
    def.describeRecursive(out, t, maxLevel, keyArgs);
    return out.join('');
};

def.describeRecursive = function(out, t, remLevels, keyArgs) {
    if(remLevels > 0) {
        remLevels--;
        switch(typeof t) {
            case 'undefined': return out.push('undefined');
            case 'object':
                if(!t) {
                    out.push('null');
                    return true;
                }

                if(def.fun.is(t.describe)) return t.describe(out, remLevels, keyArgs);

                if(t instanceof Array) {
                    out.push('[');
                    t.forEach(function(item, index) {
                        if(index) out.push(', ');
                        if(!def.describeRecursive(out, item, remLevels, keyArgs)) out.pop();
                    });
                    out.push(']');
                } else if(t instanceof Date) {
                    out.push(t.toISOString());
                } else {
                    var ownOnly = def.get(keyArgs, 'ownOnly', true);
                    if(t === def.global) return out.push('<window>'), true;

                    // DOM object
                    if(def.fun.is(t.cloneNode)) return out.push('<dom #' + (t.id || t.name || '?') + '>'), true;

                    if(remLevels > 1 && t.constructor !== Object) {
                        remLevels = 1;
                        ownOnly = true;
                    }

                    out.push('{');
                    var first = true;
                    for(var p in t) {
                        if(!ownOnly || def.hasOwnProp.call(t, p)) {
                            if(!first) out.push(', ');
                            out.push(p + ': ');
                            if(!def.describeRecursive(out, t[p], remLevels, keyArgs)) {
                                out.pop();
                                if(!first) out.pop();
                            } else if(first) {
                                first = false;
                            }
                        }
                    }

                    if(first) {
                        var s = '' + t;
                        if(s !== '[object Object]') out.push('{'+ s + '}'); // not very useful
                    }

                    out.push('}');
                }
                // else {
                //     out.push(JSON.stringify("'new ...'"));
                // }
                return true;

            // 6 dec places max
            case 'number':  out.push(''+(Math.round(100000 * t) / 100000)); return true;
            case 'boolean': out.push(''+t); return true;
            case 'string':  out.push(JSON.stringify(t)); return true;
            case 'function':
                return def.get(keyArgs, 'funs', false)
                    ? (out.push(JSON.stringify(t.toString().substr(0, 13) + '...')), true)
                    : false;
        }
        out.push("'new ???'");
        return true;
    }
};

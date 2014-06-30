pvc.stringify = function(t, keyArgs) {
    var maxLevel = def.get(keyArgs, 'maxLevel') || 5,
        out = [];
    pvc.stringifyRecursive(out, t, maxLevel, keyArgs);
    return out.join('');
};

pvc.stringifyRecursive = function(out, t, remLevels, keyArgs) {
    if(remLevels > 0) {
        remLevels--;
        switch(typeof t) {
            case 'undefined': return out.push('undefined');
            case 'object':
                if(!t) {
                    out.push('null');
                    return true;
                }

                if(def.fun.is(t.stringify)) return t.stringify(out, remLevels, keyArgs);

                if(t instanceof Array) {
                    out.push('[');
                    t.forEach(function(item, index) {
                        if(index) out.push(', ');
                        if(!pvc.stringifyRecursive(out, item, remLevels, keyArgs)) out.pop();
                    });
                    out.push(']');
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
                            if(!pvc.stringifyRecursive(out, t[p], remLevels, keyArgs)) {
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

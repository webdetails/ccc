/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pv_Mark:true */

pvc.BaseChart
.add({
    _processExtensionPoints: function() {
        if(!this.parent) {
            this._processExtensionPointsIn(this.options);
            this._processExtensionPointsIn(this.options.extensionPoints);
        } else {
            this._components = this.parent._components;
        }
    },

    _processExtensionPointsIn: function(points, prefix, fNep) {
        // TODO: It's kind of non-sensical to keep the order
        // of a map (like `extensionPoints`) - JS maps have no guaranteed order.

        var comps = this._components || (this._components = {}),
            name, id, prop, splitIndex;

        for(name in points) {
            splitIndex = name.indexOf("_");
            if(splitIndex > 0) {
                id   = name.substring(0, splitIndex);
                prop = name.substring(splitIndex + 1);
                if(id && prop) {
                    if(prefix) id = pvc_unwrapExtensionOne(id, prefix);
                    (def.getOwn(comps, id) || (comps[id] = new def.OrderedMap()))
                        .add(prop, points[name]);
                }
            } else if(fNep) {
                id = prefix ? pvc_unwrapExtensionOne(name, prefix) : name;
                fNep(points[name], id, name);
            }
        }
    },
    
    extend: function(mark, ids, keyArgs) {
        if(def.array.is(ids))
            ids.forEach(function(id) { this._extendCore(mark, id, keyArgs); }, this);
        else
            this._extendCore(mark, ids, keyArgs);
    },
    
    _extendCore: function(mark, id, keyArgs) {
        // if mark is null or undefined, skip
        if(mark) {
            var component = def.getOwn(this._components, id);
            if(component) {
                if(mark.borderPanel) mark = mark.borderPanel;
                
                var logOut     = pvc.debug >= 3 ? [] : null,
                    constOnly  = def.get(keyArgs, 'constOnly', false),
                    wrap       = mark.wrap,
                    keyArgs2   = {tag: pvc.extensionTag},
                    isRealMark = mark instanceof pv_Mark,
                    isRealMarkAndWrapOrConstOnly = isRealMark && (wrap || constOnly),
                    processValue = function(v, m) {
                        // Extend object css and svg properties
                        if(v != null) {
                            var type = typeof v;
                            if(type === 'object') {
                                if(m === 'svg' || m === 'css') {
                                    var v2 = mark.propertyValue(m);
                                    if(v2) v = def.copy(v2, v);
                                } else if(v instanceof Array) {
                                    return v.map(function(vi) { return processValue(vi, m); });
                                }
                            } else if(isRealMarkAndWrapOrConstOnly && type === 'function') {
                                if(constOnly) return;

                                // Don't wrap the "add" and "call" methods to support extension idioms.
                                // "call" eliminates most use cases of renderCallback.
                                if(m !== 'add' && m !== 'call') v = wrap.call(mark, v, m);
                            }
                        }
                        return v;
                    },
                    callMethod = function(mm, v) {
                        return (v instanceof Array) ? mm.apply(mark, v) : mm.call(mark, v);
                    };

                component.forEach(function(v, m) {
                    // Not everything that is passed to 'mark' argument
                    //  is actually a mark...(ex: scales)
                    // Not locked and
                    // Not intercepted and
                    if(mark.isLocked && mark.isLocked(m)) {
                        if(logOut) logOut.push(m + ": locked extension point!");
                    } else if(mark.isIntercepted && mark.isIntercepted(m)) {
                        if(logOut) logOut.push(m + ":" + pvc.stringify(v) + " (controlled)");
                    } else {
                        if(logOut) logOut.push(m + ": " + pvc.stringify(v));

                        v = processValue(v, m);
                        if(v !== undefined) {
                            // Distinguish between mark methods and properties
                            var mm = mark[m];
                            if(typeof mm === "function") {
                                if(isRealMark && mark.properties[m]) {
                                    mark.intercept(m, v, keyArgs2);
                                } else {
                                    // Not really a mark or not a real protovis property.
                                    // In this case, multiple calls and then multiple arguments are allowed in v.
                                    if(v instanceof Array)
                                        v.forEach(function(vi) { callMethod(mm, vi); });
                                    else
                                        callMethod(mm, v);
                                }
                            } else {
                                mark[m] = v;
                            }
                        }
                    }
                });

                if(logOut) {
                    if(logOut.length)
                        this._log("Applying Extension Points for: '" + id + "'\n\t* " + logOut.join("\n\t* "));
                    else if(pvc.debug >= 5)
                        this._log("No Extension Points for: '" + id + "'");
                }
            }
        } else if(pvc.debug >= 4) {
            this._log("Applying Extension Points for: '" + id + "' (target mark does not exist)");
        }
    },

    /**
     * Obtains the specified extension point.
     */
    _getExtension: function(id, prop) {
        var component;
        if(!def.array.is(id)) {
            component = def.getOwn(this._components, id);
            if(component) return component.get(prop);
        } else {
            // Last extension points are applied last, and so have priority...
            var i = id.length - 1, value;
            while(i >= 0) {
                component = def.getOwn(this._components, id[i--]);
                if(component && (value = component.get(prop)) !== undefined) return value;
            }
        }
    },
    
    _getComponentExtensions: function(id) {
        return def.getOwn(this._components, id);
    },
    
    _getConstantExtension: function(id, prop) {
        var value = this._getExtension(id, prop);
        if(!def.fun.is(value)) return value;
    }
});


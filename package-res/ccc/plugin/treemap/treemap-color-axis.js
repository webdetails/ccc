/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// TODO: This way of injecting derived colors doesn't yet feel right.
// In particular, it implies deriving the ColorAxis class, which
// might complicate in future multi-plot scenarios.

// The hoverable effect needs colors assigned to parents,
// in the middle of the hierarchy,
// whose color possibly does not show in normal mode,
// cause they have no leaf child (or degenerate child)
// The headers also need colors assigned to the non-leaf-parent nodes. 

def
.type('pvc.visual.TreemapDiscreteColorAxis', pvc.visual.ColorAxis)
.init(function(chart, type, index, keyArgs) {
    
    this.base(chart, type, index, keyArgs);
    
    // TODO: Undesirable access to the treemap plot.
    // There's currently no way to pass options to the
    //  axis, upon construction; but only to specify the type of axis to create.
    this.isByParent = chart.plots.treemap.option('ColorMode') === 'byparent';
})
.add(/** @lends pvc.visual.TreemapDiscreteColorAxis# */{
    /** @override */
    domainItemValueProp: function() {
        return !!this.role && this.role.grouping.isSingleDimension ? 'value' : 'absKey';
    },
    
    /** @override */
    domainGroupOperator: function() { return 'select'; },

    _calcAvgColor: function(colors) {
        var L = colors.length; // assumed > 0
        if(L > 1) {
            var r = 0, g = 0, b = 0, a = 0;
            colors.forEach(function(c) {
                var rgb = c.rgb();
                r += rgb.r;
                g += rgb.g;
                b += rgb.b;
                a += rgb.a;
            });
            var f = Math.floor;
            return pv.rgb(f(r/L), f(g/L), f(b/L), f(a/L));
        }

        var color = colors[0];
        return L ? color.darker(0.7) : color;
    },
    
    /** @override */
    _getBaseScheme: function() {
        var me = this,
            // Filter datas that will get derived colors
            isNotDegenerate = function(data) { return data.value != null; },
            children        = function(data) { return data.children().where(isNotDegenerate); },
            hasChildren     = function(data) { return children(data).any(); },
            hasDerivedColor = function(data) { return children(data).any(hasChildren); },
        
            // Materialize query result
            derivedColorDatas = def.query(this.domainData().nodes()).where(hasDerivedColor).array(),
            baseScheme = me.option('Colors');
        
        // New base Scheme
        return function(d/*domainAsArrayOrArgs*/) {
            var domainKeys = (d instanceof Array) ? d : def.array.copy(arguments),
                // Index derived datas by their key.
                derivedDatasByKey = def.query(derivedColorDatas).object({
                        name: function(itemData) { return me.domainItemValue(itemData); }
                    });

            // Filter out domain keys of derived datas
            def.array.removeIf(domainKeys, function(k) { return def.hasOwnProp.call(derivedDatasByKey, k); });
            
            // Build the base scale, with the remaining domain keys
            var baseScale = baseScheme(domainKeys),
                derivedColorMap = {},
                getColor = function(itemData) {
                    var k = me.domainItemValue(itemData), c;
                    if(def.hasOwnProp.call(derivedDatasByKey, k)) {
                        c = def.getOwn(derivedColorMap, k);
                        if(!c) {
                            var colors = children(itemData).select(getColor).array();
                            if(!colors.length) throw def.assert("Should have at least one child that is also a parent.");
                            c = derivedColorMap[k] = me._calcAvgColor(colors);
                        }
                    } else {
                        c = baseScale(k);
                    }
                    return c;
                };
            
            derivedColorDatas.forEach(getColor);

            // Create the new scale
            var scale = function(k) { return def.getOwn(derivedColorMap, k) || baseScale(k); };
            
            // Extend with baseScale methods
            def.copy(scale, baseScale);
            
            // Override domain and range methods
            var d2, r2;
            scale.domain = function() {
                if(arguments.length) throw def.error.operationInvalid("The scale cannot be modified.");
                return d2 || (d2 = def.array.append(def.ownKeys(derivedColorMap), domainKeys));
            };
            
            scale.range = function() {
                if(arguments.length) throw def.error.operationInvalid("The scale cannot be modified.");
                return r2 || (r2 = def.array.append(def.own(derivedColorMap), baseScale.range()));
            };
            
            return scale;
        };
    },

    // Select all items that will take base scheme colors
    /** @override */
    _selectDomainItems: function(domainData) {
        var candidates = def.query(domainData.nodes()),
            isNotDegenerate = function(data) { return data.value != null; },
            children = function(data) { return data.children().where(isNotDegenerate); },

            // Has at least one (non-degenerate) child
            hasChildren = function(data) { return children(data).any(); },

            // Has no children or they are all degenerate
            isLeaf = function(data) { return !hasChildren(data); };

        if(this.isByParent) {
            return candidates
                .where(function(itemData) {
                    // The root node is assigned a color only when it is a leaf node as well,
                    // or has leaf children.
                    // The root can be degenerate in this case...
                    if(!itemData.parent) return isLeaf(itemData) || children(itemData).any(isLeaf);

                    // Is a non-degenerate node having at least one child.
                    return isNotDegenerate(itemData) && hasChildren(itemData);
                });
        }
        
        return candidates.where(function(itemData) {
            // Leaf node &&
            // > Single (root) || non-degenerate
            return (!itemData.parent || isNotDegenerate(itemData)) && isLeaf(itemData);
        });
    }
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Size:true, pvc_Axis:true */

// TODO: This way of injecting derived colors doesn't yet feel right.
// In particular, it implies deriving the ColorAxis class, which
// might complicate in future multi-plot scenarios.

// The hoverable effect needs colors assigned to parents,
// in the middle of the hierarchy,
// whose color possibly does not show in normal mode,
// cause they have no leaf child (or degenerate child)
// The headers also need colors assigned to the non-leaf-parent nodes. 

def
.type('pvc.visual.TreemapDiscreteByParentColorAxis', pvc.visual.ColorAxis)
.add(/** @lends pvc.visual.TreemapDiscreteByParentColorAxis# */{
    _calcAvgColor: function(colors) {
        var r = 0, g = 0, b = 0, a = 0;
        colors.forEach(function(c) {
            var rgb = c.rgb();
            r += rgb.r;
            g += rgb.g;
            b += rgb.b;
            a += rgb.a;
        });
        
        var L = colors.length; // assumed > 0
        var f = Math.floor;
        var color = pv.rgb(f(r/L), f(g/L), f(b/L), f(a/L));
        return color.darker(0.7);
    },
    
    _getBaseScheme: function() {
        var me = this;
        var baseScheme  = me.option('Colors');
        
        // TODO: BEGIN BAD CODE. It's a kind of hard-wiring.
        var treemapPlot = me.chart.plots.treemap;
        
        // dataCell is TreemapColorDataCell
        var dataCell = def
            .query(me.dataCells)
            .first(function(dc) { return dc.plot === treemapPlot; });
        // TODO: END BAD CODE
        
        // ------------
        
        var domainData = dataCell.domainData();
        var allDatas   = def.query((domainData || undefined) && domainData.nodes());
        
        // Filter datas that will get derived colors
        var isNotDegenerate = function(data) { return data.value != null; };
        var children        = function(data) { return data.children().where(isNotDegenerate); };
        var hasChildren     = function(data) { return children(data).any(); };
        var hasDerivedColor = function(data) { return children(data).any(hasChildren); };
        
        // Materialize query result
        var derivedColorDatas = allDatas.where(hasDerivedColor).array();
        
        var computeDerivedColorMap = function(baseScale) {
            var derivedColorMap = {};
            var baseColorMap = def.query(baseScale.domain()).object({value: baseScale});
            
            var getColor = function(itemData) {
                var k = dataCell.domainItemDataValue(itemData);
                var c = def.getOwn(derivedColorMap, k) || def.getOwn(baseColorMap, k);
                if(!c) {
                    var colors = itemData.children().where(hasChildren).select(getColor).array();
                    if(!colors.length) { throw def.assert("Should have at least one child that is also a parent."); }
                    c = derivedColorMap[k] = me._calcAvgColor(colors);
                }
                
                return c;
            };
            
            derivedColorDatas.forEach(getColor);
            
            return derivedColorMap;
        };
        
        // New base Scheme
        return function(d/*domainAsArrayOrArgs*/) {
            // Create a fresh baseScale, from the baseScheme, with given domain item values
            // This will hopefully set the colors of parents which only have leaf children.
            if(!(d instanceof Array)) { d = def.array.copy(arguments); }
            
            var baseScale = baseScheme(d);
            
            // Determine derived colors map
            var derivedColorMap = computeDerivedColorMap(baseScale);
            
            // Create the new scale
            var scale = function(k) { return def.getOwn(derivedColorMap, k) || baseScale(k); };
            
            // Extend with baseScale methods
            def.copy(scale, baseScale);
            
            // Override domain and range methods
            var d2, r2;
            scale.domain = function() {
                if (arguments.length) { throw def.error.operationInvalid("The scale cannot be modified."); }
                return d2 || (d2 = def.array.append(def.ownKeys(colorMap), d));
            };
            
            scale.range = function() {
                if (arguments.length) { throw def.error.operationInvalid("The scale cannot be modified."); }
                return r2 || (r2 = def.array.append(def.own(colorMap), baseScale.range()));
            };
            
            return scale;
        };
    }
});

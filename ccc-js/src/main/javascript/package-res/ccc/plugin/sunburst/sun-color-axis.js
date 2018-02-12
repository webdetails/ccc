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

function cast_number_zero_to_one(v) {
  return def.number.toBetween(v, 0, 1);
}

def('pvc.visual.SunburstDiscreteColorAxis', pvc.visual.ColorAxis.extend({
    methods: /** @lends pvc.visual.SunburstDiscreteColorAxis# */{
        /** @override */
        domainItemValueProp: function() {
            return !!this.role && this.role.grouping.isSingleDimension ? 'value' : 'absKey';
        },

        /** @override */
        domainGroupOperator: function() { return 'select'; },

        // Select all items that will take base scheme colors
        /** @override */
        _selectDomainItems: function(domainData) {
            var isNotDegenerate = function(data) { return data.value != null; };

            // TODO: this kills multi-plot usage...
            var isFanOrLevelsMode = this.chart.plots.sunburst.option('ColorMode') !== 'slice';
            if(isFanOrLevelsMode) {
                // First-level slices always have colors assigned from the base scheme.
                // All others, either have an available fixed color or their color is derived from their parent's color.

                var colorAvailable = this.option('Colors')().available;
                if(!colorAvailable) {
                    // Only give colors to first-level slices.
                    // All other will be derived from parent colors.
                    return def.query(domainData.childNodes).where(isNotDegenerate);
                }

                var valueProp = this.domainItemValueProp();

                // Non-root and (non-degenerate level or has an available fixed color).
                return def.query(domainData.nodes())
                    .where(function(itemData) {
                        if(!itemData.parent) return false;

                        // Is a non-degenerate node and is a 1st level node or has an available fixed color for it.
                        return isNotDegenerate(itemData) &&
                            (!itemData.parent.parent || colorAvailable(itemData[valueProp]));
                    });
            }

            // TODO: This ordering is still not perfect, as scene slices are still ordered ascending/descending by size
            // in the plot panel. It would be knowing too much in this place...
            // The whole sharing of the color axis across multiple plots and using one plot's option to define the
            // properties of the color scale is wrong...

            // All non-degenerate levels and non-root.
            return def.query(nodes_breadthFirst(domainData))
                .where(function(itemData) {
                    if(!itemData.parent) return false;
                    return isNotDegenerate(itemData);
                });
        }
    },

    options: {
        // How much a last sibling slice will be brighter than a first sibling slice.
        SliceBrightnessFactor: {
            resolve: '_resolveFull',
            cast: def.number.toNonNegative,
            value: 1
        },

        // [colorMode=level] How much alpha is decremented in each level in [0, 1] relative to the alpha of the base color.
        SliceLevelAlphaRatio: {
            resolve: '_resolveFull',
            cast: cast_number_zero_to_one,
            value: 0.15
        },

        // [colorMode=level] Minimum alpha in [0, 1]
        SliceLevelAlphaMin: {
            resolve: '_resolveFull',
            cast: cast_number_zero_to_one,
            value: 0.1
        }
    }
}));

function nodes_breadthFirst(root) {
    var nodes = [root];

    var i = -1;
    while(++i < nodes.length) {
        var node = nodes[i];
        nodes.push.apply(nodes, node.childNodes);
    }

    return nodes;
}

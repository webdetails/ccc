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

function cast_number_zero_to_one() {
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

        /** @override */
        _getBaseScheme: function() {
            // TODO: this kills multi-plot usage...
            var isFanOrLevelsMode = this.chart.plots.sunburst.option('ColorMode') !== 'slice';
            if(!isFanOrLevelsMode) return this.base();

            // Filter datas that will get colors from the scale
            var isNotDegenerate = function(data) { return data.value != null; },

                // Materialize query result
                haveColorMapByKey = def.query(this.domainData().childNodes)
                    .where(isNotDegenerate)
                    .select(this.domainItemValue.bind(this))
                    .object(),

                baseScheme = this.option('Colors');

            // New base Scheme
            return function() {
                var baseScale = baseScheme.apply(null, arguments);

                function scale(key) {
                    return def.hasOwn(haveColorMapByKey, key)
                        ? baseScale(key)
                        : null; // signal derived color
                }

                // Extend with baseScale methods
                def.copy(scale, baseScale);

                return scale;
            };
        },

        // Select all items that will take base scheme colors
        /** @override */
        _selectDomainItems: function(domainData) {
            var isNotDegenerate = function(data) { return data.value != null; };

            // TODO: this kills multi-plot usage...
            var isFanOrLevelsMode = this.chart.plots.sunburst.option('ColorMode') !== 'slice';
            if(isFanOrLevelsMode)
                // Only give colors to first-level slices.
                // All other will be derived from parent colors.
                return def.query(domainData.childNodes).where(isNotDegenerate);

            return def.query(domainData.nodes())
                .where(function(itemData) {
                    if(!itemData.parent) return false;

                    // Is a non-degenerate node having at least one child.
                    return isNotDegenerate(itemData) && !itemData.parent.parent;
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
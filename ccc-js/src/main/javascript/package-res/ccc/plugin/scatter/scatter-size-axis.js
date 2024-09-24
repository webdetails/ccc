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

pvc.parseMetricPointSizeAxisRatioTo =
    pvc.makeEnumParser('ratioTo', ['minWidthHeight', 'height', 'width'], 'minWidthHeight');

def('pvc.visual.MetricPointSizeAxis', pvc.visual.SizeAxis.extend({
    options: {
        // Ratio of the biggest bubble diameter to
        // the length of plot area dimension according to option 'sizeAxisRatioTo'
        Ratio: {
            resolve: '_resolveFull',
            cast:    def.number.toNonNegative,
            value:   1/5
        },

        RatioTo: {
            resolve: '_resolveFull',
            cast:    pvc.parseMetricPointSizeAxisRatioTo,
            value:   'minwidthheight'
        }
    }
}));

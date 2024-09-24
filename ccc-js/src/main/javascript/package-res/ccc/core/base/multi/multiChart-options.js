/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @name pvc.visual.MultiChart
 *
 * @class Contains multi-chart related options.
 *
 * @extends pvc.visual.OptionsBase
 *
 * @constructor
 * @param {pvc.BaseChart} chart The associated chart.
 */
def('pvc.visual.MultiChart', pvc.visual.OptionsBase.extend({
    init: function(chart) {
        this.base(chart, 'multiChart', 0, {byV1: false, byNaked: false});
    },
    options: {
        Start: {
            resolve: '_resolveFull',
            cast:    def.number.toNonNegative,
            value:   0
        },
        Max: {
            resolve: '_resolveFull',
            cast:    def.number.toPositive,
            value:   Infinity
        },
        ColumnsMax: {
            resolve: '_resolveFull',
            cast:    def.number.toPositive,
            value:   3
        },
        SingleRowFillsHeight: {
            resolve: '_resolveFull',
            cast:  Boolean,
            value: true
        },
        SingleColFillsHeight: {
            resolve: '_resolveFull',
            cast:  Boolean,
            value: true
        },
        Overflow: {
            resolve: '_resolveFull',
            cast:  pvc.parseMultiChartOverflow,
            value: 'grow'
        }
    }
}));


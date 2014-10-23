/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a normalized bar plot.
 * 
 * @name pvc.visual.NormalizedBarPlot
 * @class Represents a normalized bar plot.
 * @extends pvc.visual.BarPlotAbstract
 */
def('pvc.visual.NormalizedBarPlot', pvc.visual.BarPlotAbstract.extend({
    methods: /** @lends pvc.visual.NormalizedBarPlot# */{
        type: 'nbar'
    },
    options: {
        Stacked: {
            resolve: null,
            value: true
        }
    }
}));

pvc.visual.Plot.registerClass(pvc.visual.NormalizedBarPlot);


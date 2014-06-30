/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a bar plot.
 * 
 * @name pvc.visual.BarPlot
 * @class Represents a bar plot.
 * @extends pvc.visual.BarPlotAbstract
 */
def
.type('pvc.visual.BarPlot', pvc.visual.BarPlotAbstract)
.add({
    type: 'bar'
});

pvc.visual.Plot.registerClass(pvc.visual.BarPlot);
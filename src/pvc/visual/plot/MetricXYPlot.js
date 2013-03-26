/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes an abstract metric XY plot.
 * 
 * @name pvc.visual.MetricXYPlot
 * @class Represents an abstract metric XY plot.
 * @extends pvc.visual.CartesianPlot
 */
def
.type('pvc.visual.MetricXYPlot', pvc.visual.CartesianPlot)
.add({
    _getOptionsDefinition: function() { return pvc.visual.MetricXYPlot.optionsDef; }
});

pvc.visual.MetricXYPlot.optionsDef = def.create(
    pvc.visual.CartesianPlot.optionsDef, {
        BaseRole: { // override
            value:   'x'
        },
        
        OrthoAxis: { // override -> value 1
            resolve: null
        },
        
        OrthoRole: {
            value: 'y'
        }
    });
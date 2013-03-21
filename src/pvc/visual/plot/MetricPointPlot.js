/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a metric XY plot.
 * 
 * @name pvc.visual.MetricPointPlot
 * @class Represents a metric point plot.
 * @extends pvc.visual.MetricXYPlot
 */
def
.type('pvc.visual.MetricPointPlot', pvc.visual.MetricXYPlot)
.add({
    type: 'scatter',
    _getOptionsDefinition: function() { return pvc.visual.MetricPointPlot.optionsDef; }
});

function pvcMetricPoint_buildVisibleOption(type) {
    return {
        resolveV1: function(optionInfo) {
            this._specifyChartOption(optionInfo, 'show' + type);
            return true;
        }
    };
}

pvc.visual.MetricPointPlot.optionsDef = def.create(
    pvc.visual.MetricXYPlot.optionsDef, {
        SizeRole: {
            resolve: '_resolveFixed',
            value: 'size'
        },
        
        SizeAxis: {
            resolve: '_resolveFixed',
            value: 1
        },
        
        Shape: {
            resolve: '_resolveFull',
            cast:    pvc.parseShape,
            value:   'circle'
        },

        NullShape: {
            resolve: '_resolveFull',
            cast:    pvc.parseShape,
            value:   'cross'
        },

        DotsVisible: {
            resolve: '_resolveFull',
            data:    pvcMetricPoint_buildVisibleOption('Dots'),
            cast:    Boolean,
            value:   false
        },
        
        LinesVisible: {
            resolve: '_resolveFull',
            data:    pvcMetricPoint_buildVisibleOption('Lines'),
            cast:    Boolean,
            value:   false
        },
        
        ValuesAnchor: { // override
            value: 'right'
        },

        ValuesMask: {
            value: "{x},{y}"
        }
    });
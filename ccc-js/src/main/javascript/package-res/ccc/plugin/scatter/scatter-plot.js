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
def('pvc.visual.MetricPointPlot', pvc.visual.MetricXYPlot.extend({
    methods: /** @lends pvc.visual.MetricPointPlot# */{
        type: 'scatter',

        /** @override */
        _initVisualRoles: function() {

            this.base();

            this._addVisualRole('size', {
                isMeasure: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                defaultDimension: 'size',
                dimensionDefaults: {
                    valueType: Number
                }
            });
        },

        /** @override */
        _getColorRoleSpec: function() {
            return {
                isMeasure: true,
                defaultSourceRole: 'series',
                defaultDimension:  'color*',
                dimensionDefaults: {
                    valueType: Number
                }
            };
        },

        _initDataCells: function() {

            this.base();

            if(this.option('DotsVisible'))
                this._addDataCell(new pvc.visual.DataCell(
                    this,
                    /*axisType*/ 'size',
                    this.option('SizeAxis') - 1,
                    this.visualRoles.size));
        }
    },

    options: {
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
        },

        AutoPaddingByDotSize: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   true
        }
    }
}));

pvc.visual.Plot.registerClass(pvc.visual.MetricPointPlot);

function pvcMetricPoint_buildVisibleOption(type) {
    return {
        resolveV1: function(optionInfo) {
            return this._specifyChartOption(optionInfo, 'show' + type), true;
        }
    };
}

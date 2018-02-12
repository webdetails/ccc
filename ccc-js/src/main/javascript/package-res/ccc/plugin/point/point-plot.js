/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a point plot.
 *
 * @name pvc.visual.PointPlot
 * @class Represents a Point plot.
 * @extends pvc.visual.CategoricalPlot
 */
def('pvc.visual.PointPlot', pvc.visual.CategoricalPlot.extend({
    methods: /** @lends pvc.visual.PointPlot# */{
        type: 'point',

        /** @override */
        _initVisualRoles: function() {

            this.base();

            this._addVisualRole('value', {
                isMeasure: true,
                isRequired: true,
                isPercent: this.option('Stacked'),
                requireSingleDimension: false,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimension: 'value'
            });
        }
    },
    options: {
        DotsVisible: {
            resolve: '_resolveFull',
            data:    pvcPoint_buildVisibleOption('Dots', true),
            cast:    Boolean,
            value:   false
        },

        LinesVisible: {
            resolve: '_resolveFull',
            data:    pvcPoint_buildVisibleOption('Lines', true),
            cast:    Boolean,
            value:   false
        },

        AreasVisible: {
            resolve: '_resolveFull',
            data:    pvcPoint_buildVisibleOption('Areas', false),
            cast:    Boolean,
            value:   false
        },

        AreasFillOpacity: {
            resolve: '_resolveFull',
            cast:    def.number.toNonNegative,
            value:   null
        },

        ValuesAnchor: { // override
            value: 'right'
        }
    }
}));

pvc.visual.Plot.registerClass(pvc.visual.PointPlot);

function pvcPoint_buildVisibleOption(type, dv) {
    return {
        resolveV1: function(optionInfo) {
            if(this.globalIndex === 0) {
                if(!this._specifyChartOption(optionInfo, 'show' + type)) optionInfo.defaultValue(dv);
                return true;
            }
        }
    };
}

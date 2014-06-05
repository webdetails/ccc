/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @name pvc.visual.SmallChart
 * 
 * @class Contains small-chart related options.
 * 
 * @extends pvc.visual.OptionsBase
 * 
 * @constructor
 * @param {pvc.BaseChart} chart The associated chart.
 */
def
.type('pvc.visual.SmallChart', pvc.visual.OptionsBase)
.init(function(chart) {
    this.base(chart, 'small', 0, {byV1: false, byNaked: false});
})
.add(/** @lends pvc.visual.SmallChart# */{
    _getOptionsDefinition: function() { return pvc.visual.SmallChart.optionsDef; }
})
.addStatic({
    optionsDef: {
        Width: {
            resolve: '_resolveFull',
            cast:    pvc_PercentValue.parse,
            value:   null
        },
        Height: {
            resolve: '_resolveFull',
            cast:    pvc_PercentValue.parse,
            value:   null
        },
        AspectRatio: {
            resolve:    '_resolveFull',
            cast:       pvc.castPositiveNumber,
            getDefault: function() {
                if(this.chart instanceof pvc.PieChart)
                    // 5/4 <=> 10/8 < 10/7
                    return 10/7;

                // Cartesian, ...
                return 5/4;
            }
        },
        Margins: {
            resolve: '_resolveFull',
            cast:    pvc_Sides.as,
            value:   new pvc_Sides(new pvc_PercentValue(0.02))
        },
        Paddings: {
            resolve: '_resolveFull',
            cast:    pvc_Sides.as,
            value:   0
        }
    }
});
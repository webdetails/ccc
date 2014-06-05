/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_PercentValue:true */

/**
 * PieChart is the main class for generating... pie charts (surprise!).
 */
def
.type('pvc.PieChart', pvc.BaseChart)
.add({
    _axisClassByType: {
        'category': pvc.visual.Axis, // Type gets set dynamically in the Axis to this object's property 'category'.
        'angle':    pvc.visual.NormalizedAxis
    },

    // 1 = root, 2 = leaf, 1|2=3 = everywhere
    _axisCreateChartLevel: {
        'category': 2,
        'angle':    2
    },

    _axisSetScaleChartLevel: {
        'category': 2,
        'angle':    2
    },

    _axisCreationOrder: (function() {
        var a = pvc.BaseChart.prototype._axisCreationOrder.slice();
        a.push('category', 'angle');
        return a;
    }()),

    _createPlotsInternal: function() {
        this._addPlot(new pvc.visual.PiePlot(this));
    },
    
    _setAxisScale: function(axis, chartLevel) {

        this.base(axis, chartLevel);

        // 1 = root, 2 = leaf, 1|2=3 = everywhere
        if((chartLevel & 2) && axis.type === 'angle')
            axis.setScaleRange({min: 0, max: 2*Math.PI});
    },

    _createContent: function(parentPanel, contentOptions) {

        // TODO: move these to the pie plot?

        var isV1Compat = this.compatVersion() <= 1;
        if(isV1Compat) {
            var innerGap = pvc.castNumber(this.options.innerGap) || 0.95;
            innerGap = def.between(innerGap, 0.1, 1);
            contentOptions.paddings = ((1 - innerGap) * 100 / 2).toFixed(2) + "%";
        } else if(contentOptions.paddings == null) {
            contentOptions.paddings = new pvc_PercentValue(0.025);
        }

        contentOptions.scenes = def.getPath(this.options, 'pie.scenes');

        // ----------------

        this.base(parentPanel, contentOptions);
    }
});

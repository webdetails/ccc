/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// TODO: Consider the creation of a base PolarChart to 
// be the base class for Pie and Sunburst.
def
.type('pvc.SunburstChart', pvc.BaseChart)
.add({
    _axisClassByType: {
        'size':  pvc.visual.NormalizedAxis,
        'color': pvc.visual.SunburstDiscreteColorAxis
    },

    // Create color axis, even if the role is unbound
    // cause we need to check the axis options any way
    _axisCreateIfUnbound: {
        'color': true
    },

    _getTranslationClass: function(translOptions) {
        return def.type(this.base(translOptions)).add(pvc.data.SunburstChartTranslationOper);
    },

    // Consider all datums to be not-null.
    // All measures are optional...
    // @override
    _getIsNullDatum: def.fun.constant(),

    _createPlotsInternal: function() {
        var sunburstPlot = new pvc.visual.SunburstPlot(this);

        this._addPlot(sunburstPlot);
        
        // Not currently supported
        this.options.legend = false;
    }
});

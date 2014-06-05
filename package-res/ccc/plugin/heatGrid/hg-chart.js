/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * HeatGridChart is the main class for generating... heatGrid charts.
 *  A heatGrid visualizes a matrix of values by a grid (matrix) of *
 *  bars, where the color of the bar represents the actual value.
 *  By default the colors are a range of green values, where
 *  light green represents low values and dark green high values.
 *  A heatGrid contains:
 *     - two categorical axis (both on x and y-axis)
 *     - no legend as series become rows on the perpendicular axis 
 *  Please contact CvK if there are issues with HeatGrid at cde@vinzi.nl.
 */
def
.type('pvc.HeatGridChart', pvc.CategoricalAbstract)
.add({
    _allowColorPerCategory: true,

    // Create color axis, even if the role is unbound
    // cause we need to check the axis options any way
    _axisCreateIfUnbound: {
        'color': true
    },

    /* @override */
    _processOptionsCore: function(options) {
        
        this.base(options);
        
        def.set(options, 
            'legend', false,
            
            // Has no meaning in the current implementation
            'panelSizeRatio', 1);
    },

    /* @override */
    _createPlotsInternal: function() {
        this._addPlot(new pvc.visual.HeatGridPlot(this));
    },
    
    defaults: {
        colorValIdx: 0,
        sizeValIdx:  1,
        measuresIndexes: [2], // TODO: ???
        axisOffset: 0,
        plotFrameVisible: false,
        colorNormByCategory: true,
        numSD: 2   // width (only for normal distribution)
    }
});

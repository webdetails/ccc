/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A NormalizedBarChart is a 100% stacked bar chart.
 */
def
.type('pvc.NormalizedBarChart', pvc.BarAbstract)
.add({
    /** @override */
    _getContinuousVisibleExtentConstrained: function(axis, min, max) {
        if(axis.type === 'ortho')
            /* 
             * Forces showing 0-100 in the axis.
             * Note that the bars are stretched automatically by the band layout,
             * so this scale ends up being ignored by the bars.
             * Note also that each category would have a different scale,
             * so it isn't possible to provide a single correct scale,
             * that would satisfy all the bars...
             */
            return {min: 0, max: 100, minLocked: true, maxLocked: true};

        return this.base(axis, min, max);
    },
    
    _createPlotsInternal: function() {
        this._addPlot(new pvc.visual.NormalizedBarPlot(this));
    }
});
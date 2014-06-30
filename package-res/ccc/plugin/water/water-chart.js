/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * WaterfallChart is the class that generates waterfall charts.
 *
 * The waterfall chart is an alternative to the pie chart for
 * showing distributions. The advantage of the waterfall chart is that
 * it possibilities to visualize sub-totals and offers more convenient
 * possibilities to compare the size of categories (in a pie-chart you
 * have to compare wedges that are at a different angle, which
 * requires some additional processing/brainpower of the end-user).
 *
 * Waterfall charts are basically Bar-charts with some added
 * functionality. Given the complexity of the added features this
 * class has it's own code-base. However, it would be easy to
 * derive a BarChart class from this class by switching off a few
 * features.
 *
 * If you have an issue or suggestions regarding the Waterfall-charts
 * please contact CvK at cde@vinzi.nl
 */
def
.type('pvc.WaterfallChart', pvc.BarAbstract)
.add({
    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options) {
        // Doesn't work (yet?);
        options.baseAxisComposite = false;
        
        this.base(options);
    },
  
    _createPlotsInternal: function() {
        this._addPlot(new pvc.visual.WaterfallPlot(this));
    }
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A NormalizedBarChart is a 100% stacked bar chart.
 */
def
.type('pvc.NormalizedBarChart', pvc.BarAbstract)
.add({

    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options) {
        // Still affects default data cell settings
        options.stacked = true;
        options.percentageNormalized = true;

        this.base(options);
    },

    _initPlotsCore: function(hasMultiRole) {
        new pvc.visual.NormalizedBarPlot(this);
    },

    /* @override */
    _createPlotPanels: function(parentPanel, baseOptions){
        var barPlot = this.plots.bar;

        this.barChartPanel =
            new pvc.NormalizedBarPanel(
                this,
                parentPanel,
                barPlot,
                Object.create(baseOptions));
    }
});
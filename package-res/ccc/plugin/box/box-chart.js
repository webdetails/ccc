/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * BoxplotChart is the main class for generating... categorical boxplotcharts.
 * 
 * The boxplot is used to represent the distribution of data using:
 *  - a box to represent the region that contains 50% of the datapoints,
 *  - the whiskers to represent the regions that contains 95% of the datapoints, and
 *  - a center line (in the box) that represents the median of the dataset.
 * For more information on boxplots you can visit  http://en.wikipedia.org/wiki/Box_plot
 *
 * If you have an issue or suggestions regarding the ccc BoxPlot-charts
 * please contact CvK at cde@vinzi.nl
 */
def
.type('pvc.BoxplotChart', pvc.CategoricalAbstract)
.add({
    _getTranslationClass: function(translOptions) {
        return def
            .type(this.base(translOptions))
            .add(pvc.data.BoxplotChartTranslationOper);
    },
    
    _createPlotsInternal: function() {
        this._addPlot(new pvc.visual.BoxPlot(this));

        if(this.options.plot2) {
            // Line Plot
            this._addPlot(new pvc.visual.PointPlot(this, {
                name: 'plot2',
                spec: {
                    visualRoles: {
                        'value': {from: 'main.median'}
                    }
                },
                defaults: {
                    LinesVisible: true,
                    DotsVisible: true,
                    ColorAxis: 2,
                    OrthoAxis: 1
                }
            }));
        }
    },

    /** @override */
    _initAxesEnd: function() {
        
        // Set defaults of Offset property
        var typeAxes = this.axesByType.ortho;
        if(typeAxes) typeAxes.forEach(function(axis) {
            axis.option.defaults({Offset: 0.02});
        });

        this.base();
    },
    
    defaults: {
        // plot2: false
        // legend: false,
        crosstabMode: false
        // panelSizeRatio
    }
});
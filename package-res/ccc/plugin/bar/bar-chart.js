/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */
def
.type('pvc.BarChart', pvc.BarAbstract)
.add({
    _allowV1SecondAxis: true, 
    
    /** @override */
    _createPlotsInternal: function() {
        this._addPlot(new pvc.visual.BarPlot(this));

        if(this.options.plot2) {
            // Line Plot
            this._addPlot(new pvc.visual.PointPlot(this, {
                name: 'plot2',
                defaults: {
                    DataPart:    '1',
                    ColorAxis:    2,
                    LinesVisible: true,
                    DotsVisible:  true
                }}));
        }
    },
    
    /** @override */
    _createPlotTrend: function() {
        this._addPlot(new pvc.visual.PointPlot(this, {
            name: 'trend',
            spec: {
                visualRoles: {
                    color: {from: 'series'} // one trend per series
                }
            },
            fixed: {
                TrendType: 'none',
                NullInterpolatioMode: 'none'
            },
            defaults: {
                DataPart:  'trend',
                ColorAxis:    2,
                LinesVisible: true,
                DotsVisible:  false
            }
        }));
    },

    /** @override */
    _createContent: function(parentPanel, contentOptions) {
        
        this.base(parentPanel, contentOptions);

        // Legacy fields
        var barPanel = this.plotPanels.bar;

        var plot2Panel = this.plotPanels.plot2;
        if(plot2Panel && plot2Panel.plot.type === 'point') {
            if(barPanel) {
                barPanel.pvSecondLine = plot2Panel.pvLine;
                barPanel.pvSecondDot  = plot2Panel.pvDot;
            }

            plot2Panel._applyV1BarSecondExtensions = true;
        }
    }
});

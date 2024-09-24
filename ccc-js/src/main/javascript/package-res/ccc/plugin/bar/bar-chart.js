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
        this._createMainPlot();
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

    /** @virtual */
    _createMainPlot: function() {
        this._addPlot(new pvc.visual.BarPlot(this));
    },

    /** @override */
    _createPlotTrend: function() {
        this._addPlot(new pvc.visual.PointPlot(this, {
            name: 'trend',
            spec: {
                visualRoles: {
                    // Initially, the trend plot's value is sourced from the main plot's same named visual role.
                    // This ensures it doesn't affect the initial phase of visual role binding.
                    // But actually, this vr must be bound to the set of all dimensions to which trended plots are bound...
                    // See #_willBindVisualRoles.
                    // value: {from: 'main.value'},
                    color: {from: 'series'} // one trend per local series visual role.
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
    _willBindVisualRoles: function(complexType) {

        this.base(complexType);

        // Trend plots must now fix their value role bindings to the actual dimensions of all trended plots
        if(this.plots.trend) {
            var valueDimNames = this._getPreBoundTrendedDimensionNames();
            this.plots.trend.visualRoles.value.preBind(cdo.GroupingSpec.parse(valueDimNames));
        }
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

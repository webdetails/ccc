/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * MetricPointAbstract is the base class of metric dot and line.
 */
def
.type('pvc.MetricPointAbstract', pvc.MetricXYAbstract)
.add({
    _axisClassByType: {
        'size': pvc.visual.MetricPointSizeAxis
    },
    
    /** @override */
    _createPlotsInternal: function() {
        this._addPlot(this._createPointPlot());
    },

    /** @abstract */
    _createPointPlot: function() {},

    /** @override */
    _createPlotTrend: function() {
        this._addPlot(new pvc.visual.MetricPointPlot(this, {
            name: 'trend',
            spec: {
                visualRoles: {
                    color: {from: 'series'}, // one trend per series
                    size:  null // prevent auto-sourcing to main plot's size role
                }
            },
            fixed: {
                TrendType: 'none',
                NullInterpolatioMode: 'none',
                SizeRole:  null,
                SizeAxis:  null,
                OrthoAxis: 1
            },
            defaults: {
                DataPart:    'trend',
                ColorAxis:    2,
                LinesVisible: true,
                DotsVisible:  false
            }
        }));
    },

    /** @override */
    _getTranslationClass: function(translOptions) {
        return def
            .type(this.base(translOptions))
            .add(pvc.data.MetricPointChartTranslationOper);
    },

    /** @override */
    _calcAxesOffsetPaddings: function() {
        var aops = this.base();
        return aops || new pvc_Sides(0.01); // default value
    },

    defaults: {
        axisOriginIsZero: false,
        tooltipOffset: 10
    }
});

/**
 * Metric Dot Chart
 */
def
.type('pvc.MetricDotChart', pvc.MetricPointAbstract)
.add({
    /** @override */
    _createPointPlot: function() {
        return new pvc.visual.MetricPointPlot(this, {
            fixed: {DotsVisible: true}
        });
    }
});

/**
 * Metric Line Chart
 */
def
.type('pvc.MetricLineChart', pvc.MetricPointAbstract)
.add({
    /** @override */
    _createPointPlot: function() {
        return new pvc.visual.MetricPointPlot(this, {
            fixed: {LinesVisible: true}
        });
    }
});
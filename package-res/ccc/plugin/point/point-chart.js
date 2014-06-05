/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * PointAbstract is the class that will be extended by
 * dot, line, stacked-line and area charts.
 */
def
.type('pvc.PointAbstract', pvc.CategoricalAbstract)
.add({
    /** @override */
    _processOptionsCore: function(options) {
        // Has no meaning in this chart type
        options.panelSizeRatio = 1;
        
        this.base(options);
    },

    /** @override */
    _createPlotsInternal: function() {

        this._addPlot(this._createPointPlot());

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
                DataPart:    'trend',
                ColorAxis:    2,
                LinesVisible: true,
                DotsVisible:  false
            }
        }));
    },

    /** @override */
    _initAxesEnd: function() {
        // Set defaults of Offset property
        var typeAxes = this.axesByType.base;
        if(typeAxes) typeAxes.forEach(function(axis) {
            if(axis.scaleType !== 'discrete') axis.option.defaults({Offset: 0.01});
        });

        typeAxes = this.axesByType.ortho;
        if(typeAxes) typeAxes.forEach(function(axis) {
            axis.option.defaults({Offset: 0.04});
        });

        this.base();
    },
    
    /** @abstract */
    //_createPointPlot: function() {},
    
    defaults: {
        tooltipOffset: 10
    }
});

/**
 * Dot Chart
 */
def
.type('pvc.DotChart', pvc.PointAbstract)
.add({
    _createPointPlot: function() {
        return new pvc.visual.PointPlot(this, {
            fixed: {DotsVisible: true}
        });
    }
});

/**
 * Line Chart
 */
def
.type('pvc.LineChart', pvc.PointAbstract)
.add({
    _createPointPlot: function() {
        return new pvc.visual.PointPlot(this, {
            fixed: {LinesVisible: true}
        });
    }
});

/**
 * Area Chart
 */
def
.type('pvc.AreaChart', pvc.PointAbstract)
.add({
    _createPointPlot: function() {
        return new pvc.visual.PointPlot(this, {
            fixed: {AreasVisible: true}
        });
    }
});

/**
 * Stacked Line Chart
 */
pvc.mStackedLineChart = // V1 compatibility    
def
.type('pvc.StackedLineChart', pvc.PointAbstract)
.add({
    _createPointPlot: function() {
        return new pvc.visual.PointPlot(this, {
            fixed: {LinesVisible: true, Stacked: true}
        });
    }
});

/**
 * Stacked Dot Chart
 */
def
.type('pvc.StackedDotChart', pvc.PointAbstract)
.add({
    _createPointPlot: function() {
        return new pvc.visual.PointPlot(this, {
            fixed: {DotsVisible: true, Stacked: true}
        });
    }
});

/**
 * Stacked Area Chart
 */
pvc.mStackedAreaChart = // V1 compatibility
def
.type('pvc.StackedAreaChart', pvc.PointAbstract)
.add({
    _createPointPlot: function() {
        return new pvc.visual.PointPlot(this, {
            fixed:    {AreasVisible: true, Stacked: true},
            defaults: {LinesVisible: true}
        });
    }
});

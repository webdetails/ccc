/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes an abstract metric XY plot.
 * 
 * @name pvc.visual.MetricXYPlot
 * @class Represents an abstract metric XY plot.
 * @extends pvc.visual.CartesianPlot
 */
def
.type('pvc.visual.MetricXYPlot', pvc.visual.CartesianPlot)
.add({
    /** @override */
    _getOptionsDefinition: function() { return pvc.visual.MetricXYPlot.optionsDef; },

    /** @override */
    _initVisualRoles: function() {

        this.base();

        this._addVisualRole('x', {
            isMeasure:  true,
            isRequired: true,
            requireSingleDimension: true,
            requireIsDiscrete: false,
            defaultDimension: 'x',
            dimensionDefaults: {
                valueType: this.chart.options.timeSeries ? Date : Number
            }
        });

        this._addVisualRole('y', {
            isMeasure:  true,
            isRequired: true,
            requireSingleDimension: true,
            requireIsDiscrete: false,
            defaultDimension: 'y',
            dimensionDefaults: {valueType: Number}
        });
    },

    /** @override */
    _getBaseRole: function() { return this.visualRoles.x; },

    /** @override */
    _getOrthoRoles: function() { return [this.visualRoles.y]; },

    /** @override */
    generateTrendsDataCell: function(newDatums, dataCell, baseData) {
        var serRole = this.visualRoles.series,
            xRole   = this.visualRoles.x,
            yRole   = dataCell.role,
            trendOptions = dataCell.trend,
            trendInfo = trendOptions.info;

        this.chart._warnSingleContinuousValueRole(yRole);

        var xDimName = xRole.lastDimensionName(),
            yDimName = yRole.lastDimensionName(),

            // Visible part data, possibly grouped by series (if series is bound)
            data = this.chart.visiblePlotData(this, dataCell.dataPartValue, {baseData: baseData}), // [ignoreNulls=true]
            dataPartAtom = this.chart._getTrendDataPartAtom(),
            dataPartDimName = dataPartAtom.dimension.name;

        // For each series...
        // Or data already only contains visible data
        // Or null series
        (serRole.isBound() ? data.children() : def.query([data]))
            .each(genSeriesTrend);

        function genSeriesTrend(serData) {
            var funX    = function(datum) { return datum.atoms[xDimName].value; },
                funY    = function(datum) { return datum.atoms[yDimName].value; },
                datums  = serData.datums().sort(null, /* by */funX).array(),
                options = def.create(trendOptions, {rows: def.query(datums), x: funX, y: funY}),
                trendModel = trendInfo.model(options);

            if(trendModel) {
                datums.forEach(function(datum, index) {
                    var trendX = funX(datum), trendY;
                    if(trendX && (trendY = trendModel.sample(trendX, funY(datum), index)) != null) {
                        var atoms =
                            def.set(
                                Object.create(serData.atoms), // just common atoms
                                xDimName, trendX,
                                yDimName, trendY,
                                dataPartDimName, dataPartAtom);

                        newDatums.push(new cdo.TrendDatum(data.owner, atoms, trendOptions));
                    }
                });
            }
        }
    }
});

pvc.visual.MetricXYPlot.optionsDef = def.create(
    pvc.visual.CartesianPlot.optionsDef, {
        OrthoAxis: { // override resolve -> forces default value = 1
            resolve: null
        }
    });
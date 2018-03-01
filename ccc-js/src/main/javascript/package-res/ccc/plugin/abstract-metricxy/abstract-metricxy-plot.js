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
def('pvc.visual.MetricXYPlot', pvc.visual.CartesianPlot.extend({
    methods: /** @lends pvc.visual.MetricXYPlot# */{
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

            if(dataCell.plot !== this) throw def.error.operationInvalid("DataCell not of this plot.");

            // Visible part data, possibly grouped by series (if series is bound)
            var data = this.chart.visiblePlotData(this, {baseData: baseData}); // [ignoreNulls=true]

            var yRole = dataCell.role;
            var yDimNames = yRole.getCompatibleBoundDimensionNames(data);
            if(yDimNames.length === 0) {
                return;
            }

            var serRole = this.visualRoles.series;
            var xRole = this.visualRoles.x;
            var trendOptions = dataCell.trend;
            var trendInfo = trendOptions.info;

            var xDimName = xRole.grouping.singleDimensionName;

            var dataPartAtom = this.chart._getTrendDataPartAtom();
            var dataPartDimName = dataPartAtom.dimension.name;
            var datumDimNames;

            yDimNames.forEach(function(yDimName) {
                datumDimNames = null;

                // For each series...
                // Or data already only contains visible data
                // Or null series
                (serRole.isBound() ? data.children() : def.query([data]))
                    .each(function(serData) {
                        genSeriesTrend(serData, yDimName)
                    });
            });

            function genSeriesTrend(serData, yDimName) {
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

                            // Exclude all extension dimensions.
                            // Do this only once, as the structure is the same for every datum.
                            if(!datumDimNames) {
                                datumDimNames = data.type.filterExtensionDimensionNames(def.keys(atoms));
                            }

                            newDatums.push(new cdo.TrendDatum(data.owner, atoms, datumDimNames, trendOptions));
                        }
                    });
                }
            }
        }
    },

    options: {
        OrthoAxis: { // override resolve -> forces default value = 1
            resolve: null
        }
    }
}));

/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/
define([
    "ccc/def",
    "ccc/pvc",
    "test/utils",
    "test/data-1"
], function(def, pvc, utils, datas) {

    describe("pvc.CartesianGridDockingPanel", function() {

        describe("ZeroLine option", function() {
            var chartOptions;

            beforeEach(function() {

                chartOptions = {
                    width:       400,
                    height:      300,
                    animate:      false,
                    interactive:  false
                };
            });

            it("should not add a zero line when a numeric axis ZeroLine option is false", function() {
                var dataSpec = datas['relational, x=qty1|y=qty2, 4-quadrant points'];

                def.copyOwn(chartOptions, {
                    axisZeroLine: false
                });

                var chart = utils.createAndLayoutChart(pvc.MetricDotChart, chartOptions, dataSpec);

                expect(chart.contentPanel.xZeroLine instanceof Object).toBe(false);
                expect(chart.contentPanel.yZeroLine instanceof Object).toBe(false);
            });

            it("should add a zero line when a numeric axis ZeroLine option is true and data crosses zero", function() {
                var dataSpec = datas['relational, x=qty1|y=qty2, 4-quadrant points'];

                def.copyOwn(chartOptions, {
                    axisZeroLine: true
                });

                var chart = utils.createAndLayoutChart(pvc.MetricDotChart, chartOptions, dataSpec);

                expect(chart.contentPanel.xZeroLine instanceof Object).toBe(true);
                expect(chart.contentPanel.yZeroLine instanceof Object).toBe(true);
            });

            it("should not add a zero line when a numeric axis ZeroLine option is true but data does not cross zero", function() {
                var dataSpec = datas['relational, x=qty1|y=qty2, positive quadrant points'];

                def.copyOwn(chartOptions, {
                    axisZeroLine: true
                });

                var chart = utils.createAndLayoutChart(pvc.MetricDotChart, chartOptions, dataSpec);

                expect(chart.contentPanel.xZeroLine instanceof Object).toBe(false);
                expect(chart.contentPanel.yZeroLine instanceof Object).toBe(false);
            });

            it("should not add a zero line when a discrete axis ZeroLine option is true", function() {
                var dataSpec = datas['relational, category=date|value=qty, 4 categories'];

                def.copyOwn(chartOptions, {
                    baseAxisZeroLine: true
                });

                var chart = utils.createAndLayoutChart(pvc.BarChart, chartOptions, dataSpec);

                expect(chart.contentPanel.xZeroLine instanceof Object).toBe(false);
            });

            // CDF-449
            it("should not add a zero line when a time series axis ZeroLine option is true", function() {
                var dataSpec = datas['relational, category=Date|value=qty, 2 date categories: 1 negative and 1 positive'];
                var chartOptions = {
                    width:       400,
                    height:      300,
                    animate:     false,
                    interactive: false,
                    baseAxisZeroLine: true,
                    timeSeries:  true
                };

                var chart = utils.createAndLayoutChart(pvc.LineChart, chartOptions, dataSpec);

                expect(chart.contentPanel.xZeroLine instanceof Object).toBe(false);
            });
        });
    });
});
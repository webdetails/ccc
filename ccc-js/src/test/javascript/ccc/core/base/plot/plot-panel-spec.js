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

    //region helpers
    function createAndLayoutChart(chartType, options1, options2) {

        var chartOptions = {
            width:  200,
            height: 300,

            // Reset
            animate: false,
            interactive: false,
            autoPaddingByDotSize: false, // relevant for MetricDotChart
            axisOffset: 0,
            margins: 0,
            paddings: 0,
            contentPaddings: 0,
            contentMargins: 0
        };

        if(options1) def.copyOwn(chartOptions, options1);
        if(options2) def.copyOwn(chartOptions, options2);

        var dataSpec;
        if(chartType === pvc.MetricDotChart) {
            dataSpec = datas['relational, category=date|value=qty|value2=sales, 4 categories, constant positive value, increasing value'];
        } else {
            dataSpec = datas['relational, category=date|value=qty, 4 categories'];
        }

        return utils.createAndLayoutChart(chartType, chartOptions, dataSpec);
    }

    function measureLayout(chart, layoutMeasureId) {
        switch(layoutMeasureId) {
            case 'main':
                return chart.plotPanels.main.getLayout().size;

            case 'main-paddings':
                return chart.plotPanels.main.getLayout().paddings;

            case 'base':
                return chart.basePanel.getLayout().size;

            case 'content-fill':
                return chart.contentPanel.getLayout().gridSize;

            case 'content-fill-client':
                var li = chart.contentPanel.getLayout();
                return {
                    width:  (li.gridSize.width ||0) - li.gridPaddings.width,
                    height: (li.gridSize.height||0) - li.gridPaddings.height
                };

            case 'content-fill-paddings':
                return chart.contentPanel.getLayout().gridPaddings;
        }
    }

    function expectSizeToBe(size, w, h) {
        if(w != null) expect(size.width ).toBeCloseTo(w, 2);
        if(h != null) expect(size.height).toBeCloseTo(h, 2);
    }
    //endregion

    describe("pvc.PlotPanel", function() {

        describe("Option `plotSizeMin`", function() {

            describe("Basic behaviour", function() {

                [
                    pvc.PieChart, // inherits from BaseChart
                    pvc.BarChart,  // inherits from Categorical
                    pvc.MetricDotChart // inherits from Cartesian
                ].forEach(function(chartType) {

                    describe("In a " + def.qualNameOf(chartType), function() {

                        describe("Specifying a `plotSizeMin` larger than the chart's dimensions " +
                                 "should force the chart to increase its plot area beyond the " +
                                 "specified `width` and `height`", function() {

                            it("when `plotSizeMin` is specified as a number", function() {

                                var chart = createAndLayoutChart(chartType, {
                                    plotSizeMin: 400
                                });

                                expectSizeToBe(measureLayout(chart, 'main'), 400, 400);
                            });

                            it("when `plotSizeMin` is specified as an object", function() {

                                var chart = createAndLayoutChart(chartType, {
                                    plotSizeMin: {width: 400}
                                });

                                expectSizeToBe(measureLayout(chart, 'main'), 400);
                            });

                            it("when `plotSizeMin` is specified as a string containing a number", function() {

                                var chart = createAndLayoutChart(chartType, {
                                    plotSizeMin: '400'
                                });

                                expectSizeToBe(measureLayout(chart, 'main'), 400, 400);
                            });


                            it("but NEVER when `plotSizeMin` is specified as a percentage string " +
                               "(because percentages are not supported)", function() {
                                // specifying a percentage would make no sense, as the chart would grow on
                                // each iteration of the layout solver

                                var chart = createAndLayoutChart(chartType, {});
                                var plotSizeNormal = measureLayout(chart, 'main');

                                chart = createAndLayoutChart(chartType, {
                                    plotSizeMin: '90%'
                                });

                                expectSizeToBe(measureLayout(chart, 'main'), plotSizeNormal.width, plotSizeNormal.height);
                            });
                        });
                    });
                });

                // ---

                [
                    pvc.PieChart,  // inherits from BaseChart
                    pvc.BarChart,  // inherits from Categorical
                    pvc.MetricDotChart // inherits from Cartesian
                ].forEach(function(chartType) {

                    describe("In a " + def.qualNameOf(chartType), function() {

                        var _defaultOptions = {
                            plotSizeMin:   400,
                            axisLabel_visible: false,
                            baseAxisSize:  50,
                            orthoAxisSize: 50
                        };

                        function getChartPlotExtraSize(chart) {
                            return {
                                width:  chart.axes.base  ? chart.axesPanels.base .getLayout().size.height : 0,
                                height: chart.axes.ortho ? chart.axesPanels.ortho.getLayout().size.width  : 0
                            };
                        }

                        it("the base panel should grow just enough, when there are no content paddings nor content margins", function() {

                            var chart = createAndLayoutChart(chartType, _defaultOptions);

                            var sizeExtra = getChartPlotExtraSize(chart);

                            expectSizeToBe(measureLayout(chart, 'base'), 400 + sizeExtra.width, 400 +  + sizeExtra.height);
                        });

                        it("the base panel should grow just enough, when there are absolute paddings", function() {

                            var chart = createAndLayoutChart(chartType, _defaultOptions, {
                                contentPaddings: 100
                            });

                            var sizeExtra = getChartPlotExtraSize(chart);

                            // 400 + 2 * 100 == 600
                            expectSizeToBe(measureLayout(chart, 'base'), 600 +  sizeExtra.width, 600 + sizeExtra.height);
                        });

                        it("the base panel should grow just enough, when there are relative paddings", function() {

                            var chart = createAndLayoutChart(chartType, _defaultOptions, {
                                contentPaddings: "30%"
                            });

                            var sizeExtra = getChartPlotExtraSize(chart);

                            // (400 + extra) / (1 - 2 * 0.30)
                            var width  = (400 + sizeExtra.width)  / (1 - 2 * 0.30);
                            var height = (400 + sizeExtra.height) / (1 - 2 * 0.30);

                            expectSizeToBe(measureLayout(chart, 'base'), width, height);
                        });

                        it("the base panel should grow just enough when there are absolute margins", function() {

                            var chart = createAndLayoutChart(chartType, _defaultOptions, {
                                contentMargins: 100
                            });

                            var sizeExtra = getChartPlotExtraSize(chart);

                            // 400 + 2 * 100 == 600
                            expectSizeToBe(measureLayout(chart, 'base'), 600 + sizeExtra.width, 600 + sizeExtra.height);
                        });

                        it("the base panel should grow just enough when there are relative margins", function() {

                            var chart = createAndLayoutChart(chartType, _defaultOptions, {
                                contentMargins: "30%"
                            });

                            var sizeExtra = getChartPlotExtraSize(chart);

                            // (400 + extra) / (1 - 2 * 0.30)
                            // (400 + extra) / (1 - 2 * 0.30)
                            var width  = (400 + sizeExtra.width)  / (1 - 2 * 0.30);
                            var height = (400 + sizeExtra.height) / (1 - 2 * 0.30);

                            expectSizeToBe(measureLayout(chart, 'base'), width, height);
                        });

                        it("the base panel should grow just enough when there are both absolute margins and paddings", function() {

                            var chart = createAndLayoutChart(chartType, _defaultOptions, {
                                contentMargins: 100,
                                contentPaddings: 33
                            });

                            var sizeExtra = getChartPlotExtraSize(chart);

                            // 400 + 2 * 100 + 2 * 33 == 666
                            expectSizeToBe(measureLayout(chart, 'base'), 666 + sizeExtra.width, 666 + sizeExtra.height);
                        });
                    });
                });
            });

            describe("Interaction with other options of cartesian axes", function() {

                describe("Axis offset", function() {
                    var _defaultOptions = {
                        axisOffset: 0.45,                 // 90% of the plot area is just padding
                        orthoAxisDomainRoundMode: 'none', // no tick rounding on the vertical direction
                        orthoAxisOriginIsZero: true       // the default; locks "bottom" from being affected offset.
                    };

                    it("should affect the plot area paddings, when `plotSizeMin` is not specified", function() {
                        var chart = createAndLayoutChart(pvc.BarChart, _defaultOptions);

                        var pa = measureLayout(chart, 'content-fill');
                        expectSizeToBe(measureLayout(chart, 'content-fill-paddings'), 0.9       * pa.width, 0.45       * pa.height);
                        expectSizeToBe(measureLayout(chart, 'content-fill-client'),   (1 - 0.9) * pa.width, (1 - 0.45) * pa.height);
                    });

                    it("should affect the plot area paddings, when `plotSizeMin` is specified", function() {
                        var chart = createAndLayoutChart(pvc.BarChart, _defaultOptions, {
                            plotSizeMin: 400
                        });

                        var pa = measureLayout(chart, 'content-fill');
                        expectSizeToBe(pa, 400, 400);
                        expectSizeToBe(measureLayout(chart, 'content-fill-paddings'), 0.9       * pa.width, 0.45       * pa.height);
                        expectSizeToBe(measureLayout(chart, 'content-fill-client'),   (1 - 0.9) * pa.width, (1 - 0.45) * pa.height);
                    });
                });
            });

            describe("Interaction with other options of categorical axes", function() {

                describe("Fixed categorical band layout", function() {
                    // Band imposes main plot client size min of: 4 categories: 4*(70+10) = 320 pixels
                    // There are no label overflows cause the bars are wider than the labels.
                    var C = 4;
                    var TB = (70 + 10) * C; // = 320

                    var _defaultOptions = {
                        baseAxisBandSize:    70,
                        baseAxisBandSpacing: 10
                    };

                    it("should grow the content's fill client size to the space allocated to the bands, when no `plotSizeMin` is specified", function() {

                        var chart = createAndLayoutChart(pvc.BarChart, _defaultOptions);

                        expectSizeToBe(measureLayout(chart, 'content-fill-client'), TB);
                    });

                    it("should ignore `plotSizeMin`, when it is SMALLER than the space allocated to the bands", function() {

                        var chart = createAndLayoutChart(pvc.BarChart, _defaultOptions, {
                            plotSizeMin: {width: 250}
                        });

                        expectSizeToBe(measureLayout(chart, 'content-fill'), TB);
                    });

                    it("should grow the content's fill size to `plotSizeMin` when it is LARGER than the space allocated to the bands", function() {

                        var chart = createAndLayoutChart(pvc.BarChart, _defaultOptions, {
                            plotSizeMin: {width: 400}
                        });

                        expectSizeToBe(measureLayout(chart, 'content-fill'), 400);
                    });
                });

                describe("Axis offset and Fixed categorical band layout", function() {
                    // Band imposes main plot client size of: 4 categories: 4*(70+10) = 320 pixels
                    // There are no label overflows cause the bars are wider than the labels.
                    // 5% base axis offset causes 5% paddings on each side
                    var C = 4;
                    var TB = (70 + 10) * C; // = 320
                    var plotW = TB / (1 - 2 * 0.05); // ~355.5(5)

                    var _defaultOptions = {
                        baseAxisBandSize:    70,
                        baseAxisBandSpacing: 10,
                        baseAxisOffset:      0.05
                    };

                    it("should grow the plot area to the axis offset plus the fixed space allocated to the bands, " +
                       "when `plotSizeMin` is not specified", function() {

                        var chart = createAndLayoutChart(pvc.BarChart, _defaultOptions);

                        expectSizeToBe(measureLayout(chart, 'content-fill'), plotW);
                    });

                    it("should grow the plot area to the axis offset plus the fixed space allocated to the bands, " +
                       "and not be affected by a `plotSizeMin` that is smaller than the plot size that results when it is not specified", function() {

                        var arbitraryDelta = 10;

                        var chart = createAndLayoutChart(pvc.BarChart, _defaultOptions, {
                            plotSizeMin: {width: plotW - arbitraryDelta}
                        });

                        expectSizeToBe(measureLayout(chart, 'content-fill'), plotW);
                    });

                    it("should grow the plot area to `plotSizeMin`, " +
                       "when specified and larger than the plot size that results when it is not specified", function() {

                        var arbitraryDelta = 10;

                        var chart = createAndLayoutChart(pvc.BarChart, _defaultOptions, {
                            plotSizeMin: {width: plotW + arbitraryDelta}
                        });

                        expectSizeToBe(measureLayout(chart, 'content-fill'), plotW + arbitraryDelta);
                    });
                });
            });

            describe("Interaction with other options of continuous axes", function() {
                /**
                 * The maximum of the dataset is 19, and there are ticks until 21.
                 * Hence, the padding introduced by tick rounding is (21-19) / 21 of the client height.
                 *
                 * By adding this space to the effective padding of the main panel,
                 * we should obtain the original orthoAxisOffset.
                 */

                var _defaultOptions = {
                    //axisLabel_visible: false,
                    baseAxisSize:      50,
                    orthoAxisSize:     50,
                    orthoAxisTickUnit:  3,       // ticks: [0, 3, 6, 9, 12, 15, 18, 21]
                    orthoAxisOriginIsZero: true, // "bottom" is locked and axis offset is not applied to this side.
                    orthoAxisDomainRoundMode: 'tick', // round domain to next tick (from 19 to 21)
                    contentPaddings:   10 // absorb any axes' labels' overflows
                };

                function measureOrthoAxisOffset(chart) {
                    var m = chart.plotPanels.main.getLayout();
                    var tickRoundPct  = 2 / 21;
                    var tickRoundPx   = tickRoundPct * m.clientSize.height;

                    var topAxisOffset = (m.paddings.top || 0) + tickRoundPx;
                    return topAxisOffset / m.size.height;
                }

                it("should add plot paddings equal to the difference between the axis offset and the tick rounding", function() {
                    // Tick Rounding is: 2 / 21 = 0.09523809523809523 ~= 0.1
                    // So, 0.1 and 0.4 are both greater and paddings should be added to reach the desired offset.

                    var chart = createAndLayoutChart(pvc.BarChart, _defaultOptions, {
                        height: 470, // 470 = 400 + 50 + 2 * 10
                        orthoAxisOffset: 0.4
                    });

                    expect(measureOrthoAxisOffset(chart)).toBeCloseTo(0.4, 2);

                    // ---

                    chart = createAndLayoutChart(pvc.BarChart, _defaultOptions, {
                        height: 470, // 470 = 400 + 50 + 2 * 10
                        orthoAxisOffset: 0.1
                    });

                    expect(measureOrthoAxisOffset(chart)).toBeCloseTo(0.1, 2);
                });

                it("should NOT add paddings when the tick rounding is LARGER than the axis offset", function() {
                    // Tick Rounding is: 2 / 21 = 0.09523809523809523 ~= 0.1
                    // 0.01 is much smaller, so no paddings should be added.

                    var chart = createAndLayoutChart(pvc.BarChart, _defaultOptions, {
                        height: 470, // 470 = 400 + 50 + 2 * 10
                        orthoAxisOffset: 0.01
                    });

                    expect(measureOrthoAxisOffset(chart)).toBeGreaterThan(0.01);

                    expect(measureLayout(chart, 'content-fill-paddings').height).toBe(0);
                });

                it("should result in the same plot paddings, when the plot size is instead imposed by an equal `plotSizeMin`", function() {

                    var chart = createAndLayoutChart(pvc.BarChart, _defaultOptions, {
                        plotSizeMin:     400, // 400 + 50 + 2 * 10 = 470
                        orthoAxisOffset: 0.4
                    });

                    expect(measureOrthoAxisOffset(chart)).toBeCloseTo(0.4, 2);

                    // ---

                    chart = createAndLayoutChart(pvc.BarChart, _defaultOptions, {
                        plotSizeMin:     400, // 400 + 50 + 2 * 10 = 470
                        orthoAxisOffset: 0.1
                    });

                    expect(measureOrthoAxisOffset(chart)).toBeCloseTo(0.1, 2);

                    // ---

                    chart = createAndLayoutChart(pvc.BarChart, _defaultOptions, {
                        plotSizeMin:     400, // 400 + 50 + 2 * 10 = 470
                        orthoAxisOffset: 0.01
                    });

                    expect(measureOrthoAxisOffset(chart)).toBeGreaterThan(0.01);
                    expect(measureLayout(chart, 'content-fill-paddings').height).toBe(0);
                });
            });

            describe("Interaction with plots' own content overflow", function() {

                var _defaultOptions = {
                    sizeRole: "y",
                    sizeAxisRatio: 0.1,
                    sizeAxisRatioTo: "height"
                };

                it("should not add any paddings for the bubbles, when `autoPaddingsByDotSize` is false", function() {
                    var chart = createAndLayoutChart(pvc.MetricDotChart, _defaultOptions, {
                        autoPaddingByDotSize: false
                    });

                    expectSizeToBe(measureLayout(chart, 'main-paddings'), 0, 0);
                });

                it("should add just enough paddings to encompass all of the bubbles, when `autoPaddingByDotSize` is true", function() {
                    var chart = createAndLayoutChart(pvc.MetricDotChart, _defaultOptions, {
                        autoPaddingByDotSize: true,
                        orthoAxisDomainRoundMode: 'none'
                    });

                    // biggest bubble is at the topmost position (y = 100)
                    // size = y
                    // So, padding top is equal to the greatest bubble radius.
                    var sizeValue = 100;
                    var radiusMax = Math.sqrt(chart.axes.size.scale(sizeValue));

                    expect(measureLayout(chart, 'main-paddings').top).toBeCloseTo(radiusMax, 2);
                });

                it("should not add paddings if tick rounding already ensures the bubbles are inside the plot area", function() {
                    var chart = createAndLayoutChart(pvc.MetricDotChart, _defaultOptions, {
                        autoPaddingByDotSize: true,
                        orthoAxisDomainRoundMode: 'tick',
                        orthoAxisTickUnit: 60
                    });

                    expect(measureLayout(chart, 'main-paddings').top).toBe(0);
                });

                it("should add just enough paddings to encompass all of the bubbles, " +
                   "when `plotSizeMin` is used and `autoPaddingByDotSize` is true", function() {
                    var chart = createAndLayoutChart(pvc.MetricDotChart, _defaultOptions, {
                        autoPaddingByDotSize: true,
                        orthoAxisDomainRoundMode: 'none',
                        plotSizeMin: {height: 600}
                    });

                    // biggest bubble is at the topmost position (y = 100)
                    // size = y
                    // So, padding top is equal to the greatest bubble radius.
                    var sizeValue = 100;
                    var radiusMax = Math.sqrt(chart.axes.size.scale(sizeValue));

                    expect(measureLayout(chart, 'main-paddings').top).toBeCloseTo(radiusMax, 2);
                });
            });

            describe("Interaction with multi-charts", function() {

                [
                    pvc.PieChart, // inherits from BaseChart
                    pvc.BarChart  // inherits from Categorical
                ].forEach(function(chartType) {

                    describe("In a " + def.qualNameOf(chartType), function() {

                        it("should ignore the plotSizeMin option on a small-multiples chart", function() {
                            var chart = createAndLayoutChart(pvc.BarChart, {
                                multiChartRole: 'category',
                                categoryRole:   'category',
                                multiChartColumnsMax: 2,
                                plotSizeMin:    {width: 400}
                            });

                            var li = chart.contentPanel.getLayout();
                            expect(li.width).toBe(200/2);
                        });
                    });
                });
            });
        });
    });
});
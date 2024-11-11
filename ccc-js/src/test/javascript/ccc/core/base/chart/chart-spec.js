/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
define([
    'ccc/cdo',
    'ccc/pvc',
    'ccc/def',
    'test/utils',
    'test/data-1'
], function(cdo, pvc, def, utils, datas) {

    describe("pvc.BaseChart", function() {

        describe("preserveLayout", function() {

            function createChart(options, type) {
                var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
                return utils.createChart(type, options, dataSpec);
            }

            function createLineChart(opts) {

                var chartOptions = {
                    dimensions: {
                        category: {
                            valueType :  Date       ,
                            rawFormat : "%Y-%m-%d"  ,
                            format    : "%m/%d"
                        }
                    }
                };

                chartOptions = $.extend({}, chartOptions, opts);

                return createChart(chartOptions, pvc.LineChart);
            }

            it("should create a chart with preserveLayout set to false ", function() {
                var chart = createLineChart({});
                chart.render();

                expect(!!chart).toBe(true);
                expect(!!chart.options.preserveLayout).toBe(false);
                expect(chart._preserveLayout).toBe(false);
            });

            it("should create a chart with preserveLayout", function() {
                var chart = createLineChart({preserveLayout: true});

                expect(!!chart).toBe(true);
                expect(chart.options.preserveLayout).toBe(true);

                chart.render();
                expect(chart._preserveLayout).toBe(false);  //only true on 2nd render

                chart.render(true, true, false);
                expect(chart._preserveLayout).toBe(true);  //only true on 2nd render

            });

            // TODO test if layout is kept
        });

        describe("#_setNumericAxisScale(axis)", function() {

            function expectOrthoDomain(dataId, expectedDomain, options) {
                var dataSpec = datas[dataId];
                var chart = utils.createAndLayoutChart(pvc.LineChart, options || {}, dataSpec);

                var domain = chart.axes.ortho.scale.domain();
                expect(domain).toEqual(expectedDomain);
            }

            describe("when OriginIsZero: false and DomainRoundMode: none", function() {

                it("should respect a domain of [8, 13]", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, variable positive values';
                    var options = {
                        orthoAxisOriginIsZero: false,
                        orthoAxisDomainRoundMode: 'none'
                    };

                    expectOrthoDomain(dataId, [8, 13], options);
                });

                it("should respect a domain of [-13, -8]", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, variable negative values';
                    var options = {
                        orthoAxisOriginIsZero: false,
                        orthoAxisDomainRoundMode: 'none'
                    };

                    expectOrthoDomain(dataId, [-13, -8], options);
                });

                it("should respect a domain of [-10, 13]", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, variable positive and negative values';
                    var options = {
                        orthoAxisOriginIsZero: false,
                        orthoAxisDomainRoundMode: 'none'
                    };

                    expectOrthoDomain(dataId, [-10, 13], options);
                });

                it("should adjust a domain of [10, 10] to [9.9, 10.1]", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, constant positive value';
                    var options = {
                        orthoAxisOriginIsZero: false,
                        orthoAxisDomainRoundMode: 'none'
                    };

                    expectOrthoDomain(dataId, [9.9, 10.1], options);
                });

                it("should adjust a domain of [-10, -10] to [-10.1, -9.9]", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, constant negative value';
                    var options = {
                        orthoAxisOriginIsZero: false,
                        orthoAxisDomainRoundMode: 'none'
                    };

                    expectOrthoDomain(dataId, [-10.1, -9.9], options);
                });

                it("should adjust a domain of [0, 0] to [-0.1, +0.1]", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, constant zero value';
                    var options = {
                        orthoAxisOriginIsZero: false,
                        orthoAxisDomainRoundMode: 'none'
                    };

                    expectOrthoDomain(dataId, [-0.1, +0.1], options);
                });
            });

            describe("when OriginIsZero: true", function() {

                it("should transform a domain of [8, 13] into [0, 13]", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, variable positive values';
                    var options = {
                        orthoAxisDomainRoundMode: 'none'
                    };

                    expectOrthoDomain(dataId, [0, 13], options);
                });

                it("should transform a domain of [-13, -8] into [-13, 0]", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, variable negative values';
                    var options = {
                        orthoAxisDomainRoundMode: 'none'
                    };

                    expectOrthoDomain(dataId, [-13, 0], options);
                });

                it("should respect a domain of [-10, 13]", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, variable positive and negative values';
                    var options = {
                        orthoAxisDomainRoundMode: 'none'
                    };

                    expectOrthoDomain(dataId, [-10, 13], options);
                });

                it("should adjust a domain of [10, 10] to [0, 10.1]", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, constant positive value';
                    var options = {
                        orthoAxisDomainRoundMode: 'none'
                    };

                    expectOrthoDomain(dataId, [0, 10.1], options);
                });

                it("should adjust a domain of [-10, -10] to [-10.1, 0]", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, constant negative value';
                    var options = {
                        orthoAxisDomainRoundMode: 'none'
                    };

                    expectOrthoDomain(dataId, [-10.1, 0], options);
                });

                it("should adjust a domain of [0, 0] to [-0.1, +0.1]", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, constant zero value';
                    var options = {
                        orthoAxisDomainRoundMode: 'none'
                    };

                    expectOrthoDomain(dataId, [-0.1, +0.1], options);
                });
            });

            describe("when DomainRoundMode: tick", function() {

                it("should transform a domain of [8, 13] into [8, 14] when tick unit is 2", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, variable positive values';
                    var options = {
                        orthoAxisOriginIsZero: false,
                        orthoAxisTickUnit: 2,
                        orthoAxisDomainRoundMode: 'tick'
                    };

                    expectOrthoDomain(dataId, [8, 14], options);
                });

                it("should transform a domain of [-13, -8] into [-14, -8] when tick unit is 2", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, variable negative values';
                    var options = {
                        orthoAxisOriginIsZero: false,
                        orthoAxisTickUnit: 2,
                        orthoAxisDomainRoundMode: 'tick'
                    };

                    expectOrthoDomain(dataId, [-14, -8], options);
                });

                it("should transform a domain of [-10, 13] into [-10, 14] when tick unit is 2", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, variable positive and negative values';
                    var options = {
                        orthoAxisOriginIsZero: false,
                        orthoAxisTickUnit: 2,
                        orthoAxisDomainRoundMode: 'tick'
                    };

                    expectOrthoDomain(dataId, [-10, 14], options);
                });

                it("should adjust a domain of [10, 10] to [8, 12] when tick unit is 2", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, constant positive value';
                    var options = {
                        orthoAxisOriginIsZero: false,
                        orthoAxisTickUnit: 2,
                        orthoAxisDomainRoundMode: 'tick'
                    };

                    expectOrthoDomain(dataId, [8, 12], options);
                });

                it("should adjust a domain of [-10, -10] to [-12, -8] when tick unit is 2", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, constant negative value';
                    var options = {
                        orthoAxisOriginIsZero: false,
                        orthoAxisTickUnit: 2,
                        orthoAxisDomainRoundMode: 'tick'
                    };

                    expectOrthoDomain(dataId, [-12, -8], options);
                });

                it("should adjust a domain of [0, 0] to [-2, +2] when tick unit is 2", function() {

                    var dataId = 'relational, category=date|value=qty, 4 categories, constant zero value';
                    var options = {
                        orthoAxisOriginIsZero: false,
                        orthoAxisTickUnit: 2,
                        orthoAxisDomainRoundMode: 'tick'
                    };

                    expectOrthoDomain(dataId, [-2, +2], options);
                });
            });
        });
    });
});

define([
    'ccc/cdo',
    'ccc/pvc',
    'ccc/def',
    'test/utils',
    'test/data-1'
], function(cdo, pvc, def, utils, datas) {

    describe("pvc.visual.SizeAxis", function() {

        describe('Options that fix the domain', function() {

            it("should create a size axis with no fixed limits on domain", function() {
                var axis = createSizeAxis({
                        useShapes: true,
                        visualRoles:{size: 'value'}
                    }, pvc.HeatGridChart);

                axis.bind(axis.chart.axes.size.dataCells);
                axis.chart._setNumericAxisScale(axis);

                expect(!!axis).toBe(true);
                expect(axis.type).toEqual('size');

                expect(axis.scale.maxLocked).not.toBe(true);
                expect(axis.scale.minLocked).not.toBe(true);
            });

            describe("FixedMin, FixedMax and FixedLength (and Domain Align) interactions", function() {
                var axis, options;

                beforeEach(function() {
                    options = {
                        useShapes: true,
                        visualRoles: {size: 'value'},
                        size2AxisFixedMin:    10,
                        size2AxisFixedMax:    20,
                        size2AxisFixedLength: 30
                    };
                });

                describe("a) if only FixedMin, FixedMax specified", function() {

                    beforeEach(function() {
                        delete options.size2AxisFixedLength;

                        axis = createSizeAxis(options, pvc.HeatGridChart);
                        axis.bind(axis.chart.axes.size.dataCells);
                        axis.chart._setNumericAxisScale(axis);
                    });

                    it("should set the desired min and max for the domain", function() {
                        expect(axis.scale.domain()[0]).toEqual(10);
                        expect(axis.scale.domain()[1]).toEqual(20);
                    });

                    it("should set both min and max to locked", function() {
                        expect(axis.scale.maxLocked).toBe(true);
                        expect(axis.scale.minLocked).toBe(true);
                    });
                });

                describe("b) if only FixedMin, FixedLength specified", function() {

                    beforeEach(function() {
                        delete options.size2AxisFixedMax;

                        axis = createSizeAxis(options, pvc.HeatGridChart);
                        axis.bind(axis.chart.axes.size.dataCells);
                        axis.chart._setNumericAxisScale(axis);
                    });

                    it("should set the desired min, length and a calculated max for the domain", function() {
                        expect(axis.scale.domain()[0]).toEqual(10);
                        expect(axis.scale.domain()[1]).toEqual(40);
                    });

                    it("should set both min and max to locked", function() {
                        expect(axis.scale.maxLocked).toBe(true);
                        expect(axis.scale.minLocked).toBe(true);
                    });
                });

                describe("c) if only FixedMax, FixedLength specified", function() {

                    beforeEach(function() {
                        delete options.size2AxisFixedMin;

                        axis = createSizeAxis(options, pvc.HeatGridChart);
                        axis.bind(axis.chart.axes.size.dataCells);
                        axis.chart._setNumericAxisScale(axis);
                    });

                    it("should set the desired max, length and a calculated min for the domain", function() {
                        expect(axis.scale.domain()[0]).toEqual(-10);
                        expect(axis.scale.domain()[1]).toEqual(20);
                    });

                    it("should set both min and max to locked", function() {
                        expect(axis.scale.maxLocked).toBe(true);
                        expect(axis.scale.minLocked).toBe(true);
                    });
                });

                describe("d) if all are specified", function() {

                    beforeEach(function() {
                        axis = createSizeAxis(options, pvc.HeatGridChart);
                        axis.bind(axis.chart.axes.size.dataCells);
                        axis.chart._setNumericAxisScale(axis);
                    });

                    it("should set the desired min, length and a calculated max for the domain, " +
                       "ignoring the specified fixed maximum", function() {
                        expect(axis.scale.domain()[0]).toEqual(10);
                        expect(axis.scale.domain()[1]).toEqual(40);
                    });

                    it("should set both min and max to locked", function() {
                        expect(axis.scale.maxLocked).toBe(true);
                        expect(axis.scale.minLocked).toBe(true);
                    });
                });

                describe("e) if only fixed length is specified", function() {

                    beforeEach(function() {
                        delete options.size2AxisFixedMin;
                        delete options.size2AxisFixedMax;
                    });

                    describe("i) default domain align", function() {

                        beforeEach(function() {
                            axis = createSizeAxis(options, pvc.HeatGridChart);
                            axis.bind(axis.chart.axes.size.dataCells);
                            axis.chart._setNumericAxisScale(axis);
                        });

                        it("should be 'center'", function() {
                            expect(axis.option('DomainAlign')).toEqual('center');
                        });
                    });

                    describe("i) default domain align", function() {

                        beforeEach(function() {
                            axis = createSizeAxis(options, pvc.HeatGridChart);
                            axis.bind(axis.chart.axes.size.dataCells);
                            axis.chart._setNumericAxisScale(axis);
                        });

                        it("should be center", function() {
                            expect(axis.option('DomainAlign')).toEqual('center');
                        });
                    });

                    describe("ii) domain align = min", function() {
                        it("should set the desired length, set the min to the base min and calculate max", function() {

                            options['size2AxisDomainAlign'] = 'min';

                            axis = createSizeAxis(options, pvc.HeatGridChart);
                            axis.bind(axis.chart.axes.size.dataCells);
                            axis.chart._setNumericAxisScale(axis);

                            expect(axis.scale.domain()[1] - axis.scale.domain()[0]).toEqual(30);
                            expect(axis.scale.domain()[0]).toEqual(axis.chart.axes.size.scale.domain()[0]);
                        });

                        it("shouldn't set min and max to locked", function() {
                            expect(axis.scale.maxLocked).not.toBe(true);
                            expect(axis.scale.minLocked).not.toBe(true);
                        });
                    });

                    describe("iii) domain align = max", function() {
                        it("should set the desired length, set the min to the base min and calculate max", function() {

                            options['size2AxisDomainAlign'] = 'max';

                            axis = createSizeAxis(options, pvc.HeatGridChart);
                            axis.bind(axis.chart.axes.size.dataCells);
                            axis.chart._setNumericAxisScale(axis);

                            expect(axis.scale.domain()[1] - axis.scale.domain()[0]).toEqual(30);
                            expect(axis.scale.domain()[1]).toEqual(axis.chart.axes.size.scale.domain()[1]);
                        });

                        it("shouldn't set min and max to locked", function() {
                            expect(axis.scale.maxLocked).not.toBe(true);
                            expect(axis.scale.minLocked).not.toBe(true);
                        });
                    });

                    describe("iv) domain align = center", function() {
                        it("should set the desired length and calculate a min and max for the domain", function() {

                            options['size2AxisDomainAlign'] = 'center';

                            axis = createSizeAxis(options, pvc.HeatGridChart);
                            axis.bind(axis.chart.axes.size.dataCells);
                            axis.chart._setNumericAxisScale(axis);

                            expect(axis.option('DomainAlign')).toEqual('center');
                            expect(axis.scale.domain()[1] - axis.scale.domain()[0]).toEqual(30);
                        });

                        it("shouldn't set min and max to locked", function() {
                            expect(axis.scale.maxLocked).not.toBe(true);
                            expect(axis.scale.minLocked).not.toBe(true);
                        });
                    });
                });
            });
        });
    });

    function createChart(options, type) {
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
        return utils.createChart(type, options, dataSpec);
    }

    function createSizeAxis(chartOptions, chartType) {
        var chart = createChart(chartOptions, chartType);
        var SizeAxis = pvc.visual.SizeAxis;
        return new SizeAxis(chart, 'size', 1, {}); // 1 ?
    }
});
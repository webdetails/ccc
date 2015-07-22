define([
  'ccc/cdo',
  'ccc/pvc',
  'ccc/def',
  'test/utils',
  'test/data-1'
], function(cdo, pvc, def, utils, datas) {



    describe("axis -", function() {

        it("should create an axis", function() {
            var axis = createAxis({orientation: "horizontal"}, "base");

            expect(!!axis).toBe(true);
        });

        describe("The extensionPrefixes", function() {
            var axis = undefined;
            var scaleType = undefined;
            var DataCellMock = {
                role: {
                    grouping: {
                        isDiscrete: function() { return scaleType == "discrete"; },
                        lastDimensionValueType: function() { return false; }
                    }
                }
            };

            beforeEach(function() {
                axis = createAxis({orientation: "horizontal"}, "base");
            });

            afterEach(function() {
                axis = undefined;
                scaleType = undefined;
            });


            it("Should be created without scaleType information on init", function() {
                expect(axis.extensionPrefixes).toEqual(["axis", "yAxis", "baseAxis"]);
            });

            describe("When binding the axis", function() {
                it("Should be updated with scaleType information - 'continuous'", function() {
                    scaleType = "continuous";
                    axis.bind([DataCellMock]);
                    expect(axis.extensionPrefixes).toEqual(["axis", "continuousAxis", "numericAxis", "yAxis", "baseAxis"]);
                });

                it("Should be updated with scaleType information - 'discrete'", function() {
                    scaleType = "discrete";
                    axis.bind([DataCellMock]);
                    expect(axis.extensionPrefixes).toEqual(["axis", "discreteAxis", "yAxis", "baseAxis"]);
                });
            });
        });

        describe("Axis Validation - ", function() {

            describe("When values are Normalized", function() {

                it("Should not throw an error when ortho2Axis is different from orthoAxis", function() {
                    expect(function() { createChart({valuesNormalized:true, plot2: true, plot2OrthoAxis: 2}) }).not.toThrow();
                });

                it("Should not throw an error when ortho2Axis is equal to orthoAxis and is also normalized", function() {
                    expect(function() { createChart({valuesNormalized:true, plots: [{type: 'bar', orthoAxis: 1, valuesNormalized: true}]}) }).not.toThrow();
                });

                it("Should throw an error when ortho2Axis is equal to orthoAxis but is not normalized", function() {
                    expect(function() { createChart({valuesNormalized:true, plot2:true, plot2OrthoAxis: 1, plot2ValuesNormalized: false}) }).toThrow();
                });

            })

        });


        describe('Cart axis options that fix the domain (for base axis with timeseries scale): ', function() {

            it("should create a size axis with no fixed limits on domain; ", function() {
                var axis = createCartContinuousAxis({orientation: "horizontal", timeSeries: true}, "base");
                axis.bind(axis.chart.axes.base.dataCells);
                axis.chart._setTimeSeriesAxisScale(axis);

                expect(!!axis).toBe(true);
                expect(axis.type).toEqual('base');

                expect(axis.scale.maxLocked).not.toBe(true);
                expect(axis.scale.minLocked).not.toBe(true);
            });

            describe("1) FixedMin, FixedMax and FixedLength (and Domain Align) interactions ", function() {
                var axis, options = {   'orientation'            :  'horizontal',
                                        'timeSeries'             :   true,
                                        'base2AxisFixedMin'      :   new Date(2011,6,3),
                                        'base2AxisFixedMax'      :   new Date(2011,7,10),
                                        'base2AxisFixedLength'   :   "w"
                                    };

                describe("a) if only FixedMin, FixedMax specified - ", function() {

                    beforeEach(function() {
                        options['base2AxisFixedLength'] = undefined;
                        axis = createCartContinuousAxis(options, 'base');
                        axis.bind(axis.chart.axes.base.dataCells);
                        axis.chart._setTimeSeriesAxisScale(axis);
                    });

                    afterEach(function() {

                        options['base2AxisFixedLength'] = "w";
                    });

                    it("should set the desired min and max for the domain; ", function() {
                        expect(axis.scale.domain()[0]).toEqual(new Date(2011,6,3));
                        expect(axis.scale.domain()[1]).toEqual(new Date(2011,7,10));
                    });

                    it("should set both min and max to Locked; ", function() {
                        expect(axis.scale.maxLocked).toBe(true);
                        expect(axis.scale.minLocked).toBe(true);
                    });

                });

                describe("b) if only FixedMin, FixedLength specified - ", function() {
                    
                    beforeEach(function() {
                        options['base2AxisFixedMax'] = undefined;
                        axis = createCartContinuousAxis(options, 'base');
                        axis.bind(axis.chart.axes.base.dataCells);
                        axis.chart._setTimeSeriesAxisScale(axis);
                    });

                    afterEach(function() {

                        options['base2AxisFixedMax'] = new Date(2011,7,10);
                    });

                    it("should set the desired min, length and a calculated max for the domain; ", function() {
                        expect(axis.scale.domain()[0]).toEqual(new Date(2011,6,3));
                        expect(axis.scale.domain()[1]).toEqual(new Date(2011,6,10));
                    });

                    it("should set both min and max to Locked; ", function() {
                        expect(axis.scale.maxLocked).toBe(true);
                        expect(axis.scale.minLocked).toBe(true);
                    });
                    
                });

                describe("c) if only FixedMax, FixedLength specified - ", function() {
                    
                    beforeEach(function() {
                        options['base2AxisFixedMin'] = undefined;
                        axis = createCartContinuousAxis(options, 'base');
                        axis.bind(axis.chart.axes.base.dataCells);
                        axis.chart._setTimeSeriesAxisScale(axis);
                    });

                    afterEach(function() {

                        options['base2AxisFixedMin'] = new Date(2011,6,3);
                    });

                    it("sshould set the desired max, length and a calculated min for the domain; ", function() {
                        expect(axis.scale.domain()[0]).toEqual(new Date(2011,7,3));
                        expect(axis.scale.domain()[1]).toEqual(new Date(2011,7,10));
                    });

                    it("should set both min and max to Locked; ", function() {
                        expect(axis.scale.maxLocked).toBe(true);
                        expect(axis.scale.minLocked).toBe(true);
                    });
                    
                });

                describe("d) if all are specified - ", function() {
                    
                    beforeEach(function() {
                        axis = createCartContinuousAxis(options, 'base');
                        axis.bind(axis.chart.axes.base.dataCells);
                        axis.chart._setTimeSeriesAxisScale(axis);
                    });

                    it("should set the desired min, length and a calculated max for the domain, ignoring the specified fixed maximum; ", function() {
                        expect(axis.scale.domain()[0]).toEqual(new Date(2011,6,3));
                        expect(axis.scale.domain()[1]).toEqual(new Date(2011,6,10));
                    });

                    it("should set both min and max to Locked; ", function() {
                        expect(axis.scale.maxLocked).toBe(true);
                        expect(axis.scale.minLocked).toBe(true);
                    });
                    
                });
        
                describe("e) if only fixed length is specified - ", function() {

                    beforeEach(function() {
                        options['base2AxisFixedMin'] = undefined;
                        options['base2AxisFixedMax'] = undefined;
                        options['baseAxisDomainRoundMode'] = 'none';
                        options['base2AxisDomainRoundMode'] = 'none';
                    });

                    afterEach(function() {
                        options['base2AxisFixedMin'] = new Date(2011,6,3);
                        options['base2AxisFixedMax'] = new Date(2011,7,10);
                    });

                    describe("i) default domain align - ", function() {
                        beforeEach(function() {
                            axis = createCartContinuousAxis(options, 'base');
                            axis.bind(axis.chart.axes.base.dataCells);
                            axis.chart._setTimeSeriesAxisScale(axis);
                        });

                        it("should set the desired length and calculate a min and max for the domain; ", function() {
                            expect(axis.option('DomainAlign')).toEqual('center');
                            expect(axis.scale.domain()[1] - axis.scale.domain()[0]).toEqual(pvc.time.intervals.w);
                        });

                        it("shouldn't set min and max to Locked; ", function() {
                            expect(axis.scale.maxLocked).not.toBe(true);
                            expect(axis.scale.minLocked).not.toBe(true);
                        });

                    });


                    describe("ii) specific domain align - ", function() {

                        it("should set the desired length, set the min to the base min and calculate max; ", function() {
                            options['base2AxisDomainAlign'] = 'min';
                            axis = createCartContinuousAxis(options, 'base');
                            axis.bind(axis.chart.axes.base.dataCells);
                            axis.chart._setTimeSeriesAxisScale(axis);
                            expect(axis.scale.domain()[1] - axis.scale.domain()[0]).toEqual(pvc.time.intervals.w);
                            expect(axis.scale.domain()[0]).toEqual(axis.chart.axes.base.scale.domain()[0]);
                        });

                        
                        it("should set the desired length, set the min to the base min and calculate max; ", function() {
                            options['base2AxisDomainAlign'] = 'max';
                            axis = createCartContinuousAxis(options, 'base');
                            axis.bind(axis.chart.axes.base.dataCells);
                            axis.chart._setTimeSeriesAxisScale(axis);
                            expect(axis.scale.domain()[1] - axis.scale.domain()[0]).toEqual(pvc.time.intervals.w);
                            expect(axis.scale.domain()[1]).toEqual(axis.chart.axes.base.scale.domain()[1]);
                        });

                    });
                    
                });

            });

            describe("2) Ratio, PreserveRatio, FixedLength (and Domain Align) impact in axis state ", function() {

                var axis, options = {   'orientation'            :  'horizontal',
                                        'timeSeries'             :   true,
                                        'base2AxisRatio'         :   '100/m'
                                    };

                describe("a) Specified ratio - ", function() {

                    beforeEach(function() {
                        axis = createCartContinuousAxis(options, 'base');
                        axis.bind(axis.chart.axes.base.dataCells);
                        axis.chart._setTimeSeriesAxisScale(axis);
                        axis.setScaleRange(200);
                    });

                    it("should set the desired min and max for the domain, given a fixed range; ", function() {
                        expect((axis.scale.domain()[1]-axis.scale.domain()[0])).toEqual(2*pvc.time.intervals.m);
                    });

                    it("shouldn't set min and max to Locked; ", function() {
                        expect(axis.scale.maxLocked).not.toBe(true);
                        expect(axis.scale.minLocked).not.toBe(true);
                    });

                });

                describe("b) Unspecified ratio, PreserveRatio imposed without FixedLength - ", function() {

                    beforeEach(function() {
                        options['base2AxisRatio'] = undefined;
                        options['base2AxisPreserveRatio']  = true;
                        axis = createCartContinuousAxis(options, 'base');
                        axis.bind(axis.chart.axes.base.dataCells);
                        axis.chart._setTimeSeriesAxisScale(axis);
                        axis.setScaleRange(200);
                    });

                    it("keep the first given domain and calculate an initial ratio, saving it in the axes state; ", function() {
                        expect(axis.scale.domain()[0]).toEqual(axis.chart.axes.base.scale.domain()[0]);
                        expect(axis.scale.domain()[1]).toEqual(axis.chart.axes.base.scale.domain()[1]);
                        
                        expect(!! axis._state).toBe(true);
                        expect(axis._state.ratio).toBe(200/Math.abs(axis.scale.domain()[1]-axis.scale.domain()[0]));
                    });

                    it("shouldn't set min and max to Locked; ", function() {
                        expect(axis.scale.maxLocked).not.toBe(true);
                        expect(axis.scale.minLocked).not.toBe(true);
                    });

                });

                describe("c) Unspecified ratio, PreserveRatio imposed with FixedLength - ", function() {

                    beforeEach(function() {
                        options['base2AxisRatio'] = undefined;
                        options['base2AxisPreserveRatio']  = true;
                        options['base2AxisFixedLength']  = 'm';
                        axis = createCartContinuousAxis(options, 'base');
                        axis.bind(axis.chart.axes.base.dataCells);
                        axis.chart._setTimeSeriesAxisScale(axis);
                        axis.setScaleRange(200);
                    });

                    it("calculate an initial ratio with the given FixedLength and impose it, with precedence over FixedLength; ", function() {
                        expect(axis.scale.domain()[1]-axis.scale.domain()[0]).toEqual(pvc.time.intervals.m);
                       
                        expect(!! axis._state).toBe(true);
                        expect(axis._state.ratio).toBe(pvc.cartAxis_parseRatio('200/m'));
                    });

                    it("shouldn't set min and max to Locked; ", function() {
                        expect(axis.scale.maxLocked).not.toBe(true);
                        expect(axis.scale.minLocked).not.toBe(true);
                    });

                });

            });

            describe("3) PreserveRatio between renders ", function() {

                var options = {     'width'                  :   600,
                                    'height'                 :   400,
                                    'orientation'            :  'horizontal',
                                    'timeSeries'             :   true,
                                    'baseAxisPreserveRatio'  :   true,
                                    'preserveLayout'         :   true,
                                    'baseAxisDomainAlign'    :  'max'
                                },
                    chart   = createCartContChart(options).render(); 
                    initMin   = chart.axes.base.scale.domain()[0],
                    initMax   = chart.axes.base.scale.domain()[1],
                    initRange = chart.axes.base.scale.size,
                    initRatio = Math.abs(chart.axes.base._state.ratio);
                    
                    chart.data.add([ new cdo.Datum( chart.data, {   series   : "London"    , 
                                                                        category : "2011-10-05",
                                                                        value    : 42             }) ]);
                    chart.render(true, true, false);

                var axis = chart.axes.base; //after re-render

                it("should change domain max, since DomainAlign = 'max' and the new value is higher ", function() {                                         
                    expect(axis.scale.domain()[1]).not.toEqual(initMax);                    
                });

                it("should keep ratio ", function() {
                    //precision may bring problems ?
                    expect(initRatio).toEqual(axis._state.ratio);   
                });

                it("shouldn't set min and max to Locked; ", function() {
                    expect(axis.scale.maxLocked).not.toBe(true);
                    expect(axis.scale.minLocked).not.toBe(true);
                });

            });

        });
                
    });

    function createChart(options) {
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
        var chart = utils.createChart(pvc.BarChart, options, dataSpec);
        return chart;
    }

    function createAxis(chartOptions, axisType) {
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
        var chart = utils.createChart(pvc.BarChart, chartOptions, dataSpec);

        var Axis = pvc.visual.CartesianAxis;
        return new Axis(chart, axisType, 0);
    }

    function createCartContinuousAxis(chartOptions, axisType) {
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
        var chart = utils.createChart(pvc.LineChart, chartOptions, dataSpec);

        var Axis = pvc.visual.CartesianAxis;
        return new Axis(chart, axisType, 1);
    }

    function createCartContChart(options) {
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
        var chart = utils.createChart(pvc.LineChart, options, dataSpec);
        return chart;
    }


});

define([
    'ccc/cdo',
    'ccc/pvc',
    'ccc/def',
    'test/utils',
    'test/data-1'
], function(cdo, pvc, def, utils, datas) {

    describe('Sliding Window for cartesian charts ', function() {
        var options, chart, slidingWindow;

        beforeEach(function() {
            options = { timeSeries      : true,
                        timeSeriesFormat: "%Y-%m-%d",
                        slidingWindow   :  true  };
        });

        afterEach(function() {
            chart =
            slidingWindow =
            options = null;
        });

        it("should not be created if length unspecified; ", function() {
            chart = createChart(options, pvc.LineChart);
            expect(!!chart.slidingWindow).toBe(false);
        });

        it("should be created if length specified; ", function() {
            options['slidingWindowLength'] = 'y';
            chart = createChart(options, pvc.LineChart);
            expect(!!chart.slidingWindow).toBe(true);
        });


        describe("(1) if length specified, it", function() {

            beforeEach(function() {
                options['slidingWindowLength'] = 'y';
                slidingWindow = createSlidingWindow(options, pvc.LineChart);
                slidingWindow.initFromOptions();
            });

            it("should have the specified length ", function() {
                expect(slidingWindow.length).toEqual(pvc.time.intervals.y);
            });

            it("should have a default dimension ", function() {
                expect(slidingWindow.dimension).toEqual("category");
            });

        });


        describe("(2) if dimension specified ", function() {

            beforeEach(function() {
                options['slidingWindowLength'] = 'w';
            });

            it("should have specified dimension", function() {
                options['slidingWindowDimension']  = 'series';
                slidingWindow = createSlidingWindow(options, pvc.LineChart);
                slidingWindow.initFromOptions();
                expect(slidingWindow.dimension).toEqual(options.slidingWindowDimension);
            });

            it("should ignore invalid dimension and set default", function() {
                options['slidingWindowDimension'] = 'InvalidDimensionName';
                slidingWindow = createSlidingWindow(options, pvc.LineChart);
                slidingWindow.initFromOptions();
                expect(slidingWindow.dimension).not.toEqual(options.slidingWindowDimension);
                expect(slidingWindow.dimension).toEqual("category");
            });

        });

        describe("(3) select function", function() {
            var datum1, datum2, remove, myScoreFun,
                dummyDatum1data = { category: "2011-02-12",
                                    series:   "London",
                                    value:    45         },
                dummyDatum2data = { category: "2014-02-12",
                                    series:   "Lisbon",
                                    value:    70         };

            beforeEach(function() {
                options['slidingWindowLength'] = 'y';
            });

            describe("default", function() {

                beforeEach(function() {
                    slidingWindow = createSlidingWindow(options, pvc.LineChart);
                    slidingWindow.initFromOptions();
                    datum1 = new cdo.Datum(slidingWindow.chart.data, dummyDatum1data);
                    datum2 = new cdo.Datum(slidingWindow.chart.data, dummyDatum2data);
                    slidingWindow.chart.data.add([datum1, datum2]);
                    remove = slidingWindow.select([datum1, datum2]);
                });

                it("should remove datuns older than one year relative to the maximum datum", function() {
                    expect(remove.length).toEqual(1);
                    expect(remove[0]).toEqual(datum1);
                });

            });

            describe(" overriden with call to base - ", function() {

                beforeEach(function() {
                    mySelectFun = function(ds) { return this.base(ds); };
                    options['slidingWindowSelect'] = mySelectFun;
                    slidingWindow = createSlidingWindow(options, pvc.LineChart);
                    slidingWindow.initFromOptions();
                    datum1 = new cdo.Datum(slidingWindow.chart.data, dummyDatum1data);
                    datum2 = new cdo.Datum(slidingWindow.chart.data, dummyDatum2data);
                    slidingWindow.chart.data.add([datum1, datum2]);
                    remove = slidingWindow.select([datum1, datum2]);
                });

                it("should remove datums older than one year relative to the maximum datum", function() {
                    expect(remove.length).toEqual(1);
                    expect(remove[0]).toEqual(datum1);
                });
            });

            describe(" overriden without calling base - ", function() {

                beforeEach(function() {
                    mySelectFun = function(ds) { return []; };
                    options['slidingWindowSelect'] = mySelectFun;
                    slidingWindow = createSlidingWindow(options, pvc.LineChart);
                    slidingWindow.initFromOptions();
                    datum1 = new cdo.Datum(slidingWindow.chart.data, dummyDatum1data);
                    datum2 = new cdo.Datum(slidingWindow.chart.data, dummyDatum2data);
                    slidingWindow.chart.data.add([datum1, datum2]);
                    remove = slidingWindow.select([datum1, datum2]);
                });

                it("should not remove any datum", function() {
                    expect(remove.length).toEqual(0);
                });

            });

        });

        describe("(4) setting defaults", function() {

           beforeEach(function() {
                options['baseAxisFixedLength'] = 'w';
                slidingWindow = createSlidingWindow(options, pvc.LineChart);
                slidingWindow.initFromOptions();
                slidingWindow.setDimensionsOptions(slidingWindow.chart.data.type);
                slidingWindow.setDataFilter(slidingWindow.chart.data);
                slidingWindow.setLayoutPreservation(slidingWindow.chart);
                slidingWindow.setAxesDefaults(slidingWindow.chart);
            } );

            it("should set preserveLayout", function() {
                expect(slidingWindow.chart.options.preserveLayout).toEqual(true);
            });

            it("should set default comparer for all discrete and bound dimensions", function() {
                var complexType = slidingWindow.chart.data.type;
                complexType._dimsNames.forEach(function(mainDimName) {
                    if(slidingWindow.chart.visualRolesOf(mainDimName) &&
                       complexType.dimensions(mainDimName).isDiscrete) {
                        expect(complexType.dimensions(mainDimName)._comparer).toEqual(def.ascending);
                    }
                }, slidingWindow);
            });

            it("should set color axis PreserveMap for all color axis", function() {
                slidingWindow.chart.axesByType.color.forEach(function(axis) {
                    expect(axis.option.defaultValue('PreserveMap')).toEqual(true);
                }, slidingWindow);
            });

             it("should set slidingWindow dimension's axis FixedLength default", function() {
               var axes = slidingWindow.chart.axesList;
               axes.filter(function(axis) {
                    return axis.role.grouping.singleDimensionName == slidingWindow.dimension;
                }, this)
                .forEach(function(axis) {
                     expect(axis.option.defaultValue('FixedLength')).toEqual(this.length);
                     expect(axis.option('FixedLength')).not.toEqual(this.length);
                }, slidingWindow);
            });

        });

    });

    function createChart(options, type) {
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
        var chart = utils.createChart(type, options, dataSpec);
        return chart;
    }

    function createSlidingWindow(chartOptions, chartType) {
        var chart = createChart(chartOptions, chartType);
        var SlidingWindow = pvc.visual.SlidingWindow;
        return new SlidingWindow(chart);
    }
});

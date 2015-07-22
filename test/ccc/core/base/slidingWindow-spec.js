define([
    'ccc/cdo',
    'ccc/pvc',
    'ccc/def',
    'test/utils',
    'test/data-1'
], function(cdo, pvc, def, utils, datas) {

    describe('Sliding Window object for cartesian charts', function() {

        it("should create a sliding window options object; ", function() {
            var slidingWindow = createSlidingWindow({ timeSeries: true, timeSeriesFormat: "%Y-%m-%d", slidingWindow:true }, pvc.LineChart);
            expect(!!slidingWindow).toBe(true);
        });

        describe("1) If no options are specified: ", function() {

            var options = { timeSeries      : true,
                            timeSeriesFormat: "%Y-%m-%d",
                            slidingWindow   :  true 
                           };
            var slidingWindow = createSlidingWindow(options, pvc.LineChart);

            it("should be created with default values; ", function() {
                slidingWindow._initFromOptions();

                expect(slidingWindow.dimName).toEqual("category");
                expect(slidingWindow.interval).toEqual(Number.MAX_VALUE);
                expect(slidingWindow.score).toEqual(slidingWindow._defaultSlidingWindowScore);
                expect(slidingWindow.select).toEqual(slidingWindow._defaultSlidingWindowSelect);
            });
        });


         describe("2) If some options are specified:  ", function() {
            var options, slidingWindow;

            beforeEach(function() {
                options = { timeSeries      : true,
                            timeSeriesFormat: "%Y-%m-%d",
                            slidingWindow   :  true 
                           };
                slidingWindow = undefined;                
            });

            afterEach(function() {
                slidingWindow = undefined;
                options = undefined;
            });


            it("should be created with correct specified options", function() {
                options['slidingWindowInterval'] = 'w';
                options['slidingWindowDimName']  = 'series';
                options['slidingWindowScore'] = function(d) { return 1; } ;
                
                slidingWindow = createSlidingWindow(options, pvc.LineChart);
                slidingWindow._initFromOptions();

                expect(slidingWindow.interval).toEqual(6048e5);
                expect(slidingWindow.dimName).toEqual(options.slidingWindowDimName);
   
            });         


            it("should ignore incorrect options", function() {
                options['slidingWindowInterval'] = 'InvalidStringFormat';
                options['slidingWindowDimName']  = 'InexistentDimension';
                
                slidingWindow = createSlidingWindow(options, pvc.LineChart);
                slidingWindow._initFromOptions();

                expect(slidingWindow.interval).toEqual(Number.MAX_VALUE);
                expect(slidingWindow.dimName).not.toEqual(options.slidingWindowDimName);
   
            });

            describe(" evaluating datums", function() {
                describe(" with default scoring functions - ", function() {
                    it("should discard datuns outside interval", function() {
                        options['slidingWindowInterval'] = 'y';

                        slidingWindow = createSlidingWindow(options, pvc.LineChart);
                        slidingWindow._initFromOptions();
                        var data = slidingWindow.chart.data,
                            dimension = data.dimensions(slidingWindow.dimName);
                            datum1 = new cdo.Datum(data, {
                                            category: "2011-02-12",
                                            series:   "London",
                                            value:    45                }),
                            datum2 = new cdo.Datum(data, {
                                            category: "2014-02-12",
                                            series:   "Lisbon",
                                            value:    70                });      

                        data.add([datum1, datum2]);
                        var remove = []
                        slidingWindow.select([datum1, datum2], remove);

                        expect(slidingWindow.dimName).toEqual(dimension.name);
                        expect(slidingWindow.score(datum1)).toEqual(datum1.atoms[dimension.name].value);
                        expect(remove.length).toEqual(1);
                        expect(remove[0]).toEqual(datum1);

                    });

                    it("should discard no datum if interval is unspecified", function() {

                        slidingWindow = createSlidingWindow(options, pvc.LineChart);
                        slidingWindow._initFromOptions();
                        var data = slidingWindow.chart.data,
                            dimension = data.dimensions(slidingWindow.dimName);
                            datum1 = new cdo.Datum(data, {
                                            category: "2011-02-12",
                                            series:   "London",
                                            value:    45                }),
                            datum2 = new cdo.Datum(data, {
                                            category: "2014-02-12",
                                            series:   "Lisbon",
                                            value:    70                });      

                        data.add([datum1, datum2]);
                        var remove = [];
                        slidingWindow.select([datum1, datum2], remove);
                        
                        expect(slidingWindow.dimName).toEqual(dimension.name);
                        expect(slidingWindow.score(datum1)).toEqual(datum1.atoms[dimension.name].value);
                        expect(remove.length).toEqual(0);

                    });
                });

                describe(" with different score and select functions - ", function() {

                    var data;

                    it("should discard all datuns if scoring function always returns null", function() {
                        options['slidingWindowInterval'] = 'y';
                        options['slidingWindowScore'] = function(d) { return null; } ;

                        slidingWindow = createSlidingWindow(options, pvc.LineChart);
                        slidingWindow._initFromOptions();
                        data = slidingWindow.chart.data;
                        var dimension = data.dimensions(slidingWindow.dimName);
                            datum1 = new cdo.Datum(data, {
                                            category: "2011-02-12",
                                            series:   "London",
                                            value:    45                }),
                            datum2 = new cdo.Datum(data, {
                                            category: "2014-02-12",
                                            series:   "Lisbon",
                                            value:    70                });      

                        data.add([datum1, datum2]);
                        var remove = [];
                        slidingWindow.select([datum1, datum2], remove);

                        expect(slidingWindow.score(datum1)).toEqual(null);
                        expect(slidingWindow.score(datum2)).toEqual(null);
                        expect(remove.length).toEqual(2);
                        expect(remove[0]).toEqual(datum1);
                        expect(remove[1]).toEqual(datum2);

                    });

                    it("should ignore score if select is default and score has no meaning", function() {
                        options['slidingWindowInterval'] = 'y';
                        options['slidingWindowScore'] = function(d) { return "noMeaningScore"; } ;

                        slidingWindow = createSlidingWindow(options, pvc.LineChart);
                        slidingWindow._initFromOptions();
                        data = slidingWindow.chart.data;
                        var dimension = data.dimensions(slidingWindow.dimName);
                            datum1 = new cdo.Datum(data, {
                                            category: "2011-02-12",
                                            series:   "London",
                                            value:    45                }),
                            datum2 = new cdo.Datum(data, {
                                            category: "2014-02-12",
                                            series:   "Lisbon",
                                            value:    70                });  

                        data.add([datum1, datum2]);
                        var remove = [];
                        slidingWindow.select([datum1, datum2], remove);    

                        expect(remove.length).toEqual(0);

                    });

                });

            });       

            describe(" setting axis defaults", function() {
                it("should set axis options' defaults", function() {
                    options['slidingWindowInterval'] = 'w';
                    slidingWindow = createSlidingWindow(options, pvc.LineChart);
                    slidingWindow._initFromOptions();
                    slidingWindow.setAxisDefaults();

                    slidingWindow.chart.axesByType.color.forEach(function(axis) {
                        expect(axis.option.defaultValue('PreserveMap')).toEqual(true);
                        var dim = axis.role.grouping.firstDimension;
                        //expect(dim.comparer).toEqual(def.ascending);
                    }, slidingWindow);

                    expect(slidingWindow.chart.options.preserveLayout).toEqual(true);

                    var axes = slidingWindow.chart.axesList.filter(function(axis) {
                        var dim = axis.role.grouping.firstDimension;
                        return dim.name == this.dimName;
                    }, slidingWindow);

                    axes.forEach(function(axis) {
                         expect(axis.option.defaultValue('FixedLength')).toEqual(this.interval);
                         expect(axis.option('FixedLength')).toEqual(this.interval);
                    }, slidingWindow);

        
                });

                it("should set axis options' defaults except for fixed length", function() {
                    slidingWindow = createSlidingWindow(options, pvc.LineChart);
                    slidingWindow._initFromOptions();
                    slidingWindow.setAxisDefaults();

                    slidingWindow.chart.axesByType.color.forEach(function(axis) {
                        expect(axis.option.defaultValue('PreserveMap')).toEqual(true);
                        var dim = axis.role.grouping.firstDimension;
                        //expect(dim.comparer).toEqual(def.ascending);
                    }, slidingWindow);

                    expect(slidingWindow.chart.options.preserveLayout).toEqual(true);

                    var axes = slidingWindow.chart.axesList.filter(function(axis) {
                        var dim = axis.role.grouping.firstDimension;
                        return dim.name == this.dimName;
                    }, slidingWindow);

                    axes.forEach(function(axis) {
                         expect(axis.option.defaultValue('FixedLength')).toBe(undefined);
                         expect(axis.option('FixedLength')).toBe(undefined);
                    }, slidingWindow);

        
                });
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
define([
    'ccc/pvc',
    'ccc/def',
    'test/utils',
    'test/data-1'
], function(pvc, def, utils, datas) {

    var cdo = pvc.data;

    var When   = utils.describeTerm("when"),
        Then   = utils.describeTerm("then"),
        After  = utils.describeTerm("after"),
        With   = utils.describeTerm("with"),
        And    = utils.describeTerm("and"),
        The    = utils.describeTerm("the"),
        A      = utils.describeTerm("a"),
        Should = utils.itTerm("should");

    describe("plots -", function () {
        When("option plot2 is truthy", function() {
            And("the chart is a Bar chart", function() {
                var options = {plot2: true};
                testBarChartMainPlot(options);
                testBarChartPlot2(options);


                // Testing options plot2Series and plot2SeriesIndexes
                //   One of the requirements is that a role named series exists.
                //   The series role exists in all and only in cartesian charts.
                //   Also, currently, there's no plot2 option for non-cartesian charts.

                // Also, testing the automatic creation of the dataPart dimension.

                And([
                    "the dimension dataPart is not defined explicitly",
                    "the visual role dataPart is not bound explicitly"
                ], function() {
                    And("the options plot2Series and plot2SeriesIndexes are not specified", function() {
                        // Auto value of plot2SeriesIndexes = -1
                        The("dimension dataPart", function() {
                            Should("be defined", function() {
                                var chart = createBarChart1({
                                    plot2: true
                                });

                                expect(!!chart.data.type.dimensions('dataPart', {assertExists: false})).toBe(true);
                            });
                        });

                        The("data part value '1'", function() {
                            Should("only occur in datums having series='Lisbon'", function() {
                                var chart = createBarChart1({
                                    plot2: true
                                });

                                chart.data.datums().each(function(datum) {
                                    var series = datum.atoms.series.value;
                                    if(series === 'Lisbon') {
                                        var dataPart = datum.atoms.dataPart.value;
                                        expect(dataPart).toBe('1');
                                    }
                                });
                            });
                        });

                        The("data part value '0'", function() {
                            Should("only occur in datums NOT having series='Lisbon'", function() {
                                var chart = createBarChart1({
                                    plot2: true
                                });

                                chart.data.datums().each(function(datum) {
                                    var series = datum.atoms.series.value;
                                    if(series !== 'Lisbon') {
                                        var dataPart = datum.atoms.dataPart.value;
                                        expect(dataPart).toBe('0');
                                    }
                                });
                            });
                        });
                    });

                    And("the option plot2Series is a non-empty array", function() {
                        And("option compatVersion=1", function() {
                            The("dimension dataPart", function() {
                                Should("not be defined", function() {
                                    var chart = createBarChart1({
                                        plot2: true,
                                        plot2Series: ['Lisbon'],
                                        compatVersion: 1
                                    });

                                    expect(chart.data.type.dimensions('dataPart', {assertExists: false})).toBe(null);
                                });
                            });
                        });

                        And("option compatVersion > 1", function() {
                            The("dimension dataPart", function() {
                                Should("be defined", function() {
                                    var chart = createBarChart1({
                                        plot2: true,
                                        plot2Series: ['Lisbon'],
                                        compatVersion: 2
                                    });

                                    expect(!!chart.data.type.dimensions('dataPart', {assertExists: false})).toBe(true);
                                });

                                Should("be calculated", function() {
                                    var chart = createBarChart1({
                                        plot2: true,
                                        plot2Series: ['Lisbon'],
                                        compatVersion: 2
                                    });

                                    expect(chart.data.type.isCalculated('dataPart')).toBe(true);
                                });

                                Should("have values '0' and '1'", function() {
                                    var chart = createBarChart1({
                                        plot2: true,
                                        plot2Series: ['Lisbon'],
                                        compatVersion: 2
                                    });

                                    var dimDataPart = chart.data.dimensions('dataPart');

                                    expect(dimDataPart.atoms().length).toBe(2);
                                    expect(!!dimDataPart.atom('0')).toBe(true);
                                    expect(!!dimDataPart.atom('1')).toBe(true);
                                });
                            });
                        });
                    });

                    And([
                        "the option plot2Series is not defined",
                        "the option plot2SeriesIndexes is a non-empty array"
                    ], function() {
                        The("dimension dataPart", function() {
                            var opts = {
                                plot2: true,
                                plot2SeriesIndexes: [-1]
                            };

                            var chart = createBarChart1(opts);

                            Should("be defined", function() {
                                expect(!!chart.data.type.dimensions('dataPart', {assertExists: false})).toBe(true);
                            });

                            Should("be calculated", function() {
                                expect(chart.data.type.isCalculated('dataPart')).toBe(true);
                            });

                            Should("have values '0' and '1'", function() {
                                var dimDataPart = chart.data.dimensions('dataPart');

                                expect(dimDataPart.atoms().length).toBe(2);
                                expect(!!dimDataPart.atom('0')).toBe(true);
                                expect(!!dimDataPart.atom('1')).toBe(true);
                            });
                        });
                    });
                });
            });
        });

        When("option plot2 is falsy", function() {
            And("option plots is not specified", function() {
                And("the chart is a Bar chart", function() {
                    A("second plot is not created", function () {
                        var chart = createBarChart1({});
                        expect(chart.plotList.length).toBe(1);
                    });
                });

                // Testing the trend plot when there is no second plot
                And("option trendType=linear", function() {
                    And("the chart is a Bar chart", function() {

                        var chart = createBarChart1({
                            trendType: 'linear'
                        });
                        var trend = chart.plots.trend;

                        A("plot with name trend", function() {
                            Should("be defined", function() {
                                expect(!!trend).toBe(true);
                            });
                        });

                        The("trend plot", function() {
                            Should("be of type point and have (type) index 0", function() {
                                expect(trend.type ).toBe("point");
                                expect(trend.index).toBe(0);
                            });

                            Should("have name=trend", function() {
                                expect(trend.name).toBe("trend");
                            });

                            Should("have id=point", function() {
                                expect(trend.id).toBe("point");
                            });

                            Should("have globalIndex=1 and isMain=false", function() {
                                expect(trend.globalIndex).toBe(1);
                                expect(trend.isMain).toBe(false);
                            });

                            Should("have isInternal=true", function() {
                                expect(trend.isInternal).toBe(true);
                            });

                            Should("be accessible by the key point", function() {
                                expect(trend).toBe(chart.plots.point);
                            });

                            Should("have option DataPart=trend", function() {
                                expect(trend.option('DataPart')).toBe('trend');
                            });
                            Should("have option ColorAxis=2", function() {
                                expect(trend.option('ColorAxis')).toBe(2);
                            });
                            Should("have option OrthoAxis=1", function() {
                                expect(trend.option('OrthoAxis')).toBe(1);
                            });
                        });

                        The("dimension dataPart", function() {
                            Should("be defined", function() {
                                expect(!!chart.data.type.dimensions('dataPart', {assertExists: false})).toBe(true);
                            });

                            Should("be calculated", function() {
                                expect(chart.data.type.isCalculated('dataPart')).toBe(true);
                            });

                            Should("have values '0' and 'trend'", function() {
                                var dimDataPart = chart.data.dimensions('dataPart');

                                expect(dimDataPart.atoms().length).toBe(2);
                                expect(!!dimDataPart.atom('0')).toBe(true);
                                expect(!!dimDataPart.atom('trend')).toBe(true);
                            });
                        });
                    });
                });
            });

            And("option plots is specified", function() {
                And("the chart is a Bar chart", function() {

                    // Creating the internal "plot2" plot by using the plots option alone
                    And("option plots contains a single plot with name=plot2", function() {
                        var options = {
                            plots: [
                                {name: 'plot2'}
                            ]
                        };

                        testBarChartMainPlot(options);
                        testBarChartPlot2(options);
                    });

                    // Creating an external plot
                    And("option plots contains a single plot with type=bar, with no name", function() {
                        var chart = createBarChart1({
                            plots: [
                                {
                                    type: 'bar'
                                }
                            ]
                        });

                        A("second plot", function() {
                            Should("be defined", function() {
                                expect(chart.plotList.length).toBe(2);
                            });
                        });

                        The("second plot", function() {
                            var plot2 = chart.plotList[1];
                            Should("be of type bar", function() {
                                expect(plot2.type).toBe('bar');
                            });
                            Should("have no name", function() {
                                expect(plot2.name).toBeUndefined();
                            });
                            Should("have not be the first plot", function() {
                                expect(plot2).not.toBe(chart.plotList[0]);
                            });
                            Should("have property isInternal=false", function() {
                                expect(plot2.isInternal).toBe(false);
                            });
                            Should("have option dataPart default to '0'", function() {
                                expect(plot2.option('DataPart')).toBe('0');
                            });
                            Should("have option orthoAxis default to 1", function() {
                                expect(plot2.option('OrthoAxis')).toBe(1);
                            });
                            Should("have option colorAxis default to 1", function() {
                                expect(plot2.option('ColorAxis')).toBe(1);
                            });
                            Should("have property optionId != property id", function() {
                                expect(plot2.id).toBe("bar2");
                                expect(plot2.optionId).not.toBe("bar2");
                            });
                            Should("have property optionId with a random value", function() {
                                var chart2 = createBarChart1({
                                    plots: [
                                        {
                                            type: 'bar'
                                        }
                                    ]
                                });
                                expect(plot2.optionId).not.toBe(chart2.plotList[1].optionId);
                            });

                            // Internal plots cannot specify top-level options and extension points.
                            // (actually, local options are published as top-level options, under a randomly generated optionId prefix)
                            Should("ignore options prefixed with the plot's id in the global scope", function() {
                                var chart2 = createBarChart1({
                                    bar2DataPart: '1',
                                    plots: [
                                        {
                                            type: 'bar'
                                        }
                                    ]
                                });
                                expect(chart2.plotList[1].option('DataPart')).toBe('0');
                            });
                        });
                    });

                    And("option plots contains a single plot with type=bar and name=foo", function() {
                        var chart = createBarChart1({
                            plots: [
                                {
                                    type: 'bar',
                                    name: 'foo'
                                }
                            ]
                        });

                        The("second plot", function() {
                            var plot2 = chart.plotList[1];
                            Should("have name=foo", function() {
                                expect(plot2.name).toBe('foo');
                            });

                            // Internal plots cannot specify top-level options and extension points.
                            // (actually, local options are published as top-level options, under a randomly generated optionId prefix)
                            Should("ignore options prefixed with the plot's name in the global scope", function() {
                                var chart2 = createBarChart1({
                                    fooStacked: true,
                                    plots: [
                                        {
                                            type: 'bar',
                                            name: 'foo'
                                        }
                                    ]
                                });
                                expect(chart2.plotList[1].option('Stacked')).toBe(false);
                            });
                        });
                    });

                    And("option plots contains a single plot with type=bar and name=.", function() {
                        Should("throw an error due to invalid plot name", function () {
                            expect(function () {
                                createBarChart1({
                                    plots: [
                                        {
                                            type: 'bar',
                                            name: '.'
                                        }
                                    ]
                                });
                            }).toThrow();
                        });
                    });

                    And("option plots contains a single plot with type=bar and name=$", function() {
                        Should("throw an error due to invalid plot name", function () {
                            expect(function () {
                                createBarChart1({
                                    plots: [
                                        {
                                            type: 'bar',
                                            name: '$'
                                        }
                                    ]
                                });
                            }).toThrow();
                        });
                    });

                    // Setting options of the main plot
                    And("option plots contains a single plot with name=main", function() {
                        A("second plot", function() {
                            Should("not be defined", function() {
                                var chart = createBarChart1({
                                    plots: [
                                        {
                                            name: 'main'
                                        }
                                    ]
                                });
                                expect(chart.plotList.length).toBe(1);
                            });
                        });

                        // The default value of stacked is...
                        The("first plot", function() {
                            Should("have option stacked=false", function() {
                                var chart = createBarChart1({
                                    plots: [
                                        {
                                            name: 'main'
                                        }
                                    ]
                                });
                                expect(chart.plotList[0].option('Stacked')).toBe(false);
                            });
                        });

                        With("local option stacked=true", function() {
                            // Specifying local option takes effect
                            The("first plot", function() {
                                Should("have option stacked=true", function() {
                                    var chart = createBarChart1({
                                        plots: [
                                            {
                                                name: 'main',
                                                stacked: true
                                            }
                                        ]
                                    });
                                    expect(chart.plotList[0].option('Stacked')).toBe(true);
                                });
                            });

                            // General precedence of local options over top-level ones, for internal plots.
                            And("top-level option stacked=false", function() {
                                The("first plot", function() {
                                    Should("have option stacked=true", function() {
                                        var chart = createBarChart1({
                                            stacked: false,
                                            plots: [
                                                {
                                                    name: 'main',
                                                    stacked: true
                                                }
                                            ]
                                        });
                                        expect(chart.plotList[0].option('Stacked')).toBe(true);
                                    });
                                });
                            });

                            And("top-level option barStacked=false", function() {
                                The("first plot", function() {
                                    Should("have option stacked=true", function() {
                                        var chart = createBarChart1({
                                            barStacked: false,
                                            plots: [
                                                {
                                                    name: 'main',
                                                    stacked: true
                                                }
                                            ]
                                        });
                                        expect(chart.plotList[0].option('Stacked')).toBe(true);
                                    });
                                });
                            });

                            And("top-level option barStacked=false", function() {
                                The("first plot", function() {
                                    Should("have option stacked=true", function() {
                                        var chart = createBarChart1({
                                            barStacked: false,
                                            plots: [
                                                {
                                                    name: 'main',
                                                    stacked: true
                                                }
                                            ]
                                        });
                                        expect(chart.plotList[0].option('Stacked')).toBe(true);
                                    });
                                });
                            });
                        });

                        With("local option trendType=linear", function() {
                            A("second plot", function() {
                                Should("be defined", function() {
                                    var chart = createBarChart1({
                                        plots: [
                                            {
                                                name: 'main',
                                                trendType: 'linear'
                                            }
                                        ]
                                    });
                                    expect(chart.plotList.length).toBe(2);
                                });
                            });
                        });
                    });

                    And("option plots contains a single plot with name=trend", function() {
                        A("second plot", function() {
                            Should("not be defined", function() {
                                var chart = createBarChart1({
                                    plots: [
                                        {
                                            name: 'trend'
                                        }
                                    ]
                                });
                                expect(chart.plotList.length).toBe(1);
                            });
                        });
                    });

                    // Setting options of the trend plot
                    And("option trendType=linear", function() {
                        And("option plots contains a single plot with name=trend", function() {
                            A("second plot", function() {
                                var chart = createBarChart1({
                                    trendType: 'linear',
                                    plots: [
                                        {
                                            name: 'trend'
                                        }
                                    ]
                                });
                                Should("be defined", function() {
                                    expect(chart.plotList.length).toBe(2);
                                });
                            });

                            With("local option stacked=true", function() {
                                // Specifying local option takes effect
                                The("trend plot", function() {
                                    Should("have option stacked=true", function() {
                                        var chart = createBarChart1({
                                            trendType: 'linear',
                                            plots: [
                                                {
                                                    name: 'trend',
                                                    stacked: true
                                                }
                                            ]
                                        });
                                        expect(chart.plots.trend.option('Stacked')).toBe(true);
                                    });
                                });

                                // General precedence of local options over top-level ones, for internal plots.
                                // plotId+OptionName
                                And("top-level option pointStacked=false", function() {
                                    The("trend plot", function() {
                                        Should("have option stacked=true", function() {
                                            var chart = createBarChart1({
                                                trendType: 'linear',
                                                pointStacked: false,
                                                plots: [
                                                    {
                                                        name: 'trend',
                                                        stacked: true
                                                    }
                                                ]
                                            });
                                            expect(chart.plots.trend.option('Stacked')).toBe(true);
                                        });
                                    });
                                });
                                // Idem, for plotName+OptionName
                                And("top-level option trendStacked=false", function() {
                                    The("trend plot", function() {
                                        Should("have option stacked=true", function() {
                                            var chart = createBarChart1({
                                                trendType: 'linear',
                                                trendStacked: false,
                                                plots: [
                                                    {
                                                        name: 'trend',
                                                        stacked: true
                                                    }
                                                ]
                                            });
                                            expect(chart.plots.trend.option('Stacked')).toBe(true);
                                        });
                                    });
                                });
                            });

                            The("trend plot", function() {

                            });
                        });
                    });
                });
            });
        });
    });

    // -----------------

    function createBarChart1(options) {
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
        return utils.createChart(pvc.BarChart, options, dataSpec);
    }

    function testBarChartMainPlot(options) {
        A("first plot is created", function() {
            var chart = createBarChart1(options);

            expect(chart.plotList.length).toBeGreaterThan(0);

            var plot = chart.plotList[0];

            expect(!!plot).toBe(true);
        });

        The("first plot", function() {
            Should("be of type bar and have (type) index 0", function() {
                var chart = createBarChart1(options);

                var plot = chart.plotList[0];

                expect(!!plot).toBe(true);
                expect(plot.type ).toBe("bar");
                expect(plot.index).toBe(0);
            });

            Should("have no name, i.e. name=undefined", function() {
                var chart = createBarChart1(options);

                var plot = chart.plotList[0];
                expect(plot.name).toBeUndefined();
            });

            Should("have id=bar", function() {
                var chart = createBarChart1(options);

                var plot = chart.plotList[0];
                expect(plot.id).toBe("bar");
            });

            Should("have globalIndex=0 and isMain=true", function() {
                var chart = createBarChart1(options);

                var plot = chart.plotList[0];
                expect(plot.globalIndex).toBe(0);
                expect(plot.isMain).toBe(true);
            });

            Should("have isInternal=true", function() {
                var chart = createBarChart1(options);

                var plot = chart.plotList[0];
                expect(plot.isInternal).toBe(true);
            });

            Should("be accessible by the key bar", function() {
                var chart = createBarChart1(options);

                expect(chart.plotList[0]).toBe(chart.plots.bar);
            });

            Should("be accessible by the key main", function() {
                var chart = createBarChart1(options);

                expect(chart.plotList[0]).toBe(chart.plots.main);
            });

            Should("have its visual roles globally available without any prefix", function() {
                var chart = createBarChart1(options);
                var plot = chart.plotList[0];
                expect(plot.visualRoles.category).toBe(chart.visualRoles.category);
                expect(plot.visualRoles.series  ).toBe(chart.visualRoles.series  );
                expect(plot.visualRoles.value   ).toBe(chart.visualRoles.value   );
            });

            Should("have its visual roles globally available with the 'main.' prefix", function() {
                var chart = createBarChart1(options);
                var plot = chart.plotList[0];
                expect(plot.visualRoles.category).toBe(chart.visualRoles['main.category']);
                expect(plot.visualRoles.series  ).toBe(chart.visualRoles['main.series']  );
                expect(plot.visualRoles.value   ).toBe(chart.visualRoles['main.value']   );
            });

            Should("have its visual roles globally available with the id 'bar.' prefix", function() {
                var chart = createBarChart1(options);
                var plot = chart.plotList[0];
                expect(plot.visualRoles.category).toBe(chart.visualRoles['bar.category']);
                expect(plot.visualRoles.series  ).toBe(chart.visualRoles['bar.series']);
                expect(plot.visualRoles.value   ).toBe(chart.visualRoles['bar.value']);
            });
        });
    }

    function testBarChartPlot2(options) {
        A("second plot is created", function() {
            var chart = createBarChart1(options);

            expect(chart.plotList.length).toBeGreaterThan(1);

            var plot = chart.plotList[1];

            expect(!!plot).toBe(true);
        });

        The("second plot", function() {
            Should("be of type point and have (type) index 0", function() {
                var chart = createBarChart1(options);

                var plot = chart.plotList[1];

                expect(!!plot).toBe(true);
                expect(plot.type ).toBe("point");
                expect(plot.index).toBe(0);
            });

            Should("have name=plot2", function() {
                var chart = createBarChart1(options);

                var plot = chart.plotList[1];
                expect(plot.name).toBe("plot2");
            });

            Should("have id=point", function() {
                var chart = createBarChart1(options);

                var plot = chart.plotList[1];
                expect(plot.id).toBe("point");
            });

            Should("have globalIndex=1 and isMain=false", function() {
                var chart = createBarChart1(options);

                var plot = chart.plotList[1];
                expect(plot.globalIndex).toBe(1);
                expect(plot.isMain).toBe(false);
            });

            Should("have isInternal=true", function() {
                var chart = createBarChart1(options);

                var plot = chart.plotList[1];
                expect(plot.isInternal).toBe(true);
            });

            Should("be accessible by the key plot2", function() {
                var chart = createBarChart1(options);

                expect(chart.plotList[1]).toBe(chart.plots.plot2);
            });

            Should("be accessible by the key point", function() {
                var chart = createBarChart1(options);

                expect(chart.plotList[1]).toBe(chart.plots.point);
            });

            Should("have its visual roles globally available with the name 'plot2.' prefix", function() {
                var chart = createBarChart1(options);
                var plot = chart.plotList[1];
                expect(plot.visualRoles.category).toBe(chart.visualRoles['plot2.category']);
                expect(plot.visualRoles.series  ).toBe(chart.visualRoles['plot2.series']);
                expect(plot.visualRoles.value   ).toBe(chart.visualRoles['plot2.value']);
            });

            Should("have its visual roles globally available with the id 'point.' prefix", function() {
                var chart = createBarChart1(options);
                var plot = chart.plotList[1];
                expect(plot.visualRoles.category).toBe(chart.visualRoles['point.category']);
                expect(plot.visualRoles.series  ).toBe(chart.visualRoles['point.series']);
                expect(plot.visualRoles.value   ).toBe(chart.visualRoles['point.value']);
            });
        });
    }
});
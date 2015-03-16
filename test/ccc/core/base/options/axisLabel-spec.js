define([
    'ccc/pvc',
    'ccc/def',
    'test/utils'
], function(pvc, def, utils) {

    var When = utils.describeTerm("when"),
        And = utils.describeTerm("and"),
        Should = utils.itTerm("should");

    var dataSpec = [
            {
                resultset: [
                    ["London", "2011-06-05", 72],
                    ["London", "2011-06-12", 50],
                    ["London", "2011-06-19", 20],
                    ["London", "2011-06-26", 23],
                    ["London", "2011-07-03", 72],
                    ["London", "2011-07-10", 80],
                    ["London", "2011-07-26", 23],
                    ["London", "2011-07-31", 72],
                    ["London", "2011-08-07", 50],
                    ["London", "2011-08-14", 20],
                    ["London", "2011-08-28", 20],

                    ["Paris", "2011-06-05", 27],
                    ["Paris", "2011-06-26", 32],
                    ["Paris", "2011-07-03", 24],
                    ["Paris", "2011-07-10", 80],
                    ["Paris", "2011-07-17", 90],
                    ["Paris", "2011-07-24", 53],
                    ["Paris", "2011-07-31", 17],
                    ["Paris", "2011-08-07", 20],
                    ["Paris", "2011-08-21", 43],

                    ["Lisbon", "2011-06-12", 30],
                    ["Lisbon", "2011-07-03", 60],
                    ["Lisbon", "2011-07-10", 80],
                    ["Lisbon", "2011-07-17", 15]
                ],
                metadata: [
                    {colType: "String",  colName: "City"},
                    {colType: "String",  colName: "Date"},
                    {colType: "Numeric", colName: "Quantity"}
                ]
            },
            {
                crosstabMode: false,
                readers:      "series, category, value"
            }];

    var baseOptions = {
        width: 500,
        height: 300,
        orthoAxisDomainRoundMode: 'tick',
        orthoAxisDomainScope: 'global',
        orthoAxisGrid: false,
        orthoAxisMinorTicks: true,
        orthoAxisOffset: 0,
        orthoAxisOverlappedLabelsMode: 'hide',
        orthoAxisTicks: true,
        orthoAxisVisible: true,
        orthoAxisZeroLine: true,
        baseAxisOffset: 0,
        baseAxisOverlappedLabelsMode: 'hide',
        baseAxisTicks: true,
        baseAxisTooltipAutoContent: 'value',
        baseAxisTooltipEnabled: true,
        baseAxisVisible: true,
        xAxisLabel_textAngle: -0.7,
        yAxisLabel_textAngle: -0.7,
        yAxisLabel_text: "long text label",
        xAxisLabel_text: "long text label"
    };

    var MIN_AXIS_SIZE = 1;
    var DEF_TICK_LENGTH = 6;

    var axisTypeMap = {
        continuous: "ortho",
        discrete: "base"
    };

    var chartOrientationMap = {
        ortho: {
            x: "horizontal",
            y: "vertical"
        },
        base: {
            x: "vertical",
            y: "horizontal"
        }
    };

    describe("axisLabel", function () {
        When("axis is discrete", function() {
            testDiscreteLayout();
        });
        When("axis is continuous", function() {
            testContinuousLayout();
        });
    });

    function testDiscreteLayout() {
        And("the orientation is vertical", function() {
            testBarChart("discrete","y");
        });
        And("the orientation is horizontal", function() {
            testBarChart("discrete","x");
        });
    }

    function testContinuousLayout() {
        And("the orientation is vertical", function() {
            testBarChart("continuous","y");
        });
        And("the orientation is horizontal", function() {
            testBarChart("continuous","x");
        });
    }

    function testBarChart(axisVarType, axisOrientation) {
        var axis = axisTypeMap[axisVarType];
        testChartAxis(axis, axisOrientation);
    }

    function testChartAxis(axis, axisOrientation) {
        And("showLabels==true and showTicks==true", function() {
            Should("have overflow paddings", function() {
                buildAndTestBarChart(true, true, axis, axisOrientation, false);
            });
        });
        And("showLabels==true and showTicks==false", function() {
            Should("have overflow paddings", function() {
                buildAndTestBarChart(true, false, axis, axisOrientation, false);
            });
        });
        And("showLabels==false and showTicks==true", function() {
            Should("not have overflow paddings", function() {
                buildAndTestBarChart(false, true, axis, axisOrientation, DEF_TICK_LENGTH);
            });
        });
        And("showLabels==false and showTicks==false", function() {
            Should("not have overflow paddings", function() {
                buildAndTestBarChart(false, false, axis, axisOrientation, MIN_AXIS_SIZE);
            });
        });
    }

    function buildAndTestBarChart(showLabel, showTicks, axis, axisOrientation, res) {
        var orientation = chartOrientationMap[axis][axisOrientation];
        var barChart = new pvc.BarChart(buildOptions(showLabel, showTicks, orientation));
        barChart.setData.apply(barChart, dataSpec);
        barChart._create({});
        barChart.basePanel._create({});

        var hwCheck = axisOrientation == "x" ? "height" : "width";
        var paddings = barChart.axesPanels[axis].parent._layoutInfo.paddings;
        var overflowed = paddings.left > 0 || paddings.right > 0 || paddings.top > 0 || paddings.bottom > 0;
        if(res) {
            expect(barChart.axesPanels[axis]._layoutInfo.clientSize[hwCheck]).toBe(res);
            expect(overflowed).toBe(false);
        } else {
            expect(overflowed).toBe(true);
        }
    }

    function buildOptions(showLabels, showTicks, orientation) {
        var extendedOpts = def.create(true, baseOptions);
        if(!showLabels) {
            extendedOpts.axisLabel_visible = false;
            extendedOpts.orthoAxisLabel_visible = false;
            extendedOpts.baseAxisLabel_visible = false;
        }
        if(!showTicks) {
            extendedOpts.axisTicks = false;
            extendedOpts.orthoAxisTicks = false;
            extendedOpts.baseAxisTicks = false;
        }
        if(orientation) {
            extendedOpts.orientation = orientation;
        }
        return extendedOpts;
    }
});

define([
  'ccc/pvc',
  'ccc/def',
  'test/utils',
  'test/data-1'
], function(pvc, def, utils, datas) {



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
    });

    function createAxis(chartOptions, axisType) {
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
        var chart = utils.createChart(pvc.BarChart, chartOptions, dataSpec);

        var Axis = pvc.visual.CartesianAxis;
        return new Axis(chart, axisType, 0);
    }

});
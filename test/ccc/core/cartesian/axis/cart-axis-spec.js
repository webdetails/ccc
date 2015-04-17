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
    });

    function createChart(options) {
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
        var chart = utils.createChart(pvc.BarChart, options, dataSpec);
    }

    function createAxis(chartOptions, axisType) {
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
        var chart = utils.createChart(pvc.BarChart, chartOptions, dataSpec);

        var Axis = pvc.visual.CartesianAxis;
        return new Axis(chart, axisType, 0);
    }

});

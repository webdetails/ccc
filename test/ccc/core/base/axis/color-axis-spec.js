define([
    'ccc/cdo',
    'ccc/pvc',
    'ccc/def',
    'test/utils',
    'test/data-1'
], function(cdo, pvc, def, utils, datas) {

    describe('Color axis preserveMap option and functions: ', function() {

        it("should create a color axis with default preserveMap; ", function() {
            var axis = createColorAxis();

            expect(!!axis).toBe(true);
            expect(axis.type).toEqual('color');

            expect(axis.option.isSpecified('PreserveMap')).toBe(false);
            expect(axis.option('PreserveMap')).toEqual(false); //no default
        });

        it("should create a color axis with preserveMap specified; ", function() {
            var axis = createColorAxis({color2AxisPreserveMap: true});

            expect(axis.option.isSpecified('PreserveMap')).toBe(true);
            expect(axis.option('PreserveMap')).toEqual(true); 
        });

        it("should create a color axis and change its default to true; ", function() {
            var axis = createColorAxis();
            axis.setPreserveColorMap();

            expect(axis.option.isSpecified('PreserveMap')).toBe(false);
            expect(axis.option('PreserveMap')).toEqual(true); 
        });

        it("should save a map in the axis state ", function() {
            var axis = createColorAxis({color2AxisPreserveMap: true});
            //axis.setPreserveColorMap();
            axis.bind(axis.chart.axes.color.dataCells);
            axis.chart._setNumericAxisScale(axis);
            axis.scheme();
            axis.preserveColorMap();

            expect(!! axis._state).toBe(true);
            expect(!! axis._state.Map).toBe(true);
        });

        // TODO test effective map

        describe('Color preservation', function() {

            it("should return different colors when data changes and preserveMap is not specified", function() {
                var axis = createColorAxis();
                //axis.setPreserveColorMap();

                axis.bind(axis.chart.axes.color.dataCells);
                axis.chart._setDiscreteAxisScale(axis);

                //axis.preserveColorMap();

                //TODO test if map is kept or not

            });

        });
    });

    function createChart(options, type) {
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
        var chart = utils.createChart(type, options, dataSpec);
        return chart;
    }

    function createColorAxis(opts) {
        chartOptions = {
            dimensions: { 
                category: { 
                    valueType :  Date       , 
                    rawFormat : "%Y-%m-%d"  , 
                    format    : "%m/%d"   
                    } 
                },
            visualRoles: {
                color: 'series'
            }
        }

        chartOptions = $.extend({},chartOptions,opts);
        var chart = createChart(chartOptions, pvc.LineChart);
        var ColorAxis = pvc.visual.ColorAxis;
        return new ColorAxis(chart, 'color', 1, {}); // 1 ?
    }

});
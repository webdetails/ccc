define([
    'ccc/cdo',
    'ccc/pvc',
    'ccc/def',
    'test/utils',
    'test/data-1'
], function(cdo, pvc, def, utils, datas) {

    describe('preserve layout implementation', function() {

        it("should create a chart with preserveLayout set to false ", function() {
            var chart = createLineChart({});
            chart.render;

            expect(!! chart).toBe(true);
            expect(!! chart.options.preserveLayout).toBe(false);
            expect(chart._preserveLayout).toBe(false);
        });

        it("should create a chart with preserveLayout", function() {
            var chart = createLineChart({ preserveLayout: true });

            expect(!! chart).toBe(true);
            expect(chart.options.preserveLayout).toBe(true);

            chart.render();
            expect(chart._preserveLayout).toBe(false);  //only true on 2nd render

            chart.render(true, true, false);
            expect(chart._preserveLayout).toBe(true);  //only true on 2nd render

        });

        // TODO test if layout is kept

    });

    function createChart(options, type) {
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
        var chart = utils.createChart(type, options, dataSpec);
        return chart;
    }

    function createLineChart(opts) {
        chartOptions = {
            dimensions: { 
                category: { 
                    valueType :  Date       , 
                    rawFormat : "%Y-%m-%d"  , 
                    format    : "%m/%d"   
                    } 
                }
        }

        chartOptions = $.extend({},chartOptions,opts);

        return createChart(chartOptions, pvc.LineChart);
    }

});
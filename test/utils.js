define([
    'ccc/pvc',
    'ccc/def'
], function(pvc, def) {
    var testUtils = {};

    testUtils.loadData = function(dataSpec) {
        var chart = new pvc.BarChart();
        chart.setData.apply(chart, dataSpec);
        chart._create({});
        return chart.data;
    };

    testUtils.expectDatumValues = function(datum, map) {
        var datoms = datum.atoms;
        def.eachOwn(map, function(v, k) {
            expect(datoms[k].value).toBe(map[k]);
        });
    };

    testUtils.categoricalDataAndVisualRoles = function(dataSpec) {
        var chart = new pvc.BarChart();
        chart.setData.apply(chart, dataSpec);
        chart._create({});

        return {
            data:        chart.data,
            visualRoles: chart.visualRoles
        };
    };

    return testUtils;
});
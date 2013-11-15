pen.define('test-utils', ['cdf/lib/CCC/pvc-d1.0', 'cdf/lib/CCC/def'], function(pvc, def) {
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
    
    return testUtils;
});
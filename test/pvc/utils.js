define([
    'ccc/pvc',
    'ccc/def'
], function(pvc, def) {
    var testUtils = {};

    testUtils.loadDataOverBaseChart = function(dataSpec) {
        var chart = new pvc.BaseChart();
        chart.setData.apply(chart, dataSpec);
        chart._create({});
        return chart.data;
    };

    testUtils.loadDataOverBarChart = function(dataSpec) {
        var chart = new pvc.BaseChart();
        chart.setData.apply(chart, dataSpec);
        chart._create({});
        return chart.data;
    };

    testUtils.createBaseChart = function(options, dataSpec) {
        var chart = new pvc.BaseChart(options);
        chart.allowNoData = true;
        if(dataSpec) chart.setData.apply(chart, dataSpec);
        
        try {
            chart._create({});
        } catch(ex) {
            if(!(ex instanceof def.global.NoDataException)) {
                throw ex;
            }
        }
        
        return chart;
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

    testUtils.describeTerm = function(term) {
        function termed() {
            arguments[0] = term + " " + arguments[0];
            return describe.apply(this, arguments);
        }
        return termed;
    };

    testUtils.itTerm = function(term) {
        function termed() {
            arguments[0] = term + " " + arguments[0];
            return it.apply(this, arguments);
        }
        return termed;
    };

    return testUtils;
});
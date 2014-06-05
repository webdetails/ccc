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

    testUtils.createChart = function(Chart, options, dataSpec) {
        var chart = new Chart(options);
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

    testUtils.createBaseChart = function(options, dataSpec) {
        return testUtils.createChart(pvc.BaseChart, options, dataSpec);
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
            arguments[0] = (def.array.is(term) ? term.join(", and ") : term) + " " + arguments[0];
            return describe.apply(this, arguments);
        }
        return termed;
    };

    testUtils.itTerm = function(term) {
        function termed() {
            arguments[0] = (def.array.is(term) ? term.join(", and ") : term) + " " + arguments[0];
            return it.apply(this, arguments);
        }
        return termed;
    };

    return testUtils;
});
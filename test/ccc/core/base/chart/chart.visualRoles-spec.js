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

    function createBaseChart1(options) {
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
        return utils.createChart(pvc.BaseChart, options, dataSpec);
    }

    describe("chart.visualRoles -", function () {
        var chart = createBaseChart1({});

        The("visual role multiChart", function() {
            Should("be defined", function() {
                expect(chart.visualRoles.multiChart instanceof pvc.visual.Role).toBe(true);
            });

            Should("be accessible using the key $.multiChart", function() {
                expect(chart.visualRoles['$.multiChart']).toBe(chart.visualRoles.multiChart);
            });
        });

        The("visual role dataPart", function() {
            Should("be defined", function() {
                var chart = createBaseChart1({});
                expect(chart.visualRoles.dataPart instanceof pvc.visual.Role).toBe(true);
            });

            Should("be accessible using the key $.dataPart", function() {
                expect(chart.visualRoles['$.dataPart']).toBe(chart.visualRoles.dataPart);
            });
        });
    });
});
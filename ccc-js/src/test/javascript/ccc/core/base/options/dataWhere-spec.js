define([
    'ccc/pvc',
    'ccc/def',
    'test/utils',
    'test/data-1'
], function(pvc, def, utils, datas) {

    var When   = utils.describeTerm("when"),
        Then   = utils.describeTerm("then"),
        After  = utils.describeTerm("after"),
        With   = utils.describeTerm("with"),
        And    = utils.describeTerm("and"),
        The    = utils.describeTerm("the"),
        A      = utils.describeTerm("a"),
        Should = utils.itTerm("should");

    describe("pvc.options.dataWhere -", function () {

        When("'dataWhere' contains an always true predicate", function() {
            Should("load all rows", function() {
                var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
                var L = dataSpec[0].resultset.length;
                var chart = utils.createBaseChart({dataWhere: def.retTrue}, dataSpec);
                expect(chart.data.count()).toBe(L);
            });
        });
        
        When("'dataWhere' contains an always false predicate", function() {
            Should("load 0 rows", function() {
                var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
                var chart = utils.createBaseChart({dataWhere: def.retFalse}, dataSpec);
                expect(chart.data.count()).toBe(0);
            });
        });
        
        When("'dataWhere' contains a predicate that excludes rows with the 'London' series", function() {
            var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
            var L = dataSpec[0].resultset.length;
            var excluded = 'London';
            var where = function(datum) {
                return datum.atoms.series.value !== excluded;
            };
            var chart = utils.createBaseChart({dataWhere: where}, dataSpec);

            Should("not load all rows", function() {
                expect(chart.data.count() < L).toBe(true);
                expect(chart.data.count() > 0).toBe(true);
            });
            
            The("dimension 'series'", function() {
                Should("not contain an atom with value 'London'", function() {
                    var seriesDim = chart.data.dimensions('series');
                    expect(seriesDim.atom(excluded)).toBe(null);
                });
            });
        });
        
        When("'dataWhere' is specified", function() {
            Should("ignore 'dataOptions.where'", function() {
                var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
                var chart = utils.createBaseChart({
                    dataWhere:   def.retFalse,
                    dataOptions: {where: def.retTrue}
                }, dataSpec);
                expect(chart.data.count()).toBe(0);
            });
        });
        
        When("'dataWhere' is NOT specified", function() {
            And("'dataOptions.where' is specified", function() {
                var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
                var chart = utils.createBaseChart({
                    dataOptions: {where: def.retFalse}
                }, dataSpec);
                Then("'dataOptions.where'", function() {
                    Should("be honored", function() {
                        expect(chart.data.count()).toBe(0);
                    });
                });
            });
        });
    });
});
define([
    'ccc/cgf',
    'ccc/def',
    'test/utils'
], function(cgf, def, utils) {

    /*global describe:true, it:true, expect:true, spyOn: true*/

    var When   = utils.describeTerm("when"),
        With   = utils.describeTerm("with"),
        The    = utils.describeTerm("the"),
        Should = utils.itTerm("should");

    describe("cgf.ValueTemplate -", function() {
        When("#createElement is called", function() {
            Should("throw if it has no parent template", function() {
                var margin = new cgf.ValueTemplate();
                expect(function() {
                    margin.createElement();
                }).toThrow();
            });

            Should("not throw if it has a parent template", function() {
                var margin = new cgf.ValueTemplate();

                margin.parent = new cgf.AdhocTemplate();

                expect(function() {
                    margin.createElement();
                }).not.toThrow();
            });
        });
    });
});
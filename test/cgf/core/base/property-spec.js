define([
    'ccc/cgf',
    'ccc/def',
    'test/utils'
], function(cgf, def, utils) {

    /*global describe:true, it:true, expect:true*/

    var Should = utils.itTerm("should");

    describe("cgf.property -", function () {
        var prop1 = cgf.property('foo', Object);

        Should("be possible to create", function() {
            expect(!!prop1).toBe(true);
        });

        Should("have the specified short name", function() {
            expect(prop1.shortName).toBe('foo');
        });

        Should("have a fullName that has shortName as a prefix", function() {
            expect(prop1.fullName.substr(0, prop1.shortName.length)).toBe(prop1.shortName);
        });

        describe("function signature -", function() {
            var inst;
            beforeEach(function() {
                inst = {
                    _props: {},

                    get: function(p) { return this._props[p.fullName]; },
                    set: function(p, v) { this._props[p.fullName] = v; }
                };
            });

            Should("read an instance's value", function() {
                expect(prop1(inst)).toBeUndefined();
            });

            Should("write an instance's value and read it back using the property function itself", function() {
                var v1 = {};

                // set
                prop1(inst, v1);

                expect(prop1(inst)).toBe(v1);
            });
        });
    });
});
define([
    'ccc/pvc',
    'ccc/def'
], function(pvc, def) {

    var cdo = pvc.data;

    function itMask(mask, value, result, options) {
        it("should format «" + mask + "» with «" + value + "» as «" + result + "»", function() {
            var f = cdo.dateFormat(mask);
            if(options)
                for(var m in options)
                    f[m](options[m]);

            var r = f(value);
            expect(r).toBe(result);
        });
    }

    function describeSpecialValues(mask) {
        describe("«" + mask + "» formats null as an empty string", function() {
            itMask(mask, null, "");
        });
    }

    describe("cdo.dateFormat -", function() {
        describe("empty masks -", function() {
            describeSpecialValues("");

            describe("format proper dates like #toString()", function() {
                var date = new Date();
                var text = String(date);
                itMask("", date, text);
            });
        });

        describe("non-empty masks -", function() {
            describeSpecialValues("%m");
        });

        describe("formatting mask -", function() {
            it("can be configured", function() {
                var f = cdo.dateFormat();

                f.mask("%d");

                var date = new Date(2014, 4, 29);
                var r = f(date);
                
                expect(r).toBe(""+date.getDate());
            });

            it("can be re-configured", function() {
                var f = cdo.dateFormat();

                f.mask("%d");

                var date = new Date(2014, 4, 29);
                var r = f(date);
                
                f.mask("%m");

                r = f(date);

                expect(r).toBe("05");
            });
        });

        describe("configuration -", function() {
            // This indirectly tests def.js' configuration and factory/class convention functionality.

            describe("a just created date format", function() {
                it("should have a default undefined mask", function() {
                    var f = cdo.dateFormat();
                    expect(f.mask()).toBeUndefined();
                });
            });

            describe("setting all the properties and reading them back", function() {
                it("should obtain the set values", function() {
                    var f = cdo.dateFormat();
                    var config = {mask: "%m"};

                    def.configure(f, config);

                    expect(f.mask()).toBe(config.mask);
                });
            });

            describe("configuring the date format", function() {
                describe("with a string", function() {
                    it("should set its mask to that string", function() {
                        var f = cdo.dateFormat();
                        var mask = "%m";
                        def.configure(f, mask);
                        expect(f.mask()).toBe(mask);
                    });
                });

                describe("with another date format", function() {
                    it("should copy its properties", function() {
                        var f1 = cdo.dateFormat();
                        var f2 = cdo.dateFormat({mask: "%m"});

                        def.configure(f1, f2);

                        expect(f1.mask()).toBe(f2.mask());
                    });
                });
            });
        });
    });
});
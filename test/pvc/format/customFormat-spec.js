define([
    'ccc/pvc',
    'ccc/def'
], function(pvc, def) {

    function formatterABC(value) {
        return "ABC" + value;
    }

    function formatterCDE(value) {
        return "CDE" + value;
    }

    describe("pvc.customFormat -", function() {
        describe("formatter -", function() {
            it("can be configured", function() {
                var f = pvc.customFormat();

                f.formatter(formatterABC);

                expect(f.formatter()).toBe(formatterABC);

                var r = f("FOO");

                expect(r).toBe("ABCFOO");
            });

            it("can be re-configured", function() {
                var f = pvc.customFormat();

                f.formatter(formatterABC);

                var r = f("FOO");

                f.formatter(formatterCDE);

                r = f("FOO");

                expect(r).toBe("CDEFOO");
            });
        });

        describe("configuration -", function() {
            // This indirectly tests def.js' configuration and factory/class convention functionality.

            describe("a just created custom format", function() {
                it("should have a default formatter that formats nully values as the empty string", function() {
                    var f = pvc.customFormat();

                    expect(!f.formatter()).toBe(false);

                    expect(f(null)).toBe("");
                    expect(f(undefined)).toBe("");
                });

                it("should have a default formatter that formats non-nully values by calling toString on them", function() {
                    var f = pvc.customFormat();

                    expect(f(123)).toBe("123");
                    expect(f({toString: function() { return "QUACK!"; }})).toBe("QUACK!");
                });
            });

            describe("creating a custom format", function() {
                describe("with a function as first argument", function() {
                    it("should set its formatter function", function() {
                        var f = pvc.customFormat(formatterABC);
                        expect(f.formatter()).toBe(formatterABC);
                    });
                });
            });

            describe("configuring the custom format", function() {
                describe("with a function", function() {
                    it("should set its formatter to that function", function() {
                        var f = pvc.customFormat();

                        def.configure(f, formatterABC);
                        expect(f.formatter()).toBe(formatterABC);
                    });
                });

                describe("with another custom format", function() {
                    it("should copy its properties", function() {
                        var f1 = pvc.customFormat();
                        var f2 = pvc.customFormat().formatter(formatterABC);

                        def.configure(f1, f2);

                        expect(f1.formatter()).toBe(formatterABC);
                    });
                });
            });
        });
    });
});
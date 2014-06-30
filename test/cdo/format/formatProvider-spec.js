define([
    'ccc/pvc',
    'ccc/def'
], function(pvc, def) {

    var cdo = pvc.data;

    describe("cdo.formatProvider -", function() {

        describe("configuration -", function() {
            // This indirectly tests def.js' configuration and factory/class convention functionality.

            describe("a just created format provider", function() {
                it("should have a default number format", function() {
                    var fp = cdo.format();
                    expect(def.classOf(fp.number())).toBe(cdo.numberFormat);

                    expect(!fp.number().mask()).toBe(false);
                });

                it("should have a default percent format", function() {
                    var fp = cdo.format();
                    expect(def.classOf(fp.percent())).toBe(cdo.numberFormat);

                    expect(!fp.percent().mask()).toBe(false);
                });

                it("should have a default date format", function() {
                    var fp = cdo.format();
                    expect(def.classOf(fp.date())).toBe(cdo.dateFormat);

                    expect(!fp.date().mask()).toBe(false);
                });

                it("should have a different default number and percent formats", function() {
                    var fp = cdo.format();
                    expect(fp.percent()).not.toBe(fp.number());
                });

                it("should have a default any format", function() {
                    var fp = cdo.format();
                    var anyFormat = fp.any();

                    expect(def.classOf(anyFormat)).toBe(cdo.customFormat);

                    expect(!anyFormat.formatter()).toBe(false);
                });
            });

            describe("configuring the format provider", function() {
                describe("with another format provider", function() {
                    it("should copy its properties", function() {
                        var fp1 = cdo.format();
                        var fp2 = cdo.format({
                            number:  cdo.numberFormat(),
                            percent: cdo.numberFormat(),
                            date:    cdo.dateFormat  (),
                            any:     cdo.customFormat()
                        });

                        def.configure(fp1, fp2);

                        expect(fp1.number ()).toBe(fp2.number ());
                        expect(fp1.percent()).toBe(fp2.percent());
                        expect(fp1.date   ()).toBe(fp2.date   ());
                        expect(fp1.any    ()).toBe(fp2.any    ());
                    });
                });

                describe("with a date format", function() {
                    it("should set the date property", function() {
                        var fp = cdo.format();
                        var df = cdo.dateFormat({mask: "%m"});

                        def.configure(fp, df);

                        expect(fp.date()).toBe(df);
                    });
                });

                describe("with a number format", function() {
                    it("should set the number property", function() {
                        var fp = cdo.format();
                        var nf = cdo.numberFormat({mask: "abcd"});

                        def.configure(fp, nf);

                        expect(fp.number()).toBe(nf);
                    });

                    it("should not set the percent property", function() {
                        var fp = cdo.format();
                        var nf = cdo.numberFormat({mask: "abcd"});

                        def.configure(fp, nf);

                        expect(fp.percent()).not.toBe(nf);
                    });
                });

                describe("with a custom format", function() {
                    it("should set the any property", function() {
                        var fp = cdo.format();
                        var ff = function(v) { return String(v); };
                        var cf = cdo.customFormat(ff);

                        def.configure(fp, cf);

                        expect(fp.any()).toBe(cf);
                    });
                });

                describe("with an object", function() {
                    describe("having a string in property 'number'", function() {
                        it("should set the number property with a number format having that string as mask", function() {
                            var fp = cdo.format();
                            def.configure(fp, {number: "abcd"});

                            var nf = fp.number();
                            expect(def.is(nf, cdo.numberFormat)).toBe(true);
                            expect(nf.mask()).toBe("abcd");
                        });

                        it("should configure the mask property of a current number format", function() {
                            var fp = cdo.format();
                            var nf = cdo.numberFormat();

                            fp.number(nf);

                            def.configure(fp, {number: "abcd"});

                            expect(fp.number()).toBe(nf);
                            expect(nf.mask()).toBe("abcd");
                        });
                    });

                    describe("having a function in property 'number'", function() {
                        it("should set the number property with a custom format having that function as formatter", function() {
                            var fp = cdo.format();
                            var ff = function(v) { return String(v); };
                            def.configure(fp, {number: ff});

                            var nf = fp.number();
                            expect(def.is(nf, cdo.customFormat)).toBe(true);
                            expect(nf.formatter()).toBe(ff);
                        });

                        it("should configure the 'formatter' property of a current custom format", function() {
                            var fp = cdo.format();
                            var nf = cdo.customFormat();
                            var ff = function(v) { return String(v); };

                            fp.number(nf);

                            def.configure(fp, {number: ff});

                            expect(fp.number()).toBe(nf);
                            expect(nf.formatter()).toBe(ff);
                        });
                    });
                });
            });
        });
    });
});
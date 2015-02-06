define([
    'ccc/cdo',
    'ccc/def'
], function(cdo, def) {

    describe("cdo.format.language -", function() {

        it("Passing no arguments should return the current format provider", function() {
            var lfp = cdo.format.language();

            expect(def.classOf(lfp)).toBe(cdo.format);
            expect(lfp.languageCode).toBe('neutral');
        });

        it("When one argument is given", function() {
            it("And it is a string", function() {
                it("Should return the format provider correspondent to the specified language", function() {
                    var lfp = cdo.format.language('neutral');
                    expect(def.classOf(lfp)).toBe(cdo.format);
                    expect(lfp.number().mask()).toBe('#,0.##');

                    it("And should return 'undefined' when there is none.", function() {
                        expect(cdo.format.language('SomeLanguage')).toBe(undefined);
                    });
                });
            });

            it("And it's an object should configure multiple format providers", function() {
                var config = {
                    lang: {
                        number: {
                            mask: 'mask'
                        }
                    },
                    otherLang: {
                        number: {
                            mask: 'abcd',
                            style: {
                                currency: 'X'
                            }
                        },
                        date: {
                            mask: 'qwerty'
                        }
                    }
                };

                var langP = cdo.format.language('lang');
                var otherLangP = cdo.format.language('otherLang');

                expect(langP).not.toBe(undefined);
                expect(otherLangP).not.toBe(undefined);
                expect(langP.number().mask()).toBe('mask');
                expect(otherLangP.number().mask()).toBe('abcd');
                expect(otherLangP.number().style().currency()).toBe('X');
                expect(otherLangP.date().mask()).toBe('qwerty');
            });

            it("And it's a cdo.FormatProvider should change the current format provider and return it", function() {
                var formP = cdo.format();

                expect(cdo.format.language(formP)).toBe(formP);
            });
        });

        it("When two arguments are given", function() {
            it("Should configure the specified language and return its format provider", function() {
                var config = {
                    number: {
                        mask: 'abcd',
                        style: {
                          currency: 'X'
                        }
                    },
                    date: {
                        mask: 'qwerty'
                    }
                };

                var lfp = cdo.format.language('testLang', config);
                var testLang = cdo.format.language('testLang');

                expect(lfp).toBe(testLang);
                expect(lfp.number().mask()).toBe('abcd');
                expect(lfp.number().style().currency()).toBe('X');
                expect(lfp.date().mask()).toBe('qwerty');
            });
        });

        it("Passing more than two arguments should throw an error.", function() {
            expect(function() {
                cdo.format.language('arg1', 'arg2', 'arg3');
            }).toThrow();
        });
    });
});

/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
define([
    'ccc/cdo',
    'ccc/def'
], function(cdo, def) {

    describe("cdo.format.language -", function() {
        var defaultLanguage = 'en-us';

        it("Passing no arguments should return the current format provider", function() {
            var lfp = cdo.format.language();

            expect(def.classOf(lfp)).toBe(cdo.format);
            expect(lfp.languageCode).toBe(defaultLanguage);
        });

        describe("When one argument is given", function() {
            describe("And it is a string", function() {
                describe("Should return the format provider correspondent to the specified language", function() {
                    it("And should return the format provider for the default language when there is none.", function() {

                        var lfp = cdo.format.language(defaultLanguage);
                        expect(def.classOf(lfp)).toBe(cdo.format);
                        expect(lfp.number().mask()).toBe('#,0.##');

                        expect(cdo.format.language('SomeLanguage').languageCode).toBe(defaultLanguage);
                    });
                });
            });

            it("And it's an object should configure multiple format providers, one for each language", function() {
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

                cdo.format.language(config);

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

        describe("When two arguments are given", function() {
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
                expect(lfp.languageCode).toBe(testLang.languageCode);
                expect(lfp.number().mask()).toBe('abcd');
                expect(lfp.number().style().currency()).toBe('X');
                expect(lfp.date().mask()).toBe('qwerty');

                var lfp2 = cdo.format.language('foo-bar-extra', config);
                var fooBarExtra = cdo.format.language('foo-bar-extra');

                expect(lfp2).toBe(fooBarExtra);
                expect(lfp2.languageCode).toBe(fooBarExtra.languageCode);
                expect(lfp2.number().mask()).toBe('abcd');
                expect(lfp2.number().style().currency()).toBe('X');
                expect(lfp2.date().mask()).toBe('qwerty');
            });
        });

        it("Passing more than two arguments should throw an error.", function() {
            expect(function() {
                cdo.format.language('arg1', 'arg2', 'arg3');
            }).toThrow();
        });
    });
});

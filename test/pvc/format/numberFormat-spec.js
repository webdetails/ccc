define([
    'ccc/pvc',
    'ccc/def'
], function(pvc, def) {

    function itMask(mask, value, result, options) {
        it("should format «" + mask + "» with «" + value + "» as «" + result + "»", function() {
            var f = pvc.numberFormat(mask);
            if(options)
                for(var m in options)
                    f[m](options[m]);
           
            var r = f(value);
            expect(r).toBe(result);
        });
    }

    function describeSpecialValues(mask) {
        describe("«" + mask + "» formats null, NaN and +/- Infinity as empty strings", function() {
            itMask(mask, null,      "");
            itMask(mask, NaN,       "");
            itMask(mask, +Infinity, "");
            itMask(mask, -Infinity, "");
        });
    }

    describe("pvc.numberFormat -", function() {
        describe("empty masks -", function() {
            describeSpecialValues("");

            describe("format proper numbers like #toString()", function() {
                itMask("", -1,     "-1");
                itMask("", 0.5,    "0.5");
                itMask("", 0,      "0");
                itMask("", 1,      "1");
                itMask("", 10,     "10");
                itMask("", 100,    "100");
                itMask("", 1000,   "1000");
                itMask("", 100.12, "100.12");
            });
        });

        describe("integer masks -", function() {
            describeSpecialValues("#");

            describe("«#» rounds to 0 decimal places and outputs all significant integer digits", function() {
                itMask("#", 0,    "");
                itMask("#", 0.4,  "");
                itMask("#", 0.5,  "1");
                itMask("#", 1,    "1");
                itMask("#", 10,   "10");
                itMask("#", 1000, "1000");
            });

            describe("«0» rounds to 0 decimal places and outputs all significant integer digits, or at least one", function() {
                itMask("0", 0,    "0");
                itMask("0", 0.4,  "0");
                itMask("0", 0.5,  "1");
                itMask("0", 1,    "1");
                itMask("0", 10,   "10");
                itMask("0", 1000, "1000");
            });

            describe("«#0» is the same as «0»", function() {
                itMask("#0", 0,    "0");
                itMask("#0", 0.4,  "0");
                itMask("#0", 0.5,  "1");
                itMask("#0", 1,    "1");
                itMask("#0", 10,   "10");
                itMask("#0", 1000, "1000");
            });

            describe("«##» is the same as «#»", function() {
                itMask("##", 0,    "");
                itMask("##", 0.4,  "");
                itMask("##", 0.5,  "1");
                itMask("##", 1,    "1");
                itMask("##", 10,   "10");
                itMask("##", 1000, "1000");
            });

            describe("«0#» is the same as «00»", function() {
                itMask("0#", 0,    "00");
                itMask("0#", 0.4,  "00");
                itMask("0#", 0.5,  "01");
                itMask("0#", 1,    "01");
                itMask("0#", 10,   "10");
                itMask("0#", 1000, "1000");

                itMask("00", 0,    "00");
                itMask("00", 0.4,  "00");
                itMask("00", 0.5,  "01");
                itMask("00", 1,    "01");
                itMask("00", 10,   "10");
                itMask("00", 1000, "1000");
            });

            describe("«#:#»", function() {
                itMask("#:#", 0,    ":");
                itMask("#:#", 0.4,  ":");
                itMask("#:#", 0.5,  ":1");
                itMask("#:#", 1,    ":1");
                itMask("#:#", 10,   "1:0");
                itMask("#:#", 1000, "100:0");
            });

            describe("«#:0»", function() {
                itMask("#:0", 0,    ":0");
                itMask("#:0", 0.4,  ":0");
                itMask("#:0", 0.5,  ":1");
                itMask("#:0", 1,    ":1");
                itMask("#:0", 10,   "1:0");
                itMask("#:0", 1000, "100:0");
            });

            describe("«#:0» is not the same as «:0»", function() {
                itMask(":0", -1,    "-:1");
                itMask(":0", 0,    ":0");
                itMask(":0", 0.4,  ":0");
                itMask(":0", 0.5,  ":1");
                itMask(":0", 1,    ":1");
                itMask(":0", 10,   ":10");
                itMask(":0", 1000, ":1000");
            });
        });
        
        describe("integer padding -", function() {
            describe("can use a specified character", function() {
                itMask("0",   0,    "X", {style: {integerPad: "X"}});
                itMask("000", 1,  "XX1", {style: {integerPad: "X"}});
            });
        });

        describe("negative sign -", function() {
            describe("can use a specified character", function() {
                itMask("0", -2, "X2", {style: {negativeSign: "X"}});
            });
        });

        describe("fractional masks -", function() {
            describeSpecialValues(".#");

            describe("«.#» rounds to 1 decimal place and outputs all significant integer and fractional digits", function() {
                itMask(".#", 0,    "");
                itMask(".#", 0.4,  ".4");
                itMask(".#", 0.5,  ".5");

                describe("decimal point is only output if there's at least one actual significant digit in the value", function() {
                    itMask(".#", 1,    "1");
                    itMask(".#", 10,   "10");
                    itMask(".#", 1000, "1000");
                });

                itMask(".#", 1.2,  "1.2");
                itMask(".#", 1.24, "1.2");
                itMask(".#", 1.25, "1.3");

                describe("decimal point is ignored when in the fractional part", function() {
                    itMask("..#.", 1,    "1");
                    itMask("..#.", 10,   "10");
                    itMask("..#.", 1000, "1000");
                });

                describe("comma is ignored when in the fractional part", function() {
                    itMask(".,#,", 1,    "1");
                    itMask(".,#,", 10,   "10");
                    itMask(".,#,", 1000, "1000");
                });
            });

            describe("«.#0#» is the same as «.00#»", function() {
                itMask(".#0#", 0,      ".00");
                itMask(".#0#", 0.4,    ".40");
                itMask(".#0#", 1,      "1.00");
                itMask(".#0#", 1.2,    "1.20");
                itMask(".#0#", 1.24,   "1.24");
                itMask(".#0#", 1.254,  "1.254");
                itMask(".#0#", 1.2543, "1.254");
                itMask(".#0#", 1.2545, "1.255"); // would fail if "naive" floating point rounding were used

                itMask(".00#", 0,      ".00");
                itMask(".00#", 0.4,    ".40");
                itMask(".00#", 1,      "1.00");
                itMask(".00#", 1.2,    "1.20");
                itMask(".00#", 1.24,   "1.24");
                itMask(".00#", 1.254,  "1.254");
                itMask(".00#", 1.2543, "1.254");
                itMask(".00#", 1.2545, "1.255");
            });
        });
        
        describe("fractional padding -", function() {
            describe("can use a specified character", function() {
                itMask(".0",   0,    ".X", {style: {fractionPad: "X"}});
                itMask(".000", .1, ".1XX", {style: {fractionPad: "X"}});
            });
        });

        describe("decimal separator -", function() {
            describe("can use a specified character", function() {
                itMask("0.0",   0, "0X0", {style: {decimal: "X"}});
                itMask("0.0", 1.1, "1X1", {style: {decimal: "X"}});
            });
        });

        describe("formatting mask -", function() {
            it("can be configured", function() {
                var f = pvc.numberFormat();

                f.mask("00.0");

                var r = f(0);
                
                expect(r).toBe("00.0");
            });

            it("can be re-configured", function() {
                var f = pvc.numberFormat();

                f.mask("00.0");

                var r = f(0);
                
                f.mask("000.0");

                r = f(0);

                expect(r).toBe("000.0");
            });
        });

        describe("integer and fractional masks -", function() {
            describe("«0.##»", function() {
                 itMask("0.##", 0,     "0");
                 itMask("0.##", 0.2,   "0.2");
                 itMask("0.##", 1.2,   "1.2");
                 itMask("0.##", 1.23,  "1.23");
                 itMask("0.##", 1.235, "1.24");
                 itMask("0.##", 10,    "10");

                 itMask("0.##", -0.2,   "-0.2");
                 itMask("0.##", -1.2,   "-1.2");
                 itMask("0.##", -1.23,  "-1.23");
                 itMask("0.##", -1.235, "-1.24");
                 itMask("0.##", -10,    "-10");
            });
        });

        describe("composite masks -", function() {
            describe("A mask with positive and negative sections: «#;(#)»", function() {
                describe("A zero value uses the positive mask", function() {
                    itMask("#;(#)", 0,    "");    
                });
                describe("A positive value that rounds to zero uses the positive mask", function() {
                    itMask("#;(#)", 0.4,  "");
                });
                describe("A negative value that rounds to zero uses the positive mask", function() {
                    itMask("#;(#)", -0.4,  "");
                });
                
                describe("Other positive values", function() {
                    itMask("#;(#)", 0.5,  "1");
                    itMask("#;(#)", 1,    "1");
                    itMask("#;(#)", 10,   "10");
                });
                
                describe("Other negative values", function() {
                    itMask("#;(#)", -0.5,  "(1)");
                    itMask("#;(#)", -1,    "(1)");
                    itMask("#;(#)", -10,   "(10)");
                });
            });
            
            describe("An empty positive section «;» is not like «»; it outputs nothing ", function() {
                itMask(";", 0,  "");
                itMask(";", 1,  "");
                
                itMask(";", -1,  "");
                itMask(";", -10, "");
            });

            describe("An empty negative section uses the positive section: «#;»", function() {
                itMask("#;", 0,  "");
                itMask("#;", 1,  "1");
                
                itMask("#;", -1,  "1");
                itMask("#;", -10, "10");
            });

            describe("A mask with positive, negative and zero sections: «#;(#);ZERO»", function() {
                itMask("#;(#);ZERO", 0,    "ZERO");
                itMask("#;(#);ZERO", 0.4,  "ZERO");
                itMask("#;(#);ZERO", 0.5,  "1");
                itMask("#;(#);ZERO", 1,    "1");
                
                itMask("#;(#);ZERO", -0.4,  "ZERO");
                itMask("#;(#);ZERO", -0.5,  "(1)");
                itMask("#;(#);ZERO", -10,   "(10)");
            });

            describe("A mask with positive and negative sections, and an empty zero section: «#;(#);» uses the positive section as zero", function() {
                itMask("#;(#);", 0,    "");
                itMask("#;(#);", 0.4,  "");
                itMask("#;(#);", 0.5,  "1");
                itMask("#;(#);", 1,    "1");
                
                itMask("#;(#);", -0.4,  "");
                itMask("#;(#);", -0.5,  "(1)");
                itMask("#;(#);", -10,   "(10)");
            });

            describe("A mask with positive, negative, zero and null sections: «#;(#);ZERO;NULL»", function() {
                itMask("#;(#);ZERO;NULL", 0,    "ZERO");
                itMask("#;(#);ZERO;NULL", 0.4,  "ZERO");
                itMask("#;(#);ZERO;NULL", 0.5,  "1");
                itMask("#;(#);ZERO;NULL", 1,    "1");
                
                itMask("#;(#);ZERO;NULL", -0.4, "ZERO");
                itMask("#;(#);ZERO;NULL", -0.5, "(1)");
                itMask("#;(#);ZERO;NULL", -10,  "(10)");

                itMask("#;(#);ZERO;NULL",  null,     "NULL");

                // TODO: review this later
                itMask("#;(#);ZERO;NULL",  NaN,      "");
                itMask("#;(#);ZERO;NULL",  Infinity, "");
                itMask("#;(#);ZERO;NULL", -Infinity, "");
            });

            describe("A mask with positive, negative and zero sections, and an empty null section: «#;(#);ZERO;» outputs nulls as \"\"", function() {
                itMask("#;(#);ZERO;",  null, "");
            });

            describe("A mask with more than 4 sections", function() {
                it("should throw an error", function() {
                    var f = pvc.numberFormat("x;y;z;w;v");
                    expect(function() {
                        f(123);
                    }).toThrow();
                });
            });
        });
    
        describe("mixed text content -", function() {
            describe("text content only, does not output the number", function() {
                itMask("ABC", 0,   "ABC");
                itMask("ABC", 0.5,  "ABC");
                itMask("ABC;", -0.5,  "ABC");
            });

            describe("decimal point is only output if there's at least one actual significant digit in the value", function() {
                itMask("#-##-0.#:#", 0,     "--0:");
                itMask("#-##-0.#:#", 10,    "-1-0:");
                itMask("#-##-0.#:#", 1234,  "1-23-4:");
            });
            
            itMask("#-##-0.#:#", 0.2,   "--0.2:");
            itMask("#-##-0.#:#", 1.23,  "--1.2:3");
            itMask("#-##-0.#:#", 1.235, "--1.2:4");

            describe("excess integer significant digits are output by the leftmost 0 or #", function() {
                itMask("#-##-0.#:#", 12345,  "12-34-5:");
                itMask("xxx#-##-0.#:#", 12345,  "xxx12-34-5:");
            });

            describe("negative sign is output at the leftmost position", function() {
                itMask("xxx#-##-0.#:#", -12345,  "-xxx12-34-5:");
            });
        });

        describe("escaping with \\ -", function() {
            
            // text only does not output the number
            describe("special characters pass literally to the output", function() {
                itMask('\\#', 0.2, "#");
                itMask('\\0', 0.2, "0");
                itMask('\\.', 0.2, ".");
                itMask('\\,', 0.2, ",");
                itMask('\\;', 0.2, ";");
                itMask('\\\u00a4', 0.2, "\u00a4");
                itMask('\\%', 0.2, "%");
                itMask('\\‰', 0.2, "‰");
                itMask('\\‱', 0.2, "‱");
            });

            itMask('\\##.#', 0.2, "#.2");
        });

        describe("escaping with \"\" -", function() {
            
            describe("special characters pass literally to the output", function() {
                itMask('"#"', 0.2, "#");
                itMask('"0"', 0.2, "0");
                itMask('"."', 0.2, ".");
                itMask('","', 0.2, ",");
                itMask('";"', 0.2, ";");
                itMask('"\u00a4"', 0.2, "\u00a4");
                itMask('"%"', 0.2, "%");
                itMask('"‰"', 0.2, "‰");
                itMask('"‱"', 0.2, "‱");
            });

            describe("multiple special characters become literal", function() {
                itMask('A B "# 0 . , ; \u00a4 % ‰ ‱" 0', 1, "A B # 0 . , ; \u00a4 % ‰ ‱ 1");
            });

            describe("the escape character `\\` does not escape", function() {
                itMask('"\\"\\" 0', 1, '\\" 1');
            });

            describe("extends till the end of the mask, if the literal is not terminated", function() {
                itMask('" 0', 1, ' 0');
            });
        });

        describe("scaling with percent: %, per-mile: ‰, and per-10-mile: ‱\"\" -", function() {
            itMask('0.00%', 0.2, "20.00%");
            itMask('0.00‰', 0.2, "200.00‰");
            itMask('0.00‱', 0.2, "2000.00‱");

            itMask('%0.00', 0.2, "%20.00");
            itMask('‰0.00', 0.2, "‰200.00");
            itMask('‱0.00', 0.2, "‱2000.00");
            
            itMask('0.00\\%', 0.2, "0.20%");
            itMask('0.00\\‰', 0.2, "0.20‰");
            itMask('0.00\\‱', 0.2, "0.20‱");

            itMask('0.00%', -0.2, "-20.00%");
            itMask('0.00‰', -0.2, "-200.00‰");
            itMask('0.00‱', -0.2, "-2000.00‱");
        });

        describe("scaling with `,` -", function() {
            itMask('0,.', 1000,     "1");
            itMask('0,.', 1000000,  "1000");
            itMask('0,,.', 1000000, "1");
            
            itMask('0,.', 500, "1");
            itMask('0,.', 400, "0");
            itMask('#,.', 400, "");

            itMask('0,,.',  1500000, "2");
            itMask('0,,.#', 1500000, "1.5");

            describe("does not require an explicit decimal point", function() {
                itMask('0,', 1000,     "1");
                itMask('0,,', 1000000, "1");
                
                itMask('0,', 500, "1");
                itMask('#,', 400, "");
                itMask('0,,',  1500000, "2");
            }); 
        });

        describe("grouping with `,` -", function() {
            itMask('0,000',  1000,    "1,000");
            itMask('0,000',  1000000, "1,000,000");
            itMask('0,0-00', 1000000, "1,000,0-00");
            itMask('0,-000', 1000000, "1,000,-000");

            describe("the position of the `,` is not relevant (unless beside the dot)", function() {
                itMask('00,00',   1000, "1,000");
                itMask('000,0',   1000, "1,000");
                itMask('#,0',     1000, "1,000");
                itMask('#-,-000', 1000, "1,--000");
            });

            describe("the number of `,`s is not relevant", function() {
                itMask('0,0,,00',  1000, "1,000");
            });

            describe("a `,` not within `0` and or `#` is ignored", function() {
                itMask(',0000',  1000, "1000");
                itMask('-,-#00',  1000, "--1000");
            });

            describe("configuring the size of groups", function() {
                itMask('0,000',  1000, "10,00", {style: {groupSizes: [2]}});

                itMask('#,##0',       1,        "1", {style: {groupSizes: [2,3]}});
                itMask('#,##0',      12,       "12", {style: {groupSizes: [2,3]}});
                itMask('#,##0',     123,     "1,23", {style: {groupSizes: [2,3]}});
                itMask('#,##0',    1234,    "12,34", {style: {groupSizes: [2,3]}});
                itMask('#,##0',   12345,   "123,45", {style: {groupSizes: [2,3]}});
                itMask('#,##0',  123456, "1,234,56", {style: {groupSizes: [2,3]}});

                itMask('#,##0', 12345678901234, "123,456,789,012,34", {style: {groupSizes: [2,3]}});
                itMask('#,##0', 12345678901234, "1,2345,6789,012,34", {style: {groupSizes: [2,3,4]}});
            });

            describe("configuring the group separator", function() {
                itMask('#,##0', 1234, "1#234", {style: {group: "#"}});
                itMask('#,##0', 12345678901234, "123#456#789#012#34", {style: {groupSizes: [2,3], group: "#"}});
            });
        });

        describe("scientific notation", function() {
            describe("uses the character `e` or `E` specified in the mask", function() {
                itMask("0e0", 1, "1e0");
                itMask("0E0", 1, "1E0");
            });

            describe("marks positives exponents only if the mask is like `e+` or `E+`", function() {
                itMask("0e+0", 1, "1e+0");
                itMask("0E+0", 1, "1E+0");
            });

            describe("always marks negatives exponents", function() {
                itMask("0e+0", 0.1, "1e-1");
                itMask("0e0",  0.1, "1e-1");
                itMask("0e-0", 0.1, "1e-1");
            });

            describe("pads the exponent with as many `0`s as the mask", function() {
                itMask("0e0",   10,  "1e1");
                itMask("0e00",  10,  "1e01");
                itMask("0e000", 10,  "1e001");

                itMask("0e0",   Math.pow(10, 10), "1e10");
                itMask("0e00",  Math.pow(10, 10), "1e10");
                itMask("0e000", Math.pow(10, 10), "1e010");
            });

            describe("works fine with negative numbers", function() {
                itMask("0e+0", -0.1, "-1e-1");
                itMask("0e0",  -0.1, "-1e-1");
                itMask("0e-0", -0.1, "-1e-1");

                itMask("0e+0", -10, "-1e+1");
                itMask("0e0",  -10, "-1e1");
                itMask("0e-0", -10, "-1e1");
            });

            describe("works fine with fractional numbers, scaling, percent and rounding", function() {
                itMask("0.##e+0", 0.123,  "1.23e-1");
                itMask("0.##e+0", 0.1234, "1.23e-1");
                itMask("0.##e+0", 0.1235, "1.24e-1");
                
                itMask("0,,.##e+0",  1235, "1.24e-3");
                itMask("%0,,.##e+0", 1235, "%1.24e-1");
            });

            describe("the exponent marker can be placed anywhere in the mask", function() {
                itMask("0 (e0)", 10,  "1 (e1)");
                itMask("(e0) 0", 10,  "(e1) 1");

                itMask("0.0(e0)", 10,  "1.0(e1)");
                itMask("0.(e0)0", 10,  "1.(e1)0");
            });

            itMask("0e+00",    1, "1e+00");
            itMask("0e+00",   10, "1e+01");
            itMask("0e+00",  100, "1e+02");
            itMask("0e+00",  0.1, "1e-01");
            itMask("0e+00", 0.01, "1e-02");
        });

        describe("currency symbol -", function() {
            itMask("0\u00a4",  1, "1$");
            itMask("\u00a40",  1, "$1");
            itMask("\u00a4.0", 1, "$1.0");
            itMask(".0\u00a4", 1, "1.0$");

            describe("configuring it", function() {
                itMask("\u00a4.0", 1, "€1.0", {style: {currency: "€"}});
                itMask(".0\u00a4", 1, "1.0€", {style: {currency: "€"}});
            });

            describe("can be placed many times, anywhere", function() {
                itMask("\u00a4.0\u00a4", 1, "$1.0$");
                itMask("0\u00a40.0\u00a4", 10, "1$0.0$");
            });
        });

        // mondrian extension
        describe("currency USD", function() {
            // TODO
        });

        describe("configuration -", function() {
            // This indirectly tests def.js' configuration and factory/class convention functionality.

            describe("a just created number format", function() {
                it("should have a default undefined mask", function() {
                    var f = pvc.numberFormat();
                    expect(f.mask()).toBeUndefined();
                });

                it("should have a default inherited number style, one that is shared by all instances", function() {
                    var f1 = pvc.numberFormat();
                    var f2 = pvc.numberFormat();
                    expect(f1).not.toBe(f2);

                    var s1 = f1.style();
                    expect(!s1).toBe(false);

                    var s2 = f2.style();

                    expect(s1).toBe(s2);
                });
            });

            describe("setting the number style to a different instance", function() {
                describe("and getting the number style", function() {
                    it("should obtain the new instance", function() {
                        var f = pvc.numberFormat();
                        var s1 = f.style();

                        var s2 = pvc.numberFormatStyle();
                        expect(!s2).toBe(false);

                        expect(s1).not.toBe(s2);

                        f.style(s2);

                        expect(s2).toBe(f.style());
                    });
                });

                describe("and configuring its properties", function() {
                    it("should not affect the original instance", function() {
                        var f = pvc.numberFormat();
                        var s1 = f.style();
                        var d1 = s1.decimal();

                        var s2 = pvc.numberFormatStyle();
                        f.style(s2);

                        s2.decimal("x" + d1);

                        expect(s1.decimal()).toBe(d1);
                    });
                });

                describe("and then setting it to null", function() {
                    it("should reset the number style to the initial default style", function() {
                        var f = pvc.numberFormat();
                        var s1 = f.style();
                        var s2 = pvc.numberFormatStyle();

                        f.style(s2);
                        expect(s2).toBe(f.style());
                        f.style(null);
                        expect(s1).toBe(f.style());
                    });
                });
            });

            describe("configuring the number style through the number format, with a plain object", function() {
                it("should auto/ create a local number style that inherits from the original one", function() {
                    var f = pvc.numberFormat();
                    var s1 = f.style();

                    // Change with something unique that we can detect later.
                    var groupSizes1 = [1, 2, 3];
                    s1.groupSizes(groupSizes1);

                    var group1 = s1.group();
                    var group2 = " " + s1;
                    f.style({group: group2});

                    var s2 = f.style();

                    expect(s2).not.toBe(s1);

                    expect(s2.groupSizes()).toBe(groupSizes1);
                    expect(s2.group()).toBe(group2);
                    expect(s1.group()).toBe(group1);

                    groupSizes1 = [1, 2, 3, 4];
                    s1.groupSizes(groupSizes1);

                    expect(s2.groupSizes()).toBe(groupSizes1);
                });

                it("should preserve an already local number style", function() {
                    var f = pvc.numberFormat();
                    f.style({group: "  "});

                    var s2 = f.style();

                    f.style({group: "  "});

                    var s3 = f.style();

                    expect(s2).toBe(s3);
                });
            });

            describe("setting all the properties and reading them back", function() {
                it("should obtain the set values", function() {
                    var f = pvc.numberFormat();
                    var config = {
                        mask: "00.0",
                        style: {
                            decimal: "D",
                            group: "G",
                            groupSizes: [2, 3],
                            negativeSign: "N",
                            currency: "€",
                            integerPad: "I",
                            fractionPad: "F"
                        }
                    };

                    def.configure(f, config);

                    var configStyle = config.style;
                    var s = f.style();

                    expect(f.mask()).toBe(config.mask);
                    expect(s.decimal()).toBe(configStyle.decimal);
                    expect(s.group()).toBe(configStyle.group);
                    expect(s.groupSizes()).toEqual(configStyle.groupSizes);
                    expect(s.negativeSign()).toBe(configStyle.negativeSign);
                    expect(s.currency()).toBe(configStyle.currency);
                    expect(s.integerPad()).toBe(configStyle.integerPad);
                    expect(s.fractionPad()).toBe(configStyle.fractionPad);
                });
            });

            describe("configuring the number format", function() {
                describe("with a string", function() {
                    it("should set its mask to that string", function() {
                        var f = pvc.numberFormat();
                        var mask = "ABCD";
                        def.configure(f, mask);
                        expect(f.mask()).toBe(mask);
                    });
                });

                describe("with another number format", function() {
                    it("should copy its properties", function() {
                        var f1 = pvc.numberFormat();
                        var f2 = pvc.numberFormat({
                            mask: "00.0",
                            style: {decimal: ";"}
                        });

                        def.configure(f1, f2);

                        expect(f1.mask ()).toBe(f2.mask ());
                        expect(f1.style()).toBe(f2.style());
                    });
                });
            });
        });

        describe("localization", function() {
            // TODO ?
        });
    });
});
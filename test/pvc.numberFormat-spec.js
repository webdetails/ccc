define([
    'ccc/pvc'
], function(pvc) {

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

    describe("pvc.numberFormat", function() {
        describe("empty masks", function() {
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

        describe("integer masks:", function() {
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
        
        describe("integer padding", function() {
            describe("can use a specified character", function() {
                itMask("0",   0,    "X", {integerPad: "X"});
                itMask("000", 1,  "XX1", {integerPad: "X"});
            });
        });

        describe("negative sign", function() {
            describe("can use a specified character", function() {
                itMask("0", -2, "X2", {negativeSign: "X"});
            });
        });

        describe("fractional masks:", function() {
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
        
        describe("fractional padding", function() {
            describe("can use a specified character", function() {
                itMask(".0",   0,    ".X", {fractionPad: "X"});
                itMask(".000", .1, ".1XX", {fractionPad: "X"});
            });
        });

        describe("decimal separator", function() {
            describe("can use a specified character", function() {
                itMask("0.0",   0, "0X0", {decimal: "X"});
                itMask("0.0", 1.1, "1X1", {decimal: "X"});
            });
        });

        describe("formatting mask", function() {
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

        describe("integer and fractional masks:", function() {
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

        describe("composite masks:", function() {
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
    
        describe("mixed text content", function() {
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

        describe("escaping with \\", function() {
            
            // text only does not output the number
            describe("special characters pass literally to the output", function() {
                itMask('\\#', 0.2, "#");
                itMask('\\0', 0.2, "0");
                itMask('\\.', 0.2, ".");
                itMask('\\,', 0.2, ",");
                itMask('\\;', 0.2, ";");
                itMask('\\$', 0.2, "$");
                itMask('\\%', 0.2, "%");
                itMask('\\‰', 0.2, "‰");
                itMask('\\‱', 0.2, "‱");
            });

            itMask('\\##.#', 0.2, "#.2");
        });

        describe("escaping with \"\"", function() {
            
            describe("special characters pass literally to the output", function() {
                itMask('"#"', 0.2, "#");
                itMask('"0"', 0.2, "0");
                itMask('"."', 0.2, ".");
                itMask('","', 0.2, ",");
                itMask('";"', 0.2, ";");
                itMask('"$"', 0.2, "$");
                itMask('"%"', 0.2, "%");
                itMask('"‰"', 0.2, "‰");
                itMask('"‱"', 0.2, "‱");
            });

            describe("multiple special characters become literal", function() {
                itMask('A B "# 0 . , ; $ % ‰ ‱" 0', 1, "A B # 0 . , ; $ % ‰ ‱ 1");
            });

            describe("the escape character `\\` does not escape", function() {
                itMask('"\\"\\" 0', 1, '\\" 1');
            });

            describe("extends till the end of the mask, if the literal is not terminated", function() {
                itMask('" 0', 1, ' 0');
            });
        });

        describe("scaling with percent: %, per-mile: ‰, and per-10-mile: ‱\"\"", function() {
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

        describe("scaling with `,`", function() {
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

        describe("grouping with `,`", function() {
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
                itMask('0,000',  1000, "10,00", {groupSizes: [2]});

                itMask('#,##0',       1,        "1", {groupSizes: [2,3]});
                itMask('#,##0',      12,       "12", {groupSizes: [2,3]});
                itMask('#,##0',     123,     "1,23", {groupSizes: [2,3]});
                itMask('#,##0',    1234,    "12,34", {groupSizes: [2,3]});
                itMask('#,##0',   12345,   "123,45", {groupSizes: [2,3]});
                itMask('#,##0',  123456, "1,234,56", {groupSizes: [2,3]});

                itMask('#,##0', 12345678901234, "123,456,789,012,34", {groupSizes: [2,3]});
                itMask('#,##0', 12345678901234, "1,2345,6789,012,34", {groupSizes: [2,3,4]});
            });

            describe("configuring the group separator", function() {
                itMask('#,##0', 1234, "1#234", {group: "#"});
                itMask('#,##0', 12345678901234, "123#456#789#012#34", {groupSizes: [2,3], group: "#"});
            });
        });

        describe("scientific notation", function() {
            // TODO
        });

        describe("currency symbol", function() {
            itMask("0$",  1, "1$");
            itMask("$0",  1, "$1");
            itMask("$.0", 1, "$1.0");
            itMask(".0$", 1, "1.0$");

            describe("configuring the currency symbol", function() {
                itMask("$.0", 1, "€1.0", {currencySymbol: "€"});
                itMask(".0$", 1, "1.0€", {currencySymbol: "€"});
            });

            describe("can be placed many times, anywhere", function() {
                itMask("$.0$", 1, "$1.0$");
                itMask("0$0.0$", 10, "1$0.0$");
            });
        });

        // mondrian extension
        describe("currency USD", function() {
            // TODO
        });

        describe("configuration", function() {
            it("can be configured", function() {
                var f = pvc.numberFormat();
                var config = {
                    mask:    "00.0",
                    decimal: "D",
                    group:   "G",
                    groupSizes: [2, 3],
                    negativeSign: "N",
                    currencySymbol: "€",
                    integerPad:  "I",
                    fractionPad: "F"
                };

                f.configure(config);

                expect(f.mask()).toBe(config.mask);
                expect(f.decimal()).toBe(config.decimal);
                expect(f.group()).toBe(config.group);
                expect(f.groupSizes()).toEqual(config.groupSizes);
                expect(f.negativeSign()).toBe(config.negativeSign);
                expect(f.currencySymbol()).toBe(config.currencySymbol);
                expect(f.integerPad()).toBe(config.integerPad);
                expect(f.fractionPad()).toBe(config.fractionPad);
            });
        });

        describe("localization", function() {
            // TODO ?
        });
    });
});
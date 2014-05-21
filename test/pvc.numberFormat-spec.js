define([
    'ccc/pvc'
], function(pvc) {

    function itMask(mask, value, result) {
        it("should format «" + mask + "» with «" + value + "» as «" + result + "»", function() {
            var f = pvc.numberFormat(mask);
            var r = f(value);
            expect(r).toBe(result);
        });
    }

    function describeSpecialValues(mask) {
        describe("«" + mask + "» formats null, NaN and Infinity as empty strings", function() {
            itMask(mask, null,      "");
            itMask(mask, NaN,       "");
            itMask(mask, +Infinity, "");
            itMask(mask, -Infinity, "");
        });
    }

    describe("numberFormat", function() {
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

        // TODO: a , not between # or 0, or to the left of a `.`, is ignored.
        // ex: XxX,  ->   XxX
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

        // TODO: throws on more than 4 sections
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
            // TODO
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
        });

        describe("grouping with `,`", function() {
            itMask('0,000', 1000, "1,000");
            itMask('0,000', 1000000, "1,000,000");
            itMask('0,0-00', 1000000, "1,000,0-00");
            itMask('0,-000', 1000000, "1,000,-000");
        });

        describe("scientific notation", function() {
            // TODO
        });

        describe("currency symbol", function() {
            // TODO
        });

        describe("currency USD", function() {
            // TODO
        });

        describe("localization", function() {
            // TODO
        });
    });
});
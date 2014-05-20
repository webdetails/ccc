define([
    'ccc/pvc'
], function(pvc) {

    function itMask(mask, value, result) {
        it("Mask «" + mask + "» over «" + value + "»", function() {
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
                itMask(".#", 1,    "1");
                itMask(".#", 1.2,  "1.2");
                itMask(".#", 1.24, "1.2");
                itMask(".#", 1.25, "1.3");
                itMask(".#", 10,   "10");
                itMask(".#", 1000, "1000");
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

        describe("composite masks:", function() {
            describe("«#;(#)»", function() {
                itMask("#;(#)", 0,    "");
                itMask("#;(#)", 0.4,  "");
                itMask("#;(#)", 0.5,  "1");
                itMask("#;(#)", 1,    "1");
                itMask("#;(#)", 10,   "10");

                itMask("#;(#)", -0.4,  "");
                itMask("#;(#)", -0.5,  "(1)");
                itMask("#;(#)", -1,    "(1)");
                itMask("#;(#)", -10,   "(10)");
            });
        });
    });
});
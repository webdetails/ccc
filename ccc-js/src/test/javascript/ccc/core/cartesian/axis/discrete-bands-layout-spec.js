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
    'ccc/pvc',
    'ccc/def'
], function(pvc, def) {

    var discreteBandsLayout = pvc.visual.discreteBandsLayout;

    describe("discreteBandsLayout -", function() {

        function doLayout(options) {
            return discreteBandsLayout(
                def.get(options, 'N'),
                def.get(options, 'B'),
                def.get(options, 'Bmin'),
                def.get(options, 'Bmax'),
                def.get(options, 'E'),
                def.get(options, 'Emin'),
                def.get(options, 'Emax'),
                def.get(options, 'R'));
        }

        function expectLayout(options, expectedLayout) {
            var layoutInfo = doLayout(options);

            if('mode' in expectedLayout) {
                it("should return the mode '" + expectedLayout.mode + "'", function() {
                    expect(layoutInfo.mode).toBe(expectedLayout.mode);
                });
            }

            if('value' in expectedLayout) {
                it("should return the fixed size value " + expectedLayout.value, function() {
                    expect(layoutInfo.value).toBe(expectedLayout.value);
                });
            }

            if('min' in expectedLayout) {
                it("should return the min " + expectedLayout.min, function() {
                    expect(layoutInfo.min).toBe(expectedLayout.min);
                });
            }

            if('max' in expectedLayout) {
                it("should return the max " + expectedLayout.max, function() {
                    expect(layoutInfo.max).toBe(expectedLayout.max);
                });
            }

            if('ratio' in expectedLayout) {
                it("should return the ratio " + expectedLayout.ratio, function() {
                    expect(layoutInfo.ratio).toBe(expectedLayout.ratio);
                });
            }

            if('band' in expectedLayout) {
                it("should return the band " + expectedLayout.band, function() {
                    expect(layoutInfo.band).toBe(expectedLayout.band);
                });
            }

            if('space' in expectedLayout) {
                it("should return the space " + expectedLayout.space, function() {
                    expect(layoutInfo.space).toBe(expectedLayout.space);
                });
            }
        }

        it("should return null when given 0 categories", function() {
            expect(doLayout({N: 0})).toBe(null);
        });

        describe("1. Coerce Max with Min, and Fixed with Max and Min -", function() {
            describe("i. Bmin > Bmax is like B=Bmin -", function() {
                expectLayout({
                    N: 10,
                    Bmin: 3, Bmax: 2
                }, {
                    min:   30,
                    ratio: 1
                });
            });

            describe("ii. Emin > Emax is like E=Emin -", function() {
                expectLayout({
                    N: 10,
                    Emin: 3, Emax: 2
                }, {
                    min: 30,
                    ratio: 0
                });
            });

            describe("iii.a. B > Bmax is like B=Bmax -", function() {
                expectLayout({
                    N: 10,
                    B: 2,
                    Bmax: 1
                }, {
                    min: 10,
                    ratio: 1
                });
            });

            describe("iii.b. B < Bmin is like B=Bmin -", function() {
                expectLayout({
                    N: 10,
                    B: 2,
                    Bmin: 3
                }, {
                    min: 30,
                    ratio: 1
                });
            });

            describe("iv. Bmin = Bmax is like B=Bmin -", function() {
                expectLayout({
                    N: 10,
                    Bmin: 3, Bmax: 3
                }, {
                    min:   30,
                    ratio: 1
                });
            });

            describe("v.a. E > Emax is like E=Emax -", function() {
                expectLayout({
                    N: 10,
                    E: 2,
                    Emax: 1
                }, {
                    min: 10,
                    ratio: 0
                });
            });

            describe("v.b. E < Emin is like E=Emin -", function() {
                expectLayout({
                    N: 10,
                    E: 2,
                    Emin: 3
                }, {
                    min: 30,
                    ratio: 0
                });
            });

            describe("vi. Emin = Emax is like E=Emin -", function() {
                expectLayout({
                    N: 10,
                    Emin: 3, Emax: 3
                }, {
                    min: 30,
                    ratio: 0
                });
            });
        });

        describe("2. Fixed or Partially Fixed Layout -", function() {
            describe("ii. has B and E -", function() {
                describe("a. both zero -", function() {
                    expectLayout({
                        N: 10,
                        B: 0, E: 0,
                        R: 0.8
                    }, {
                        mode:  'rel',
                        value: undefined,
                        ratio: 0.8,
                        min:   0,
                        max:   Infinity
                    });

                    // Does not enter a loop?
                    expectLayout({
                        N: 10,
                        B: 0,
                        E: 0,
                        Bmin: 0, Bmax: 0,
                        Emin: 0, Emax: 0,
                        R: 0.8
                    }, {
                        mode:  'rel',
                        value: undefined,
                        ratio: 0.8,
                        min:   0,
                        max:   Infinity
                    });

                    expectLayout({
                        N: 10,
                        B: 0, E: 0,
                        Bmin: 0, Bmax: 2,
                        Emin: 0, Emax: 0, // E = 0
                        R: 0.8
                    }, {
                        mode:  'rel',
                        value: undefined,
                        ratio: 0.8,
                        min:   0,
                        max:   Infinity
                    });

                    expectLayout({
                        N: 10,
                        B: 0, E: 0,
                        Bmin: 0, Bmax: 0, // B = 0
                        Emin: 0, Emax: 2,
                        R: 0.8
                    }, {
                        mode:  'rel',
                        value: undefined,
                        ratio: 0.8,
                        min:   0,
                        max:   Infinity
                    });
                });

                describe("b. else - ", function() {
                    describe("both not zero -", function() {
                        expectLayout({
                            N: 10,
                            B: 1, E: 2
                        }, {
                            mode:  'abs',
                            value: 30, // N * (B + E)
                            ratio: 1/3, // B / (B + E)
                            band:  1,
                            space: 2
                        });
                    });

                    describe("B is zero, E is not zero -", function() {
                        expectLayout({
                            N: 10,
                            B: 0,
                            E: 1
                        }, {
                            mode: 'abs',
                            value: 10, // N * (B + E)
                            ratio: 0,  // B / (B + E)
                            band: 0,
                            space: 1
                        });
                    });

                    describe("B is not zero, E is zero -", function() {
                        expectLayout({
                            N: 10,
                            B: 1,
                            E: 0
                        }, {
                            mode:  'abs',
                            value: 10,
                            ratio: 1,
                            band:  1,
                            space: 0
                        });
                    });
                });
            });

            describe("iii. has B and not E -", function() {
                describe("B is not zero -", function() {
                    expectLayout({
                        N: 10,
                        B: 1
                    }, {
                        mode:  'abs',
                        value: undefined,
                        min:   10,
                        max:   Infinity,
                        ratio: 1,
                        band:  1,
                        space: undefined
                    });

                    describe("and Emin", function() {
                        expectLayout({
                            N: 10,
                            B: 1,
                            Emin: 2
                        }, {
                            mode:  'abs',
                            value: undefined,
                            min:   30,
                            max:   Infinity,
                            ratio: 1/3,
                            band:  1,
                            space: undefined
                        });
                    });

                    describe("and Emax", function() {
                        expectLayout({
                            N: 10,
                            B: 1,
                            Emax: 5
                        }, {
                            mode:  'abs',
                            value: undefined,
                            min:   10,
                            max:   60,
                            ratio: 1,
                            band:  1,
                            space: undefined
                        });
                    });

                    describe("and Emin, Emax", function() {
                        expectLayout({
                            N: 10,
                            B: 1,
                            Emin: 2,
                            Emax: 5
                        }, {
                            mode:  'abs',
                            value: undefined,
                            min:   30,
                            max:   60,
                            ratio: 1/3,
                            band:  1,
                            space: undefined
                        });
                    });
                });

                describe("B is zero -", function() {
                    expectLayout({
                        N: 10,
                        B: 0,
                        R: 0.6
                    }, {
                        mode:  'abs',
                        value: undefined,
                        min:   0,
                        max:   Infinity,
                        ratio: 0,
                        band:  0,
                        space: undefined
                    });
                });
            });

            describe("iv. has E and not B -", function() {
                describe("E is not zero - ", function() {
                    expectLayout({
                        N: 10,
                        E: 1
                    }, {
                        mode:  'abs',
                        value: undefined,
                        min:   10,
                        max:   Infinity,
                        ratio: 0,
                        band:  undefined,
                        space: 1
                    });

                    describe("and Bmin -", function() {
                        expectLayout({
                            N: 10,
                            E: 1,
                            Bmin: 2
                        }, {
                            mode:  'abs',
                            value: undefined,
                            min:   30,
                            max:   Infinity,
                            ratio: 2/3,
                            band:  undefined,
                            space: 1
                        });
                    });

                    describe("and Bmax -", function() {
                        expectLayout({
                            N: 10,
                            E: 1,
                            Bmax: 5
                        }, {
                            mode:  'abs',
                            value: undefined,
                            min:   10,
                            max:   60,
                            ratio: 0,
                            band:  undefined,
                            space: 1
                        });
                    });

                    describe("and Bmin, Bmax -", function() {
                        expectLayout({
                            N: 10,
                            E: 1,
                            Bmin: 2,
                            Bmax: 5
                        }, {
                            mode:  'abs',
                            value: undefined,
                            min:   30,
                            max:   60,
                            ratio: 2/3,
                            band:  undefined,
                            space: 1
                        });
                    });
                });

                describe("E is zero -", function() {
                    expectLayout({
                        N: 10,
                        E: 0,
                        R: 0.6
                    }, {
                        mode:  'abs',
                        value: undefined,
                        min:   0,
                        max:   Infinity,
                        ratio: 1,
                        band:  undefined,
                        space: 0
                    });
                });
            });
        });

        describe("3. Variable -", function() {
            describe("iii. At least one of the points min or max is (fully) specified -", function() {
                describe("e. The line between min and max -", function () {
                    expectLayout({
                        N: 10,
                        Bmin: 1,
                        Bmax: 2,
                        Emin: 3,
                        Emax: 4
                    }, {
                        mode: 'abs',
                        min:   40,
                        max:   60,
                        ratio: 1/4,
                        band:  1,
                        space: 3
                    });
                });

                describe("c. The line between <0,0> and min -", function () {
                    expectLayout({
                        N: 10,
                        Bmin: 1,
                        Emin: 3
                    }, {
                        mode:  'rel',
                        min:   40,
                        max:   Infinity,
                        ratio: 1/4
                    });

                    describe("d. and Bmax -", function () {
                        expectLayout({
                            N: 10,
                            Bmin: 1,
                            Emin: 3,
                            Bmax: 4
                        }, {
                            mode:  'rel',
                            min:   40,
                            max:   10 * 4 * (1 + 3/1), // N * Bmax*(1 + m) // m = Emin/Bmin
                            ratio: 1/4
                        });
                    });

                    describe("e. and Emax -", function () {
                        expectLayout({
                            N: 10,
                            Bmin: 1,
                            Emin: 3,
                            Emax: 6
                        }, {
                            mode:  'rel',
                            min:   40,
                            max:   10 * 6 * (1 + 1/3), // N * Emax * (1 + 1/m) // m = Emin/Bmin
                            ratio: 1/4
                        });
                    });
                });

                describe("d. The line between <0,0> and max -", function () {
                    expectLayout({
                        N:    10,
                        Bmax: 1,
                        Emax: 3
                    }, {
                        mode:  'rel',
                        min:   0,
                        max:   40,
                        ratio: 1/4
                    });

                    describe("d. and Bmin -", function () {
                        expectLayout({
                            N:    10,
                            Bmax: 3,
                            Emax: 9,
                            Bmin: 2
                        }, {
                            mode:  'rel',
                            min:   10 * 2 * (1 + 9/3), // N * Bmin*(1 + m) // m = Emax/Bmax
                            max:   120,
                            ratio: 1/4
                        });
                    });

                    describe("e. and Emin -", function () {
                        expectLayout({
                            N:    10,
                            Bmax: 3,
                            Emax: 9,
                            Emin: 4
                        }, {
                            mode:  'rel',
                            min:   10 * 4 * (1 + 3/9), // N * Emin * (1 + 1/m) // m = Emax/Bmax
                            max:   120,
                            ratio: 1/4
                        });
                    });
                });
            });

            describe("iv. The points min and max are both not (fully) specified -", function() {
                describe("g. Free — the points min and max are strictly not specified -", function () {
                    expectLayout({
                        N: 10,
                        R: 0.7
                    }, {
                        mode: 'rel',
                        value: undefined,
                        min:   0,
                        max:   Infinity,
                        ratio: 0.7
                    });
                });

                describe("h. The point min is strictly not specified and max is partially specified -", function () {
                    describe("a. Emax -", function () {
                        expectLayout({
                            N:    10,
                            R:    0.8,
                            Emax: 2
                        }, {
                            mode: 'rel',
                            value: undefined,
                            min:   0,
                            max:   10 * 2 * (1 + 1/(1/0.8 - 1)), // N * Emax * (1 + 1/m) // m = 1/R - 1
                            ratio: 0.8
                        });
                    });

                    describe("b. Bmax -", function () {
                        expectLayout({
                            N:    10,
                            R:    0.8,
                            Bmax: 2
                        }, {
                            mode: 'rel',
                            value: undefined,
                            min:   0,
                            max:   10 * 2 * (1 + (1/0.8 - 1)), // N * Bmax * (1 + m) // m = 1/R - 1
                            ratio: 0.8
                        });
                    });
                });

                describe("i. The point max is strictly not specified and min is partially specified -", function () {
                    describe("a. Emin -", function () {
                        expectLayout({
                            N:    10,
                            R:    0.8,
                            Emin: 2
                        }, {
                            mode: 'rel',
                            value: undefined,
                            min:   10 * 2 * (1 + 1/(1/0.8 - 1)), // N * Emin * (1 + 1/m) // m = 1/R - 1
                            max:   Infinity,
                            ratio: 0.8
                        });
                    });

                    describe("b. Bmin -", function () {
                        expectLayout({
                            N:    10,
                            R:    0.8,
                            Bmin: 2
                        }, {
                            mode: 'rel',
                            value: undefined,
                            min:   10 * 2 * (1 + (1/0.8 - 1)), // N * Bmin * (1 + m) // m = 1/R - 1
                            max:   Infinity,
                            ratio: 0.8
                        });
                    });
                });

                describe("j. The points max and min are both partially specified -", function() {
                    describe("b. The B range is fully specified -", function() {
                        expectLayout({
                            N:    10,
                            R:    0.8,
                            Bmin: 2,
                            Bmax: 4
                        }, {
                            mode: 'rel',
                            value: undefined,
                            min:   10 * 2 * (1 + (1/0.8 - 1)), // N * Bmin * (1 + m) // m = 1/R - 1,
                            max:   10 * 4 * (1 + (1/0.8 - 1)), // N * Bmax * ...
                            ratio: 0.8
                        });
                    });

                    describe("c. The E range is fully specified -", function() {
                        expectLayout({
                            N:    10,
                            R:    0.8,
                            Emin: 2,
                            Emax: 4
                        }, {
                            mode: 'rel',
                            value: undefined,
                            min:   10 * 2 * (1 + 1/(1/0.8 - 1)), // N * Emin * (1 + 1/m) // m = 1/R - 1,
                            max:   10 * 4 * (1 + 1/(1/0.8 - 1)), // N * Emax * ...
                            ratio: 0.8
                        });
                    });

                    describe("d. Crossed - The B and E ranges are partially specified - Emin,Bmax -", function() {
                        describe("b. B'min < Bmax", function() {
                            var Emin = 2;
                            var R = 0.8;
                            var m = 1/R - 1; // 0.25
                            var Bmin = Emin / m; // 8
                            var Bmax = 10; // > Bmin
                            var Emax = Bmax * m;
                            expectLayout({
                                N:    10,
                                R:    R,
                                Emin: Emin,
                                Bmax: Bmax   // > 8
                            }, {
                                mode: 'rel',
                                value: undefined,
                                min:   10 * (Emin + Bmin),
                                max:   10 * (Emax + Bmax),
                                ratio: R
                            });
                        });

                        describe("c. B'min >= Bmax -", function() {
                            var Emin = 2;
                            var R = 0.8;
                            var m = 1/R - 1; // 0.25
                            var Bmin = Emin / m; // 8
                            var Bmax = 7; // < Bmin

                            expectLayout({
                                N:    10,
                                R:    R,
                                Emin: Emin,
                                Bmax: Bmax   // < 8 // => Fixed B = Bmin, E>=Emin
                            }, {
                                mode: 'abs',
                                value: undefined,
                                min:   10 * (Emin + Bmin),
                                max:   Infinity,
                                ratio: R
                            });

                            Bmax = Bmin;

                            expectLayout({
                                N:    10,
                                R:    R,
                                Emin: Emin,
                                Bmax: Bmax   // === 8 // => Fixed B = Bmin, E>=Emin
                            }, {
                                mode: 'abs',
                                value: undefined,
                                min:   10 * (Emin + Bmin),
                                max:   Infinity,
                                ratio: R
                            });
                        });
                    });

                    describe("e. Crossed - The B and E ranges are partially specified - Bmin,Emax -", function() {
                        describe("b. E'min < Emax -", function() {
                            var Bmin = 16;
                            var R = 0.8;
                            var m = 1/R - 1; // 0.25
                            var Emin = Bmin * m; // 4
                            var Emax = 6; // > Emin
                            var Bmax = Emax / m;

                            expectLayout({
                                N:    10,
                                R:    R,
                                Bmin: Bmin,
                                Emax: Emax   // > 8
                            }, {
                                mode: 'rel',
                                value: undefined,
                                min:   10 * (Emin + Bmin),
                                max:   10 * (Emax + Bmax),
                                ratio: R
                            });
                        });

                        describe("c. E'min >= Emax -", function() {
                            var Bmin = 16;
                            var R = 0.8;
                            var m = 1/R - 1; // 0.25
                            var Emin = Bmin * m; // 4
                            var Emax = 3; // < Emin

                            expectLayout({
                                N:    10,
                                R:    R,
                                Bmin: Bmin,
                                Emax: Emax   // < 4 // => Fixed E = Emin, B>=Bmin
                            }, {
                                mode: 'abs',
                                value: undefined,
                                min:   10 * (Emin + Bmin),
                                max:   Infinity,
                                ratio: R
                            });

                            Emax = Emin;

                            expectLayout({
                                N:    10,
                                R:    R,
                                Bmin: Bmin,
                                Emax: Emax
                            }, {
                                mode: 'abs',
                                value: undefined,
                                min:   10 * (Emin + Bmin),
                                max:   Infinity,
                                ratio: R
                            });
                        });
                    });
                });
            });
        });
    });
});
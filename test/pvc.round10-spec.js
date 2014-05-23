define([
    'ccc/pvc'
], function(pvc) {

    function round10Naive(value, places) {
        var scale  = Math.pow(10, places);
        return Math.round(value * scale) / scale;
    }

    function mult10Naive(value, places) {
        return value * Math.pow(10, places);
    }

    var naiveRoundTests = [
        // Naive Fails
        {value: 35.855, places: 2, naiveResult: 35.85, result: 35.86},
        {value:  1.005, places: 2, naiveResult:  1.00, result:  1.01},
        // Both OK
        {value:  1.455, places: 2, naiveResult:  1.46, result:  1.46},
        {value:  1.454, places: 2, naiveResult:  1.45, result:  1.45}
    ];

    var naiveMultNumbers = [
        // Naive Fails
        {value: 1.2345, places: 1, naiveResult: 12.344999999999999, result: 12.345},

        // Both OK
        {value:  100,  places:  2, naiveResult:  10000, result:  10000},
        {value:  2345, places: -2, naiveResult:  23.45, result:  23.45},
        {value:  0,    places: -2, naiveResult:  0,     result:  0},
        {value:  55,   places:  0, naiveResult:  55,    result:  55}
    ];

    describe("pvc.round10", function() {
        it("should round numbers without incurring into floating point precision problems", function() {
            naiveRoundTests.forEach(function(test) {
                expect(round10Naive(test.value, test.places))
                    .toBe(test.naiveResult);

                expect(pvc.round10(test.value, test.places))
                    .toBe(test.result);
            });
        });
    });

    describe("pvc.mult10", function() {
        it("should multiply numbers by powers of 10 without incurring into floating point precision problems", function() {
            naiveMultNumbers.forEach(function(test) {
                expect(mult10Naive(test.value, test.places))
                    .toBeCloseTo(test.naiveResult, 15);

                expect(pvc.mult10(test.value, test.places))
                    .toBe(test.result);
            });
        });
    });
});
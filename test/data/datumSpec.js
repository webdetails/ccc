define(['cdf/lib/CCC/pvc-d1.0'], function(pvc) {

    describe('Datum', function() {

        it('is defined', function() {
            expect(typeof pvc.data.Datum === 'function').toBe(true);
        });

    });

});
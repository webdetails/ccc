define([
    'ccc/pvc',
    'test/utils',
    'test/data-1'
], function(pvc, utils, datas) {

    describe('Data loading', function() {
        describe('of relational data:', function() {
            var data = utils.loadDataOverBaseChart(datas['relational, first category missing on first series']);

            it('should preserve source row order', function() {
                var datums = data.datums().array();

                expect(datums.length).toBe(5);
                utils.expectDatumValues(datums[0], {series: 'London', category: 'B', value: 50});
                utils.expectDatumValues(datums[1], {series: 'London', category: 'C', value: 72});
                utils.expectDatumValues(datums[2], {series: 'Lisbon', category: 'A', value: 72});
                utils.expectDatumValues(datums[3], {series: 'Lisbon', category: 'B', value: 30});
                utils.expectDatumValues(datums[4], {series: 'Lisbon', category: 'C', value: 60});
            });

            it('should preserve the source value order, in discrete dimensions', function() {
                var atoms = data.dimensions('series').atoms();

                expect(atoms.length).toBe(2);
                expect(atoms[0].value).toBe('London');
                expect(atoms[1].value).toBe('Lisbon');

                // -------------

                atoms = data.dimensions('category').atoms();

                // AMAZE yourselves:
                expect(atoms.length).toBe(3);
                expect(atoms[0].value).toBe('B');
                expect(atoms[1].value).toBe('C');
                expect(atoms[2].value).toBe('A');
            });

            it('should ignore source value order, in favor of numeric order, in numeric dimensions', function() {
                var atoms = data.dimensions('value').atoms();

                expect(atoms.length).toBe(4);
                expect(atoms[0].value).toBe(30);
                expect(atoms[1].value).toBe(50);
                expect(atoms[2].value).toBe(60);
                expect(atoms[3].value).toBe(72);
            });
        });

        describe('of cross-tab data:', function() {
            var data = utils.loadDataOverBaseChart(datas['cross-tab, category missing on first series']);

            it('should preserve source row-major order', function() {
                var datums = data.datums().array();

                expect(datums.length).toBe(8);
                utils.expectDatumValues(datums[0], {series: 'London', category: 'A', value: null});
                utils.expectDatumValues(datums[1], {series: 'Lisbon', category: 'A', value: 72});
                utils.expectDatumValues(datums[2], {series: 'London', category: 'B', value: 50});
                utils.expectDatumValues(datums[3], {series: 'Lisbon', category: 'B', value: 30});
                utils.expectDatumValues(datums[4], {series: 'London', category: 'C', value: 72});
                utils.expectDatumValues(datums[5], {series: 'Lisbon', category: 'C', value: 60});
                utils.expectDatumValues(datums[6], {series: 'London', category: 'D', value: -30});
                utils.expectDatumValues(datums[7], {series: 'Lisbon', category: 'D', value: -5});
            });

            it('should preserve the source value order, in discrete dimensions', function() {
                var dimension = data.dimensions('series');
                var atoms = dimension.atoms();

                expect(atoms.length).toBe(2);
                expect(atoms[0].value).toBe('London');
                expect(atoms[1].value).toBe('Lisbon');

                // -------------

                atoms = data.dimensions('category').atoms();

                // AMAZE yourselves... or not
                expect(atoms.length).toBe(4);
                expect(atoms[0].value).toBe('A');
                expect(atoms[1].value).toBe('B');
                expect(atoms[2].value).toBe('C');
                expect(atoms[3].value).toBe('D');
            });

            it('should ignore source value order, in favor of numeric order, in numeric dimensions', function() {
                var atoms = data.dimensions('value').atoms();

                expect(atoms.length).toBe(7);
                expect(atoms[0].value).toBe(null);
                expect(atoms[1].value).toBe(-30);
                expect(atoms[2].value).toBe(-5);
                expect(atoms[3].value).toBe(30);
                expect(atoms[4].value).toBe(50);
                expect(atoms[5].value).toBe(60);
                expect(atoms[6].value).toBe(72);
            });
        });
    });

});
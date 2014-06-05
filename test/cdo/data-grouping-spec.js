define([
    'ccc/pvc',
    'test/utils',
    'test/data-1'
], function(pvc, utils, datas) {

    describe('Data grouping', function() {

        describe('by series and then category', function() {
            it('should create groups in the source order of each\'s first datum', function() {
                var data = utils.loadDataOverBaseChart(datas['relational, first category missing on first series']);

                var grouped = data.groupBy('series, category');

                expect(grouped.treeHeight).toBe(2);

                // London and Lisbon
                expect(grouped.childNodes.length).toBe(2);
                var londonGroup = grouped.childNodes[0];
                var lisbonGroup = grouped.childNodes[1];

                expect(londonGroup.value).toBe('London');
                expect(lisbonGroup.value).toBe('Lisbon');

                expect(londonGroup.childNodes.length).toBe(2);
                expect(lisbonGroup.childNodes.length).toBe(3);

                expect(londonGroup.childNodes[0].value).toBe('B');
                expect(londonGroup.childNodes[1].value).toBe('C');

                // AMAZE yourselves, datum order is correct:
                expect(lisbonGroup.childNodes[0].value).toBe('A');
                expect(lisbonGroup.childNodes[1].value).toBe('B');
                expect(lisbonGroup.childNodes[2].value).toBe('C');
            });

            it('should not ignore null datums for source order determination', function() {
                var data = utils.loadDataOverBaseChart(datas['relational, row 1 has series X and value null, row 2 has series Y and value not null']);

                var grouped = data.groupBy('series, category', {isNull: false});

                expect(grouped.treeHeight).toBe(2);
                expect(grouped.childNodes.length).toBe(2);
                expect(grouped.childNodes[0].value).toBe('X');
                expect(grouped.childNodes[1].value).toBe('Y');
            });
        });
    });

});
define([
    'ccc/pvc',
    'test/utils',
    'test/data-1'
], function(pvc, utils, datas) {
    describe('Dimension', function() {
        var data = utils.loadDataOverBaseChart(datas['cross-tab, category missing on first series']);

        it('should keep the dimension list aligned with the dimensions', function(){
            var dimensionList = data.dimensionsList();

            expect(dimensionList.length).toBe(3);
            expect(dimensionList[0].name).toBe('series');
            expect(dimensionList[1].name).toBe('category');
            expect(dimensionList[2].name).toBe('value');
        });

        it('should get indexes correctly', function(){
            var dimensionValue = data.dimensions("value");

            expect(dimensionValue.indexes().length).toBe(7);
            expect(dimensionValue.indexes({visible: true})[0]).toBe(0);

            data.datums().first().toggleVisible();

            expect(dimensionValue.indexes({visible: true}).length).toBe(6);
            expect(dimensionValue.indexes({visible: true})[0]).toBe(1);
        });

        it('should check if atom is visible', function(){
            var dimensionValue = data.dimensions("value");
            var atoms = dimensionValue.atoms();

            expect(dimensionValue.isVisible(atoms[0])).toBe(false);
        });

        it('should get atom for an existing value', function(){
            var dimensionValue = data.dimensions("value");

            expect(dimensionValue.atom(72)).toBe(dimensionValue.extent().max);
        });

        it('should get distinct atoms', function(){
            var dimensionValue = data.dimensions("value");
            var atoms = [dimensionValue.atom(-5), dimensionValue.atom(-30)];

            expect(dimensionValue.getDistinctAtoms([-5, -30])[0]).toBe(atoms[0]);
            expect(dimensionValue.getDistinctAtoms([-5, -30])[1]).toBe(atoms[1]);
        })

        it('should get max and min', function(){
            var dimensionValue = data.dimensions("value");

            expect(dimensionValue.extent().max.value).toBe(72);
            expect(dimensionValue.extent().min.value).toBe(-30);
            expect(dimensionValue.max().value).toBe(72);
            expect(dimensionValue.min().value).toBe(-30);

            expect(dimensionValue.extent().max).toBe(dimensionValue.max());
            expect(dimensionValue.extent().min).toBe(dimensionValue.min());
        });

        it('should get the sum of all atoms', function(){
            var dimensionValue = data.dimensions("value");

            expect(dimensionValue.sum()).toBe(72+50+30+72+60-5-30);
            expect(dimensionValue.sum({'abs': true})).toBe(72+50+30+72+60+5+30);

            //set one datum as not visible
            data.datums().last().setVisible(false);

            expect(dimensionValue.sum({'visible': true})).toBe(72+50+30+72+60-30);
            expect(dimensionValue.sum({'visible': true, 'abs': true})).toBe(72+50+30+72+60+30);

            expect(dimensionValue.sum({'visible': false})).toBe(-5);
            expect(dimensionValue.sum({'visible': false, 'abs': true})).toBe(5);

            //set one datum as visible again
            data.datums().last().toggleVisible();

            expect(dimensionValue.sum()).toBe(72+50+30+72+60-5-30);
            expect(dimensionValue.sum({'abs': true})).toBe(72+50+30+72+60+5+30);
        });

        it('should get the percentage for all atoms', function(){
            var dimensionValue = data.dimensions("value");

            expect(dimensionValue.percent(72)).toBe(72/(72+50+30+72+60+5+30));
        });

        it('should ignore the \'abs\' argument when evaluating #percent', function(){
            var dimensionValue = data.dimensions("value");

            expect(dimensionValue.percent(72, {'abs': false})).toBe(72/(72+50+30+72+60+5+30));
        });
    });
});
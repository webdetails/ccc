define([
    'ccc/pvc',
    'test/utils',
    'test/data-1'
], function(pvc, utils, datas) {
    describe('Datum', function() {
        describe("loading over BarChart", function(){
            var data = utils.loadDataOverBaseChart(datas['cross-tab, category missing on first series']);

            it("should be selected after setSelected", function(){
                var datum = data.datums().first();

                expect(datum.isSelected).toBe(false);

                datum.toggleSelected();
                expect(datum.isSelected).toBe(true);

                datum.setSelected(false);
                expect(datum.isSelected).toBe(false);
            });

            it("should be hidden after setVisible", function(){
                var datum = data.datums().first();

                expect(datum.isVisible).toBe(true);

                datum.toggleVisible();
                expect(datum.isVisible).toBe(false);

                datum.setVisible(true);
                expect(datum.isVisible).toBe(true);
            });
        });

    });
});
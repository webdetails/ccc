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
    'test/utils',
    'test/data-1'
], function(utils, datas) {
    describe('Atom', function() {
        describe("loading over BarChart", function(){
            var data = utils.loadDataOverBaseChart(datas['cross-tab, category missing on first series']);

            it("should be selected after setSelected", function(){
                var atoms = data.dimensions('series').atoms();

                expect(atoms[0].toString()).toBe("London");
                expect(atoms[1].toString()).toBe("Lisbon");
            });
        });

    });
});
/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/
define([
    'test/utils',
    'test/data-1'
], function(utils, datas) {
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

        describe("in BaseChart", function(){
            var args = datas['cross-tab, category time-series positive nulls'];

            it("should have same key and id without 'key dimension'", function(){
                var data = utils.loadDataOverBaseChart(args);
                var datum = data.datums().first();
                var generateValFun = function(data, datum) {
                     var keySep = data.keySep;
                     var value = "";
                     var length = data._dimensionsList.length - 1;
                     for( i = 0; i < length; i ++ ) {
                         var curVal = datum.atoms[[data._dimensionsList[i].name]].value;
                         value += curVal + keySep;
                     }
                     value += datum.atoms[[data._dimensionsList[length].name]].value;

                     return value;
                };

                var expectedVal = generateValFun(data, datum);
                expect(datum.key).toBe(datum.id);
                expect(datum.value).toBe(expectedVal);
                expect(datum.value).toBe(datum.rawValue);

            });

            it("should have as key only those dimensions that are marked as 'key dimension' #1", function(){
                args[1].dimensions = {
                    "category":{"isKey":true}
                };

                var data = utils.loadDataOverBaseChart(args);
                var datum = data.datums().first();
                var dimensionValue = datum.atoms["category"].value;

                var generateValFun = function(data, datum) {
                     var keySep = data.keySep;
                     var value = "";
                     var length = data._dimensionsList.length - 1;
                     for( i = 0; i < length; i ++ ) {
                         var curVal = datum.atoms[[data._dimensionsList[i].name]].value;
                         value += curVal + keySep;
                     }
                     value += datum.atoms[[data._dimensionsList[length].name]].value;

                     return value;
                };

                var expectedVal = generateValFun(data, datum);

                expect(datum.key).toBe(dimensionValue);
                expect(datum.value).toBe(expectedVal);
                expect(datum.value).toBe(datum.rawValue);
            });

            it("should have as key only those dimensions that are marked as 'key dimension' #2", function(){
                args[1].dimensions = {
                    "value":{"isKey":true}
                };

                var data = utils.loadDataOverBaseChart(args);
                var datum = data.datums().first();
                var dimensionValue = datum.atoms["value"].value;

                var generateValFun = function(data, datum) {
                     var keySep = data.keySep;
                     var value = "";
                     var length = data._dimensionsList.length - 1;
                     for( i = 0; i < length; i ++ ) {
                         var curVal = datum.atoms[[data._dimensionsList[i].name]].value;
                         value += curVal + keySep;
                     }
                     value += datum.atoms[[data._dimensionsList[length].name]].value;

                     return value;
                };

                var expectedVal = generateValFun(data, datum);

                expect(datum.key).toBe(String(dimensionValue));
                expect(datum.value).toBe(expectedVal);
                expect(datum.value).toBe(datum.rawValue);
            });

            it("should have as key only those dimensions that are marked as 'key dimension' #3", function(){
                args[1].dimensions = {
                    "category":{"isKey":true},
                    "value":{"isKey":true}
                };

                var data = utils.loadDataOverBaseChart(args);
                var datum = data.datums().first();
                var dimensionValue1 = datum.atoms["category"].value;
                var dimensionValue2 = datum.atoms["value"].value;
                var expectedKey = dimensionValue1 + data.keySep + dimensionValue2;

                var generateValFun = function(data, datum) {
                     var keySep = data.keySep;
                     var value = "";
                     var length = data._dimensionsList.length - 1;
                     for( i = 0; i < length; i ++ ) {
                         var curVal = datum.atoms[[data._dimensionsList[i].name]].value;
                         value += curVal + keySep;
                     }
                     value += datum.atoms[[data._dimensionsList[length].name]].value;

                     return value;
                };

                var expectedVal = generateValFun(data, datum);

                expect(datum.key).toBe(expectedKey);
                expect(datum.value).toBe(expectedVal);
                expect(datum.value).toBe(datum.rawValue);
            });

            it("should have as key only those dimensions that are marked as 'key dimension' #4", function(){
                args[1].dimensions = {
                    "category":{"isKey":true},
                    "series":{"isKey":true},
                    "value":{"isKey":true}
                };

                var data = utils.loadDataOverBaseChart(args);
                var datum = data.datums().first();
                var dimensionValue1 = datum.atoms["category"].value;
                var dimensionValue2 = datum.atoms["series"].value;
                var dimensionValue3 = datum.atoms["value"].value;
                var expectedKey = dimensionValue1 + data.keySep + dimensionValue2 + data.keySep + dimensionValue3;

                var generateValFun = function(data, datum) {
                     var keySep = data.keySep;
                     var value = "";
                     var length = data._dimensionsList.length - 1;
                     for( i = 0; i < length; i ++ ) {
                         var curVal = datum.atoms[[data._dimensionsList[i].name]].value;
                         value += curVal + keySep;
                     }
                     value += datum.atoms[[data._dimensionsList[length].name]].value;

                     return value;
                };

                var expectedVal = generateValFun(data, datum);

                expect(datum.key).toBe(expectedKey);
                expect(datum.value).toBe(expectedVal);
                expect(datum.value).toBe(datum.rawValue);
            });
        });
    })
});
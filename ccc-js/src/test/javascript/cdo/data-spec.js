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
    'ccc/cdo'
], function(cdo) {

    describe('Data', function() {
        var complexType = new cdo.ComplexType({
            series:   {valueType:  String},
            category: {valueType:  String},
            value:    {valueType:  Number}
        });

        describe('constructor', function() {
            it('should throw, when all of: complex type, parent and linkParent are not specified', function() {
                expect(function() {
                    new cdo.Data({type: null, parent: null, linkParent: null});
                }).toThrow();
            });

            it('should not throw, when just given a complex type', function() {
                expect(function() {
                    new cdo.Data({type: complexType});
                }).not.toThrow();
            });

            // From now on, assuming ComplexType is available somehow

            it('should return a Data instance', function() {
                // You know constructors can return a value other than `this`?

                var data = new cdo.Data({type: complexType});
                expect(data instanceof cdo.Data).toBe(true);
            });

            describe('for an root/owner Data', function() {
                it('should create an Owner Data when both parent and linkParent are not specified', function() {
                    var data = new cdo.Data({type: complexType, parent: null, linkParent: null});
                    expect(data.owner).toBe(data);
                });

                it('should have a null parent and linkParent', function() {
                    var data = new cdo.Data({type: complexType});
                    expect(data.parent).toBeNull();
                    expect(data.linkParent).toBeNull();
                });
            });

            // ...
        });

        describe("dispose", function() {
           it("should set '_dimensions' and '_dimensionsList' to null", function() {
               var data = new cdo.Data({type: complexType});

               expect(data._disposed).toBe(false);
               expect(data._dimensions).not.toBeNull();
               expect(data._dimensionsList).not.toBeNull();

               data.dispose();

               expect(data._disposed).toBe(true);
               expect(data._dimensions).toBeNull();
               expect(data._dimensionsList).toBeNull();
           })
        });

        // ...
    });
});
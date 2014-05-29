define([
    'ccc/pvc',
    'ccc/def'
], function(pvc, def) {

    describe('Data', function() {
        var complexType = new pvc.data.ComplexType({
            series:   {valueType:  String},
            category: {valueType:  String},
            value:    {valueType:  Number}
        });

        describe('constructor', function() {
            it('should throw, when all of: complex type, parent and linkParent are not specified', function() {
                expect(function() {
                    new pvc.data.Data({type: null, parent: null, linkParent: null});
                }).toThrow();
            });

            it('should not throw, when just given a complex type', function() {
                expect(function() {
                    new pvc.data.Data({type: complexType});
                }).not.toThrow();
            });

            // From now on, assuming ComplexType is available somehow

            it('should return a Data instance', function() {
                // You know constructors can return a value other than `this`?

                var data = new pvc.data.Data({type: complexType});
                expect(data instanceof pvc.data.Data).toBe(true);
            });

            describe('for an root/owner Data', function() {
                it('should create an Owner Data when both parent and linkParent are not specified', function() {
                    var data = new pvc.data.Data({type: complexType, parent: null, linkParent: null});
                    expect(data.owner).toBe(data);
                });

                it('should have a null parent and linkParent', function() {
                    var data = new pvc.data.Data({type: complexType});
                    expect(data.parent).toBeNull();
                    expect(data.linkParent).toBeNull();
                });
            });

            // ...
        });

        // ...
    });
});
define([    
    'ccc/pvc',
    'ccc/def'
], function(pvc, def) {

    describe('DimensionType', function() {
      
        var spec = {
            isHidden : true,
            valueType : Number
        }
      
        var complexType = new pvc.data.ComplexType();
        var dimensionType = new pvc.data.DimensionType(complexType, 'dimension1', spec);
      
        describe('method isHidden()', function() {
            it('expects to return true', function() {
                expect(dimensionType.isHidden).toBe(true);
            });
        });

        /* Depends solely on the specified "valueType" option.
           If you pass valueType: Boolean, String, null or Object, it will be true.
           If you pass valueType: Date, Number, it will be false. */
        describe('method isDiscreteValueType()', function() {
            it('expects to return true', function() {
                expect(dimensionType.isDiscreteValueType).toBe(false);
            });
        });
        
        /* Defaults to "isDiscreteValueType"
           unless isDiscrete option is specified in the spec. */
        describe('method isDiscrete()', function() {
            it('expects to return true', function() {
                expect(dimensionType.isDiscrete).toBe(false);
            });
        });
      
    });
});
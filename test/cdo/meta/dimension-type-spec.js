define([    
    'ccc/pvc',
    'ccc/def'
], function(pvc, def) {

    var cdo = pvc.data;

    describe('DimensionType', function() {

        var spec = {
            isHidden : true,
            valueType : Number,
            label : 'series',
            isDiscrete : true
        };
      
        var complexType = new cdo.ComplexType();
        var dimensionType = new cdo.DimensionType(complexType, 'dimension1', spec);
      
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
                expect(dimensionType.isDiscrete).toBe(true);
            });
        });
        
        describe('method valueTypeName(Boolean)', function() {
          it('should be Boolean', function() {
              expect(cdo.DimensionType.valueTypeName(Boolean)).toBe('Boolean');
          });
        });
        
        describe('method valueTypeName(Number)', function() {
          it('should be Number', function() {
              expect(cdo.DimensionType.valueTypeName(Number)).toBe('Number');
          });
        });
        
        describe('method dimensionGroupName(series1234)', function() {
          it('should be series1234', function() {
              expect(cdo.DimensionType.dimensionGroupName('series1234')).toBe('series');
          });
        });
        
        describe('method cdo.DimensionType.extendSpec()', function() {
          it('should extend with the label new_dimension', function() {
              var spec = {
                  label : 'new_dimension'
              }
              var newDimension = cdo.DimensionType.extendSpec('dimension2', spec);
              expect(newDimension.label).toBe('new_dimension');
          });
        });
        
        describe('method cdo.DimensionType.cast.Number(1)', function() {
          it('should return 1000', function() {
              expect(cdo.DimensionType.cast.Number('1000')).toBe(1000);
          });
        });
        
        describe('property label', function() {
            it('shuld be series', function() {
                expect(dimensionType.label).toBe('series');
            });
        });

        describe('property name', function() {
            it('should be dimension1', function() {
                expect(dimensionType.name).toBe('dimension1');
            });
        });

        describe('property group', function() {
            it('should be dimension', function() {
                expect(dimensionType.group).toBe('dimension');
            });
        });
        
        describe('property valueTypeName', function() {
            it('should be Number', function() {
                expect(dimensionType.valueTypeName).toBe('Number');
            });
        });
    });
});
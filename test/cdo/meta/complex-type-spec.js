define([    
    'ccc/pvc',
    'ccc/def'
], function(pvc, def) {

    var cdo = pvc.data;

    describe('ComplexType', function() {
      
        var complexType = new cdo.ComplexType();
        var dimType1 = complexType.addDimension('dimension1');
        var dimType2 = complexType.addDimension('dimension2');
        var dimType3 = complexType.addDimension('series1');
      
        describe('method dimensionsList()', function() {
            it('should return an array', function() {
                expect(complexType.dimensionsList() instanceof Array).toBe(true);
            });

            it('should return as many dimensions as defined', function() {
                expect(complexType.dimensionsList().length).toBe(3);
            });

            it('should return the defined dimensions and in definition order', function() {
                var dimList = complexType.dimensionsList();
                expect(dimList[0]).toBe(dimType1);
                expect(dimList[1]).toBe(dimType2);
                expect(dimList[2]).toBe(dimType3);
            });
        });
        
        describe('method dimensionsNames()', function() {
            it('should return 2 dimensions named dimension1 and dimension2', function() {
                expect(complexType.dimensionsNames()[0]).toBe('dimension1');
                expect(complexType.dimensionsNames()[1]).toBe('dimension2');
            });
        });
        
        describe('method dimensions()', function() {
            it('should return 1 dimension named dimension1', function() {
                expect(complexType.dimensions('dimension1')).not.toBe(null);
            });
        });
        
        /* The group name is taken to be the name of the dimension
           without any suffix numbers. If the name of a dimension type 
           is 'dimension1', then its default group is 'dimension'. */
        describe('method groupDimensions()', function() {
            it('should return 2 dimensions for group dimension', function() {
                expect(complexType.groupDimensions('dimension').length).toBe(2);
            });
            it('should return 1 dimension for group series', function() {
              expect(complexType.groupDimensions('series').length).toBe(1);
          });
        });
        
        describe('method groupDimensionsNames()', function() {
            it('should return 2 dimensions named dimension1 and dimension2', function() {
                expect(complexType.groupDimensionsNames('dimension')[0]).toBe('dimension1');
                expect(complexType.groupDimensionsNames('dimension')[1]).toBe('dimension2');
            });
        });
      
    });
});
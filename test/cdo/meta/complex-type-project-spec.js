define([
    'ccc/pvc',
    'ccc/def'
], function(pvc, def) {

    var cdo = pvc.data;

    describe('ComplexTypeProject', function() {
        var complexTypeProject = null;

        afterEach(function() { // Clean up objects
            complexTypeProject = null;
        })

        describe('constructor', function() {
            it('should create a ComplexTypeProject with no arguments', function() {
                complexTypeProject = new cdo.ComplexTypeProject();

                expect(complexTypeProject).toBeDefined();
                expect(complexTypeProject._dims).toEqual([]);
                expect(complexTypeProject._dimList).toEqual([]);
                expect(complexTypeProject._dimGroupsDims).toEqual({});
                expect(complexTypeProject._dimGroupSpecs).toEqual({});
            })

            it('should create a ComplexTypeProject with a _dimGroupSpecs parameter', function() {
                var _dimGroupSpecs = { 'test' : 1 };
                complexTypeProject = new cdo.ComplexTypeProject(_dimGroupSpecs);

                expect(complexTypeProject._dimGroupSpecs).toEqual(_dimGroupSpecs);
            })
        })

        describe('default constructor', function() {
            beforeEach(function() {
                complexTypeProject = new cdo.ComplexTypeProject();
            })

            it('should test the "hasDim" function', function() {
                var _dims = {
                    'dim1' : 'dim1'
                }

                complexTypeProject._dims = _dims;

                expect(complexTypeProject.hasDim('dim1')).toBe(true);
                expect(complexTypeProject.hasDim('dim2')).toBe(false);
            })

            it('should test the "setDim" function', function() {
                expect(function() {
                    complexTypeProject.setDim();
                }).toThrow();
                
                complexTypeProject.setDim('dim1', 'dim1Spec');
                expect(complexTypeProject.hasDim('dim1')).toBe(true);

                var spec = complexTypeProject._dims['dim1'].spec;
                for (i in spec) {
                    expect(spec[i]).toEqual('dim1Spec'.charAt(i));
                }
            })

            describe('calls "setDim"', function() {

                beforeEach(function() {
                    complexTypeProject.setDim('dim1', 'dim1Spec');
                    complexTypeProject.setDim('dim2', 'dim2Spec');
                })

                it('should test the "setDimDefaults" function', function() {
                    var spec = 'dim2SpecObject';
                    var specObj = {};
                    for (i in spec) {
                        specObj[i] = spec.charAt(i);
                    }

                    spec = complexTypeProject._dims['dim1'].spec;

                    var specPre = {};
                    for (i in spec) {
                        specPre[i] = spec[i];
                    }

                    complexTypeProject.setDimDefaults('dim1', specObj);

                    var specPost = {};
                    for (i in spec) {
                        specPost[i] = spec[i];
                    }

                    expect(specPre).not.toEqual(specPost);
                })

                it('should test the "readDim" function', function() {
                    var info = complexTypeProject._ensureDim('dim1', 'dim1Spec');

                    info.isCalc = true;

                    expect(function() {
                        complexTypeProject.readDim('dim1');
                    }).toThrow();

                    info.isCalc = false;

                    complexTypeProject.readDim('dim1');

                    expect(info.isRead).toEqual(true);

                    expect(function() {
                        complexTypeProject.readDim('dim1');
                    }).toThrow();
                })

                it('should test the "calcDim" function', function() {
                    var info = complexTypeProject._ensureDim('dim1', 'dim1Spec');

                    info.isRead = true;

                    expect(function() {
                        complexTypeProject.calcDim('dim1');
                    }).toThrow();

                    info.isRead = false;

                    complexTypeProject.calcDim('dim1');

                    expect(info.isCalc).toEqual(true);

                    expect(function() {
                        complexTypeProject.calcDim('dim1');
                    }).toThrow();
                })

                it('should test the "isReadOrCalc" function', function() {
                    expect(complexTypeProject.isReadOrCalc()).toBe(false);

                    expect(complexTypeProject.isReadOrCalc('dim1')).toBe(undefined);
                    expect(complexTypeProject.isReadOrCalc('dim2')).toBe(undefined);

                    complexTypeProject.readDim('dim1');
                    expect(complexTypeProject.isReadOrCalc('dim1')).toBe(true);
                    expect(complexTypeProject.isReadOrCalc('dim2')).toBe(undefined);

                    complexTypeProject.calcDim('dim2');
                    expect(complexTypeProject.isReadOrCalc('dim2')).toBe(true);
                })

                it('should test the "groupDimensionsNames" function', function() {
                    expect(complexTypeProject.groupDimensionsNames('dim').length).toBe(2);
                    expect(complexTypeProject.groupDimensionsNames('dim')['0']).toBe('dim1');
                    expect(complexTypeProject.groupDimensionsNames('dim')['1']).toBe('dim2');
                })

                it('should test the "setCalc" function', function() {
                    expect(function() {
                        complexTypeProject.setCalc();
                    }).toThrow();

                    expect(function() {
                        complexTypeProject.setCalc({});
                    }).toThrow();

                    var calcSpec = {
                        calculation : 'calcuation',
                        names : ['dim1', 'dim2']
                    }

                    complexTypeProject.setCalc(calcSpec);

                    expect(complexTypeProject._calcList.length).toBe(1);
                    expect(complexTypeProject._calcList[0]).toEqual(calcSpec);
                })

                it('should test the "configureComplexType" function', function() {
                    var complexType = new cdo.ComplexType();

                    complexTypeProject.setCalc({
                        calculation : 'calcuation',
                        names : ['dim1', 'dim2']
                    });

                    var dimNamesSize = complexType._dimsNames.length;
                    complexTypeProject.configureComplexType(complexType);

                    expect(dimNamesSize).toBe(0);
                    expect(complexType._dimsNames.length).toBe(2);
                    expect(complexType._dimsNames[0]).toBe('dim1');
                    expect(complexType._dimsNames[1]).toBe('dim2');
                    expect(complexType._calculations.length).toBe(1);
                    expect(complexType._calculations[0]).toBe('calcuation');
                });
            })
        }) 
    })
})
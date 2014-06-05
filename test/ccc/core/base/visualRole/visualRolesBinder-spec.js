define([
    'ccc/pvc',
    'ccc/def',
    'test/utils',
    'test/data-1'
], function(pvc, def, utils, datas) {

    var cdo = pvc.data;

    var When   = utils.describeTerm("when"),
        //Then   = utils.describeTerm("then"),
        That   = utils.describeTerm("that"),
        After  = utils.describeTerm("after"),
        //With   = utils.describeTerm("with"),
        And    = utils.describeTerm("and"),
        The    = utils.describeTerm("the"),
        A      = utils.describeTerm("a"),
        Should = utils.itTerm("should");

    function createVisualRolesContext(roles, roleList, rolesOptions) {
        function context(rn) {
            return def.getOwn(roles, rn);
        }

        context.query = function() {
            return def.query(roleList);
        };

        context.getOptions = function(r) {
            return rolesOptions[r.prettyId()]; // note: null is a valid config value!
        };

        return context;
    }

    function buildVisualRolesContext(visualRolesSpecs, rolesOptions) {
        var roles = {};
        var roleList = visualRolesSpecs.map(function(spec, index) {
            spec = Object.create(spec);
            spec.index = index;

            var r = new pvc.visual.Role(spec.name, spec);
            var prettyId;
            (spec.testNames || [r.name]).forEach(function(testName, index) {
                roles[testName] = r;
                if(!index) prettyId = testName;
            });

            // mock prettyId method, so that it always returns prettyId.
            // In the real implementation, the pretty id depends
            // on the existence of a plot, to return a prefixed value.
            if(prettyId !== r.name) r.prettyId = def.fun.constant(prettyId);

            return r;
        });

        return createVisualRolesContext(roles, roleList, rolesOptions);
    }

    describe("visualRolesBinder -", function() {
        Should("Not throw when constructed", function() {
            var ignored = pvc.visual.rolesBinder();
        });

        describe("begin() -", function() {
            describe("configuration -", function() {
                When("the visual role option isReversed=true", function() {
                    After("calling begin()", function() {
                        The("visual role", function() {
                            Should("have property isReversed=true", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [
                                    {name: 'series'}
                                ];
                                var rolesOptions = {series: {isReversed: true}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.begin();

                                expect(context('series').isReversed).toBe(true);
                            });
                        });
                    });
                });

                When("the visual role option isReversed=false", function() {
                    After("calling begin()", function() {
                        The("visual role", function() {
                            Should("have property isReversed=false", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [
                                    {name: 'series'}
                                ];
                                var rolesOptions = {series: {isReversed: false}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.begin();

                                expect(context('series').isReversed).toBe(false);
                            });
                        });
                    });
                });

                When("the visual role option legendVisible=false", function() {
                    After("calling begin()", function() {
                        The("visual role", function() {
                            Should("have method legendVisible()=false", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [{name: 'series'}];
                                var rolesOptions = {series: {legendVisible: false}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.begin();

                                expect(context('series').legendVisible()).toBe(false);
                            });
                        });
                    });
                });

                When("the visual role option legendVisible=true", function() {
                    After("calling begin()", function() {
                        The("visual role", function() {
                            Should("have method legendVisible()=true", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [{name: 'series'}];
                                var rolesOptions = {series: {legendVisible: true}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.begin();

                                expect(context('series').legendVisible()).toBe(true);
                            });
                        });
                    });
                });

                When("the visual role option from=other", function() {
                    And("a visual role with name=other does NOT exist", function() {
                        After("calling begin()", function() {
                            Should("an error be thrown", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [{name: 'series'}];
                                var rolesOptions = {series: {from: 'other'}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                expect(function() {
                                    binder.begin();
                                }).toThrow();
                            });
                        });
                    });

                    And("a visual role with name=other exists", function() {
                        After("calling begin()", function() {
                            The("visual role", function() {
                                Should("have property sourceRole=other", function() {
                                    var ctp = new cdo.ComplexTypeProject();

                                    var rolesSpecs = [{name: 'series'}, {name: 'other'}];
                                    var rolesOptions = {series: {from: 'other'}};

                                    var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                    var binder = pvc.visual.rolesBinder()
                                        .complexTypeProject(ctp)
                                        .context(context);

                                    binder.begin();

                                    expect(context('series').sourceRole).toBe(context('other'));
                                });
                            });
                        });
                    });

                    // Precedence of option "from" over "dimensions"
                    And("the visual role option dimensions=dimA", function() {
                        After("calling begin()", function() {
                            The("visual role", function() {

                                Should("have property sourceRole=other and not be pre-bound", function() {
                                    var ctp = new cdo.ComplexTypeProject();

                                    var rolesSpecs = [{name: 'series'}, {name: 'other'}];
                                    var rolesOptions = {series: {from: 'other', dimensions: 'dimA'}};

                                    var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                    var binder = pvc.visual.rolesBinder()
                                        .complexTypeProject(ctp)
                                        .context(context);

                                    binder.begin();

                                    expect(context('series').sourceRole).toBe(context('other'));
                                    expect(context('series').isPreBound()).toBe(false);
                                });
                            });
                        });
                    });
                });

                // Short-syntax for role options, as a string
                When("the visual role option is a string, the name of a dimension", function() {
                    And("a dimension with that name does NOT exist", function() {
                        After("calling begin()", function() {
                            The("visual role", function() {
                                Should("be pre-bound to a grouping containing that single dimension", function() {
                                    var ctp = new cdo.ComplexTypeProject();

                                    var rolesSpecs = [{name: 'series'}];
                                    var rolesOptions = {series: 'dimA'};

                                    var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                    var binder = pvc.visual.rolesBinder()
                                        .complexTypeProject(ctp)
                                        .context(context);

                                    binder.begin();

                                    var seriesRole = context('series');
                                    expect(seriesRole.isPreBound()).toBe(true);
                                    var g = seriesRole.preBoundGrouping();

                                    expect(g.isSingleDimension).toBe(true);
                                    expect(g.lastDimension.name).toBe('dimA');
                                });
                            });

                            When("the role is the single role bound to the dimension", function() {
                                The("dimension", function() {
                                    Should("be defined in the complex type project", function() {
                                        var ctp = new cdo.ComplexTypeProject();

                                        var rolesSpecs = [{name: 'A'}];
                                        var rolesOptions = {A: 'dimA'};

                                        var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                        var binder = pvc.visual.rolesBinder()
                                            .complexTypeProject(ctp)
                                            .context(context);

                                        binder.begin();

                                        expect(ctp.hasDim('dimA')).toBe(true);
                                    });
                                });
                            });

                            When("the role is NOT the single role bound to the dimension", function() {
                                The("dimension", function() {
                                    Should("be defined in the complex type project", function() {
                                        var ctp = new cdo.ComplexTypeProject();

                                        var rolesSpecs = [{name: 'A'}, {name: 'B'}];
                                        var rolesOptions = {A: 'dimA'};

                                        var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                        var binder = pvc.visual.rolesBinder()
                                            .complexTypeProject(ctp)
                                            .context(context);

                                        binder.begin();

                                        expect(ctp.hasDim('dimA')).toBe(true);
                                    });
                                });
                            });
                        });
                    });

                    And("a dimension with that name does exist", function() {
                        After("calling begin()", function() {
                            The("visual role", function() {
                                Should("be pre-bound to a grouping containing that single dimension", function() {
                                    var ctp = new cdo.ComplexTypeProject();
                                    ctp.setDim('dimA');

                                    var rolesSpecs = [{name: 'series'}];
                                    var rolesOptions = {series: 'dimA'};

                                    var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                    var binder = pvc.visual.rolesBinder()
                                        .complexTypeProject(ctp)
                                        .context(context);

                                    binder.begin();

                                    var seriesRole = context('series');
                                    expect(seriesRole.isPreBound()).toBe(true);
                                    var g = seriesRole.preBoundGrouping();

                                    expect(g.isSingleDimension).toBe(true);
                                    expect(g.lastDimension.name).toBe('dimA');
                                });
                            });
                        });
                    });
                });

                When("the visual role option dimensions=dimA", function() {
                    After("calling begin()", function() {
                        The("visual role", function() {
                            Should("be pre-bound to a grouping containing that single dimension", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [{name: 'series'}];
                                var rolesOptions = {series: {dimensions: 'dimA'}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.begin();

                                var seriesRole = context('series');
                                expect(seriesRole.isPreBound()).toBe(true);
                                var g = seriesRole.preBoundGrouping();

                                expect(g.isSingleDimension).toBe(true);
                                expect(g.lastDimension.name).toBe('dimA');
                            });
                        });
                    });
                });
            });

            When("a primary role exists, with some name", function() {
                And("a secondary role is not pre-bound or sourced, by configuration", function() {
                    After("calling begin()", function() {
                        The("secondary role", function() {
                            Should("have sourceRole=primary-role", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [
                                    // Primary role
                                    {
                                        name: 'series'
                                    },

                                    // Secondary role
                                    {
                                        name: 'series',
                                        testNames: ['foo.series']
                                    }
                                ];

                                var rolesOptions = {};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.begin();

                                expect(context('foo.series').sourceRole).toBe(context('series'));
                            });
                        });
                    });
                });

                And("a secondary role is pre-bound by configuration", function() {
                    After("calling begin()", function() {
                        The("secondary role", function() {
                            Should("be pre-bound and NOT have sourceRole=primary-role", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [
                                    // Primary role
                                    {
                                        name: 'series'
                                    },

                                    // Secondary role
                                    {
                                        name: 'series',
                                        testNames: ['foo.series']
                                    }
                                ];

                                var rolesOptions = {'foo.series': {dimensions: 'dimA'}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.begin();

                                expect(context('foo.series').isPreBound()).toBe(true);
                                expect(context('foo.series').sourceRole).toBe(null);
                            });
                        });
                    });
                });

                And("a secondary role is sourced by configuration", function() {
                    After("calling begin()", function() {
                        The("secondary role", function() {
                            Should("have sourceRole=original-source-role and NOT have sourceRole=primary-role", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [
                                    // Primary role
                                    {
                                        name: 'series'
                                    },

                                    // Secondary role
                                    {
                                        name: 'series',
                                        testNames: ['foo.series']
                                    },

                                    {
                                        name: 'bar'
                                    }
                                ];

                                var rolesOptions = {'foo.series': {from: 'bar'}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.begin();

                                expect(context('foo.series').isPreBound()).toBe(false);
                                expect(context('foo.series').sourceRole).toBe(context('bar'));
                            });
                        });
                    });
                });
            });

            When("a pre-bound role, A, is, explicitly or implicitly, the source of another role, B", function() {
                After("calling begin()", function() {
                    The("other role, B", function () {
                        Should("be pre-bound to the same grouping as that of role A", function () {
                            var ctp = new cdo.ComplexTypeProject();

                            var rolesSpecs = [
                                {name: 'A'},
                                {name: 'B'}
                            ];

                            var rolesOptions = {A: {dimensions: 'dimA'}, B: {from: 'A'}};

                            var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                            var binder = pvc.visual.rolesBinder()
                                .complexTypeProject(ctp)
                                .context(context);

                            binder.begin();

                            expect(context('A').isPreBound()).toBe(true);
                            expect(!!context('A').preBoundGrouping()).toBe(true);
                            expect(context('A').preBoundGrouping()).toBe(context('B').preBoundGrouping());
                        });
                    });
                });

                // Multiple sourcing levels does not affect pre-binding propagation.
                And("in turn, role B is the source role of another role C", function() {
                    After("calling begin()", function () {
                        The("role C", function () {
                            Should("be pre-bound to the same grouping as that of role A", function () {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [
                                    {name: 'A'},
                                    {name: 'B'},
                                    {name: 'C'}
                                ];

                                var rolesOptions = {A: {dimensions: 'dimA'}, B: {from: 'A'}, C: {from: 'B'}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.begin();

                                expect(context('A').preBoundGrouping()).toBe(context('B').preBoundGrouping());
                                expect(context('B').preBoundGrouping()).toBe(context('C').preBoundGrouping());
                            });
                        });
                    });
                });
            });

            // Cyclic source role
            When("a role A is the source of role B", function() {
                And("role B is the source of role C", function() {
                    And("role C is the source of role A", function() {
                        After("calling begin()", function () {
                            A("error", function () {
                                Should("be thrown", function () {
                                    var ctp = new cdo.ComplexTypeProject();

                                    var rolesSpecs = [
                                        {name: 'A'},
                                        {name: 'B'},
                                        {name: 'C'}
                                    ];

                                    var rolesOptions = {A: {from: 'C'}, B: {from: 'A'}, C: {from: 'B'}};

                                    var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                    var binder = pvc.visual.rolesBinder()
                                        .complexTypeProject(ctp)
                                        .context(context);

                                    expect(function() {
                                        binder.begin();
                                    }).toThrow();
                                });
                            });
                        });
                    });
                });
            });

            // Dimensions receive defaults from the single role that is bound to them.
            When("a role A has a non-empty dimensionDefaults property", function() {
                And("it is the only role that is explicitly pre-bound to certain dimensions", function() {
                    After("calling begin()", function() {
                        The("bound to dimensions' properties", function() {
                            Should("have been defaulted with the visual role's dimensionDefaults", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [
                                    {name: 'A', dimensionDefaults: {valueType: Number}}
                                ];

                                var rolesOptions = {A: {dimensions: 'dimA'}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.begin();

                                var dimInfo = ctp._dims['dimA'];
                                expect(!!dimInfo).toBe(true);
                                expect(dimInfo.spec.valueType).toBe(Number);
                            });
                        });
                    });

                    // B gets implicitly pre-bound to the same dimensions of A
                    // but that doesn't count for the "single" role determination of dimensionDefaults.
                    And("there is another role, B, that is sourced by A", function() {
                        After("calling begin()", function() {
                            The("bound to dimensions' properties", function() {
                                Should("have been defaulted with the visual role's dimensionDefaults", function() {
                                    var ctp = new cdo.ComplexTypeProject();

                                    var rolesSpecs = [
                                        {name: 'A', dimensionDefaults: {valueType: Number}},
                                        {name: 'B'}
                                    ];

                                    var rolesOptions = {A: {dimensions: 'dimA'}, B: {from: 'A'}};

                                    var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                    var binder = pvc.visual.rolesBinder()
                                        .complexTypeProject(ctp)
                                        .context(context);

                                    binder.begin();

                                    var dimInfo = ctp._dims['dimA'];
                                    expect(!!dimInfo).toBe(true);
                                    expect(dimInfo.spec.valueType).toBe(Number);
                                });
                            });
                        });
                    });
                });

                And("it is NOT the only role that is explicitly pre-bound to certain dimensions", function() {
                    After("calling begin()", function() {
                        The("bound to dimensions' properties", function() {
                            Should("have NOT been defaulted with any of the visual roles' dimensionDefaults", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [
                                    {name: 'A', dimensionDefaults: {valueType: Number }},
                                    {name: 'B', dimensionDefaults: {valueType: Boolean}}
                                ];

                                var rolesOptions = {A: {dimensions: 'dimA'}, B: {dimensions: 'dimA'}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.begin();

                                var dimInfo = ctp._dims['dimA'];
                                expect(dimInfo.spec.valueType).toBeUndefined();
                            });
                        });
                    });
                });
            });

            // Null groupings - a way to prevent a role from binding or being sourced.
            When("a role's options have dimensions=null", function() {
                After("calling begin()", function() {
                    The("role", function() {
                        Should("be bound to a null grouping", function() {
                            var ctp = new cdo.ComplexTypeProject();

                            var rolesSpecs = [
                                {name: 'A'}
                            ];

                            var rolesOptions = {A: {dimensions: null}};

                            var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                            var binder = pvc.visual.rolesBinder()
                                .complexTypeProject(ctp)
                                .context(context);

                            binder.begin();

                            expect(context('A').isPreBound()).toBe(true);
                            expect(context('A').preBoundGrouping().isNull()).toBe(true);
                        });
                    });
                });
            });

            When("a role's options are null", function() {
                After("calling begin()", function() {
                    The("role", function() {
                        Should("be bound to a null grouping", function() {
                            var ctp = new cdo.ComplexTypeProject();

                            var rolesSpecs = [
                                {name: 'A'}
                            ];

                            var rolesOptions = {A: null};

                            var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                            var binder = pvc.visual.rolesBinder()
                                .complexTypeProject(ctp)
                                .context(context);

                            binder.begin();

                            expect(context('A').isPreBound()).toBe(true);
                            expect(context('A').preBoundGrouping().isNull()).toBe(true);
                        });
                    });
                });
            });
        });

        describe("end() -", function() {
            When("a role A was not pre-bound or sourced", function() {

                // Binding to existing dimensions with name like defaultDimensionName
                And("it has a non-empty property defaultDimensionName", function() {
                    That("does NOT end with *", function() {
                        And("one dimension with the same name has, since begin(), been defined", function() {
                            After("calling end()", function() {
                                The("visual role", function () {
                                    Should("become bound to that dimension", function() {
                                        var ctp = new cdo.ComplexTypeProject();

                                        var rolesSpecs = [
                                            {name: 'A', defaultDimension: 'dimA'}
                                        ];

                                        var rolesOptions = {};

                                        var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                        var binder = pvc.visual.rolesBinder()
                                            .complexTypeProject(ctp)
                                            .context(context);

                                        binder.begin();

                                        expect(context('A').isPreBound()).toBe(false);

                                        // A dimension with the default name, dimA,
                                        // is in the mean time, defined by some external means.
                                        ctp.setDim('dimA');

                                        expect(ctp.hasDim('dimA')).toBe(true);

                                        binder.end();

                                        expect(context('A').isBound()).toBe(true);
                                        expect(context('A').grouping.isSingleDimension).toBe(true);
                                        expect(context('A').grouping.lastDimension.name).toBe('dimA');
                                    });
                                });
                            });

                            And("role A has a non-empty dimensionDefaults property", function() {
                                And("it is the only role that is explicitly pre-bound to the default dimension", function () {
                                    After("calling end()", function() {
                                        The("default dimension's properties", function() {
                                            Should("have been defaulted with the role A's dimensionDefaults", function() {
                                                var ctp = new cdo.ComplexTypeProject();

                                                var rolesSpecs = [
                                                    {name: 'A', defaultDimension: 'dimA', dimensionDefaults: {valueType: Number}}
                                                ];

                                                var rolesOptions = {};

                                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                                var binder = pvc.visual.rolesBinder()
                                                    .complexTypeProject(ctp)
                                                    .context(context);

                                                binder.begin();

                                                ctp.setDim('dimA');

                                                binder.end();

                                                var dimInfo = ctp._dims['dimA'];
                                                expect(!!dimInfo).toBe(true);
                                                expect(dimInfo.spec.valueType).toBe(Number);
                                            });
                                        });
                                    });
                                });
                                And("it is NOT the only role that is explicitly pre-bound to the default dimension", function () {
                                    After("calling end()", function() {
                                        The("default dimension's properties", function() {
                                            Should("NOT have been defaulted with the role A's dimensionDefaults", function() {
                                                var ctp = new cdo.ComplexTypeProject();

                                                var rolesSpecs = [
                                                    {name: 'A', defaultDimension: 'dimA', dimensionDefaults: {valueType: Number}},
                                                    {name: 'B', defaultDimension: 'dimA'}
                                                ];

                                                var rolesOptions = {};

                                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                                var binder = pvc.visual.rolesBinder()
                                                    .complexTypeProject(ctp)
                                                    .context(context);

                                                binder.begin();

                                                ctp.setDim('dimA');

                                                binder.end();

                                                var dimInfo = ctp._dims['dimA'];
                                                expect(dimInfo.spec.valueType).toBeUndefined();
                                            });
                                        });
                                    });
                                });
                            });

                            // Sourced roles pre-binding when sources only get pre-bound in the end phase
                            And("another visual role, B, is sourced by this one, A", function() {
                                After("calling end()", function() {
                                    The("visual role, B", function() {
                                        Should("become bound to that dimension as well", function() {
                                            var ctp = new cdo.ComplexTypeProject();

                                            var rolesSpecs = [
                                                {name: 'A', defaultDimension: 'dimA'},
                                                {name: 'B'}
                                            ];

                                            var rolesOptions = {B: {from: 'A'}};

                                            var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                            var binder = pvc.visual.rolesBinder()
                                                .complexTypeProject(ctp)
                                                .context(context);

                                            binder.begin();

                                            ctp.setDim('dimA');

                                            expect(ctp.hasDim('dimA')).toBe(true);

                                            binder.end();

                                            expect(context('A').isBound()).toBe(true);
                                            expect(context('B').isBound()).toBe(true);

                                            expect(context('A').grouping).toBe(context('B').grouping);
                                        });
                                    });
                                });
                            });
                        });

                        And("two dimensions with the same name prefix have, since begin(), been defined", function() {
                            After("calling end()", function() {
                                The("visual role", function() {
                                    Should("NOT become bound to any of those dimensions", function() {
                                        var ctp = new cdo.ComplexTypeProject();

                                        var rolesSpecs = [
                                            {name: 'A', defaultDimension: 'dimA'}
                                        ];

                                        var rolesOptions = {};

                                        var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                        var binder = pvc.visual.rolesBinder()
                                            .complexTypeProject(ctp)
                                            .context(context);

                                        binder.begin();

                                        expect(context('A').isPreBound()).toBe(false);

                                        // A dimension with the default name, dimA,
                                        // is in the mean time, defined by some external means.
                                        ctp.setDim('dimA1');
                                        ctp.setDim('dimA2');

                                        expect(ctp.hasDim('dimA1')).toBe(true);
                                        expect(ctp.hasDim('dimA2')).toBe(true);

                                        binder.end();

                                        expect(context('A').isBound()).toBe(false);
                                    });
                                });
                            });
                        });

                        // Binding to automatically created dimension with name defaultDimensionName
                        And("no dimensions with same name exist", function() {
                            And("role property autoCreateDimension=true", function() {
                                After("calling end()", function() {
                                    The("visual role", function() {
                                        Should("become bound to one dimension with the default name", function() {
                                            var ctp = new cdo.ComplexTypeProject();

                                            var rolesSpecs = [
                                                {name: 'A', defaultDimension: 'dimA', autoCreateDimension: true}
                                            ];

                                            var rolesOptions = {};

                                            var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                            var binder = pvc.visual.rolesBinder()
                                                .complexTypeProject(ctp)
                                                .context(context);

                                            binder.begin();

                                            expect(context('A').isPreBound()).toBe(false);

                                            binder.end();

                                            expect(context('A').isBound()).toBe(true);
                                            expect(context('A').grouping.isSingleDimension).toBe(true);
                                            expect(context('A').grouping.lastDimension.name).toBe('dimA');
                                        });
                                    });
                                });
                            });
                        });
                    });

                    That("does end with *", function() {
                        And("one dimension with a name equal to the prefix has, since begin(), been defined", function() {
                            After("calling end()", function() {
                                The("visual role", function() {
                                    Should("become bound to that dimension", function() {
                                        var ctp = new cdo.ComplexTypeProject();

                                        var rolesSpecs = [
                                            {name: 'A', defaultDimension: 'dimA*'}
                                        ];

                                        var rolesOptions = {};

                                        var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                        var binder = pvc.visual.rolesBinder()
                                            .complexTypeProject(ctp)
                                            .context(context);

                                        binder.begin();

                                        expect(context('A').isPreBound()).toBe(false);

                                        // A dimension with the default name, dimA,
                                        // is in the mean time, defined by some external means.
                                        ctp.setDim('dimA');

                                        expect(ctp.hasDim('dimA')).toBe(true);

                                        binder.end();

                                        expect(context('A').isBound()).toBe(true);
                                        expect(context('A').grouping.isSingleDimension).toBe(true);
                                        expect(context('A').grouping.lastDimension.name).toBe('dimA');
                                    });
                                });
                            });
                        });

                        And("two dimensions with the same name prefix have, since begin(), been defined", function() {
                            After("calling end()", function() {
                                The("visual role", function() {
                                    Should("NOT become bound to any of those dimensions", function() {
                                        var ctp = new cdo.ComplexTypeProject();

                                        var rolesSpecs = [
                                            {name: 'A', defaultDimension: 'dimA*'}
                                        ];

                                        var rolesOptions = {};

                                        var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                        var binder = pvc.visual.rolesBinder()
                                            .complexTypeProject(ctp)
                                            .context(context);

                                        binder.begin();

                                        expect(context('A').isPreBound()).toBe(false);

                                        // A dimension with the default name, dimA,
                                        // is in the mean time, defined by some external means.
                                        ctp.setDim('dimA1');
                                        ctp.setDim('dimA2');

                                        expect(ctp.hasDim('dimA1')).toBe(true);
                                        expect(ctp.hasDim('dimA2')).toBe(true);

                                        binder.end();

                                        expect(context('A').isBound()).toBe(true);
                                        expect(context('A').grouping.isSingleDimension).toBe(false);
                                        expect(context('A').grouping.dimensionNames()).toEqual(['dimA1', 'dimA2']);
                                    });
                                });
                            });
                        });

                        // Binding to automatically created dimension with name defaultDimensionName
                        And("no dimensions with same name exist", function() {
                            And("role property autoCreateDimension=true", function() {
                                After("calling end()", function() {
                                    The("visual role", function() {
                                        Should("become bound to one dimension with the default name", function() {
                                            var ctp = new cdo.ComplexTypeProject();

                                            var rolesSpecs = [
                                                {name: 'A', defaultDimension: 'dimA*', autoCreateDimension: true}
                                            ];

                                            var rolesOptions = {};

                                            var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                            var binder = pvc.visual.rolesBinder()
                                                .complexTypeProject(ctp)
                                                .context(context);

                                            binder.begin();

                                            expect(context('A').isPreBound()).toBe(false);

                                            binder.end();

                                            expect(context('A').isBound()).toBe(true);
                                            expect(context('A').grouping.isSingleDimension).toBe(true);
                                            expect(context('A').grouping.lastDimension.name).toBe('dimA');
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

                // Sourcing due to defaultSourceRole
                And("it either has an empty property defaultDimensionName or could not be pre-bound by it", function() {
                    And("it has a non-empty property defaultSourceRoleName", function() {
                        And("a role with that name exists and is pre-bound", function() {
                            After("calling end()", function() {
                                The("role", function() {
                                    Should("have the default source role as source", function() {
                                        var ctp = new cdo.ComplexTypeProject();

                                        var rolesSpecs = [
                                            {name: 'A', defaultSourceRole: 'B'},
                                            {name: 'B'}
                                        ];

                                        var rolesOptions = {'B': 'dimB'};

                                        var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                        expect(context('A').defaultSourceRoleName).toBe('B');

                                        var binder = pvc.visual.rolesBinder()
                                            .complexTypeProject(ctp)
                                            .context(context);

                                        binder.begin();

                                        binder.end();

                                        expect(context('A').sourceRole).toBe(context('B'));
                                    });

                                    Should("become bound to the same grouping as that of the source role", function() {
                                        var ctp = new cdo.ComplexTypeProject();

                                        var rolesSpecs = [
                                            {name: 'A', defaultSourceRole: 'B'},
                                            {name: 'B'}
                                        ];

                                        var rolesOptions = {'B': 'dimB'};

                                        var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                        expect(context('A').defaultSourceRoleName).toBe('B');

                                        var binder = pvc.visual.rolesBinder()
                                            .complexTypeProject(ctp)
                                            .context(context);

                                        binder.begin();

                                        binder.end();

                                        expect(context('B').isBound()).toBe(true);
                                        expect(context('A').isBound()).toBe(true);
                                        expect(context('A').grouping).toBe(context('B').grouping);
                                    });
                                });
                            });
                        });

                        // When unbound and optional, sourceRoles are cleared...
                        And("a role with that name exists but is not pre-bound", function() {
                            After("calling end()", function() {
                                The("role", function() {
                                    Should("be unbound and NOT have the default source role as source", function() {
                                        var ctp = new cdo.ComplexTypeProject();

                                        var rolesSpecs = [
                                            {name: 'A', defaultSourceRole: 'B'},
                                            {name: 'B'}
                                        ];

                                        var rolesOptions = {};

                                        var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                        expect(context('A').defaultSourceRoleName).toBe('B');

                                        var binder = pvc.visual.rolesBinder()
                                            .complexTypeProject(ctp)
                                            .context(context);

                                        binder.begin();

                                        binder.end();

                                        expect(context('A').isBound()).toBe(false);
                                        expect(context('A').sourceRole).toBe(null);
                                    });
                                });
                            });
                        });
                    });
                });
            });

            When("a role was pre-bound to a null grouping in the begin phase", function() {
                After("calling end()", function() {
                    The("role", function() {
                        Should("be unbound", function() {
                            var ctp = new cdo.ComplexTypeProject();

                            var rolesSpecs = [
                                {name: 'A'}
                            ];

                            var rolesOptions = {A: {dimensions: null}};

                            var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                            var binder = pvc.visual.rolesBinder()
                                .complexTypeProject(ctp)
                                .context(context);

                            binder.begin();
                            binder.end();

                            expect(context('A').isPreBound()).toBe(false);
                            expect(context('A').isBound()).toBe(false);
                        });
                    });
                });
            });
        });
    });
});
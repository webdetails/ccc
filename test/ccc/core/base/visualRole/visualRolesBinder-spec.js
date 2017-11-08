define([
    'ccc/pvc',
    'ccc/def',
    'test/utils'
], function(pvc, def, utils) {

    var cdo = pvc.data;

    var When   = utils.describeTerm("when");
    var That   = utils.describeTerm("that");
    var After  = utils.describeTerm("after");
    var And    = utils.describeTerm("and");
    var The    = utils.describeTerm("the");
    var A      = utils.describeTerm("a");
    var Should = utils.itTerm("should");

    function createVisualRolesContext(roles, roleList, rolesOptions) {

        function context(roleName) {
            return def.getOwn(roles, roleName);
        }

        context.query = function() {
            return def.query(roleList);
        };

        context.getOptions = function(role) {
            return rolesOptions[role.prettyId()]; // note: null is a valid config value!
        };

        context.getExtensionComplexTypesMap = function() {
            return null;
        };

        return context;
    }

    function buildVisualRolesContext(visualRolesSpecs, rolesOptions) {

        var roles = {};
        var roleList = visualRolesSpecs.map(function(spec, index) {
            spec = Object.create(spec);
            spec.index = index;

            var chartMock = {};
            var role = new pvc.visual.Role(chartMock, spec.name, spec);

            var prettyId;
            (spec.testNames || [role.name]).forEach(function(testName, index) {
                roles[testName] = role;
                if(!index) prettyId = testName;
            });

            // mock prettyId method, so that it always returns prettyId.
            // In the real implementation, the pretty id depends
            // on the existence of a plot, to return a prefixed value.
            if(prettyId !== role.name) role.prettyId = def.fun.constant(prettyId);

            return role;
        });

        return createVisualRolesContext(roles, roleList, rolesOptions);
    }

    describe("visualRolesBinder -", function() {
        Should("Not throw when constructed", function() {
            var ignored = pvc.visual.rolesBinder();
        });

        describe("init() -", function() {
            describe("configuration -", function() {
                When("the visual role option isReversed=true", function() {
                    After("calling init()", function() {
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

                                binder.init();

                                expect(context('series').isReversed).toBe(true);
                            });
                        });
                    });
                });

                When("the visual role option isReversed=false", function() {
                    After("calling init()", function() {
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

                                binder.init();

                                expect(context('series').isReversed).toBe(false);
                            });
                        });
                    });
                });

                When("the visual role option legend.visible=false", function() {
                    After("calling init()", function() {
                        The("visual role", function() {
                            Should("have method legend().visible=false", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [{name: 'series'}];
                                var rolesOptions = {series: {legend: {visible: false}}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.init();

                                expect(context('series').legend().visible).toBe(false);
                            });
                        });
                    });
                });

                When("the visual role option legend().visible=true", function() {
                    After("calling init()", function() {
                        The("visual role", function() {
                            Should("have method legend().visible=true", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [{name: 'series'}];
                                var rolesOptions = {series: {legend: {visible: true}}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.init();

                                expect(context('series').legend().visible).toBe(true);
                            });
                        });
                    });
                });

                When("the visual role option from=other", function() {
                    And("a visual role with name=other does NOT exist", function() {
                        After("calling init()", function() {
                            Should("an error be thrown", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [{name: 'series'}];
                                var rolesOptions = {series: {from: 'other'}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                expect(function() {
                                    binder.init();
                                }).toThrow();
                            });
                        });
                    });

                    And("a visual role with name=other exists", function() {
                        After("calling init()", function() {
                            The("visual role", function() {
                                Should("have property sourceRole=other", function() {
                                    var ctp = new cdo.ComplexTypeProject();

                                    var rolesSpecs = [{name: 'series'}, {name: 'other'}];
                                    var rolesOptions = {series: {from: 'other'}};

                                    var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                    var binder = pvc.visual.rolesBinder()
                                        .complexTypeProject(ctp)
                                        .context(context);

                                    binder.init();

                                    expect(context('series').sourceRole).toBe(context('other'));
                                });
                            });
                        });
                    });

                    // Precedence of option "from" over "dimensions"
                    And("the visual role option dimensions=dimA", function() {
                        After("calling init()", function() {
                            The("visual role", function() {

                                Should("have property sourceRole=other and not be pre-bound", function() {
                                    var ctp = new cdo.ComplexTypeProject();

                                    var rolesSpecs = [{name: 'series'}, {name: 'other'}];
                                    var rolesOptions = {series: {from: 'other', dimensions: 'dimA'}};

                                    var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                    var binder = pvc.visual.rolesBinder()
                                        .complexTypeProject(ctp)
                                        .context(context);

                                    binder.init();

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
                        After("calling init()", function() {
                            The("visual role", function() {
                                Should("be pre-bound to a grouping containing that single dimension", function() {
                                    var ctp = new cdo.ComplexTypeProject();

                                    var rolesSpecs = [{name: 'series'}];
                                    var rolesOptions = {series: 'dimA'};

                                    var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                    var binder = pvc.visual.rolesBinder()
                                        .complexTypeProject(ctp)
                                        .context(context);

                                    binder.init();

                                    var seriesRole = context('series');
                                    expect(seriesRole.isPreBound()).toBe(true);
                                    var g = seriesRole.preBoundGrouping();

                                    expect(g.singleDimensionName).toBe('dimA');
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

                                        binder.init();

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

                                        binder.init();

                                        expect(ctp.hasDim('dimA')).toBe(true);
                                    });
                                });
                            });
                        });
                    });

                    And("a dimension with that name does exist", function() {
                        After("calling init()", function() {
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

                                    binder.init();

                                    var seriesRole = context('series');
                                    expect(seriesRole.isPreBound()).toBe(true);
                                    var g = seriesRole.preBoundGrouping();

                                    expect(g.singleDimensionName).toBe('dimA');
                                });
                            });
                        });
                    });
                });

                When("the visual role option dimensions=dimA", function() {
                    After("calling init()", function() {
                        The("visual role", function() {
                            Should("be pre-bound to a grouping containing that single dimension", function() {
                                var ctp = new cdo.ComplexTypeProject();

                                var rolesSpecs = [{name: 'series'}];
                                var rolesOptions = {series: {dimensions: 'dimA'}};

                                var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                var binder = pvc.visual.rolesBinder()
                                    .complexTypeProject(ctp)
                                    .context(context);

                                binder.init();

                                var seriesRole = context('series');
                                expect(seriesRole.isPreBound()).toBe(true);
                                var g = seriesRole.preBoundGrouping();

                                expect(g.singleDimensionName).toBe('dimA');
                            });
                        });
                    });
                });
            });

            When("a primary role exists, with some name", function() {
                And("a secondary role is not pre-bound or sourced, by configuration", function() {
                    After("calling init()", function() {
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

                                binder.init();

                                expect(context('foo.series').sourceRole).toBe(context('series'));
                            });
                        });
                    });
                });

                And("a secondary role is pre-bound by configuration", function() {
                    After("calling init()", function() {
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

                                binder.init();

                                expect(context('foo.series').isPreBound()).toBe(true);
                                expect(context('foo.series').sourceRole).toBe(null);
                            });
                        });
                    });
                });

                And("a secondary role is sourced by configuration", function() {
                    After("calling init()", function() {
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

                                binder.init();

                                expect(context('foo.series').isPreBound()).toBe(false);
                                expect(context('foo.series').sourceRole).toBe(context('bar'));
                            });
                        });
                    });
                });
            });

            When("a pre-bound role, A, is, explicitly or implicitly, the source of another role, B", function() {
                After("calling init()", function() {
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

                            binder.init();

                            expect(context('A').isPreBound()).toBe(true);
                            expect(!!context('A').preBoundGrouping()).toBe(true);
                            expect(context('A').preBoundGrouping()).toBe(context('B').preBoundGrouping());
                        });
                    });
                });

                // Multiple sourcing levels does not affect pre-binding propagation.
                And("in turn, role B is the source role of another role C", function() {
                    After("calling init()", function () {
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

                                binder.init();

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
                        After("calling init()", function () {
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
                                        binder.init();
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
                    After("calling init()", function() {
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

                                binder.init();

                                var dimInfo = ctp._dims['dimA'];
                                expect(!!dimInfo).toBe(true);
                                expect(dimInfo.spec.valueType).toBe(Number);
                            });
                        });
                    });

                    // B gets implicitly pre-bound to the same dimensions of A
                    // but that doesn't count for the "single" role determination of dimensionDefaults.
                    And("there is another role, B, that is sourced by A", function() {
                        After("calling init()", function() {
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

                                    binder.init();

                                    var dimInfo = ctp._dims['dimA'];
                                    expect(!!dimInfo).toBe(true);
                                    expect(dimInfo.spec.valueType).toBe(Number);
                                });
                            });
                        });
                    });
                });

                And("it is NOT the only role that is explicitly pre-bound to certain dimensions", function() {
                    After("calling init()", function() {
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

                                binder.init();

                                var dimInfo = ctp._dims['dimA'];
                                expect(dimInfo.spec.valueType).toBeUndefined();
                            });
                        });
                    });
                });
            });

            // Null groupings - a way to prevent a role from binding or being sourced.
            When("a role's options have dimensions=null", function() {
                After("calling init()", function() {
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

                            binder.init();

                            expect(context('A').isPreBound()).toBe(true);
                            expect(context('A').preBoundGrouping().isNull).toBe(true);
                        });
                    });
                });
            });

            When("a role's options are null", function() {
                After("calling init()", function() {
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

                            binder.init();

                            expect(context('A').isPreBound()).toBe(true);
                            expect(context('A').preBoundGrouping().isNull).toBe(true);
                        });
                    });
                });
            });
        });

        describe("dimensionsFinished() -", function() {
            When("a role A was not pre-bound or sourced", function() {

                // Binding to existing dimensions with name like defaultDimensionName
                And("it has a non-empty property defaultDimensionName", function() {
                    That("does NOT end with *", function() {
                        And("one dimension with the same name has, since init(), been defined", function() {
                            After("calling dimensionsFinished()", function() {
                                The("visual role", function () {
                                    Should("become pre-bound to that dimension", function() {
                                        var ctp = new cdo.ComplexTypeProject();

                                        var rolesSpecs = [
                                            {name: 'A', defaultDimension: 'dimA'}
                                        ];

                                        var rolesOptions = {};

                                        var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                                        var binder = pvc.visual.rolesBinder()
                                            .complexTypeProject(ctp)
                                            .context(context);

                                        binder.init();

                                        expect(context('A').isPreBound()).toBe(false);

                                        // A dimension with the default name, dimA,
                                        // is in the mean time, defined by some external means.
                                        ctp.setDim('dimA');

                                        expect(ctp.hasDim('dimA')).toBe(true);

                                        binder.dimensionsFinished();

                                        var role = context('A');
                                        expect(role.isPreBound()).toBe(true);

                                        var g = role.preBoundGrouping();
                                        expect(g.singleDimensionName).toBe('dimA');
                                    });
                                });
                            });

                            And("role A has a non-empty dimensionDefaults property", function() {
                                And("it is the only role that is explicitly pre-bound to the default dimension", function () {
                                    After("calling dimensionsFinished()", function() {
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

                                                binder.init();

                                                ctp.setDim('dimA');

                                                binder.dimensionsFinished();

                                                var dimInfo = ctp._dims['dimA'];
                                                expect(!!dimInfo).toBe(true);
                                                expect(dimInfo.spec.valueType).toBe(Number);
                                            });
                                        });
                                    });
                                });
                                And("it is NOT the only role that is explicitly pre-bound to the default dimension", function () {
                                    After("calling dimensionsFinished()", function() {
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

                                                binder.init();

                                                ctp.setDim('dimA');

                                                binder.dimensionsFinished();

                                                var dimInfo = ctp._dims['dimA'];
                                                expect(dimInfo.spec.valueType).toBeUndefined();
                                            });
                                        });
                                    });
                                });
                            });

                            // Sourced roles pre-binding when sources only get pre-bound in the end phase
                            And("another visual role, B, is sourced by this one, A", function() {
                                After("calling dimensionsFinished()", function() {
                                    The("visual role, B", function() {
                                        Should("become pre-bound to that dimension as well", function() {
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

                                            binder.init();

                                            ctp.setDim('dimA');

                                            expect(ctp.hasDim('dimA')).toBe(true);

                                            binder.dimensionsFinished();

                                            expect(context('A').isPreBound()).toBe(true);
                                            expect(context('B').isPreBound()).toBe(true);

                                            expect(context('A').preBoundGrouping())
                                                .toBe(context('B').preBoundGrouping());
                                        });
                                    });
                                });
                            });
                        });

                        And("two dimensions with the same name prefix have, since init(), been defined", function() {
                            After("calling dimensionsFinished()", function() {
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

                                        binder.init();

                                        expect(context('A').isPreBound()).toBe(false);

                                        // A dimension with the default name, dimA,
                                        // is in the mean time, defined by some external means.
                                        ctp.setDim('dimA1');
                                        ctp.setDim('dimA2');

                                        expect(ctp.hasDim('dimA1')).toBe(true);
                                        expect(ctp.hasDim('dimA2')).toBe(true);

                                        binder.dimensionsFinished();

                                        expect(context('A').isPreBound()).toBe(false);
                                    });
                                });
                            });
                        });

                        // Binding to automatically created dimension with name defaultDimensionName
                        And("no dimensions with same name exist", function() {
                            And("role property autoCreateDimension=true", function() {
                                After("calling dimensionsFinished()", function() {
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

                                            binder.init();

                                            expect(context('A').isPreBound()).toBe(false);

                                            binder.dimensionsFinished();

                                            var role = context('A');
                                            expect(role.isPreBound()).toBe(true);

                                            var g = role.preBoundGrouping();
                                            expect(g.isSingleDimension).toBe(true);
                                            expect(g.lastDimension.name).toBe('dimA');
                                        });
                                    });
                                });
                            });
                        });
                    });

                    That("does end with *", function() {
                        And("one dimension with a name equal to the prefix has, since init(), been defined", function() {
                            After("calling dimensionsFinished()", function() {
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

                                        binder.init();

                                        expect(context('A').isPreBound()).toBe(false);

                                        // A dimension with the default name, dimA,
                                        // is in the mean time, defined by some external means.
                                        ctp.setDim('dimA');

                                        expect(ctp.hasDim('dimA')).toBe(true);

                                        binder.dimensionsFinished();

                                        var role = context('A');
                                        expect(role.isPreBound()).toBe(true);

                                        var g = role.preBoundGrouping();
                                        expect(g.singleDimensionName).toBe('dimA');
                                    });
                                });
                            });
                        });

                        And("two dimensions with the same name prefix have, since init(), been defined", function() {
                            After("calling dimensionsFinished()", function() {
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

                                        binder.init();

                                        expect(context('A').isPreBound()).toBe(false);

                                        // A dimension with the default name, dimA,
                                        // is in the mean time, defined by some external means.
                                        ctp.setDim('dimA1');
                                        ctp.setDim('dimA2');

                                        expect(ctp.hasDim('dimA1')).toBe(true);
                                        expect(ctp.hasDim('dimA2')).toBe(true);

                                        binder.dimensionsFinished();

                                        var role = context('A');
                                        expect(role.isPreBound()).toBe(true);

                                        var g = role.preBoundGrouping();
                                        expect(g.isSingleDimension).toBe(false);
                                        expect(g.dimensionNames()).toEqual(['dimA1', 'dimA2']);
                                    });
                                });
                            });
                        });

                        // Binding to automatically created dimension with name defaultDimensionName
                        And("no dimensions with same name exist", function() {
                            And("role property autoCreateDimension=true", function() {
                                After("calling dimensionsFinished()", function() {
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

                                            binder.init();

                                            expect(context('A').isPreBound()).toBe(false);

                                            binder.dimensionsFinished();

                                            var role = context('A');
                                            expect(role.isPreBound()).toBe(true);

                                            var g = role.preBoundGrouping();
                                            expect(g.isSingleDimension).toBe(true);
                                            expect(g.dimensionNames()).toEqual(['dimA']);
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
                            After("calling dimensionsFinished()", function() {
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

                                        binder.init();

                                        binder.dimensionsFinished();

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

                                        binder.init();

                                        binder.dimensionsFinished();

                                        expect(context('B').isPreBound()).toBe(true);
                                        expect(context('A').isPreBound()).toBe(true);
                                        expect(context('A').preBoundGrouping()).toBe(context('B').preBoundGrouping());
                                    });
                                });
                            });
                        });

                        // When unbound and optional, sourceRoles are cleared...
                        And("a role with that name exists but is not pre-bound", function() {
                            After("calling dimensionsFinished()", function() {
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

                                        binder.init();

                                        binder.dimensionsFinished();

                                        expect(context('A').isPreBound()).toBe(false);
                                        expect(context('A').sourceRole).toBe(null);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        describe("bind() -", function() {
            When("a role A was previously pre-bound", function() {

                After("calling bind()", function() {
                    The("visual role", function () {
                        Should("become bound", function() {
                            var ctp = new cdo.ComplexTypeProject();

                            var rolesSpecs = [
                                {name: 'A', defaultDimension: 'dimA'}
                            ];

                            var rolesOptions = {};

                            var context = buildVisualRolesContext(rolesSpecs, rolesOptions);

                            var binder = pvc.visual.rolesBinder()
                                .complexTypeProject(ctp)
                                .context(context);

                            binder.init();

                            expect(context('A').isPreBound()).toBe(false);

                            // A dimension with the default name, dimA,
                            // is in the mean time, defined by some external means.
                            ctp.setDim('dimA');

                            expect(ctp.hasDim('dimA')).toBe(true);

                            binder.dimensionsFinished();

                            var complexType = new cdo.ComplexType();
                            ctp.configureComplexType(complexType, {});

                            binder.bind(complexType);

                            var role = context('A');
                            expect(role.isBound()).toBe(true);

                            var g = role.grouping;
                            expect(g.singleDimensionName).toBe('dimA');
                        });
                    });
                });
            });

            When("a role was pre-bound to a null grouping in the begin phase", function() {
                After("calling bind()", function() {
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

                            binder.init();
                            binder.dimensionsFinished();

                            var complexType = new cdo.ComplexType();
                            ctp.configureComplexType(complexType, {});

                            binder.bind(complexType);

                            expect(context('A').isPreBound()).toBe(false);
                            expect(context('A').isBound()).toBe(false);
                        });
                    });
                });
            });
        });
    });
});

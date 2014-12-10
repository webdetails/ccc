define([
    'ccc/cgf',
    'ccc/def',
    'test/utils'
], function(cgf, def, utils) {

    /*global describe:true, it:true, expect:true*/

    var When   = utils.describeTerm("when"),
        That   = utils.describeTerm("that"),
        And    = utils.describeTerm("and"),
        The    = utils.describeTerm("the"),
        A      = utils.describeTerm("a"),
        Should = utils.itTerm("should");

    describe("cgf.dom.Element -", function () {

        describe("properties -", function() {
            var propNumber = cgf.dom.property('propNumber', Number), // with cast
                propAtomic = cgf.dom.property('propAtomic', Number),
                propAny    = cgf.dom.property('propAny'), // without cast
                propAny2   = cgf.dom.property('propAny2'), // without cast

                // Dynamic cast function
                propNumberFun = cgf.dom.property('propNumberFun', function NumberFun(v) {
                    if(typeof v === 'string') {
                        return function(s, i) { return i; };
                    }
                    return +v;
                }),

                MyPart = cgf.dom.PartTemplate.extend()
                    .property(propAtomic),

                propPart = cgf.dom.property('propPart', {factory: def.fun.typeFactory(MyPart)}),

                Dot = cgf.dom.EntityTemplate.extend()
                    .property(propNumber)
                    .property(propAny)
                    .property(propAny2)
                    .property(propNumberFun)
                    .property(propAtomic)
                    .property(propPart),

                scene = {foo: {}, bar: 2};

            describe("reading the value of an element's property that was not set -", function() {
                Should("return null", function() {
                    var dotTempl1 = new Dot(),
                        dotElem1 = dotTempl1.createElement();

                    expect(dotElem1.propNumber).toBe(null);
                });

                Should("return the constant value set in the template's proto", function() {
                    var Dot2 = cgf.dom.EntityTemplate.extend()
                            .property(propNumber);

                    Dot2.type().add({
                        "defaults": new Dot().extend(cgf.dom.Template.defaults).propNumber(1)
                    });

                    var dotTempl0 = new Dot2().propNumber(2),
                        dotTempl1 = new Dot2().proto(dotTempl0),
                        dotElem1 = dotTempl1.createElement();

                    expect(dotElem1.propNumber).toBe(2);
                });

                Should("return the constant value set in the template's class defaults instance", function() {
                    var Dot2 = cgf.dom.EntityTemplate.extend()
                            .property(propNumber);

                    Dot2.type().add({
                        "defaults": new Dot2()
                            .proto(cgf.dom.EntityTemplate.defaults)
                            .propNumber(1)
                    });

                    var dotTempl1 = new Dot2(),
                        dotElem1  = dotTempl1.createElement();

                    expect(dotElem1.propNumber).toBe(1);

                    // ---------------------
                    // Even with a proto in the middle

                    dotTempl1 = new Dot2()
                        .proto(new Dot2());

                    dotElem1 = dotTempl1.createElement();
                    expect(dotElem1.propNumber).toBe(1);
                });
            });

            describe("reading the value of a constant property -", function() {
                Should("return the constant value, when the property has no cast", function() {
                    var value = {},
                        dotTempl1 = new Dot()
                            .propAny(value),

                        dotElem1 = dotTempl1.createElement(null, scene);

                    expect(dotElem1.propAny).toBe(value);
                });

                Should("return the casted constant value, when the property has a cast", function() {
                    var dotTempl1 = new Dot()
                            .propNumber("1"),

                        dotElem1 = dotTempl1.createElement(null, scene);

                    expect(dotElem1.propNumber).toBe(1);
                });

                Should("return a resolved constant value, when a property has a dynamic cast", function() {
                    var dotTempl1 = new Dot()
                            .propNumberFun("%"),

                        dotElem1 = dotTempl1.createElement(null, scene);

                    expect(dotElem1.propNumberFun).toBe(0);
                });
            });

            describe("reading the value of a variable property -", function() {
                describe("the element's scene and index arguments -", function() {
                    Should("be passed to the evaluator, when the property has no base and no cast", function() {
                        var sceneArg,
                            indexArg,
                            dotTempl1 = new Dot()
                                .propAny(function(s,i) {
                                    sceneArg = s;
                                    indexArg = i;
                                    return "1";
                                }),
                            dotElem1 = dotTempl1.createElement(null, scene, 3);

                        dotElem1.propAny;
                        expect(sceneArg).toBe(scene);
                        expect(indexArg).toBe(3);
                    });

                    Should("be passed to the evaluator, when the property has no base, but has cast", function() {
                        var sceneArg,
                            indexArg,
                            dotTempl1 = new Dot()
                                .propNumber(function(s,i) {
                                    sceneArg = s;
                                    indexArg = i;
                                    return "1";
                                }),

                            dotElem1 = dotTempl1.createElement(null, scene, 3);

                        dotElem1.propNumber;
                        expect(sceneArg).toBe(scene);
                        expect(indexArg).toBe(3);
                    });

                    Should("be passed to all evaluators, " +
                           "when the property has a base implementation, " +
                           "that delegates to the template's proto, " +
                           "which in turn delegates to the class' defaults", function() {
                        // NOTE: cannot spy, or delegate/base calls are not seen in function's text.
                        var value = {},
                            scene00, index00,
                            scene10, index10,
                            scene20, index20,
                            scene21, index21,

                            Dot1 = Dot.extend(),// has no defaults. defaults come from the element's template's defaults
                            Dot2 = Dot.extend(),

                            dotTempl0 = new Dot1()
                                .propAny(function(s, i) { scene10 = s; index10 = i; return this.delegate(); }),

                            dotTempl1 = new Dot2()
                                .proto(dotTempl0)
                                .propAny(function(s, i) { scene20 = s; index20 = i; return this.delegate(); })
                                .propAny(function(s, i) { scene21 = s; index21 = i; return this.delegate(); });

                        Dot2.type().add({
                            defaults: new Dot2()
                                .proto(Dot.defaults)
                                .propAny(function(s, i) { scene00 = s; index00 = i; return value; })
                        });

                        var dotElem1 = dotTempl1.createElement(null, scene, 3);
                        dotElem1.propAny;
                        expect(scene00).toBe(scene); expect(index00).toBe(3);
                        expect(scene10).toBe(scene); expect(index10).toBe(3);
                        expect(scene20).toBe(scene); expect(index20).toBe(3);
                        expect(scene21).toBe(scene); expect(index21).toBe(3);
                    });
                });

                That("has no cast", function() {
                    Should("return the value returned by the evaluator", function() {
                        var value = {},
                            dotTempl1 = new Dot()
                                .propAny(function() { return value; }),

                            dotElem1 = dotTempl1.createElement(null, scene);

                        expect(dotElem1.propAny).toBe(value);
                    });
                });

                That("has a cast", function() {
                    Should("return a value of the cast-type, when the evaluator returns a value of the cast-type", function() {
                        var dotTempl1 = new Dot()
                                .propAny(function() { return "1"; }),

                            dotElem1 = dotTempl1.createElement(null, scene);

                        expect(dotElem1.propAny).toBe("1");
                    });

                    Should("return a value of the cast-type, when the evaluator returns a value of a castable type", function() {
                        var dotTempl1 = new Dot()
                                .propNumber(function() { return "1"; }),

                            dotElem1 = dotTempl1.createElement(null, scene);

                        expect(dotElem1.propNumber).toBe(1);
                    });

                    Should("return a resolved variable value, when a property has a dynamic cast", function() {
                        var dotTempl1 = new Dot()
                                .propNumberFun(function() { return "%"; }),

                            dotElem1 = dotTempl1.createElement(null, scene);

                        expect(dotElem1.propNumberFun).toBe(0);
                    });
                });

                Should("evaluate it, only once per element", function() {
                    var count = 0,
                        dotTempl1 = new Dot()
                            .propNumber(function() { count++; return "1"; }),

                        dotElem1 = dotTempl1.createElement(null, scene);

                    dotElem1.propNumber;
                    expect(count).toBe(1);
                    dotElem1.propNumber;
                    expect(count).toBe(1);
                });

                That("delegates", function() {
                    And("has no base implementation", function() {
                        Should("return the value null", function() {
                            var dotTempl1 = new Dot()
                                    .propNumber(function() { return this.delegate(); }),

                                dotElem1 = dotTempl1.createElement();

                            expect(dotElem1.propNumber).toBe(null);
                        });
                    });

                    That("has a base implementation", function() {
                        Should("return the base value, " +
                               "when the top implementation is trivial", function() {
                            // NOTE: cannot spy, or delegate/base calls are not seen in function's text.
                            var o = {},
                                countP1 = 0,
                                countP2 = 0,
                                dotTempl1 = new Dot()
                                    .propAny(function() { countP1++; return o; })
                                    .propAny(function() { countP2++; return this.delegate(); }),

                                dotElem1 = dotTempl1.createElement();

                            expect(dotElem1.propAny).toBe(o);
                            expect(countP1).toBe(1);
                            expect(countP2).toBe(1);
                        });

                        Should("return the base-most value, " +
                               "when the base implementation delegates to the template's proto, " +
                               "which in turn delegates to the class' defaults", function() {
                            // NOTE: cannot spy, or delegate/base calls are not seen in function's text.
                            var value = {},
                                countP00 = 0,
                                countP10 = 0,
                                countP20 = 0,
                                countP21 = 0,
                                Dot1 = Dot.extend(),// has no defaults. defaults come from the element's template's defaults
                                Dot2 = Dot.extend(),

                                dotTempl0 = new Dot1()
                                    .propAny(function() { countP10++; return this.delegate(); }),

                                dotTempl1 = new Dot2()
                                    .proto(dotTempl0)
                                    .propAny(function() { countP20++; return this.delegate(); })
                                    .propAny(function() { countP21++; return this.delegate(); });

                            Dot2.type().add({
                                defaults: new Dot2()
                                    .proto(Dot.defaults)
                                    .propAny(function() { countP00++; return value; })
                            });

                            var dotElem1 = dotTempl1.createElement();
                            expect(dotElem1.propAny).toBe(value);
                            expect(countP00).toBe(1);
                            expect(countP10).toBe(1);
                            expect(countP20).toBe(1);
                            expect(countP21).toBe(1);
                        });
                    });
                });

                That("reads another property", function() {
                    Should("return the value of the other property", function() {
                        // NOTE: cannot spy, or delegate/base calls are not seen in function's text.
                        var value = {},

                            dotTempl1 = new Dot()
                                .propAny(function() { return value; })
                                .propAny2(function() { return this.propAny; }),

                            dotElem1 = dotTempl1.createElement();

                        expect(dotElem1.propAny2).toBe(value);
                    });
                });
            });

            describe("inheritance of property values -", function() {
                Should("inherit the value set within the proto of the parent", function() {
                    var templ = new Dot();
                    var protoTempl = new Dot()
                        .propPart({propAtomic: 1});

                    templ.proto(protoTempl);

                    var elem = templ.createElement();

                    expect(elem.propPart.propAtomic).toBe(1);
                });

                Should("inherit the value set within the defaults of the class of the parent", function() {
                    var Dot2 = Dot.extend();

                    Dot2.type().add({
                        defaults: new Dot2({
                            proto: Dot.defaults,
                            propPart: {
                                propAtomic: 1
                            }
                        })
                    });

                    var templ = new Dot2();
                    var elem  = templ.createElement();

                    expect(elem.propPart.propAtomic).toBe(1);
                });
            });

            describe("reading the static and interaction values of properties -", function() {

                Should("return the interaction value, if it is constant", function() {
                    var dotTempl1 = new Dot(),
                        f0 = function() { return 1; },
                        f1 = function() { return 2; };

                    dotTempl1
                        .propAtomic(f0)
                        .propAtomic$(f1);

                    var dotElem1 = dotTempl1.createElement(null, scene, 0);
                    expect(dotElem1.propAtomic).toBe(2);
                });

                Should("return the static value, when base is called and there is a single interaction evaluator", function() {
                    var dotTempl1 = new Dot(),
                        f0 = function() { return 1; },
                        f1 = function() { return 2 + this.base(); };

                    dotTempl1
                        .propAtomic(f0)
                        .propAtomic$(f1);

                    var dotElem1 = dotTempl1.createElement(null, scene, 0);
                    expect(dotElem1.propAtomic).toBe(3);
                });

                Should("return the static value, when the name of the property is called from an interaction evaluator", function() {
                    var dotTempl1 = new Dot(),
                        f0 = function() { return 1; },
                        f1 = function() { return 2 + this.propAtomic; };

                    dotTempl1
                        .propAtomic(f0)
                        .propAtomic$(f1);

                    var dotElem1 = dotTempl1.createElement(null, scene, 0);
                    expect(dotElem1.propAtomic).toBe(3);
                });

                Should("return the base-most constant interaction value, when base is called from other interaction evaluators", function() {
                    var dotTempl1 = new Dot(),
                        f0 = function() { return 1; },
                        f1 = function() { return 2; },
                        f2 = function() { return 2 + this.base(); },
                        f3 = function() { return 3 + this.base(); };

                    dotTempl1
                        .propAtomic(f0)
                        .propAtomic$(f1)
                        .propAtomic$(f2)
                        .propAtomic$(f3);

                    var dotElem1 = dotTempl1.createElement(null, scene, 0);
                    expect(dotElem1.propAtomic).toBe(7); // 3 + 2 + 2
                });

                Should("return the static value, when the name of the property is called from a middle interaction evaluator", function() {
                    var dotTempl1 = new Dot(),
                        f0 = function() { return 1; },
                        f1 = function() { return 2; },
                        f2 = function() { return 3 + this.propAtomic; },
                        f3 = function() { return this.base(); };

                    dotTempl1
                        .propAtomic(f0)
                        .propAtomic$(f1)
                        .propAtomic$(f2)
                        .propAtomic$(f3);

                    var dotElem1 = dotTempl1.createElement(null, scene, 0);
                    expect(dotElem1.propAtomic).toBe(4); // 3 + 1
                });

                Should("return `null` when base is called from a last stable evaluator", function() {
                    var dotTempl1 = new Dot(),
                        f0 = function() { return this.base(); },
                        f1 = function() { return this.base(); };

                    dotTempl1
                        .propAtomic(f0)
                        .propAtomic$(f1);

                    var dotElem1 = dotTempl1.createElement(null, scene, 0);
                    expect(dotElem1.propAtomic).toBe(null);
                });

                Should("return `null` when the property name is called from a middle stable evaluator", function() {
                    var dotTempl1 = new Dot(),
                        f0 = function() { return this.base(); },
                        f1 = function() { return this.propAtomic; },
                        f2 = function() { return this.base(); },
                        f3 = function() { return this.base(); };

                    dotTempl1
                        .propAtomic(f0)
                        .propAtomic(f1)
                        .propAtomic(f2)
                        .propAtomic$(f3);

                    var dotElem1 = dotTempl1.createElement(null, scene, 0);
                    expect(dotElem1.propAtomic).toBe(null);
                });

                Should("call all stable and interaction evaluators, " +
                       "in the right order, " +
                       "when the property has a base implementation, " +
                       "that delegates to the template's proto, " +
                       "which in turn delegates to the class' defaults", function() {

                    var index = 0,
                        index00, index00$,
                        index10, index10$,
                        index20, index20$,
                        index21, index21$,

                        Dot1 = Dot.extend(),// has no defaults. defaults come from the element's template's defaults
                        Dot2 = Dot.extend(),

                        dotTempl0 = new Dot1()
                            .propAtomic (function() { index10  = ++index; return this.base(); })
                            .propAtomic$(function() { index10$ = ++index; return this.base(); }),

                        dotTempl1 = new Dot2()
                            .proto(dotTempl0)
                            .propAtomic (function() { index20  = ++index; return this.base(); })
                            .propAtomic$(function() { index20$ = ++index; return this.base(); })
                            .propAtomic (function() { index21  = ++index; return this.base(); })
                            .propAtomic$(function() { index21$ = ++index; return this.base(); });

                    Dot2.type().add({
                        defaults: new Dot2()
                            .proto(Dot.defaults)
                            .propAtomic (function() { index00  = ++index; return this.base(); })
                            .propAtomic$(function() { index00$ = ++index; return this.base(); })
                    });

                    var dotElem1 = dotTempl1.createElement(null, scene, 3);
                    dotElem1.propAtomic;
                    expect(index21$).toBe(1);
                    expect(index20$).toBe(2);
                    expect(index10$).toBe(3);
                    expect(index00$).toBe(4);

                    expect(index21 ).toBe(5);
                    expect(index20 ).toBe(6);
                    expect(index10 ).toBe(7);
                    expect(index00 ).toBe(8);
                });

                describe("the element's scene and index arguments -", function() {
                    Should("be passed to the static and interaction evaluators", function() {
                        var value = {},
                            scene00, index00,
                            scene00$, index00$,

                            dotTempl0 = new Dot()
                                .propAtomic (function(s, i) { scene00  = s; index00  = i; return this.delegate(); })
                                .propAtomic$(function(s, i) { scene00$ = s; index00$ = i; return this.delegate(); });

                        var dotElem0 = dotTempl0.createElement(null, scene, 3);
                        dotElem0.propAtomic;

                        expect(scene00).toBe(scene);
                        expect(scene00$).toBe(scene);
                        expect(index00).toBe(3);
                        expect(index00$).toBe(3);
                    });

                    Should("be passed to all stable and interaction evaluators, " +
                           "when the property has a base implementation, " +
                           "that delegates to the template's proto, " +
                           "which in turn delegates to the class' defaults", function() {
                        // NOTE: cannot spy, or delegate/base calls are not seen in function's text.
                        var value = {},
                            scene00, index00, scene00$, index00$,
                            scene10, index10, scene10$, index10$,
                            scene20, index20, scene20$, index20$,
                            scene21, index21, scene21$, index21$,

                            Dot1 = Dot.extend(),// has no defaults. defaults come from the element's template's defaults
                            Dot2 = Dot.extend(),

                            dotTempl0 = new Dot1()
                                .propAtomic(function(s, i) { scene10 = s; index10 = i; return this.delegate(); })
                                .propAtomic$(function(s, i) { scene10$ = s; index10$ = i; return this.delegate(); }),

                            dotTempl1 = new Dot2()
                                .proto(dotTempl0)
                                .propAtomic(function(s, i) { scene20 = s; index20 = i; return this.delegate(); })
                                .propAtomic$(function(s, i) { scene20$ = s; index20$ = i; return this.delegate(); })
                                .propAtomic(function(s, i) { scene21 = s; index21 = i; return this.delegate(); })
                                .propAtomic$(function(s, i) { scene21$ = s; index21$ = i; return this.delegate(); });

                        Dot2.type().add({
                            defaults: new Dot2()
                                .proto(Dot.defaults)
                                .propAtomic(function(s, i) { scene00 = s; index00 = i; return this.delegate(); })
                                .propAtomic$(function(s, i) { scene00$ = s; index00$ = i; return this.delegate(); })
                        });

                        var dotElem1 = dotTempl1.createElement(null, scene, 3);
                        dotElem1.propAtomic;
                        expect(scene00).toBe(scene); expect(index00).toBe(3);
                        expect(scene10).toBe(scene); expect(index10).toBe(3);
                        expect(scene20).toBe(scene); expect(index20).toBe(3);
                        expect(scene21).toBe(scene); expect(index21).toBe(3);

                        expect(scene00$).toBe(scene); expect(index00$).toBe(3);
                        expect(scene10$).toBe(scene); expect(index10$).toBe(3);
                        expect(scene20$).toBe(scene); expect(index20$).toBe(3);
                        expect(scene21$).toBe(scene); expect(index21$).toBe(3);
                    });
                });

                describe("reading the value of other properties -", function() {
                    Should("read the stable value of the other property when read from the stable evaluator", function() {
                        var dotTempl1 = new Dot();

                        dotTempl1
                            .propNumber (function() { return 1; })
                            .propNumber$(function() { return 2; })

                            .propAtomic (function() { return this.propNumber;  })
                            .propAtomic$(function() { return 10 + this.base(); });

                        var dotElem1 = dotTempl1.createElement(null, scene, 0);
                        expect(dotElem1.propAtomic).toBe(11);
                    });

                    Should("read the interaction value of the other property when read from the interaction evaluator", function() {
                        var dotTempl1 = new Dot();

                        dotTempl1
                            .propNumber (function() { return 1; })
                            .propNumber$(function() { return 2; })

                            .propAtomic (function() { return 10;  })
                            .propAtomic$(function() { return 20 + this.propNumber; });

                        var dotElem1 = dotTempl1.createElement(null, scene, 0);
                        expect(dotElem1.propAtomic).toBe(22);
                    });

                    Should("resolve a cycle by returning null", function() {
                        var dotTempl1 = new Dot();

                        dotTempl1
                            .propNumber (function() { return this.propAtomic; })
                            .propNumber$(function() { return 2; })

                            .propAtomic (function() { return this.propNumber;  })
                            .propAtomic$(function() { return this.base(); });

                        var dotElem1 = dotTempl1.createElement(null, scene, 0);
                        expect(dotElem1.propAtomic).toBe(null);
                    });
                });

                describe("reading the value of other properties of an element of another element tree -", function() {
                    Should("read the stable value of the other property when read from the stable evaluator", function() {
                        var dotTempl1 = new Dot();
                        var dotTempl2 = new Dot();

                        dotTempl1
                        .propNumber (function() { return 1; })
                        .propNumber$(function() { return 2; })

                        dotTempl2
                        .propAtomic (function() { return dotElem1.propNumber; })
                        .propAtomic$(function() { return 10 + this.base(); });

                        var dotElem1 = dotTempl1.createElement(null, scene, 0);
                        var dotElem2 = dotTempl2.createElement(null, scene, 0);

                        expect(dotElem2.propAtomic).toBe(11);
                    });

                    Should("read the interaction value of the other property when read from the interaction evaluator", function() {
                        var dotTempl1 = new Dot();
                        var dotTempl2 = new Dot();

                        dotTempl1
                        .propNumber (function() { return 1; })
                        .propNumber$(function() { return 2; })

                        dotTempl2
                        .propAtomic (function() { return 10;  })
                        .propAtomic$(function() { return 20 + dotElem1.propNumber; });

                        var dotElem1 = dotTempl1.createElement(null, scene, 0);
                        var dotElem2 = dotTempl2.createElement(null, scene, 0);
                        expect(dotElem2.propAtomic).toBe(22);
                    });
                });

                describe("number of evaluations -", function() {
                    Should("call an interaction evaluator once, when read twice", function() {
                        var dotTempl1 = new Dot(),
                            count = 0;

                        dotTempl1
                            .propAtomic (function() { return 1;  })
                            .propAtomic$(function() { count++; return 2; });

                        var dotElem1 = dotTempl1.createElement(null, scene, 0);

                        dotElem1.propAtomic;
                        expect(count).toBe(1);

                        dotElem1.propAtomic;
                        expect(count).toBe(1);
                    });

                    Should("call an interaction evaluator twice, when read, invalidated interaction/atomic, and read again", function() {
                        var dotTempl1 = new Dot(),
                            count = 0;

                        dotTempl1
                            .propAtomic (function() { return 1;  })
                            .propAtomic$(function() { count++; return 2; });

                        var dotElem1 = dotTempl1.createElement(null, scene, 0);

                        dotElem1.propAtomic;
                        expect(count).toBe(1);
                        dotElem1.invalidateInteraction();
                        dotElem1.propAtomic;
                        expect(count).toBe(2);
                    });

                    Should("call an interaction evaluator twice, when read, invalidated interaction/atomic, and read again, but the stable once only", function() {
                        var dotTempl1 = new Dot(),
                            count0 = 0,
                            count1 = 0;

                        dotTempl1
                            .propAtomic (function() { count0++; return 1;  })
                            .propAtomic$(function() { count1++; return 2 + this.base(); });

                        var dotElem1 = dotTempl1.createElement(null, scene, 0);

                        dotElem1.propAtomic;
                        expect(count0).toBe(1);
                        expect(count1).toBe(1);
                        dotElem1.invalidateInteraction();
                        dotElem1.propAtomic;
                        expect(count0).toBe(1);
                        expect(count1).toBe(2);
                    });
                });
            });

            describe("reading the value of properties with builders", function() {
                When("reading an atomic, interaction property, with no evaluators", function() {
                    Should("call once, both the stable and interaction builders", function() {
                        var count0 = 0;
                        var count1 = 0;

                        var SubDot = cgf.dom.EntityTemplate.extend()
                            .property({
                                prop: propAtomic,
                                builderStable:      'atomicStable',
                                builderInteraction: 'atomicInteraction',
                                hasInteraction: true
                            });

                        SubDot.Element.methods({
                            _buildAtomicStable: function() {
                                count0++;
                            },

                            _buildAtomicInteraction: function() {
                                count1++;
                            }
                        });

                        var dotTempl1 = new SubDot();
                        var dotElem1 = dotTempl1.createElement();

                        expect(count0).toBe(0);
                        expect(count1).toBe(0);
                        dotElem1.propAtomic;
                        expect(count0).toBe(1);
                        expect(count1).toBe(1);
                    });

                    Should("call once, both the stable and interaction builders, " +
                           "even if the builders read the property as well", function() {
                        var count0 = 0;
                        var count1 = 0;

                        var SubDot = cgf.dom.EntityTemplate.extend()
                            .property({
                                prop: propAtomic,
                                builderStable:      'atomicStable',
                                builderInteraction: 'atomicInteraction',
                                hasInteraction: true
                            });

                        SubDot.Element.methods({
                            _buildAtomicStable: function() {
                                count0++;
                                this.propAtomic;
                            },

                            _buildAtomicInteraction: function() {
                                count1++;
                                this.propAtomic;
                            }
                        });

                        var dotTempl1 = new SubDot();
                        var dotElem1 = dotTempl1.createElement();

                        expect(count0).toBe(0);
                        expect(count1).toBe(0);
                        dotElem1.propAtomic;
                        expect(count0).toBe(1);
                        expect(count1).toBe(1);
                    });

                    Should("call once, both the stable and interaction builders, " +
                           "even if the property is read again", function() {
                        var count0 = 0;
                        var count1 = 0;

                        var SubDot = cgf.dom.EntityTemplate.extend()
                            .property({
                                prop: propAtomic,
                                builderStable:      'atomicStable',
                                builderInteraction: 'atomicInteraction',
                                hasInteraction: true
                            });

                        SubDot.Element.methods({
                            _buildAtomicStable: function() {
                                count0++;
                                this.propAtomic;
                            },

                            _buildAtomicInteraction: function() {
                                count1++;
                                this.propAtomic;
                            }
                        });

                        var dotTempl1 = new SubDot();
                        var dotElem1 = dotTempl1.createElement();

                        expect(count0).toBe(0);
                        expect(count1).toBe(0);
                        dotElem1.propAtomic;
                        expect(count0).toBe(1);
                        expect(count1).toBe(1);
                        dotElem1.propAtomic;
                        expect(count0).toBe(1);
                        expect(count1).toBe(1);
                    });

                    Should("call once, both the stable and interaction builders, " +
                           "even if the builders read that and another property", function() {
                        var count0 = 0;
                        var count1 = 0;

                        var SubDot = cgf.dom.EntityTemplate.extend()
                            .property({
                                prop: propAtomic,
                                builderStable:      'fooStable',
                                builderInteraction: 'fooInteraction',
                                hasInteraction: true
                            })
                            .property({
                                prop: propNumber,
                                builderStable:      'fooStable',
                                builderInteraction: 'fooInteraction',
                                hasInteraction: true
                            });

                        SubDot.Element.methods({
                            _buildFooStable: function() {
                                count0++;
                                this.propAtomic;
                                this.propNumber;
                            },

                            _buildFooInteraction: function() {
                                count1++;
                                this.propAtomic;
                                this.propNumber;
                            }
                        });

                        var dotTempl1 = new SubDot();
                        var dotElem1 = dotTempl1.createElement();

                        expect(count0).toBe(0);
                        expect(count1).toBe(0);
                        dotElem1.propAtomic;
                        expect(count0).toBe(1);
                        expect(count1).toBe(1);
                    });

                    Should("return the value modified by the builder", function() {
                        var SubDot = cgf.dom.EntityTemplate.extend()
                            .property({
                                prop: propAtomic,
                                builderStable: 'fooStable'
                            });

                        SubDot.Element.methods({
                            _buildFooStable: function() {
                                var v = this.propAtomic;
                                this.propAtomic = v + 10;
                            }
                        });

                        var dotTempl1 = new SubDot()
                            .propAtomic(2);

                        var dotElem1 = dotTempl1.createElement();

                        expect(dotElem1.propAtomic).toBe(12);
                    });

                    Should("throw if the element property setter is called outside of the builder", function() {
                        var SubDot = cgf.dom.EntityTemplate.extend()
                            .property({
                                prop: propAtomic,
                                builderStable: 'fooStable'
                            });

                        SubDot.Element.methods({
                            _buildFooStable: function() {
                            }
                        });

                        var dotTempl1 = new SubDot()
                            .propAtomic(2);

                        var dotElem1 = dotTempl1.createElement();

                        expect(function() {
                            dotElem1.propAtomic = 10;
                        }).toThrow();
                    });
                });
            });

            describe("calling builders directly -", function() {
                Should("be able to call a stable builder directly", function() {
                    var count = 0;
                    var SubDot = cgf.dom.EntityTemplate.extend()
                        .property({
                            prop: propAtomic,
                            builderStable: 'fooStable'
                        });

                    SubDot.Element.methods({
                        _buildFooStable: function() {
                            count++;
                        }
                    });

                    var dotTempl1 = new SubDot();

                    var dotElem1 = dotTempl1.createElement();

                    dotElem1.fooStable();

                    expect(count).toBe(1);
                });

                Should("be able to call an interaction builder directly", function() {
                    var count = 0;
                    var SubDot = cgf.dom.EntityTemplate.extend()
                        .property({
                            prop: propAtomic,
                            builderInteraction: 'fooInteraction'
                        });

                    SubDot.Element.methods({
                        _buildFooInteraction: function() {
                            count++;
                        }
                    });

                    var dotTempl1 = new SubDot();

                    var dotElem1 = dotTempl1.createElement();

                    dotElem1.fooInteraction();

                    expect(count).toBe(1);
                });

                Should("not reentry when calling directly", function() {
                    var count = 0;
                    var SubDot = cgf.dom.EntityTemplate.extend()
                        .property({
                            prop: propAtomic,
                            builderInteraction: 'fooInteraction'
                        });

                    SubDot.Element.methods({
                        _buildFooInteraction: function() {
                            count++;
                            this.fooInteraction();
                        }
                    });

                    var dotTempl1 = new SubDot();

                    var dotElem1 = dotTempl1.createElement();

                    dotElem1.fooInteraction();

                    expect(count).toBe(1);
                });
            });
        });
    });
});

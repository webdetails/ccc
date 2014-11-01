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

    describe("cgf.Template -", function () {
        describe("constructor anatomy -", function() {
            Should("be the value of cgf.Template.Element.Template", function() {
                var Templ = cgf.Template.Element.Template;
                expect(Templ).toBe(cgf.Template);
            });

            Should("have a 'defaults' property having a Template instance", function() {
                expect(cgf.Template.defaults != null).toBe(true);
                expect(cgf.Template.defaults instanceof cgf.Template).toBe(true);
            });
        });

        Should("be able to create a template instance", function() {
            new cgf.Template();
        });

        describe("#add and #content -", function() {
            Should("be able to create a child instance and add it to the parent", function() {
                var templ1 = new cgf.Template();
                var templ2 = new cgf.Template();

                expect(templ1.add(templ2)).toBe(templ2);
                expect(templ2.parent).toBe(templ1);
                expect(templ2.childIndex).toBe(0);
            });

            Should("create a child given a child template ctor", function() {
                var templ1 = new cgf.Template();
                var templ2 = templ1.add(cgf.Template);

                expect(templ2 instanceof cgf.Template).toBe(true);
                expect(templ2.parent).toBe(templ1);
                expect(templ2.childIndex).toBe(0);
            });

            Should("be able to add a config with a $type to the parent", function() {
                var templ1 = new cgf.Template();
                var templ2 = templ1.add({
                    $type: cgf.Template
                });

                expect(templ2 instanceof cgf.Template).toBe(true);
                expect(templ2.parent).toBe(templ1);
                expect(templ2.childIndex).toBe(0);
            });

            Should("be able to add a config with a $type factory to the parent", function() {
                var templ1 = new cgf.Template();
                var templ2 = templ1.add({
                    $type: function() { return new cgf.Template(); }
                });

                expect(templ2 instanceof cgf.Template).toBe(true);
                expect(templ2.parent).toBe(templ1);
                expect(templ2.childIndex).toBe(0);
            });

            Should("throw when #add is called with a config with a $type which is not a function", function() {
                var templ1 = new cgf.Template();
                expect(function() {
                    templ1.add({
                        $type: 1
                    });
                }).toThrow();
            });

            Should("throw when #add is called with a config with no $type", function() {
                var templ1 = new cgf.Template();
                expect(function() {
                    templ1.add({});
                }).toThrow();
            });

            Should("not be able to use #add to add an array of children to the parent", function() {
                var templ1 = new cgf.Template();
                expect(function(){
                    templ1.add([{
                        $type: cgf.Template
                    }]);
                }).toThrow();
            });

            Should("be able to use #content to add an array of children to the parent", function() {
                var templ1 = new cgf.Template(),
                    templ2 = templ1.content([cgf.Template, cgf.AdhocTemplate]);

                expect(templ2).toBe(templ1);

                var content = templ1.content();
                expect(def.array.is(content)).toBe(true);
                expect(content.length).toBe(2);
                expect(content[0] instanceof cgf.Template).toBe(true);
                expect(content[1] instanceof cgf.AdhocTemplate).toBe(true);
                expect(content[0]).not.toBe(content[1]);
            });
        });

        describe("#proto -", function() {
            Should("be able to set the proto property to another template", function() {
                new cgf.Template().proto(new cgf.Template());
            });

            Should("return a set proto value back", function() {
                var templ2 = new cgf.Template(),
                    templ3 = new cgf.Template();

                templ2.proto(templ3);

                expect(templ2.proto()).toBe(templ3);
            });

            Should("be able to set the proto property and receive the template back", function() {
                var templ2 = new cgf.Template(),
                    result = templ2.proto(new cgf.Template());

                expect(result).toBe(templ2);
            });

            describe("setting to the special cgf.proto.parent value", function() {
                Should("resolve to the parent when it has one", function() {
                    var templ1 = new cgf.Template();
                    var templ2 = templ1.add(cgf.Template);

                    templ2.proto(cgf.proto.parent);
                    expect(templ2.proto()).toBe(templ1);
                });

                Should("set internally, but return null, when it hasn't one", function() {
                    var templ2 = new cgf.Template();

                    templ2.proto(cgf.proto.parent);
                    expect(templ2.proto()).toBe(null);
                });

                Should("set internally, when it hasn't one, and resolve to the parent as soon as it has one", function() {
                    var templ1 = new cgf.Template();
                    var templ2 = new cgf.Template();

                    templ2.proto(cgf.proto.parent);
                    expect(templ2.proto()).toBe(null);
                    templ1.add(templ2);
                    expect(templ2.proto()).toBe(templ1);
                });

                // TODO: should restore the special cgf.proto.parent value if parent is "removed".
                // Cannot currently "remove" parent.
            });
        });

        describe("creating a template subclass -", function() {
            Should("work", function() {
                cgf.Template.extend();
            });

            Should("have an associated Element subclass", function() {
                var Dot = cgf.Template.extend();
                expect(def.fun.is(Dot.Element)).toBe(true);

                expect(Dot.Element).not.toBe(cgf.Element);
                expect(Dot.Element.prototype instanceof cgf.Element).toBe(true);
            });

            Should("have a 'defaults' property having the value of cgf.Template.defaults", function() {
                var Dot = cgf.Template.extend();
                expect(Dot.defaults != null).toBe(true);
                expect(Dot.defaults).toBe(cgf.Template.defaults);
            });

            Should("be possible to add a property to the template subclass", function() {
                var radiusProp = cgf.property('radius', Number);
                var Dot = cgf.Template.extend()
                    .property(radiusProp);

                expect(def.fun.is(Dot.prototype[radiusProp.shortName])).toBe(true);
            });

            Should("be possible to create an instance of a template subclass", function() {
                var Dot = cgf.Template.extend();
                var dot = new Dot();
                expect(dot != null).toBe(true);
            });

            Should("be possible to set a property in the template instance", function() {
                var radiusProp = cgf.property('radius', Number);
                var Dot = cgf.Template.extend()
                    .property(radiusProp);

                var dot = new Dot();

                expect(dot.radius()).toBeUndefined();
                dot.radius(1);
                expect(dot.radius()).toBe(1);
            });
        });

        describe("creating a template instance (2) -", function() {
            The("template instance", function() {
                Should("not have an Element class before creatElement is called", function() {
                    var templ1 = new cgf.Template();

                    expect(templ1.Element == null).toBe(true);
                });
            });

            When("#createElement is called", function() {
                var templ1 = new cgf.Template();
                var elem1 = templ1.createElement();

                The("template instance Element class", function() {
                    Should("be created", function() {
                        expect(templ1.Element != null).toBe(true);
                    });
                    Should("derive from the template class' Element class", function() {
                        expect(templ1.Element).not.toBe(cgf.Template.Element);
                        expect(templ1.Element.prototype instanceof cgf.Template.Element).toBe(true);
                    });
                });

                A("new element", function() {
                    Should("be returned", function() {
                        expect(elem1 != null).toBe(true);
                    });
                });
            });

            describe("of a template subclass -", function() {
                var Dot = cgf.Template.extend();

                The("template instance", function() {
                    Should("not have an Element class before createElement is called", function() {
                        var dot = new Dot();
                        expect(dot.Element == null).toBe(true);
                    });
                });

                When("#createElement is called", function() {
                    var dot = new Dot();
                    var elem1 = dot.createElement();

                    The("template instance Element class", function() {

                        Should("be created", function() {
                            expect(dot.Element != null).toBe(true);
                        });

                        Should("derive from the template class' Element class", function() {
                            expect(dot.Element).not.toBe(Dot.Element);
                            expect(dot.Element.prototype instanceof Dot.Element).toBe(true);
                        });
                    });

                    A("new element", function() {
                        Should("be returned", function() {
                            expect(elem1 != null).toBe(true);
                        });
                    });
                });

                That("has properties", function() {
                    var propNumber = cgf.property('propNumber', Number), // with cast
                        propAny = cgf.property('propAny'), // without cast

                        Dot2 = cgf.Template.extend()
                            .property(propNumber)
                            .property(propAny);

                    When("#createElement is called", function() {
                        var dot = new Dot2();

                        dot.createElement();

                        var DotElement = dot.Element;

                        The("template instance Element class", function() {
                            Should("be created", function() {
                                expect(DotElement != null).toBe(true);
                            });

                            Should("derive from the template class' Element class", function() {
                                expect(DotElement).not.toBe(Dot2.Element);
                                expect(DotElement.prototype instanceof Dot2.Element).toBe(true);
                            });

                            Should("have property getters", function() {
                                var propDesc = Object.getOwnPropertyDescriptor(DotElement.prototype, 'propNumber');
                                expect(!!propDesc).toBe(true);
                                expect(typeof propDesc.get).toBe('function');

                                var propDesc = Object.getOwnPropertyDescriptor(DotElement.prototype, 'propAny');
                                expect(!!propDesc).toBe(true);
                                expect(typeof propDesc.get).toBe('function');
                            });

                            Should("have property eval methods", function() {
                                expect(typeof DotElement.prototype._eval_propNumber).toBe('function');
                                expect(typeof DotElement.prototype._eval_propAny).toBe('function');
                            });
                        })
                    });
                });
            });
        });

        // TODO: Test - #data as synonym for #scenes
        // TODO: Test - #base and #delegate differences
        // TODO: Test - Off-dom proto template works? Like in protovis' off-root proto marks.
        // TODO: Test - Configure template content/children like in c2
        //       need template meta-type registry for creating arbitrary
        //       {$type: "canvas"} descriptions...
        // TODO: Test - Re-render subtree

        // TODO: Test - Reset template property value?
        describe("template properties -", function() {
            var propNumber = cgf.property('propNumber', Number),
                propAny = cgf.property('propAny'),
                propNumberOne = cgf.property('propNumberOne', function NumberOne(v) { return v === 1 ? 1 : null; }),

                // Dynamic cast function
                propNumberFun = cgf.property('propNumberFun', function NumberFun(v) {
                    if(typeof v === 'string') {
                        return function(s, i) { return i; };
                    }
                    return +v;
                }),

                Dot = cgf.Template.extend()
                    .property(propNumber)
                    .property(propAny)
                    .property(propNumberOne)
                    .property(propNumberFun);

            describe("setting the value of template instance properties -", function() {
                When("property does not have a cast", function() {
                    Should("set a specified constant value, of any type (except function)", function() {
                        var dot = new Dot().propAny(1);
                        expect(dot.propAny()).toBe(1);

                        dot.propAny("2");
                        expect(dot.propAny()).toBe("2");

                        var o = {};
                        dot.propAny(o);
                        expect(dot.propAny()).toBe(o);
                    });

                    Should("set a specified variable value", function() {
                        var p = function(s,i) { return i; };
                        var dot = new Dot().propNumber(p);
                        expect(dot.propNumber()).toBe(p);
                    });
                });

                When("property has a cast", function() {
                    Should("set and cast a specified constant value", function() {
                        var dot = new Dot().propNumber(1);
                        expect(dot.propNumber()).toBe(1);
                        dot.propNumber("2");
                        expect(dot.propNumber()).toBe(2);
                    });

                    Should("set a specified variable value", function() {
                        var p = function(s,i) { return i; };
                        var dot = new Dot().propNumber(p);
                        expect(dot.propNumber()).toBe(p);
                    });

                    Should("not change to a constant value if the cast function returns null (meaning invalid)", function() {
                        var dot = new Dot().propNumberOne(1);
                        expect(dot.propNumberOne()).toBe(1);
                        dot.propNumberOne(2);
                        expect(dot.propNumberOne()).toBe(1);
                    });

                    Should("set a constant value on a property with a dynamic cast", function() {
                        var dot = new Dot().propNumberFun("%");
                        var fun = dot.propNumberFun();

                        expect(def.fun.is(fun)).toBe(true);
                    });

                    Should("set a variable value on a property with a dynamic cast", function() {
                        var dot = new Dot().propNumberFun(function() { return "%"});
                        var fun = dot.propNumberFun();
                        expect(def.fun.is(fun)).toBe(true);
                    });
                });
            });
        });

        describe("element properties -", function() {
            var propNumber = cgf.property('propNumber', Number), // with cast
                propAny = cgf.property('propAny'), // without cast
                propAny2 = cgf.property('propAny2'), // without cast

                // Dynamic cast function
                propNumberFun = cgf.property('propNumberFun', function NumberFun(v) {
                    if(typeof v === 'string') {
                        return function(s, i) { return i; };
                    }
                    return +v;
                }),

                Dot = cgf.AdhocTemplate.extend()
                    .property(propNumber)
                    .property(propAny)
                    .property(propAny2)
                    .property(propNumberFun),

                scene = {foo: {}, bar: 2};

            describe("reading the value of an element property that was not set -", function() {
                Should("return null", function() {
                    var dotTempl1 = new Dot(),
                        dotElem1 = dotTempl1.createElement();

                    expect(dotElem1.propNumber).toBe(null);
                });

                Should("return the constant value set in the template's proto", function() {
                    var Dot2 = cgf.Template.extend()
                            .property(propNumber);

                    Dot2.type().add({
                        "defaults": new Dot().extend(cgf.Template.defaults).propNumber(1)
                    });

                    var dotTempl0 = new Dot2().propNumber(2),
                        dotTempl1 = new Dot2().proto(dotTempl0),
                        dotElem1 = dotTempl1.createElement();

                    expect(dotElem1.propNumber).toBe(2);
                });

                Should("return the constant value set in the template's class defaults instance", function() {
                    var Dot2 = cgf.Template.extend()
                            .property(propNumber);

                    Dot2.type().add({
                        "defaults": new Dot().extend(cgf.Template.defaults).propNumber(1)
                    });

                    var dotTempl1 = new Dot2(),
                        dotElem1 = dotTempl1.createElement();

                    expect(dotElem1.propNumber).toBe(1);

                    // ---------------------
                    // Even with a proto in the middle

                    dotTempl1 = new Dot2().proto(new Dot2());

                    var dotElem1 = dotTempl1.createElement();
                    expect(dotElem1.propNumber).toBe(1);
                });
            });

            describe("reading the value of a constant property", function() {
                Should("return the constant value, when the property has no cast", function() {
                    var value = {},
                        dotTempl1 = new Dot()
                            .propAny(value),

                        dotElem1 = dotTempl1.createElement(null, scene);

                    expect(dotElem1.propAny).toBe(value);
                });

                Should("return the constant value, when the property has a cast", function() {
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
                               "when the base implementation is trivial", function() {
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

                        Should("return the base value, " +
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
        });
    });
});
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

    describe("cgf.dom.Template -", function () {

        // TODO: Test - #data as synonym for #scenes
        // TODO: Test - #base and #delegate differences
        // TODO: Test - Off-dom proto template works? Like in protovis' off-root proto marks.
        // TODO: Test - Configure template content/children like in c2
        //       need template meta-type registry for creating arbitrary
        //       {$type: "canvas"} descriptions...
        // TODO: Test - Re-render subtree

        // TODO: Test - Reset template property value?

        describe("properties -", function() {
            describe("setting the value of template instance properties -", function() {
                var propNumber = cgf.dom.property('propNumber', Number),
                    propAny = cgf.dom.property('propAny'),
                    propNumberOne = cgf.dom.property('propNumberOne', function NumberOne(v) {
                        return v === 1 ? 1 : null;
                    }),

                    // Dynamic cast function
                    propNumberFun = cgf.dom.property('propNumberFun', function NumberFun(v) {
                        if(typeof v === 'string') {
                            return function(s, i) { return i; };
                        }
                        return +v;
                    }),

                    Dot = cgf.dom.Template.extend()
                        .property(propNumber)
                        .property(propAny)
                        .property(propNumberOne)
                        .property(propNumberFun);

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

            describe("static and interaction -", function() {
                var propAtomic = cgf.dom.property('propAtomic', Number);

                Should("be able to set the stable constant value of an atomic interaction template property", function() {
                    var SubDot = cgf.dom.Template.extend()
                        .property({prop: propAtomic, hasInteraction: true});

                    var templ0 = new SubDot();
                    templ0.propAtomic(1);

                    expect(templ0.propAtomic()).toBe(1);
                });

                Should("be able to set the interaction constant value of an atomic interaction template property", function() {
                    var SubDot = cgf.dom.Template.extend()
                        .property({prop: propAtomic, hasInteraction: true});

                    var templ0 = new SubDot();
                    templ0.propAtomic$(1);

                    expect(templ0.propAtomic$()).toBe(1);
                });

                Should("be able to set the stable and interaction constant values of an atomic interaction template property", function() {
                    var SubDot = cgf.dom.Template.extend()
                        .property({prop: propAtomic, hasInteraction: true});

                    var templ0 = new SubDot();
                    templ0.propAtomic(1);
                    templ0.propAtomic$(2);

                    expect(templ0.propAtomic()).toBe(1);
                    expect(templ0.propAtomic$()).toBe(2);
                });

                Should("be able to set the stable and interaction variable values of an atomic interaction template property", function() {
                    var SubDot = cgf.dom.Template.extend()
                        .property({prop: propAtomic, hasInteraction: true});

                    var templ0 = new SubDot(),
                        f0 = function() { return 1; },
                        f1 = function() { return 2; };

                    templ0.propAtomic(f0);
                    templ0.propAtomic$(f1);

                    expect(templ0.propAtomic()).toBe(f0);
                    expect(templ0.propAtomic$()).toBe(f1);
                });

                Should("throw when attempting to define an interaction template property of a Part type", function() {
                    var MyPart = cgf.dom.PartTemplate.extend()
                        .property(propAtomic);
                    var propPart = cgf.dom.property('propPart', {type: MyPart});
                    var SubDot = cgf.dom.Template.extend();

                    expect(function() {
                        SubDot.property({
                            prop: propPart,
                            hasInteraction: true
                        });
                    }).toThrow();
                });

                Should("throw when attempting to define an interaction template property of an Entity type", function() {
                    var propEnt = cgf.dom.property('propEnt', {type: cgf.dom.EntityTemplate});
                    var SubDot = cgf.dom.Template.extend();

                    expect(function() {
                        SubDot.property({
                            prop: propEnt,
                            hasInteraction: true
                        });
                    }).toThrow();
                });
            });

            describe("builders -", function() {
                var propAtomic = cgf.dom.property('propAtomic', Number);
                var MyPart = cgf.dom.PartTemplate.extend()
                    .property(propAtomic);

                Should("be able to define the stable builder of a template property", function() {
                    var SubDot = cgf.dom.Template.extend()
                        .property({
                            prop: propAtomic,
                            builderStable: 'atomicStable'
                        });
                });

                Should("be able to define the interaction builder of an atomic, interaction template property", function() {
                    var SubDot = cgf.dom.Template.extend()
                        .property({
                            prop: propAtomic,
                            builderInteraction: 'atomicInteraction',
                            hasInteraction: true
                        });
                });

                Should("be able to define both stable and interaction builders of an atomic, interaction template property", function() {
                    var SubDot = cgf.dom.Template.extend()
                        .property({
                            prop: propAtomic,
                            builderStable:      'atomicStable',
                            builderInteraction: 'atomicInteraction',
                            hasInteraction: true
                        });
                });

                Should("create a setter in the element class for a property with a stable builder", function() {
                    var SubDot = cgf.dom.Template.extend()
                        .property({
                            prop: propAtomic,
                            builderStable: 'atomicStable'
                            //builderInteraction: 'atomicInteraction',
                            //hasInteraction: true
                        });

                    var dotTempl1 = new SubDot();
                    dotTempl1.createElement(); // Ensure Element class has been created

                    var propDesc = Object.getOwnPropertyDescriptor(dotTempl1.Element.prototype, 'propAtomic');
                    expect(propDesc != null).toBe(true);
                    expect(typeof propDesc.set).toBe('function');
                });

                Should("create a setter in the element class for a property with an interaction builder", function() {
                    var SubDot = cgf.dom.Template.extend()
                        .property({
                            prop: propAtomic,
                            builderInteraction: 'atomicInteraction',
                            hasInteraction: true
                        });

                    var dotTempl1 = new SubDot();
                    dotTempl1.createElement(); // Ensure Element class has been created

                    var propDesc = Object.getOwnPropertyDescriptor(dotTempl1.Element.prototype, 'propAtomic');
                    expect(propDesc != null).toBe(true);
                    expect(typeof propDesc.set).toBe('function');
                });

                Should("create a setter in the element class for a property with a stable and an interaction builder", function() {
                    var SubDot = cgf.dom.Template.extend()
                        .property({
                            prop: propAtomic,
                            builderStable: 'atomicStable',
                            builderInteraction: 'atomicInteraction',
                            hasInteraction: true
                        });

                    var dotTempl1 = new SubDot();
                    dotTempl1.createElement(); // Ensure Element class has been created

                    var propDesc = Object.getOwnPropertyDescriptor(dotTempl1.Element.prototype, 'propAtomic');
                    expect(propDesc != null).toBe(true);
                    expect(typeof propDesc.set).toBe('function');
                });

                Should("not create a setter in the element class for a property with no builders", function() {
                    var SubDot = cgf.dom.Template.extend()
                        .property({
                            prop: propAtomic,
                            hasInteraction: true
                        });

                    var dotTempl1 = new SubDot();
                    dotTempl1.createElement(); // Ensure Element class has been created

                    var propDesc = Object.getOwnPropertyDescriptor(dotTempl1.Element.prototype, 'propAtomic');
                    expect(propDesc != null).toBe(true);
                    expect(typeof propDesc.set).toBe('undefined');
                });

                Should("throw when attempting to define an interaction builder for a non-interaction template property", function() {
                    var SubDot = cgf.dom.Template.extend();

                    expect(function() {
                        SubDot.property({
                            prop: propAtomic,
                            builderInteraction: 'atomicInteraction',
                            hasInteraction: false
                        });
                    }).toThrow();
                });

                Should("throw when attempting to define an interaction builder that already is a stable builder", function() {
                    var SubDot = cgf.dom.Template.extend();

                    expect(function() {
                        SubDot.property({
                            prop: propNumber,
                            builderStable: 'foo',
                            hasInteraction: false
                        })
                        .property({
                            prop: propAtomic,
                            builderInteraction: 'foo',
                            hasInteraction: false
                        });
                    }).toThrow();
                });

                Should("throw when attempting to define a stable builder that already is an interaction builder", function() {
                    var SubDot = cgf.dom.Template.extend();

                    expect(function() {
                        SubDot.property({
                            prop: propNumber,
                            builderInteraction: 'foo',
                            hasInteraction: false
                        })
                        .property({
                            prop: propAtomic,
                            builderStable: 'foo',
                            hasInteraction: false
                        });
                    }).toThrow();
                });
            });

        });

    });
});

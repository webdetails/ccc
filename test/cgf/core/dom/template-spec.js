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
        describe("constructor anatomy -", function() {
            Should("be the value of cgf.dom.Template.Element.Template", function() {
                var Templ = cgf.dom.Template.Element.Template;
                expect(Templ).toBe(cgf.dom.Template);
            });

            Should("have a 'defaults' property having a Template instance", function() {
                expect(cgf.dom.Template.defaults != null).toBe(true);
                expect(cgf.dom.Template.defaults instanceof cgf.dom.Template).toBe(true);
            });
        });

        Should("be able to create a template instance", function() {
            new cgf.dom.Template();
        });

        describe("#add and #content -", function() {
            Should("be able to create a child instance and add it to the parent", function() {
                var templ1 = new cgf.dom.EntityTemplate();
                var templ2 = new cgf.dom.EntityTemplate();

                expect(templ1.add(templ2)).toBe(templ2);
                expect(templ2.parent).toBe(templ1);
                expect(templ2.childIndex).toBe(0);
            });

            Should("create a child given a child template ctor", function() {
                var templ1 = new cgf.dom.EntityTemplate();
                var templ2 = templ1.add(cgf.dom.Template);

                expect(templ2 instanceof cgf.dom.Template).toBe(true);
                expect(templ2.parent).toBe(templ1);
                expect(templ2.childIndex).toBe(0);
            });

            Should("be able to add a config with a $type to the parent", function() {
                var templ1 = new cgf.dom.EntityTemplate();
                var templ2 = templ1.add({
                    $type: cgf.dom.Template
                });

                expect(templ2 instanceof cgf.dom.Template).toBe(true);
                expect(templ2.parent).toBe(templ1);
                expect(templ2.childIndex).toBe(0);
            });

            Should("be able to add a config with a $type factory to the parent", function() {
                var templ1 = new cgf.dom.EntityTemplate();
                var templ2 = templ1.add({
                    $type: function() { return new cgf.dom.Template(); }
                });

                expect(templ2 instanceof cgf.dom.Template).toBe(true);
                expect(templ2.parent).toBe(templ1);
                expect(templ2.childIndex).toBe(0);
            });

            Should("throw when #add is called with a config with a $type which is not a function", function() {
                var templ1 = new cgf.dom.EntityTemplate();
                expect(function() {
                    templ1.add({
                        $type: 1
                    });
                }).toThrow();
            });

            Should("throw when #add is called with a config with no $type", function() {
                var templ1 = new cgf.dom.EntityTemplate();
                expect(function() {
                    templ1.add({});
                }).toThrow();
            });

            Should("not be able to use #add to add an array of children to the parent", function() {
                var templ1 = new cgf.dom.EntityTemplate();
                expect(function(){
                    templ1.add([{
                        $type: cgf.dom.Template
                    }]);
                }).toThrow();
            });

            Should("be able to use #content to add an array of children to the parent", function() {
                var templ1 = new cgf.dom.EntityTemplate(),
                    templ2 = templ1.content([cgf.dom.Template, cgf.dom.EntityTemplate]);

                expect(templ2).toBe(templ1);

                var content = templ1.content();
                expect(def.array.is(content)).toBe(true);
                expect(content.length).toBe(2);
                expect(content[0] instanceof cgf.dom.Template).toBe(true);
                expect(content[1] instanceof cgf.dom.EntityTemplate).toBe(true);
                expect(content[0]).not.toBe(content[1]);
            });
        });

        describe("#proto -", function() {
            Should("be able to set the proto property to another template", function() {
                new cgf.dom.Template().proto(new cgf.dom.Template());
            });

            Should("return a set proto value back", function() {
                var templ2 = new cgf.dom.Template(),
                    templ3 = new cgf.dom.Template();

                templ2.proto(templ3);

                expect(templ2.proto()).toBe(templ3);
            });

            Should("be able to set the proto property and receive the template back", function() {
                var templ2 = new cgf.dom.Template(),
                    result = templ2.proto(new cgf.dom.Template());

                expect(result).toBe(templ2);
            });

            describe("setting to the special cgf.dom.proto.parent value", function() {
                Should("resolve to the parent when it has one", function() {
                    var templ1 = new cgf.dom.EntityTemplate();
                    var templ2 = templ1.add(cgf.dom.Template);

                    templ2.proto(cgf.dom.proto.parent);
                    expect(templ2.proto()).toBe(templ1);
                });

                Should("set internally, but return null, when it hasn't one", function() {
                    var templ2 = new cgf.dom.EntityTemplate();

                    templ2.proto(cgf.dom.proto.parent);
                    expect(templ2.proto()).toBe(null);
                });

                Should("set internally, when it hasn't one, and resolve to the parent as soon as it has one", function() {
                    var templ1 = new cgf.dom.EntityTemplate();
                    var templ2 = new cgf.dom.Template();

                    templ2.proto(cgf.dom.proto.parent);
                    expect(templ2.proto()).toBe(null);
                    templ1.add(templ2);
                    expect(templ2.proto()).toBe(templ1);
                });

                // TODO: should restore the special cgf.dom.proto.parent value if parent is "removed".
                // Cannot currently "remove" parent.
            });
        });

        describe("creating a template subclass -", function() {
            Should("work", function() {
                cgf.dom.Template.extend();
            });

            Should("have an associated Element subclass", function() {
                var Dot = cgf.dom.Template.extend();
                expect(def.fun.is(Dot.Element)).toBe(true);

                expect(Dot.Element).not.toBe(cgf.dom.Element);
                expect(Dot.Element.prototype instanceof cgf.dom.Element).toBe(true);
            });

            Should("have a 'defaults' property having the value of cgf.dom.Template.defaults", function() {
                var Dot = cgf.dom.Template.extend();
                expect(Dot.defaults != null).toBe(true);
                expect(Dot.defaults).toBe(cgf.dom.Template.defaults);
            });

            Should("be possible to add a property to the template subclass", function() {
                var radiusProp = cgf.dom.property('radius', Number);
                var Dot = cgf.dom.Template.extend()
                    .property(radiusProp);

                expect(def.fun.is(Dot.prototype[radiusProp.shortName])).toBe(true);
            });

            Should("be possible to create an instance of a template subclass", function() {
                var Dot = cgf.dom.Template.extend();
                var dot = new Dot();
                expect(dot != null).toBe(true);
            });

            Should("be possible to set a property in the template instance", function() {
                var radiusProp = cgf.dom.property('radius', Number);
                var Dot = cgf.dom.Template.extend()
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
                    var templ1 = new cgf.dom.Template();

                    expect(templ1.Element == null).toBe(true);
                });
            });

            When("#createElement is called", function() {
                var templ1 = new cgf.dom.Template();
                var elem1 = templ1.createElement();

                The("template instance Element class", function() {
                    Should("be created", function() {
                        expect(templ1.Element != null).toBe(true);
                    });
                    Should("derive from the template class' Element class", function() {
                        expect(templ1.Element).not.toBe(cgf.dom.Template.Element);
                        expect(templ1.Element.prototype instanceof cgf.dom.Template.Element).toBe(true);
                    });
                });

                A("new element", function() {
                    Should("be returned", function() {
                        expect(elem1 != null).toBe(true);
                    });
                });
            });

            describe("of a template subclass -", function() {
                var Dot = cgf.dom.Template.extend();

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
                    var propNumber = cgf.dom.property('propNumber', Number), // with cast
                        propAny = cgf.dom.property('propAny'), // without cast

                        Dot2 = cgf.dom.Template.extend()
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
                        })
                    });
                });
            });
        });

        describe("defining static and interaction properties", function() {
            var propAtomic = cgf.dom.property('propAtomic', Number);

            Should("allow defining a template with a non-interaction atomic property", function() {
                var SubDot = cgf.dom.Template.extend()
                    .property({prop: propAtomic, hasInteraction: false});
            });

            Should("allow defining a template with an interaction atomic property", function() {
                var SubDot = cgf.dom.Template.extend()
                    .property({prop: propAtomic, hasInteraction: true});
            });

            Should("define a template accessor for the interaction value", function() {
                var SubDot = cgf.dom.Template.extend()
                    .property({prop: propAtomic, hasInteraction: true});

                expect(typeof SubDot.prototype.propAtomic ).toBe('function');
                expect(typeof SubDot.prototype.propAtomic$).toBe('function');
                expect(SubDot.prototype.propAtomic).not.toBe(SubDot.prototype.propAtomic$);
            });
        });
    });
});

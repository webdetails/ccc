define([
    'ccc/cgf',
    'ccc/def',
    'test/utils'
], function(cgf, def, utils) {

    /*global describe:true, it:true, expect:true*/

    var When   = utils.describeTerm("when"),
        With   = utils.describeTerm("with"),
        The    = utils.describeTerm("the"),
        Should = utils.itTerm("should");

    describe("cgf.Template - #spawn - ", function () {

        When("spawning a template hierarchy", function() {
            With("a single root scene", function() {
                var templA = new cgf.Template()
                    .add(cgf.Template)
                    .parent
                    .add(cgf.Template)
                    .parent,

                    templB = templA.children[0],
                    templC = templA.children[1];

                expect(templB != null).toBe(true);
                expect(templC != null).toBe(true);

                var scene = {};

                The("spawned element hierarchy", function() {
                    Should("have the structure of the template", function() {
                        var elems = templA.spawn(scene);
                        expect(def.array.is(elems)).toBe(true);
                        expect(elems.length).toBe(1);

                        var elemA = elems[0];
                        expect(elemA instanceof templA.Element).toBe(true);
                        expect(elemA.childGroups.length).toBe(2);

                        var elemsB = elemA.childGroups[0];
                        expect(elemsB instanceof templB.Element).toBe(true);
                        expect(!elemsB.childGroups).toBe(true);

                        var elemsC = elemA.childGroups[1];
                        expect(elemsC instanceof templC.Element).toBe(true);
                        expect(!elemsC.childGroups).toBe(true);
                    });

                    Should("generate elements with the same scene", function() {
                        var elems = templA.spawn(scene);

                        var elemA = elems[0];
                        expect(elemA.scene).toBe(scene);

                        var elemsB = elemA.childGroups[0];
                        expect(elemsB.scene).toBe(scene);

                        var elemsC = elemA.childGroups[1];
                        expect(elemsC.scene).toBe(scene);
                    });

                    Should("generate elements with index 0", function() {
                        var elems = templA.spawn(scene);

                        var elemA = elems[0];
                        expect(elemA.index).toBe(0);

                        var elemsB = elemA.childGroups[0];
                        expect(elemsB.index).toBe(0);

                        var elemsC = elemA.childGroups[1];
                        expect(elemsC.index).toBe(0);
                    });
                });
            });

            With("two root scenes, returned by root-template#scenes", function() {
                var sceneA = {},
                    sceneB = {},
                    scene0 = {children: [sceneA, sceneB]},

                    templA = new cgf.Template()
                        .scenes(function(scene) { return scene.children; })
                        .add(cgf.Template)
                        .parent
                        .add(cgf.Template)
                        .parent,

                    templB = templA.children[0],
                    templC = templA.children[1];

                expect(templB != null).toBe(true);
                expect(templC != null).toBe(true);

                function testElementHierachyStructure(elemA) {
                    expect(elemA instanceof templA.Element).toBe(true);
                    expect(elemA.childGroups.length).toBe(2);

                    var elemsB = elemA.childGroups[0];
                    expect(elemsB instanceof templB.Element).toBe(true);
                    expect(!elemsB.childGroups).toBe(true);

                    var elemsC = elemA.childGroups[1];
                    expect(elemsC instanceof templC.Element).toBe(true);
                    expect(!elemsC.childGroups).toBe(true);
                }

                function testElementHierachyScene(elemA, scene) {
                    expect(elemA.scene).toBe(scene);

                    var elemsB = elemA.childGroups[0];
                    expect(elemsB.scene).toBe(scene);

                    var elemsC = elemA.childGroups[1];
                    expect(elemsC.scene).toBe(scene);
                }

                function testElementHierachyIndex(elemA, index) {
                    expect(elemA.index).toBe(index);

                    var elemsB = elemA.childGroups[0];
                    expect(elemsB.index).toBe(0);

                    var elemsC = elemA.childGroups[1];
                    expect(elemsC.index).toBe(0);
                }

                The("two spawned element hierarchies", function() {
                    Should("have the structure of the template", function() {
                        var elems = templA.spawn(scene0);

                        expect(def.array.is(elems)).toBe(true);
                        expect(elems.length).toBe(2);

                        testElementHierachyStructure(elems[0]);
                        testElementHierachyStructure(elems[1]);
                    });

                    Should("generate elements with the same scene", function() {
                        var elems = templA.spawn(scene0);

                        testElementHierachyScene(elems[0], sceneA);
                        testElementHierachyScene(elems[1], sceneB);
                    });

                    Should("generate elements with index 0", function() {
                        var elems = templA.spawn(scene0);

                        testElementHierachyIndex(elems[0], 0);
                        testElementHierachyIndex(elems[1], 1);
                    });
                });
            });

            Should("only create child Elements for applicable parent Elements", function() {
                var sceneA = {x: 1},
                    sceneB = {x: 2},
                    scene0 = {children: [sceneA, sceneB]},

                    templA = new cgf.Template()
                        .scenes(function(scene) { return scene.children; })
                        .add(cgf.Template)
                        .applicable(function(scene) { return scene.x > 1; })
                        .add(cgf.Template)
                        .parent
                        .parent,

                    templB = templA.children[0],
                    templC = templB.children[0];

                expect(templB != null).toBe(true);
                expect(templC != null).toBe(true);

                // ------------

                var elems = templA.spawn(scene0);
                expect(elems.length).toBe(2);

                var elemA = elems[0],
                    elemsB = elemA.childGroups[0];

                expect(elemsB instanceof templB.Element).toBe(true);
                expect(!elemsB.childGroups).toBe(true);

                elemA = elems[1];

                elemsB = elemA.childGroups[0];
                expect(elemsB instanceof templB.Element).toBe(true);

                var elemsC = elemsB.childGroups[0];
                expect(elemsC instanceof templC.Element).toBe(true);
            });
        });

        When("a child template has a `scenes` that returns more than one scene", function() {
            var templRoot = new cgf.Template();

            var templChild = templRoot.add(cgf.Template)
                .scenes(function(ps) { return ps.children; });

            var sceneA = {}, sceneB = {},
                parentScene = {children: [sceneA, sceneB]};

            Should("result in a child group array with one element per scene", function() {
                var elems = templRoot.spawn(parentScene);
                expect(def.array.is(elems)).toBe(true);
                expect(elems.length).toBe(1);

                var elemRoot = elems[0];
                expect(elemRoot instanceof templRoot.Element).toBe(true);
                expect(elemRoot.childGroups.length).toBe(1);

                var elemsChild = elemRoot.childGroups[0];
                expect(elemsChild instanceof Array).toBe(true);
                expect(elemsChild.length).toBe(2);

                expect(elemsChild[0] instanceof templChild.Element).toBe(true);
                expect(elemsChild[1] instanceof templChild.Element).toBe(true);
                expect(!elemsChild[0].childGroups).toBe(true);
                expect(!elemsChild[1].childGroups).toBe(true);
            });
        });

        When("a child template has a `scenes` that returns a single scene", function() {
            var templRoot = new cgf.Template();

            var templChild = templRoot.add(cgf.Template)
                .scenes(function(ps) { return [ps]; });

            var parentScene = {};

            Should("result in a degenerate child group, set to the single child element", function() {
                var elems = templRoot.spawn(parentScene);
                expect(def.array.is(elems)).toBe(true);
                expect(elems.length).toBe(1);

                var elemRoot = elems[0];
                expect(elemRoot instanceof templRoot.Element).toBe(true);
                expect(elemRoot.childGroups.length).toBe(1);

                var elemsChild = elemRoot.childGroups[0];
                expect(elemsChild instanceof templChild.Element).toBe(true);
                expect(!elemsChild.childGroups).toBe(true);
            });
        });
    });
});
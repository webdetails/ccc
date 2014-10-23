define([
    'ccc/cgf',
    'ccc/def',
    'test/utils'
], function(cgf, def, utils) {

    var When   = utils.describeTerm("when"),
        With   = utils.describeTerm("with"),
        The    = utils.describeTerm("the"),
        Should = utils.itTerm("should");

    describe("cgf.Template - template spawning - ", function () {

        When("spawning a template hierarchy", function() {
            With("a single scene", function() {
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
                        expect(elemsB.length).toBe(1);
                        expect(elemsB[0] instanceof templB.Element).toBe(true);
                        expect(!elemsB[0].childGroups).toBe(true);

                        var elemsC = elemA.childGroups[1];
                        expect(elemsC.length).toBe(1);
                        expect(elemsC[0] instanceof templC.Element).toBe(true);
                        expect(!elemsC[0].childGroups).toBe(true);
                    });

                    Should("generate elements with the same scene", function() {
                        var elems = templA.spawn(scene);

                        var elemA = elems[0];
                        expect(elemA.scene).toBe(scene);

                        var elemsB = elemA.childGroups[0];
                        expect(elemsB[0].scene).toBe(scene);

                        var elemsC = elemA.childGroups[1];
                        expect(elemsC[0].scene).toBe(scene);
                    });

                    Should("generate elements with index 0", function() {
                        var elems = templA.spawn(scene);

                        var elemA = elems[0];
                        expect(elemA.index).toBe(0);

                        var elemsB = elemA.childGroups[0];
                        expect(elemsB[0].index).toBe(0);

                        var elemsC = elemA.childGroups[1];
                        expect(elemsC[0].index).toBe(0);
                    });
                });
            });

            With("two root scenes, returned by root-template#scenes", function() {
                var sceneA = {},
                    sceneB = {};
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
                    expect(elemsB.length).toBe(1);
                    expect(elemsB[0] instanceof templB.Element).toBe(true);
                    expect(!elemsB[0].childGroups).toBe(true);

                    var elemsC = elemA.childGroups[1];
                    expect(elemsC.length).toBe(1);
                    expect(elemsC[0] instanceof templC.Element).toBe(true);
                    expect(!elemsC[0].childGroups).toBe(true);
                }

                function testElementHierachyScene(elemA, scene) {
                    expect(elemA.scene).toBe(scene);

                    var elemsB = elemA.childGroups[0];
                    expect(elemsB[0].scene).toBe(scene);

                    var elemsC = elemA.childGroups[1];
                    expect(elemsC[0].scene).toBe(scene);
                }

                function testElementHierachyIndex(elemA, index) {
                    expect(elemA.index).toBe(index);

                    var elemsB = elemA.childGroups[0];
                    expect(elemsB[0].index).toBe(0);

                    var elemsC = elemA.childGroups[1];
                    expect(elemsC[0].index).toBe(0);
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

                expect(elemsB.length).toBe(1);
                expect(!elemsB[0].childGroups).toBe(true);

                elemA = elems[1];

                var elemsB = elemA.childGroups[0];
                expect(elemsB.length).toBe(1);

                var elemsC = elemsB[0].childGroups[0];
                expect(elemsC.length).toBe(1);
                expect(elemsC[0] instanceof templC.Element).toBe(true);
            });
        });
    });
});
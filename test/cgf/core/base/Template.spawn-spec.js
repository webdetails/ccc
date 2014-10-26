define([
    'ccc/cgf',
    'ccc/def',
    'test/utils'
], function(cgf, def, utils) {

    /*global describe:true, it:true, expect:true, spyOn: true*/

    var When   = utils.describeTerm("when"),
        With   = utils.describeTerm("with"),
        The    = utils.describeTerm("the"),
        Should = utils.itTerm("should");

    describe("cgf.Template - #spawn - ", function() {

        When("spawning a template hierarchy", function() {
            With("a single root scene", function() {
                var templA = new cgf.AdhocTemplate()
                    .add(cgf.AdhocTemplate)
                    .parent
                    .add(cgf.AdhocTemplate)
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

                    templA = new cgf.AdhocTemplate()
                        .scenes(function(scene) { return scene.children; })
                        .add(cgf.AdhocTemplate)
                        .parent
                        .add(cgf.AdhocTemplate)
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

                    templA = new cgf.AdhocTemplate()
                        .scenes(function(scene) { return scene.children; })
                        .add(cgf.AdhocTemplate)
                        .applicable(function(scene) { return scene.x > 1; })
                        .add(cgf.AdhocTemplate)
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
            var templRoot = new cgf.AdhocTemplate();

            var templChild = templRoot.add(cgf.AdhocTemplate)
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

        When("a child template has a `scenes` property that returns a single scene", function() {
            var templRoot = new cgf.AdhocTemplate();

            var templChild = templRoot.add(cgf.AdhocTemplate)
                .scenes(function(ps) { return [ps]; });

            var parentScene = {};

            Should("result in a non-array child group: the single child element", function() {
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

        describe("re-spawn -", function() {
            var templRoot, templChild, elemRoot, elemChild1,
                parentScene, sceneA = {}, sceneB = {};

            beforeEach(function() {
                templRoot = new cgf.AdhocTemplate();
            });

            When("1st: spawns no elements,", function() {
                beforeEach(function() {
                    templChild = templRoot.add(cgf.AdhocTemplate)
                        .scenes(function(ps) { return ps.children; });

                    parentScene = {children: []};

                    var elems = templRoot.spawn(parentScene);
                    elemRoot = elems[0];
                });

                When("2nd: spawns no elements,", function() {

                    beforeEach(function() {
                        elemChild1 = elemRoot.childGroups[0];
                        elemRoot.refresh();
                    });

                    Should("keep the childGroup as nully", function() {
                        expect(elemChild1 == null).toBe(true);
                        // Its undefined
                        expect(elemRoot.childGroups[0] == null).toBe(true);
                    });
                });

                When("2nd: spawns a single element,", function() {

                    beforeEach(function() {
                        elemRoot.childGroups[0];

                        parentScene.children.push(sceneA);

                        elemRoot.refresh();

                        elemChild1 = elemRoot.childGroups[0];
                    });

                    Should("spawn an element directly in the child group", function() {
                        expect(elemChild1 instanceof cgf.Element).toBe(true);
                    });

                    Should("spawn an element with the corerct scene", function() {
                        expect(elemChild1.scene).toBe(sceneA);
                    });
                });

                When("2nd: spawns two elements,", function() {
                    var childGroup;

                    beforeEach(function() {
                        elemRoot.childGroups[0];

                        parentScene.children.push(sceneA, sceneB);

                        spyOn(elemChild1, 'refresh');

                        elemRoot.refresh();

                        childGroup = elemRoot.childGroups[0];
                    });

                    Should("make the childGroup become an array with two positions", function() {
                        expect(def.array.is(childGroup)).toBe(true);
                        expect(childGroup.length).toBe(2);
                    });

                    Should("spawn a 1st element", function() {
                        expect(childGroup[0] instanceof cgf.Element).toBe(true);
                    });

                    Should("spawn a 2nd element", function() {
                        expect(childGroup[1] instanceof cgf.Element).toBe(true);
                    });

                    Should("spawn the 1st element with the 1st scene", function() {
                        expect(childGroup[0].scene).toBe(sceneA);
                    });

                    Should("spawn the 2nd element with the 2nd scene", function() {
                        expect(childGroup[1].scene).toBe(sceneB);
                    });
                });
            });

            When("1st: spawns a single element,", function() {
                beforeEach(function() {
                    templChild = templRoot.add(cgf.AdhocTemplate)
                        .scenes(function(ps) { return ps.children; });

                    parentScene = {children: [sceneA]};

                    var elems = templRoot.spawn(parentScene);
                    elemRoot = elems[0];
                });

                When("2nd: spawns a single element,", function() {
                    Should("spawn the same element", function() {
                        elemChild1 = elemRoot.childGroups[0];

                        expect(elemChild1 instanceof cgf.Element).toBe(true);

                        elemRoot.refresh();

                        var elemChild2 = elemRoot.childGroups[0];

                        expect(elemChild1).toBe(elemChild2);
                    });

                    Should("call #refresh once on the single element", function() {
                        elemChild1 = elemRoot.childGroups[0];

                        spyOn(elemChild1, 'refresh');

                        elemRoot.refresh();

                        expect(elemChild1.refresh).toHaveBeenCalled();
                        expect(elemChild1.refresh.calls.length).toBe(1);
                    });
                });

                When("2nd: spawns two elements,", function() {
                    var childGroup;

                    beforeEach(function() {
                        elemChild1 = elemRoot.childGroups[0];

                        parentScene.children.push(sceneB);

                        spyOn(elemChild1, 'refresh');

                        elemRoot.refresh();

                        childGroup = elemRoot.childGroups[0];
                    });

                    Should("make the childGroup become an array with two positions", function() {
                        expect(def.array.is(childGroup)).toBe(true);
                        expect(childGroup.length).toBe(2);
                    });

                    Should("spawn the same 1st element", function() {
                        expect(childGroup[0]).toBe(elemChild1);
                    });

                    Should("spawn the same 1st element with the same scene", function() {
                        expect(elemChild1.scene).toBe(sceneA);
                    });

                    Should("spawn an additional different element", function() {
                        var elemChild2 = childGroup[1];

                        expect(elemChild2).not.toBe(elemChild1);

                        expect(elemChild2 instanceof cgf.Element).toBe(true);
                    });

                    Should("spawn an additional element with the second scene", function() {
                        var elemChild2 = childGroup[1];

                        expect(elemChild2.scene).toBe(sceneB);
                    });

                    Should("call #refresh once on the 1st element", function() {
                        expect(elemChild1.refresh).toHaveBeenCalled();
                        expect(elemChild1.refresh.calls.length).toBe(1);
                    });
                });

                When("2nd: spawns no elements,", function() {

                    beforeEach(function() {
                        elemChild1 = elemRoot.childGroups[0];
                        parentScene.children.length = 0;
                        elemRoot.refresh();
                    });

                    // TODO: Should call dispose on the exiting element.

                    Should("make the childGroup become null", function() {
                        expect(elemRoot.childGroups[0]).toBe(null);
                    });
                });
            });

            When("1st: spawns two elements,", function() {
                var childGroup, elemChild1, elemChild2;

                beforeEach(function() {
                    templChild = templRoot.add(cgf.AdhocTemplate)
                        .scenes(function(ps) { return ps.children; });

                    parentScene = {children: [sceneA, sceneB]};

                    elemRoot = templRoot.spawn(parentScene)[0];

                    childGroup = elemRoot.childGroups[0];

                    elemChild1 = childGroup[0];
                    elemChild2 = childGroup[1];
                });

                When("2nd: spawns two elements,", function() {
                    beforeEach(function() {
                        spyOn(elemChild1, 'refresh');
                        spyOn(elemChild2, 'refresh');

                        elemRoot.refresh();
                    });

                    Should("maintain the same childGroup array, with two positions", function() {
                        expect(elemRoot.childGroups[0]).toBe(childGroup);
                        expect(childGroup.length).toBe(2);
                    });

                    Should("maintain the 1st element", function() {
                        expect(childGroup[0]).toBe(elemChild1);
                    });

                    Should("maintain the 1st element's scene", function() {
                        expect(elemChild1.scene).toBe(sceneA);
                    });

                    Should("maintain the 2nd element", function() {
                        expect(childGroup[1]).toBe(elemChild2);
                    });

                    Should("maintain the 2nd element's scene", function() {
                        expect(elemChild2.scene).toBe(sceneB);
                    });

                    Should("call #refresh once on the 1st element", function() {
                        expect(elemChild1.refresh).toHaveBeenCalled();
                        expect(elemChild1.refresh.calls.length).toBe(1);
                    });

                    Should("call #refresh once on the 2nd element", function() {
                        expect(elemChild2.refresh).toHaveBeenCalled();
                        expect(elemChild2.refresh.calls.length).toBe(1);
                    });
                });

                When("2nd: spawns three elements,", function() {
                    var sceneC = {};

                    beforeEach(function() {
                        spyOn(elemChild1, 'refresh');
                        spyOn(elemChild2, 'refresh');

                        parentScene.children.push(sceneC);

                        elemRoot.refresh();
                    });

                    Should("maintain the same childGroup array, with three positions", function() {
                        expect(elemRoot.childGroups[0]).toBe(childGroup);
                        expect(childGroup.length).toBe(3);
                    });

                    Should("maintain the 1st element", function() {
                        expect(childGroup[0]).toBe(elemChild1);
                    });

                    Should("maintain the 1st element's scene", function() {
                        expect(elemChild1.scene).toBe(sceneA);
                    });

                    Should("maintain the 2nd element", function() {
                        expect(childGroup[1]).toBe(elemChild2);
                    });

                    Should("maintain the 2nd element's scene", function() {
                        expect(elemChild2.scene).toBe(sceneB);
                    });

                    Should("call #refresh once on the 1st element", function() {
                        expect(elemChild1.refresh).toHaveBeenCalled();
                        expect(elemChild1.refresh.calls.length).toBe(1);
                    });

                    Should("call #refresh once on the 2nd element", function() {
                        expect(elemChild2.refresh).toHaveBeenCalled();
                        expect(elemChild2.refresh.calls.length).toBe(1);
                    });

                    Should("add an additional different element", function() {
                        var elemChild3 = childGroup[2];
                        expect(elemChild3 instanceof cgf.Element).toBe(true);

                        expect(elemChild3).not.toBe(elemChild1);
                        expect(elemChild3).not.toBe(elemChild2);
                    });

                    Should("add an additional element with the new scene", function() {
                        var elemChild3 = childGroup[2];
                        expect(elemChild3.scene).toBe(sceneC);
                    });
                });

                When("2nd: spawns a single element,", function() {
                    beforeEach(function() {
                        spyOn(elemChild1, 'refresh');

                        parentScene.children.pop();

                        elemRoot.refresh();
                    });

                    // TODO: Should call dispose on the exiting element.

                    Should("make the childGroup become the 1st element", function() {
                        expect(elemRoot.childGroups[0]).toBe(elemChild1);
                    });

                    Should("call #refresh once on the 1st element", function() {
                        expect(elemChild1.refresh).toHaveBeenCalled();
                        expect(elemChild1.refresh.calls.length).toBe(1);
                    });
                });

                When("2nd: spawns no elements,", function() {

                    // TODO: Should call dispose on the exiting elements.

                    beforeEach(function() {
                        parentScene.children.length = 0;
                        elemRoot.refresh();
                    });

                    Should("make the childGroup become null", function() {
                        expect(elemRoot.childGroups[0]).toBe(null);
                    });
                });
            });
        });
    });
});
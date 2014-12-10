define([
    'ccc/cgf',
    'ccc/def',
    'test/utils'
], function(cgf, def, utils) {

    /*global describe:true, it:true, expect:true*/

    var Should = utils.itTerm("should");

    describe("cgf.visual.SidesPart -", function () {
        Should("have Sides.Element#all default to null", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [cgf.visual.props.margin]
            });

            var templ = new Template();
            var elem  = templ.createElement();

            expect(elem.margin.all).toBe(null);
        });

        Should("have Sides.Element#left, right, top, bottom, default to `all`", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [cgf.visual.props.margin]
            });

            var templ = new Template();
            templ.margin().all(10);

            var elem = templ.createElement();

            expect(elem.margin.left).toBe(10);
            expect(elem.margin.right).toBe(10);
            expect(elem.margin.top).toBe(10);
            expect(elem.margin.bottom).toBe(10);
        });

        Should("be able to set and read a numeric left value", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                    properties: [cgf.visual.props.margin]
                });

            var templ = new Template();
            templ.margin().left(20);

            expect(templ.margin().left()).toBe(20);
        });

        Should("be able to set and read a numeric right value", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [cgf.visual.props.margin]
            });

            var templ = new Template();
            templ.margin().right(20);

            expect(templ.margin().right()).toBe(20);
        });

        Should("be able to set and read a numeric top value", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [cgf.visual.props.margin]
            });

            var templ = new Template();
            templ.margin().top(20);

            expect(templ.margin().top()).toBe(20);
        });

        Should("be able to set and read a numeric bottom value", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [cgf.visual.props.margin]
            });

            var templ = new Template();
            templ.margin().bottom(20);

            expect(templ.margin().bottom()).toBe(20);
        });

        Should("be able to set and read a numeric all value", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [cgf.visual.props.margin]
            });

            var templ = new Template();

            templ.margin().all(20);
            expect(templ.margin().all()).toBe(20);
        });

        Should("default all properties to the value of `all`", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [cgf.visual.props.margin]
            });

            var templ = new Template();

            templ.margin().all(20);

            var elem = templ.createElement();
            var m = elem.margin;
            expect(m.bottom).toBe(20);
            expect(m.top).toBe(20);
            expect(m.left).toBe(20);
            expect(m.right).toBe(20);
        });

        Should("be able to configure and read a numeric left value", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [cgf.visual.props.margin]
            });

            var templ = new Template();
            templ.margin({left: 20});

            expect(templ.margin().left()).toBe(20);
        });

        Should("be able to set and read a string numeric left value", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [cgf.visual.props.margin]
            });

            var templ = new Template();
            templ.margin().left("20");

            expect(templ.margin().left()).toBe(20);
        });

        Should("be able to configure and read a string numeric left value", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [cgf.visual.props.margin]
            });

            var templ = new Template();
            templ.margin({left: "20"});

            expect(templ.margin().left()).toBe(20);
        });

        Should("be able to configure and read an all value", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [cgf.visual.props.margin]
            });

            var templ = new Template();
            templ.margin({all: "20"});

            expect(templ.margin().all()).toBe("20");
        });

        Should("be able to set and read a percent left value", function() {
            var Template = cgf.visual.Visual.extend({
                properties: [
                    cgf.visual.props.margin
                ]
            });

            var parentTempl = new cgf.visual.Panel();
            var childTempl = parentTempl.add(new Template());

            childTempl.margin().left("20%");

            expect(def.fun.is(childTempl.margin().left())).toBe(true);

            var parentElem = parentTempl.createElement();

            // MOCK layout object of visuals.
            parentElem._layoutInfo = {contentWidth: 100};

            var childElem = parentElem.content[0];

            expect(childElem.margin.left).toBe(20);
        });

        Should("be able to set and read a percent right value", function() {
            var Template = cgf.visual.Visual.extend({
                properties: [
                    cgf.visual.props.margin
                ]
            });

            var parentTempl = new cgf.visual.Panel();
            var childTempl = parentTempl.add(new Template());

            childTempl.margin().right("20%");

            expect(def.fun.is(childTempl.margin().right())).toBe(true);

            var parentElem = parentTempl.createElement();

            // MOCK layout object of visuals.
            parentElem._layoutInfo = {contentWidth: 100};

            var childElem = parentElem.content[0];

            expect(childElem.margin.right).toBe(20);
        });

        Should("be able to set and read a percent top value", function() {
            var Template = cgf.visual.Visual.extend({
                properties: [
                    cgf.visual.props.margin
                ]
            });

            var parentTempl = new cgf.visual.Panel();
            var childTempl = parentTempl.add(new Template());

            childTempl.margin().top("20%");

            expect(def.fun.is(childTempl.margin().top())).toBe(true);

            var parentElem = parentTempl.createElement();

            // MOCK layout object of visuals.
            parentElem._layoutInfo = {contentHeight: 100};

            var childElem = parentElem.content[0];

            expect(childElem.margin.top).toBe(20);
        });

        Should("be able to set and read a percent bottom value", function() {
            var Template = cgf.visual.Visual.extend({
                properties: [
                    cgf.visual.props.margin
                ]
            });

            var parentTempl = new cgf.visual.Panel();
            var childTempl = parentTempl.add(new Template());

            childTempl.margin().bottom("20%");

            expect(def.fun.is(childTempl.margin().bottom())).toBe(true);

            var parentElem = parentTempl.createElement();

            // MOCK layout object of visuals.
            parentElem._layoutInfo = {contentHeight: 100};

            var childElem = parentElem.content[0];

            expect(childElem.margin.bottom).toBe(20);
        });

        Should("be able to set and read a percent `all` value", function() {
            var Template = cgf.visual.Visual.extend({
                properties: [
                    cgf.visual.props.margin
                ]
            });

            var parentTempl = new cgf.visual.Panel();
            var childTempl = parentTempl.add(new Template());

            childTempl.margin().all("20%");

            expect(childTempl.margin().all()).toBe("20%");

            var parentElem = parentTempl.createElement();

            // MOCK layout object of visuals.
            parentElem._layoutInfo = {contentWidth: 200, contentHeight: 100};

            var childElem = parentElem.content[0];

            expect(childElem.margin.left  ).toBe(40);
            expect(childElem.margin.right ).toBe(40);
            expect(childElem.margin.bottom).toBe(20);
            expect(childElem.margin.top   ).toBe(20);
        });

        Should("be able to specify both `all` and `left`, and in any order", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [
                    cgf.visual.props.margin
                ]
            });

            var templ = new Template();

            templ.margin()
                .left(10)
                .all (20);

            var elem = templ.createElement();

            expect(elem.margin.left  ).toBe(10);
            expect(elem.margin.right ).toBe(20);
            expect(elem.margin.bottom).toBe(20);
            expect(elem.margin.top   ).toBe(20);
        });

        Should("be able to evaluate Sides.Element#width", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [
                    cgf.visual.props.margin
                ]
            });

            var templ = new Template();

            templ.margin()
                .left (10)
                .right(30);

            var elem = templ.createElement();

            expect(elem.margin.width).toBe(40);
        });

        Should("evaluate Sides.Element#width to null when both left and right are null", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [
                cgf.visual.props.margin
                ]
            });

            var templ = new Template();
            var elem = templ.createElement();

            expect(elem.margin.width).toBe(null);
        });

        Should("evaluate Sides.Element#width to left when only right is null", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [
                cgf.visual.props.margin
                ]
            });

            var templ = new Template();
            templ.margin()
                .left (10);

            var elem = templ.createElement();

            expect(elem.margin.width).toBe(10);
        });

        Should("evaluate Sides.Element#width to right when only left is null", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [
                cgf.visual.props.margin
                ]
            });

            var templ = new Template();
            templ.margin()
                .right(10);

            var elem = templ.createElement();

            expect(elem.margin.width).toBe(10);
        });

        Should("be able to evaluate Sides.Element#height", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [
                    cgf.visual.props.margin
                ]
            });

            var templ = new Template();

            templ.margin()
                .top(10)
                .bottom(30);

            var elem = templ.createElement();

            expect(elem.margin.height).toBe(40);
        });

        Should("evaluate Sides.Element#height to null, when both top and bottom are null", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [
                cgf.visual.props.margin
                ]
            });

            var templ = new Template();
            var elem = templ.createElement();

            expect(elem.margin.height).toBe(null);
        });

        Should("evaluate Sides.Element#height to top, when only bottom is null", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [
                cgf.visual.props.margin
                ]
            });

            var templ = new Template();

            templ.margin()
                .top(10);

            var elem = templ.createElement();

            expect(elem.margin.height).toBe(10);
        });

        Should("evaluate Sides.Element#height to bottom, when only top is null", function() {
            var Template = cgf.dom.EntityTemplate.extend({
                properties: [
                cgf.visual.props.margin
                ]
            });

            var templ = new Template();

            templ.margin()
                .bottom(30);

            var elem = templ.createElement();

            expect(elem.margin.height).toBe(30);
        });
    });
});

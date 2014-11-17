/**
 * @name cgf.visual.Canvas
 * @class A canvas is the root of a visual tree.
 * Cannot be content for another visual.
 *
 * @extends cgf.visual.Visual
 * @mixes cgf.visual.VisualParent
 */
var cgf_visual_Canvas = cgf.Canvas = cgf.visual.Canvas = cgf_visual_Visual.extend({
    methods: /** @lends cgf.visual.Canvas# */{

        /** @override */
        get tagName() { return "svg"; },

        /** @override */
        get styleClassName() { return "cgf-canvas"; },

        /**
         * Ensures that the parent of a canvas template is a _not_ a visual template.
         *
         * @param {cgf.dom.EntityTemplate} newParent The new parent.
         *
         * @override
         * @throws {def.error.argumentInvalid} When argument <i>newParent</i> is a visual template.
         */
        _onParentChanging: function(newParent) {

            if(newParent && (newParent instanceof cgf_visual_Visual))
                throw def.error.argumentInvalid("parent", "Cannot be a visual template.");

            this.base.apply(arguments);
        },

        /** @override */
        _renderEnter: function(d3SelEnter) {
            d3SelEnter = this.base(d3SelEnter);

            this._renderContentEnter(
                d3SelEnter.append("g")
                    .attr("class", "cgf-content"));

            return d3SelEnter;
        },

        /** @override */
        _renderEnterOrUpdate: function(d3SelUpd) {

            d3SelUpd = this.base(d3SelUpd)
                .attr("width",  elem_borderBoxWidth )
                .attr("height", elem_borderBoxHeight);

            this._renderContent(
                d3SelUpd.select("g.cgf-content")
                    .attr("transform", function(elem) {
                        var li = elem.layout;
                        return svg_translate(li.contentLeft, li.contentTop);
                    }));

            return d3SelUpd;
        }
    }
});

cgf_mixVisualParent(cgf_visual_Canvas);

cgf_visual_Canvas.type().add({
    defaults: new cgf_visual_Canvas()
        .proto(cgf_visual_Visual.defaults)
        .size({width: 400, height: 400}) // TODO: should this be size to content instead by default?
});

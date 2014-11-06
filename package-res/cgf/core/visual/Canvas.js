

/**
 * @name cgf.Canvas
 * @class A canvas is the root of a visual tree.
 * Cannot be content for another visual.
 *
 * @extends cgf.Visual
 * @mixes cgf.VisualParent
 */
var cgf_Canvas = cgf.Canvas = cgf_Visual.extend({
    methods: /** @lends cgf.Canvas# */{

        /** @override */
        get tagName() { return "svg"; },

        /** @override */
        get styleClassName() { return "cgf-canvas"; },

        /**
         * Ensures that the parent of a canvas template is a _not_ a visual template.
         *
         * @param {cgf.EntityTemplate} newParent The new parent.
         *
         * @override
         * @throws {def.error.argumentInvalid} When argument <i>newParent</i> is a visual template.
         */
        _onParentChanging: function(newParent) {

            if(newParent && (newParent instanceof cgf_Visual))
                throw def.error.argumentInvalid("parent", "Cannot be a visual template.");

            this.base.apply(arguments);
        },

        /** @override */
        _renderEnter: function(d3SelEnter) {
            d3SelEnter = this.base(d3SelEnter);

            this._renderContentEnter(d3SelEnter);

            return d3SelEnter;
        },

        /** @override */
        _renderEnterOrUpdate: function(d3SelUpd) {

            d3SelUpd = this.base(d3SelUpd)
                .attr("width",  elem_borderBoxWidth )
                .attr("height", elem_borderBoxHeight);

            this._renderContent(d3SelUpd);

            return d3SelUpd;
        }
    }
});

cgf_mixVisualParent(cgf_Canvas);

cgf_Canvas.type().add({
    defaults: new cgf_Canvas()
        .proto(cgf_Visual.defaults)
        .size({width: 400, height: 400}) // TODO: should this be size to content instead by default?
});



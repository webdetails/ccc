var cgf_Canvas = cgf.Canvas = cgf_Visual.extend({
    properties: [
        cgf_props.width,
        cgf_props.height
    ],
    methods: /** @lends cgf.Canvas# */{

        /** @override */
        get tagName() { return "svg"; },

        /** @override */
        get styleClassName() { return "cgf-canvas"; },

        /** @override */
        _renderEnter: function(d3SelEnter) {
            d3SelEnter = this.base(d3SelEnter);

            this._renderContentEnter(d3SelEnter);

            return d3SelEnter;
        },

        /** @override */
        _renderEnterOrUpdate: function(d3SelUpd) {

            d3SelUpd = this.base(d3SelUpd)
                .attr("width",  elem_borderWidth )
                .attr("height", elem_borderHeight);

            this._renderContent(d3SelUpd);

            return d3SelUpd;
        }
    }
});

cgf_Canvas.type().add({
    defaults: new cgf_Canvas()
        .proto(cgf_Visual.defaults)
        .width (200)
        .height(200)
});

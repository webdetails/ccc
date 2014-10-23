
var elem_borderWidth  = function(elem) { return elem.width();  };
var elem_borderHeight = function(elem) { return elem.height(); };

var elem_outerWidth   = function(elem) { return elem.outerWidth();  };
var elem_outerHeight  = function(elem) { return elem.outerHeight(); };

var elem_fill         = function(elem) { return elem.fillStyle(); };
var elem_stroke       = function(elem) { return elem.strokeStyle(); };
var elem_strokeWidth  = function(elem) { return elem.strokeWidth(); };

var svg_translate = function(left, top) {
    if(left || top) return "translate(" + (left||0)  + ", " + (top||0) + ")";
};

var cgf_Panel = cgf.Panel = cgf_Visual.extend({
    properties: [
        (cgf_props.width       = cgf.property("width",       Number)),
        (cgf_props.height      = cgf.property("height",      Number)),
        (cgf_props.margin      = cgf.property("margin"             )),
        (cgf_props.padding     = cgf.property("padding"            )),
        (cgf_props.fillStyle   = cgf.property("fillStyle",   String)),
        (cgf_props.strokeStyle = cgf.property("strokeStyle", String)),
        (cgf_props.strokeWidth = cgf.property("strokeWidth", Number))
    ],
    methods: /** @lends cgf.Panel# */{
        /** @override */
        get tagName() { return "g"; },

        /** @override */
        get styleClassName() { return "cgf-panel"; },

        /** @override */
        _renderEnter: function(d3SelEnter) {

            d3SelEnter = this.base(d3SelEnter);

            d3SelEnter.append("rect")
                .attr("class", "cgf-panel-fill");

            this._renderContentEnter(
                d3SelEnter.append("g")
                    .attr("class", "cgf-panel-content"));

            d3SelEnter.append("rect")
                .attr("class", "cgf-panel-stroke");

            return d3SelEnter;
        },

        /** @override */
        _renderEnterOrUpdate: function(d3SelUpd) {
            d3SelUpd = this.base(d3SelUpd);

            d3SelUpd
                .attr("transform", function(elem) {
                    var m = elem.margin();
                    if(m) return svg_translate(m.left, m.top);
                });

            d3SelUpd.select("rect.cgf-panel-fill")
                .attr("width",  elem_borderWidth )
                .attr("height", elem_borderHeight)
                .style("fill",  elem_fill  );

            this._renderContent(
                d3SelUpd.select("g.cgf-panel-content")
                    .attr("transform", function(elem) {
                        var p = elem.padding();
                        if(p) return svg_translate(p.left, p.top);
                    }));

            d3SelUpd.select("rect.cgf-panel-stroke")
                .attr("width",         elem_borderWidth )
                .attr("height",        elem_borderHeight)
                .style("stroke",       elem_stroke)
                .style("stroke-width", elem_strokeWidth);

            return d3SelUpd;
        }
    },
    element: {
        methods: {
            outerWidth: function() {
                var m = this.margin();
                return this.width() + (m ? ((m.left||0) + (m.right||0)) : 0);
            },

            outerHeight: function() {
                var m = this.margin();
                return this.height() + (m ? ((m.top||0) + (m.bottom||0)) : 0);
            },

            contentWidth: function() {
                var p = this.padding();
                return this.width() + (p ? ((p.left||0) + (p.right||0)) : 0);
            },

            contentHeight: function() {
                var p = this.padding();
                return this.height() + (p ? ((p.top||0) + (p.bottom||0)) : 0);
            }
        }
    }
});


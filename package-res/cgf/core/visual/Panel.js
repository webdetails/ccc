
/**
 * @name cgf.visual.Panel
 * @class A panel is the basic container for visual elements.
 *
 * It features margins, paddings, border and background.
 *
 * The root visual cannot be a panel, it must be a {@link cgf.visual.Canvas}.
 *
 * @extends cgf.visual.VisualContent
 * @mixes cgf.visual.VisualParent
 */
var cgf_visual_Panel = cgf.Panel = cgf.visual.Panel = cgf_visual_VisualContent.extend()
    .properties([
        (cgf_visual_props.padding = cgf.dom.property("padding", {
            factory: def.fun.typeFactory(cgf.visual.Sides)
        })),

        (cgf_visual_props.fillStyle  = cgf.dom.property("fillStyle", String)),

        (cgf_visual_props.strokeStyle = cgf.dom.property("strokeStyle", String)),
        (cgf_visual_props.strokeWidth = cgf.dom.property("strokeWidth", Number))
    ])
    .methods(/** @lends cgf.visual.Panel# */{
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
                    var m = elem.margin;
                    if(m) return svg_translate(m.left, m.top);
                });

            d3SelUpd.select("rect.cgf-panel-fill")
                .attr("width",  elem_borderBoxWidth )
                .attr("height", elem_borderBoxHeight)
                .style("fill",  elem_fill  );

            this._renderContent(
                d3SelUpd.select("g.cgf-panel-content")
                    .attr("transform", function(elem) {
                        var p = elem.padding;
                        if(p) return svg_translate(p.left, p.top);
                    }));

            d3SelUpd.select("rect.cgf-panel-stroke")
                .attr("width",         elem_borderBoxWidth )
                .attr("height",        elem_borderBoxHeight)
                .style("stroke",       elem_stroke)
                .style("stroke-width", elem_strokeWidth);

            return d3SelUpd;
        }
    });

cgf_mixVisualParent(cgf_visual_Panel);


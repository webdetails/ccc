
/**
 * @name cgf.visual.Panel
 * @class A panel is the basic container for visual elements.
 *
 * It features margins, paddings, stroke and fill.
 *
 * The root visual cannot be a panel, it must be a {@link cgf.visual.Canvas}.
 *
 * @extends cgf.visual.VisualContent
 * @mixes cgf.visual.VisualParent
 */
var cgf_visual_Panel = cgf.Panel =
defTemplate(cgf_visual, 'Panel', cgf_visual_VisualContent.extend())
    .properties([
        cgf_visual_props.fill,
        cgf_visual_props.stroke
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
                .attr("class", "cgf-fill");

            this._renderContentEnter(
                d3SelEnter.append("g")
                    .attr("class", "cgf-content"));

            d3SelEnter.append("rect")
                .attr("class", "cgf-stroke");

            return d3SelEnter;
        },

        /** @override */
        _renderEnterOrUpdate: function(d3SelUpd) {
            d3SelUpd = this.base(d3SelUpd);

            d3SelUpd
                .attr("transform", elem_translate);

            d3SelUpd.select("rect.cgf-fill")
                .attr("width",  elem_borderBoxWidth )
                .attr("height", elem_borderBoxHeight)
                .style("fill",  elem_fillColor);

            this._renderContent(
                d3SelUpd.select("g.cgf-content")
                    .attr("transform", function(elem) {
                        var li = elem.layout;
                        return svg_translate(li.contentLeft, li.contentTop);
                    }));

            d3SelUpd.select("rect.cgf-stroke")
                .attr("width",         elem_borderBoxWidth )
                .attr("height",        elem_borderBoxHeight)
                .style("stroke",       elem_strokeColor)
                .style("stroke-width", elem_strokeWidth);

            return d3SelUpd;
        }
    });

cgf_mixVisualParent(cgf_visual_Panel);

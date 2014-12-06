// Positioning properties
// Arc generator angles have 0 at 12 o'clock (negative y) and go clockwise.
// We advance angles so that the same convention is used for all elements.
var cgf_arcShapeGen = d3.svg.arc()
    .innerRadius(function(e) { return e.radiusInner; })
    .outerRadius(function(e) { return e.radiusOuter; })
    .startAngle (function(e) { return e.angleStart + π_1_2; })
    .endAngle   (function(e) { return e.angleEnd   + π_1_2; });

cgf_visual_props.angleStart  = cgf.dom.property("angleStart",  def.number.to);
cgf_visual_props.angleEnd    = cgf.dom.property("angleEnd",    def.number.to);
cgf_visual_props.angleSpan   = cgf.dom.property("angleSpan",   def.number.to);
cgf_visual_props.radiusInner = cgf.dom.property("radiusInner", def.number.toNonNegative);
cgf_visual_props.radiusOuter = cgf.dom.property("radiusOuter", def.number.toNonNegative);

cgf.Arc = defTemplate(cgf_visual, 'Arc', cgf_visual_VisualContent.extend())
    .properties([
        cgf_visual_props.fill,
        cgf_visual_props.stroke,

        {prop: cgf_visual_props.angleStart, builderStable: '_angleStable'},
        {prop: cgf_visual_props.angleEnd,   builderStable: '_angleStable'},
        {prop: cgf_visual_props.angleSpan,  builderStable: '_angleStable'},

        cgf_visual_props.radiusInner,
        cgf_visual_props.radiusOuter
    ])
    .methods(/** @lends cgf.visual.Arc# */{
        /** @override */
        get tagName() { return "path"; },

        /** @override */
        get styleClassName() { return "cgf-arc"; },

        /** @override */
        _renderEnterOrUpdate: function(d3SelUpd) {
            return this.base(d3SelUpd)
                .attr("d",             cgf_arcShapeGen )
                .style("fill",         elem_fillColor  )
                .style("stroke",       elem_strokeColor)
                .style("stroke-width", elem_strokeWidth);
        }
    })
    .Element
    .methods(/** @lends cgf.visual.Arc */{
        _build_angleStable: function() {
            var ai = this.angleStart,
                af = this.angleEnd,
                ad = this.angleSpan;

            if(ad == null) {
                if(ai == null) this.angleStart = ai = 0;
                if(af == null) this.angleEnd   = af = ai;
                //else if(af < ai) this.endAngle = af = af + π_1_2;

                this.angleSpan = af - ai;
            } else if(af == null) {
                if(ai == null) this.angleStart = ai = 0;
                this.angleEnd = ai + ad;
            } else if(ai == null) {
                this.angleStart = af - ad;
            }
        }
    })
    .Template;


var cat20 = d3.scale.category20();

cgf.visual.Arc.type().add({
    defaults: new cgf_visual.Arc({
        proto:          cgf_visual_Visual.defaults,
        "fill.color":   function(s, i) { return cat20(i); },
        radiusInner:    0,
        "stroke.width": 1.5
    })
});

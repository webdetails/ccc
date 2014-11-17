/**
 * A mixin class for visuals that can contain other visuals.
 * @name cgf.visual.VisualParent
 * @mixin
 * @extends cgf.visual.VisualSized
 */
var cgf_visual_VisualParentMixinMethods = /** @lends cgf.visual.VisualParent# */ {
    /** @override */
    _onChildAdded: function(child, propInfo) {

        this.base(child, propInfo);

        // Keep track of visual children.
        if(child instanceof cgf_visual_Visual)
            this._childrenVisual.push({template: child, propInfo: propInfo});
    },

    _renderContentEnter: function(d3ContentSelEnter) {
        if(d3ContentSelEnter.length) {
            var childInfos = this._childrenVisual,
                C = childInfos.length,
                i = -1;

            while(++i < C)
                d3ContentSelEnter.append("g")
                    // TODO: Also need name of template class
                    .attr("class", "cgf-child-group");
        }
    },

    _renderContent: function(d3ContentSelUpd) {
        var childInfos = this._childrenVisual,
            C = childInfos.length;
        if(C) {
            var me = this;
            d3ContentSelUpd
                .selectAll("g.cgf-child-group")
                .each(function(parentElem, visualChildIndex) {
                    var childInfo  = childInfos[visualChildIndex],
                        propInfo   = childInfo.propInfo,
                        prop       = propInfo.prop,
                        childGroup = propInfo.isAdhoc
                            ? parentElem.get(prop)
                            : parentElem[prop.shortName];

                    me._renderChildGroup(
                        d3.select(this),
                        childInfo.template,
                        prop.isList
                            ? childGroup[childInfo.template.childIndex]
                            : childGroup);
                });
        }
    },

    _renderChildGroup: function(d3GroupSel, childTempl, childGroup) {
        var key;
        if(childGroup) {
            var d3ChildSelUpd = d3GroupSel.selectAll(childTempl.tagName)
                .data(def.array.to(childGroup), key);

            childTempl.render(d3ChildSelUpd);
        }
    }
};

function cgf_mixVisualParent(Visual) {
    return cgf_mixVisualSized(Visual)
        .properties([
            (cgf_visual_props.padding = cgf.dom.property("padding", {
                factory: def.fun.typeFactory(cgf.visual.SidesValue)
            }))
        ])
        .add(cgf_visual_VisualParentMixinMethods);
}

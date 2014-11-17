/**
 * A mixin class for visual elements that can be sized.
 *
 * @name cgf.visual.VisualSized.Element
 * @mixin
 */
var cgf_visual_VisualSizedElementMethods = /** @lends cgf.visual.VisualSized.Element# */{

    get isSized() { return true; },

    /**
     * Evaluates the `size`, `sizeMin` and `sizeMax` properties.
     *
     * @param {cgf.visual.ISides} [positions] The evaluated positions,
     * if this apply to the current element.
     *
     * @return {cgf.visual.IBoundedSize} The combined bounded size value.
     */
    _evaluateSizes: function(positions) {
        var size    = this.size,
            sizeMin = this.sizeMin,
            sizeMax = this.sizeMax;

        // Any relative measures will have been resolved,
        // by the time the below calls to #width and #height end.
        //
        // If their internal evaluation resulted in `NaN`,
        // they result, effectively, in `null`.
        //
        // Here, it's like they weren't even specified.

        var w = size.width, h = size.height, s, e, pl;
        if(positions) {
            // Determine default width and height from positions.
            // Assuming we're a VisualContent.Element. And, must have a parent...

            // No Width and container size already known
            if((w == null) &&
               ((s = positions.left) != null || (e = positions.right) != null) &&
               !isNaN((pl = this.parent.layout.contentWidth)))
                w = Math.max(0, pl - (s||0) - (e||0));

            // No Height and container size already known
            if((h == null) &&
               ((s = positions.top) != null || (e = positions.bottom) != null) &&
               !isNaN((pl = this.parent.layout.contentHeight)))
                h = Math.max(0, pl - (s||0) - (e||0));
        }

        return {
            width: cgf_boundedNumber(
                nullOrNegativeOrInfiniteTo(sizeMin.width, 0), // null -> 0
                w,
                nullOrNegativeTo(sizeMax.width, Infinity)), // null -> Infinity

            height: cgf_boundedNumber(
                nullOrNegativeOrInfiniteTo(sizeMin.height, 0), // null -> 0
                h,
                nullOrNegativeTo(sizeMax.height, Infinity))  // null -> Infinity
        };
    }
};

function cgf_mixVisualSizedElement(VisualElement) {
    return VisualElement.add(cgf_visual_VisualSizedElementMethods);
}

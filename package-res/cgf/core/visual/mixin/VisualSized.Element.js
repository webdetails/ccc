/**
 * A mixin class for visual elements that can be sized.
 *
 * @name cgf.visual.VisualSized.Element
 * @mixin
 */
var cgf_visual_VisualSizedElementMethods = /** @lends cgf.visual.VisualSized.Element# */{

    get isSized() { return true; }
};

function cgf_mixVisualSizedElement(VisualElement) {
    return VisualElement.add(cgf_visual_VisualSizedElementMethods);
}


/**
 * A mixin class for visual elements that can be sized.
 *
 * @name cgf.VisualSized.Element
 * @mixin
 */
var cgf_VisualSizedElementMethods = /** @lends cgf.VisualSized.Element# */{
    get contentWidth() {
        return this.size.width;
    },

    get contentHeight() {
        return this.size.height;
    }
};

function cgf_mixVisualSizedElement(VisualElement) {
    return VisualElement.add(cgf_VisualSizedElementMethods);
}
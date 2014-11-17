/**
 * @name cgf.visual.VisualContent.Element
 * @class The base abstract class of visual elements that
 * can be the content of other visual elements.
 *
 * @extends cgf.visual.Visual.Element
 * @abstract
 */
cgf_visual_VisualContent.Element
    .add(/** @lends cgf.visual.VisualContent.Element# */{
        get isContent() { return true; }
    });

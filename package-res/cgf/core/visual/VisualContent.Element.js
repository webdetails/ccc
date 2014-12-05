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
        get isContent() { return true; },

        get left()  { return this.position.left; },
        set left(v) { this.position.left = v; },

        get right()  { return this.position.right; },
        set right(v) { this.position.right = v; },

        get top()  { return this.position.top; },
        set top(v) { this.position.top = v; },

        get bottom()  { return this.position.bottom; },
        set bottom(v) { this.position.bottom = v; }
    });

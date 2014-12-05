/**
 * @name cgf.visual.Canvas.Element
 * @class A canvas element is the root of a visual tree.
 * Cannot be content for another visual element.
 *
 * @extends cgf.visual.Visual.Element
 * @mixes cgf.visual.VisualParent.Element
 */
cgf_visual_Canvas.Element
    .add(/** @lends cgf.visual.Canvas.Element# */{
        get isLayoutRoot() { return true; }
    });

cgf_mixVisualParentElement(cgf_visual_Canvas.Element);

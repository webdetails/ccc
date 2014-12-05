
/**
 * A mixin class for visuals that can be sized.
 *
 * This mixin has the properties
 * {@link cgf.visual.VisualSized#size size},
 * {@link cgf.visual.VisualSized#sizeMin sizeMin} and
 * {@link cgf.visual.VisualSized#sizeMax sizeMax}.
 *
 * @name cgf.visual.VisualSized
 * @mixin
 */
function cgf_mixVisualSized(Visual) {

    return Visual
    .properties([
        /**
         * DOC ME!
         * @name cgf.visual.VisualSized#size
         */
        {prop: cgf_visual_props.size, builderStable: '_layoutStable'},

        /**
         * DOC ME!
         * @name cgf.visual.VisualSized#sizeMin
         */
        cgf_visual_props.sizeMin,

        /**
         * DOC ME!
         * @name cgf.visual.VisualSized#sizeMax
         */
        cgf_visual_props.sizeMax
    ]);
}

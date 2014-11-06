
/**
 * A mixin class for visuals that can be sized.
 *
 * This mixin has the properties
 * {@link cgf.VisualSized#size size},
 * {@link cgf.VisualSized#sizeMin sizeMin} and
 * {@link cgf.VisualSized#sizeMax sizeMax}.
 *
 * @name cgf.VisualSized
 * @mixin
 */
function cgf_mixVisualSized(Visual) {

    return Visual
    .properties([
        /**
         * DOC ME!
         * @name cgf.VisualSized#size
         */
        cgf_props.size,

        /**
         * DOC ME!
         * @name cgf.VisualSized#sizeMin
         */
        cgf_props.sizeMin,

        /**
         * DOC ME!
         * @name cgf.VisualSized#sizeMax
         */
        cgf_props.sizeMax
    ]);
}
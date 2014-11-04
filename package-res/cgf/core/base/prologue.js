
/**
 * Root namespace of the CGF library.
 *
 * **CGF** is an acronym for **C**ommunity **G**raphics **F**ramework.
 *
 * @namespace cgf
 */

var DEBUG = 1, // build process may set this to false.
    cgf_protoParent = {},
    cgf = {
        /**
         * Contains members related
         * to the templates' "prototype" feature.
         * @namespace
         */
        proto: {
            /**
             * Special value that,
             * when specified as the value of the {@link cgf.Template#proto} property,
             * stands for the template's parent.
             *
             * @type cgf.Template
             */
            parent: cgf_protoParent
        }
    },

    O_hasOwnProp = Object.prototype.hasOwnProperty;

/**
 * Root namespace of the CGF library.
 *
 * **CGF** is an acronym for **C**ommunity **G**raphics **F**ramework.
 *
 * @namespace cgf
 */

var cgf_protoParent = {},
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
    cgf_propsPrivProp = def.priv.key().property(null, "props");
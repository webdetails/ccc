
var cgf_dom_protoParent = {};

/**
 * The DOM namespace contains core element and template classes.
 * @name cgf.dom
 * @namespace
 */
def(cgf, 'dom', /** @lends cgf.dom */{
    /**
     * Contains members related
     * to the templates' "prototype" feature.
     * @namespace
     */
    proto: {
        /**
         * Special value that,
         * when specified as the value of the {@link cgf.dom.Template#proto} property,
         * stands for the template's parent.
         *
         * @type cgf.dom.Template
         */
        parent: cgf_dom_protoParent
    }
});

var defTemplate = function(space, name, Template) {
    def(space, name, Template);

    // Set name of Element class as well
    def.qualNameOf(
        Template.Element,
        def.qualName('Element', def.qualNameOf(Template)));

    return Template;
};

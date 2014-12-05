
/**
 * Root namespace for standard DOM properties.
 *
 * @name cgf.dom.props
 * @namespace
 */
var cgf_dom_props = cgf.dom.props = /** @lends cgf.dom.props */{

    // TODO: make scenes property accept enumerables?

    /**
     * DOC ME: The `scenes` property is core to **CGF**.
     *
     * @type cgf.dom.Property
     */
    scenes: cgf.dom.property('scenes'),

    /**
     * DOC ME: The `applicable` property is core to **CGF**.
     *
     * It has the cast function `Boolean`.
     *
     * @type cgf.dom.Property
     */
    applicable: cgf.dom.property('applicable', Boolean),

    /**
     * DOC ME: The `content` property is core to **CGF**.
     *
     * It is a list property of items of type {@link cgf.dom.Template}.
     *
     * @type cgf.dom.Property
     */
    content: cgf.dom.property('content', {
        // Abstract property type.
        // No way to auto-create.
        type:   cgf_dom_Template,
        isList: true
    })
};
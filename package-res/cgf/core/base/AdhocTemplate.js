
/**
 * Creates a template instance,
 * optionally given a configuration value.
 *
 * @constructor
 * @param {object} [config] A configuration object.
 *
 * @alias AdhocTemplate
 * @memberOf cgf
 * @class An _ad hoc_ template is the most basic non-abstract class of templates.
 *
 * Use this class whenever a more specialized template is not needed.
 *
 * @extends cgf.Template
 */
cgf.AdhocTemplate = cgf_Template.extend();

/**
 * @name cgf.AdhocTemplate.Element
 * @class The element class of _ad hoc_ templates.
 * @extends cgf.Template.Element
 * @mixes cgf.Template.Element.SceneStorageMixin
 */
cgf.AdhocTemplate.Element
    .add(cgf_TemplatedElement.SceneStorageMixin);
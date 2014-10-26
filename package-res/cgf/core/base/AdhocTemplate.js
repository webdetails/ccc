
/**
 * Creates a template instance,
 * optionally given its parent template and configuration.
 *
 * @constructor
 * @param {cgf.Template} [parent=null] The parent template.
 * @param {object} [config] A configuration object.
 * @alias AdhocTemplate
 * @memberOf cgf
 * @extend cgf.Template
 */
cgf.AdhocTemplate = cgf_Template.extend();

cgf.AdhocTemplate.Element
    .add(cgf_TemplatedElementSceneStorageMixin)
    .add(cgf_TemplatedElementParentMixin);
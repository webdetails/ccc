
/**
 * Creates a template instance,
 * optionally given a configuration value.
 *
 * @constructor
 * @param {object} [config] A configuration object.
 * @alias AdhocTemplate
 * @memberOf cgf
 * @extend cgf.Template
 */
cgf.AdhocTemplate = cgf_Template.extend();

cgf.AdhocTemplate.Element
    .add(cgf_TemplatedElementSceneStorageMixin);
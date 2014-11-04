/**
 * @name cgf.EntityTemplate
 *
 * @class A template that can have its own scene and index.
 *
 * Parent templates must be or derive from {@link cgf.EntityTemplate}.
 *
 * Contrast this to the {@link cgf.ValueTemplate} class,
 * which is that of templates which do not have an own
 * scene and index, and use instead those of its parent element.
 * Value templates cannot be parent templates and require a parent.
 *
 * @extends cgf.Template
 * @abstract
 */
cgf_EntityTemplate = cgf.EntityTemplate = cgf_Template.extend();

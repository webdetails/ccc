/**
 * @name cgf.dom.EntityTemplate
 *
 * @class A template that can have its own scene and index.
 *
 * Parent templates must be or derive from {@link cgf.dom.EntityTemplate}.
 *
 * Contrast this to the {@link cgf.dom.PartTemplate} class,
 * which is that of templates which do not have an own
 * scene and index, and use instead those of its parent element.
 * Part templates cannot be parent templates and require a parent.
 *
 * @extends cgf.dom.Template
 * @abstract
 */
var cgf_dom_EntityTemplate = cgf.EntityTemplate =
    defTemplate(cgf.dom, 'EntityTemplate', cgf_dom_Template.extend());

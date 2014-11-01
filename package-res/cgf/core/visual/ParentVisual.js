
/**
 * @alias ParentVisual
 * @memberOf cgf
 *
 * @class A visual that can have children.
 *
 * @extend cgf.Visual
 * @abstract
 */
var cgf_ParentVisual = cgf.ParentVisual = cgf_Visual.extend();

/**
 * @name cgf.ParentVisual.Element
 * @class The element class of parent visual templates.
 * @extends cgf.Visual.Element
 * @mixes cgf.Template.Element.SceneStorageMixin
 */
cgf.ParentVisual.Element
    .add(cgf_TemplatedElement.SceneStorageMixin);
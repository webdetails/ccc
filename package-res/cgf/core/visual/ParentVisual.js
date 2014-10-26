
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

cgf.ParentVisual.Element
    .add(cgf_TemplatedElementSceneStorageMixin)
    .add(cgf_TemplatedElementParentMixin);
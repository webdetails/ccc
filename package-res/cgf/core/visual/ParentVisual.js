
/**
 * Creates a parent visual template instance,
 * optionally given its parent template and configuration.
 *
 * @constructor
 * @param {cgf.Template} [parent=null] The parent template.
 * @param {object} [config] A configuration object.
 * @alias ParentVisual
 * @memberOf cgf
 * @extend cgf.Visual
 * @abstract
 */
var cgf_ParentVisual = cgf.ParentVisual = cgf_Visual.extend();

/**
 * Creates a parent visual element instance,
 * given its scene,
 * parent element and
 * child index.
 *
 * @constructor
 * @param {cgf.Element} [parent=null] The parent element of this element.
 * @param {object} [scene=null] The scene of this element.
 * @param {number} [index=-1] The index of the scene specified in argument `scene`.
 * @alias ParentVisualElement
 * @memberOf cgf
 *
 * @class A visual element that can be a parent and stores the scene and index properties.
 *
 * @extends cgf.Visual.Element
 * @mixin cgf.TemplatedElementSceneStorageMixin
 * @mixin cgf.TemplatedElementParentMixin
 * @abstract
 */
cgf.ParentVisual.Element
    .add(cgf_TemplatedElementSceneStorageMixin)
    .add(cgf_TemplatedElementParentMixin);
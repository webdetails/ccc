
var cgf_TemplatedElementSceneStorageMixin = cgf.TemplatedElementSceneStorageMixin = def.Object.extend({
    /**
     * A mixin implementation for local storage of
     * {@link cgf.TemplatedElement#scene}
     * and its index {@link cgf.TemplatedElement#index}
     * as instance fields..
     *
     * @constructor
     * @param {cgf.Element} [parent=null] The parent element of this element.
     * @param {object} [scene=null] The scene of this element.
     * @param {number} [index=-1] The index of the scene specified in argument `scene`.
     * @alias TemplatedElementParentMixin
     * @memberOf cgf
     *
     * @class A mixin class for templated elements that store the scene and index as local fields.
     *
     * @extends def.Object
     *
     * @abstract
     */
    init: function(parent, scene, index) {
        /**
         * Gets the scene that contains source data for this element,
         * or `null` when none.
         *
         * @type object
         * @override
         */
        this.scene = scene || null;

        /**
         * Gets the element's 0-based _scene_ index,
         * or `-1` if it has no specified index.
         *
         * @type number
         * @override
         */
        this.index = index == null ? -1 : index;
    }
});

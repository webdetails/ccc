
cgf_TemplatedElement.SceneStorageMixin = def.Object.extend({
    /**
     * A mixin implementation for local storage of
     * {@link cgf.Template.Element#scene}
     * and its index {@link cgf.Template.Element#index}
     * as instance fields..
     *
     * @alias SceneStorageMixin
     * @memberOf cgf.Template.Element
     *
     * @mixin
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
         * or `0` if it has no specified index.
         *
         * @type number
         * @override
         */
        this.index = index || 0;
    }
});

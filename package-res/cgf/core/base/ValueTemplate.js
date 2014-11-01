
var cgf_ValueTemplate = cgf.ValueTemplate = cgf_Template.extend({
    /**
     * @name cgf.ValueTemplate
     *
     * @extends cgf.Template
     *
     * @class A value template is a lightweight template
     * that must have a parent element and
     * that always spawns a single element per parent element.
     *
     * If a value template does not yet have a parent template
     * when {@link cgf.Template#createElement} is called,
     * an error is thrown.
     *
     * The single scene of a value element is the scene of its parent element.
     * Its scene index is always `0`.
     *
     * Setting the template's {@link cgf.Template#scenes} properties has no effect.
     */

    methods: /** @lends cgf.ValueTemplate# */{

        /**
         * Besides creating the template's element class,
         * ensures that the value template has a parent template.
         *
         * @private
         * @override
         * @throws {def.error.operationInvalid} When the template instance does not have
         * a parent template.
         */
        _initElemClass: function() {
            if(!this.parent)
                throw def.error.operationInvalid("Value template must have a parent template.");

            return this.base();
        },

        /**
         * Obtains the child scenes given the parent scene.
         *
         * This implementation always returns the parent scene.
         *
         * @param {any} parentScene The parent scene.
         * @return {any} The parent scene.
         * @override
         */
        evalScenes: def.configurable(false, function(parentScene) {
            return parentScene;
        })
    },

    element: {
        /**
         * @name cgf.ValueTemplate.Element
         * @class The element class of value templates.
         * @extends cgf.Template.Element
         */
        methods: /** @lends cgf.ValueTemplate.Element# */{

            /**
             * Gets the scene that contains source data for this element,
             * or `null` when none.
             *
             * This implementation returns the same scene as that of
             * this element's parent element.
             *
             * @type object
             * @override
             */
            get scene() { return this.parent.scene; },

            /**
             * Gets the element's 0-based _scene_ index.
             *
             * Because this element is always an only child,
             * its scene index is always `0`.
             *
             * @type number
             */
            get index() { return 0; }
        }
    }
});
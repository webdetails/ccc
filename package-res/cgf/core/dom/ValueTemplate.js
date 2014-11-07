
/**
 * @name cgf.dom.ValueTemplate
 *
 * @extends cgf.dom.Template
 *
 * @class A value template is a lightweight template
 * that must have a parent element and
 * that always spawns a single element per parent element.
 *
 * If a value template does not yet have a parent template
 * when {@link cgf.dom.Template#createElement} is called,
 * an error is thrown.
 *
 * The single scene of a value element is the scene of its parent element.
 * Its scene index is always `0`.
 *
 * Setting the template's {@link cgf.dom.Template#scenes} properties has no effect.
 */
var cgf_dom_ValueTemplate = cgf.ValueTemplate = cgf.dom.ValueTemplate = cgf_dom_Template.extend()
    .add(/** @lends cgf.dom.ValueTemplate# */{
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
    });
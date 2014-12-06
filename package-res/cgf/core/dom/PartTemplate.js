
/**
 * @name cgf.dom.PartTemplate
 *
 * @extends cgf.dom.Template
 *
 * @class A part template is a lightweight template
 * that is owned by a parent _entity_ template.
 *
 * It always spawns a single element per parent element.
 *
 * If a part template does not yet have a parent template
 * when {@link cgf.dom.Template#createElement} is called,
 * an error is thrown.
 *
 * The single scene of a part element is the scene of its parent element.
 * Its scene index is always `0`.
 *
 * The several version properties of a part element
 * are always those of its parent element.
 *
 * Setting the template's {@link cgf.dom.Template#scenes} property has no effect.
 *
 * Note that in the above simple description,
 * what is referred to as _parent_ element
 * is, in fact, named _real parent_ element,
 * as given by property {@link cgf.dom.Element#realParent}.
 */
var cgf_dom_PartTemplate = cgf.PartTemplate =

defTemplate(cgf.dom, 'PartTemplate', cgf_dom_Template.extend())
    .add(/** @lends cgf.dom.PartTemplate# */{
        /**
         * Besides creating the template's element class,
         * ensures that the part template has a parent template.
         *
         * @private
         * @override
         * @throws {def.error.operationInvalid} When the template instance does not have
         * a parent template.
         */
        _initElemClass: function() {
            if(!this.parent)
                throw def.error.operationInvalid("A part template must have a parent template.");

            return this.base();
        },

        /**
         * Obtains the child scene(s) given the parent scene.
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

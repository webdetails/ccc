
var cgf_ValueTemplate = cgf.ValueTemplate = cgf_Template.extend({
    /**
     * Creates a value template instance,
     * given its parent template and, optionally,
     * a configuration.
     *
     * @constructor
     * @param {cgf.Template} parent The parent template.
     * @param {object} [config] A configuration object.
     * @alias ValueTemplate
     * @memberOf cgf
     * @extends cfd.Template
     * @class A value template is a lightweight template
     * class that cannot have children,
     * or a non-default `scenes` property.
     *
     * The element class of a value template
     * derives from {@link cgf.ValueTemplatedElement}.
     */
    init: function(parent, config) {

        if(!parent) throw def.error.argumentRequired("parent");

        this.base(parent, config);
    },

    methods: /** @lends cgf.ValueTemplate# */{
        /**
         * Gets the empty child templates array.
         *
         * Templates of this class cannot have child templates.
         * The set form of this method is not supported.
         * The get form always returns an empty array.
         *
         * @see cgf.Template#add
         *
         * @return {Array.<cgf.Template>} The empty child templates array.
         *
         * @throws {def.error.operationInvalid} When the set form of the method is used.
         */
        content: function() {
            if(arguments.length) this.add();
            return this.children;
        },

        /**
         * Adds a child template.
         *
         * This operation is not supported because
         * templates of this class cannot have child templates.
         *
         * @method
         *
         * @param {function} ChildTempl The child template _constructor_ function.
         * @param {object} [config] A configuration object to configure the
         * created child template.
         * @throws {def.error.operationInvalid} Always.
         * @override
         */
        add: def.configurable(false, function(/*ChildTempl, config*/) {
            throw def.error.operationInvalid("Value template cannot have children");
        }),

        /**
         * Obtains the child scenes given the parent scene.
         *
         * This implementation always returns an array with
         * the parent scene as the only element.
         *
         * @param {any} parentScene The parent scene.
         * @return {Array.<any>} An array with a single child scene.
         */
        evalScenes: def.configurable(false, function(parentScene) {
            return [parentScene];
        })
    },

    element: {
        methods: /** @lends cgf.TemplatedElement# */{

            /**
             * Gets the associated template instance.
             * @name template
             * @type cgf.ValueTemplate
             */

            /**
             * Gets the element's parent element, or `null` if none.
             *
             * This property is immutable.
             *
             * @name parent
             * @type cgf.ParentTemplatedElement
             */

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

/**
 * Creates a value templated element, given a templated parent element.
 *
 * Typically, this constructor isn't used directly,
 * and {@link cgf.ValueTemplate#createElement} is used instead.
 *
 * @constructor
 * @param {cgf.ParentTemplatedElement} parent The templated parent element of this value element.
 * @name ValueTemplatedElement
 * @memberOf cgf
 *
 * @class A value templated element
 * is an only-child,
 * has no own scene and
 * cannot have children.
 *
 * The scene of a value element is that of its parent.
 *
 * @extends cgf.TemplatedElement
 */
cgf.ValueTemplatedElement = cgf_ValueTemplate.Element;
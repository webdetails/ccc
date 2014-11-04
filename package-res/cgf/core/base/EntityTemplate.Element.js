
cgf_EntityTemplate.Element
    /**
     * Creates an entity template element,
     * optionally given its
     * parent element,
     * scene and
     * scene index.
     *
     * @alias Element
     * @memberOf cgf.EntityTemplate
     *
     * @class The element class of an entity template.
     *
     * This class is abstract.
     * To create an instance you should use {@link cgf.EntityTemplate#createElement}.
     *
     * @extends cgf.Template.Element
     *
     * @abstract
     *
     * @constructor
     * @param {cgf.Element} [parent] The parent element.
     * @param {any} [scene] The scene.
     * @param {number} [index] The scene index.
     */
    .init(function(parent, scene, index) {

        /** @this cgf.EntityTemplate.Element */

        this.base(parent); // <-- _props, version

        /**
         * Gets the element's parent element, or `null` if none.
         *
         * This property is immutable.
         *
         * @type cgf.Element
         * @override
         */
        this.parent = parent || null;

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
    })

    .add(/** @lends cgf.EntityTemplate.Element# */{

        /**
         * Gets this element's real parent, or `null`, if none.
         *
         * This property is immutable.
         *
         * @name cgf.Element#realParent
         * @return {cgf.Element} The element's real parent.
         * @override
         */
        get realParent() { return this.parent; }
    });

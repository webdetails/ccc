
cgf_EntityTemplate.Element
    /**
     * Creates an entity template element,
     * optionally given its
     * parent element,
     * scene and
     * scene index.
     *
     * @name cgf.EntityTemplate.Element
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

        this.base(parent); // <-- _props, version

        // NOTE: in the following, the only way I managed to make JsDocs
        // not ignore the doclets was by using @name instead of @memberOf.
        // Otherwise, the base class' abstract versions would always show...

        /**
         * Gets the element's parent element, or `null` if none.
         *
         * This property is immutable.
         *
         * @name cgf.EntityTemplate.Element#parent
         * @type {cgf.Element}
         * @override
         */
        this.parent = parent || null;

        /**
         * Gets the scene that contains source data for this element,
         * or `null` when none.
         *
         * @type {object}
         * @name cgf.EntityTemplate.Element#scene
         * @override
         */
        this.scene = scene || null;

        /**
         * Gets the element's 0-based _scene_ index,
         * or `0` if it has no specified index.
         *
         * @type {number}
         * @name cgf.EntityTemplate.Element#index
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
         * @type {cgf.Element}
         * @override
         */
        get realParent() { return this.parent; }
    });

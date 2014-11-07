cgf.GenericElement = cgf.dom.GenericElement = cgf.dom.Element.extend()
    /**
     * Creates a generic element instance,
     * optionally given its
     * parent element.
     *
     * @constructor
     * @param {cgf.dom.Element} [parent=null] The parent element of this element.
     *
     * @name cgf.dom.GenericElement
     *
     * @class A general purpose non-abstract element class.
     *
     * This type of element is _not_ associated to a template instance.
     *
     * @extends cgf.dom.Element
     */
    .init(function(parent) {

        this.parent = parent || null;

        /**
         * Map from property full name to its value.
         *
         * @type Object.<string,any>
         * @private
         */
        this._props = {};
    })

    .add(/** @lends cgf.dom.GenericElement# */{

        /**
         * Gets this element's real parent, or `null`, if none.
         *
         * This property is immutable.
         *
         * @type {cgf.dom.Element}
         * @override
         */
        get realParent() { return this.parent; },

        /**
         * Gets the value of the specified property.
         *
         * @param {cgf.dom.property} prop The property.
         * @return {any} The value of the property in this element, or `undefined`,
         * if not present.
         * @override
         */
        get: function(prop) {
            return this._props[prop.fullName];
        },

        /**
         * Sets the value of the specified property to the specified value.
         *
         * @param {cgf.dom.property} prop The property.
         * @param {any} value The new value.
         * An `undefined` value is ignored.
         * A `null` value resets the property value.
         *
         * @return {cgf.dom.Element} This instance.
         * @override
         */
        set: function(prop, value) {
            // TODO: should prop.cast be being respected, even if not calculated?
            if(value !== undefined) {
                this._props[prop.fullName] = value === null ? undefined : value;
            }
            return this;
        }
    });

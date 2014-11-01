cgf.GenericElement = cgf.Element.extend({
    /**
     * Creates a generic element instance,
     * optionally given its
     * parent element.
     *
     * @constructor
     * @param {cgf.Element} [parent=null] The parent element of this element.
     *
     * @alias GenericElement
     * @memberOf cgf
     *
     * @class A general purpose non-abstract element class.
     *
     * This type of element is _not_ associated to a template instance.
     *
     * @extends cgf.Element
     */
    init: function(parent) {

        this.base(parent);

        /**
         * Map from property full name to its value.
         *
         * @type Object.<string,any>
         * @private
         */
        this._props = {};
    },

    methods: /** @lends cgf.GenericElement# */{
        /**
         * Gets the value of the specified property.
         *
         * @param {cgf.property} prop The property.
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
         * @param {cgf.property} prop The property.
         * @param {any} value The new value.
         * An `undefined` value is ignored.
         * A `null` value resets the property value.
         *
         * @return {cgf.Element} This instance.
         * @override
         */
        set: function(prop, value) {
            // TODO: should prop.cast be being respected, even if not calculated?
            if(value !== undefined) {
                this._props[prop.fullName] = value === null ? undefined : value;
            }
            return this;
        }
    }
});


var cgf_TemplatedElement = cgf.TemplatedElement = cgf_Element.extend({
    /**
     * Creates a templated element,
     * given its scene,
     * parent element and
     * child index.
     *
     * @constructor
     * @param {cgf.Element} [parent=null] The parent element of this element.
     * @param {object} [scene=null] The scene of this element.
     * @param {number} [index=-1] The index of the scene specified in argument `scene`.
     *
     * @alias TemplatedElement
     * @memberOf cgf
     *
     * @class An element whose
     * content structure and property values
     * follow the configuration of an associated template instance.
     *
     * This class' constructor is the value of {@link cgf.Template.Element}.
     *
     * This is the base abstract class of elements spawned by templates.
     * It provides the properties storage implementation.
     *
     * @extends cgf.Element
     *
     * @abstract
     */
    init: function(parent) {

        this.base(parent);

        /**
         * Map from property full name to its value.
         *
         * This map has the class' {@link cgf.TemplatedElement#_propsBase}
         * as prototype, so that it inherits the values of
         * constant properties.
         *
         * @type Object.<string,any>
         * @private
         */
        this._props = Object.create(this._propsBase);
    },

    methods: /** @lends cgf.TemplatedElement# */{

        /**
         * Gets the associated template instance.
         *
         * Each template instance has a corresponding {@link cgf.TemplatedElement} class.
         *
         * This property is stored in the class' prototype object
         * and is thus shared by all of its instances.
         *
         * @type cgf.Template
         */
        template: null,

        /**
         * Gets the base property values dictionary from which
         * instance dictionaries inherit.
         *
         * This dictionary maps property unique names to property values.
         * It is used to contain the shared values of
         * constant template properties.
         *
         * This property is stored in the class' prototype object
         * and is thus shared by all of its instances.
         *
         * @type Object.<string,any>
         * @private
         */
        _propsBase: {},

        /**
         * Gets the scene that contains source data for this element,
         * or `null` when none.
         * @name cgf.TemplatedElement#scene
         * @type any
         * @abstract
         */

        /**
         * Gets the element's 0-based _scene_ index,
         * or `-1` if it has no specified index.
         * @name cgf.TemplatedElement#index
         * @type number
         * @abstract
         */

        /**
         * Gets the value of the specified property.
         *
         * @param {cgf.Property} prop The property.
         * @return {any} The value of the property in this element, or <tt>undefined</tt>,
         * if not present.
         */
        get: function(prop) {
            // If the property has a local dedicated accessor, use it.
            // Otherwise, for any other properties, directly access the _props map.
            return O_hasOwnProp.call(this, prop.shortName)
                ? this[prop.shortName]()
                : this._props[prop.fullName];
        },

        /**
         * Sets the value of the specified property to the specified value.
         *
         * This operation is not supported if the specified property
         * is calculated in this element.
         *
         * @param {cgf.Property} prop The property.
         * @param {any} value The new value.
         * An `undefined` value is ignored.
         * A `null` value resets the property value.
         *
         * @return {cgf.Element} This instance.
         * @throws {def.error.operationInvalid} If the property in argument <i>prop</i>
         * is being calculated in this element.
         */
        set: function(prop, value) {
            // Cannot set properties that have a local dedicated accessor,
            //  cause those are of calculated properties.

            if(O_hasOwnProp.call(this, prop.shortName))
                throw def.error.operationInvalid("The property '{0}' is calculated and cannot be set.", [prop.shortName]);

            // A free property can be set.

            if(value !== undefined) {
                // TODO: property cast is not being handled...
                this._props[prop.fullName] = value === null ? undefined : value;
            }

            return this;
        },

        /**
         * Invalidates all property values and re-spawns child elements, if any.
         */
        refresh: function() {
            this._props = Object.create(this._propsBase);
        }
    }
});

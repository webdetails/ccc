var cgf_Element = cgf.Element = def.Object.extend()
    /**
     * @name cgf.Element
     * @class The base abstract class of elements.
     *
     * To create a generic element, use the {@link cgf.GenericElement} class.
     *
     * @abstract
     */
    .methods(/** @lends cgf.Element# */{
        /**
         * Gets the element's parent element, or `null` if none.
         *
         * This property is immutable.
         *
         * @name cgf.Element#parent
         * @return {cgf.Element} The element's parent.
         * @abstract
         */

        /**
         * Gets this element's real parent, or `null`, if none.
         *
         * This property is immutable.
         *
         * @name cgf.Element#realParent
         * @return {cgf.Element} The element's real parent.
         * @abstract
         */

        /**
         * Gets the value of a specified property.
         * @function
         * @name cgf.Element#get
         * @param {cgf.property} prop The property.
         * @return {any} The value of the property in this element, or `undefined`,
         * if not present.
         * @abstract
         */

        /**
         * Sets the value of the specified property to the specified value.
         *
         * This operation is not supported if the specified property
         * is calculated in this element.
         *
         * @name cgf.Element#set
         * @function
         * @param {cgf.property} prop The property.
         * @param {any} value The new value.
         * An `undefined` value is ignored.
         * A `null` value resets the property value.
         *
         * @return {cgf.Element} This instance.
         * @abstract
         */

        /**
         * Delegates the evaluation of a property to the base evaluator method.
         * Can optionally be given a default value,
         * that is returned instead of an undefined base result.
         *
         * This method calls the OOP-style `base` method, with no arguments.
         * It is designed to be used from within property evaluation functions
         * and provide backward compatibility with
         * {@link http://ccc.webdetails.org CCC} and
         * {@link http://mbostock.github.com/protovis/ protovis} code.
         *
         * @param {any} [dv] The value to return when the base implementation
         * returns the value `undefined`.
         *
         * @return {any} The value returned by base, or,
         * when `undefined`, the value of the argument `dv`.
         */
        delegate: function(dv) {
            var v = this.base();
            return v === undefined ? dv : v;
        }

        // TODO: implement overall child index?
        /**
         * Gets this element's child index, or `-1`, if it has no parent.
         * @return {number} The child index or `-1`.
         * @abstract
         */
        //get childIndex() { throw def.error.notImplemented(); }
    });

var cgf_dom_Element = cgf.Element = cgf.dom.Element = def.Object.extend()
    /**
     * @name cgf.dom.Element
     * @class The base abstract class of elements.
     *
     * To create a generic element, use the {@link cgf.dom.GenericElement} class.
     *
     * @abstract
     */
    .methods(/** @lends cgf.dom.Element# */{
        /**
         * Gets the element's parent element, or `null` if none.
         *
         * This property is immutable.
         *
         * @name cgf.dom.Element#parent
         * @return {cgf.dom.Element} The element's parent.
         * @abstract
         */

        /**
         * Gets this element's real parent, or `null`, if none.
         *
         * This property is immutable.
         *
         * @name cgf.dom.Element#realParent
         * @return {cgf.dom.Element} The element's real parent.
         * @abstract
         */

        /**
         * Gets the value of a specified property.
         * @function
         * @name cgf.dom.Element#get
         * @param {cgf.dom.property} prop The property.
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
         * @name cgf.dom.Element#set
         * @function
         * @param {cgf.dom.property} prop The property.
         * @param {any} value The new value.
         * An `undefined` value is ignored.
         * A `null` value resets the property value.
         *
         * @return {cgf.dom.Element} This instance.
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
        },

        /**
         * Determines the absolute value of a number in a given unit.
         *
         * This implementation only correctly evaluates the absolute unit.
         *
         * @param {number} num The number to evaluate, expressed in unit _unit_.
         * @param {number} unit The unit in which _num_ is expressed.
         *
         * @return {number} The absolute value, or `NaN`, when the unit is not defined,
         * or it cannot be evaluated in the current state.
         *
         * @virtual
         */
        evalUnit: function(num, unit) {
            if(!unit || !num || !isFinite(num)) return num; // 0, NaN, +Infinity, -Infinity
            // TODO: log unknown unit.
            return NaN;
        }

        // TODO: implement overall child index?
        /**
         * Gets this element's child index, or `-1`, if it has no parent.
         * @type {number}
         * @abstract
         */
        //get childIndex() { throw def.error.notImplemented(); }
    });

/**
 * @class pvc.FormatProvider
 * @classdesc A documentation class that represents a format provider,
 * an object used to obtain formatters for supported data types and
 * well known formatting modes.
 *
 * To create an instance of {@link pvc.FormatProvider} call
 * the factory function {@link pvc.format}.
 *
 * Take attention that this is a documentation class.
 * The actual value of "pvc.FormatProvider" is undefined.
 */

/**
 * Creates a format provider object.
 *
 * @name pvc.format
 * @function
 * @param {object|pvc.FormatProvider|pvc.NumberFormat|pvc.DateFormat} [config]
 * A format provider (or alike), a number format, or a date format
 * with which to initialize this instance.
 *
 * @return {pvc.FormatProvider} A new format provider object.
 */
var formProvider = pvc.format = function() {

    function formatProvider() {}

    formatProvider.tryConfigure = formProvider_tryConfigure;

    // Initializes this instance's fields object and
    // defines accessors for a set of "complex"-valued properties.
    def.instance(formatProvider, formProvider, numForm_sharedProp, arguments, /** @lends  pvc.FormatProvider# */{
        /**
         * Gets, sets or <i>configures</i> the number format.
         * @function
         * @param {string|pvc.NumberFormat|object} [_]
         * When a mask string or a plain object, the existing number format object is configured.
         * When a number format object, replaces the existing number format object.
         *
         * @return {pvc.FormatProvider|pvc.NumberFormat} <tt>this</tt> or the number format.
         */
        number: numForm,

        /**
         * Gets, sets or <i>configures</i> the percent number format.
         * @function
         * @param {string|pvc.NumberFormat|object} [_]
         * When a mask string or a plain object, the existing percent number format object is configured.
         * When a number format object, replaces the existing percent number format object.
         *
         * @return {pvc.FormatProvider|pvc.NumberFormat} <tt>this</tt> or the percent number format.
         */
        percent: numForm,

        /**
         * Gets, sets or <i>configures</i> the date format.
         * @function
         * @param {string|pvc.DateFormat|object} [_]
         * When a mask string or a plain object, the existing date format object is configured.
         * When a date format object, replaces the existing date format object.
         *
         * @return {pvc.FormatProvider|pvc.DateFormat} <tt>this</tt> or the date format.
         */
        date: dateForm
    });

    return formatProvider;
};


/**
 * Tries to configure this object, given a value.
 * @alias tryConfigure
 * @memberOf pvc.FormatProvider#
 * @param {any} other A value, not identical to this, to configure from.
 * @return {boolean|undefined}
 * <tt>true</tt> if the specified value is a format, number format or a date format, and
 * <tt>undefined</tt> otherwise.
 */
function formProvider_tryConfigure(other) {
    switch(def.classOf(other)) {
        case formProvider: return !!this.number (other.number ())
            .percent(other.percent())
            .date   (other.date   ()); // always true
        // When a pvc.NumberFormat, favoring the generic "number" property,
        // instead of the percent property.
        case numForm:   return !!this.number(other); // idem
        case dateForm:  return !!this.date  (other); // idem
    }
};

/**
 * Default format used by instances of {@link pvc.FormatProvider}.
 *
 * The properties of this format object can be changed and
 * will be used for providing defaults for format objects created afterwards.
 *
 * @name pvc.format.defaults
 * @type pvc.FormatProvider
 */
formProvider.defaults = formProvider({
    number:  "#,0.##",
    percent: "#,0.#%",
    date:    "%Y/%m/%d"
});

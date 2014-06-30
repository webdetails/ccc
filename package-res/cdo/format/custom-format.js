
/**
 * @class cdo.CustomFormat
 * @classdesc Represents a custom format, converting arbitrary values to a <tt>string</tt>.
 * This class allows values to be formatted using an externally provided formatting function.
 */

/**
 * Creates a new custom format object.
 *
 * @name cdo.customFormat
 * @function
 * @param {object|function} [config] A configuration value.
 * A function is taken to be the value {@link cdo.CustomFormat#formatter} function.
 * @param {cdo.CustomFormat} [proto] The prototype custom format from which default
 * property values are taken.
 * Defaults to {@link cdo.customFormat.defaults}.
 * @return {cdo.CustomFormat} A new custom format object.
 */
var customForm = cdo.customFormat = function() {
    var fields;

    function customFormat(v) {
        var formatter = fields.formatter;
        return String(formatter && formatter.apply(null, arguments));
    }

    /**
     *
     * @function
     * @name cdo.CustomFormat.prototype.format
     * @param {number} value The value to format.
     * @returns {string}
     */
    customFormat.format = customFormat;

    customFormat.tryConfigure = customForm_tryConfigure;

    fields = def.instance(customFormat, customForm, numForm_sharedProp, arguments, /** @lends  cdo.CustomFormat# */{
        /**
         * Gets or sets the formatting function.
         *
         * The default formatting function formats nully values as an empty string, and,
         * otherwise, just calls the <i>toString</i> method.
         *
         * The signature of the formatting function is:
         * <ul>
         *     <li>as many arguments as externally provided, the first being the value being formatted, and</li>
         *     <li>the custom format instance as the <tt>this</tt> JS context.</li>
         * </ul>
         *
         * @function
         * @param {function} [_] The formatting function.
         * @return {cdo.CustomFormat|function} <tt>this</tt> or the current formatting mask.
         */
        formatter: {
            cast: def.fun.as
        }
    });

    return customFormat;
};

/**
 * Tries to configure this object, given a value.
 * @alias tryConfigure
 * @memberOf cdo.CustomFormat#
 * @param {any} other A value, not identical to this, to configure from.
 * @return {boolean|undefined}
 * <tt>true</tt> if the specified value is a function or a custom format,
 * <tt>undefined</tt> otherwise.
 */
function customForm_tryConfigure(other) {
    // Must test this first. cause a cdo.CustomFormat is a function as well...
    if(def.is(other, customForm)) return !!this.formatter(other.formatter());
    if(def.fun.is(other))         return !!this.formatter(other);
}

// ----------------

// Not using def.string.to, because of it having a second argument.
function customForm_defaultFormatter(v) {
    return v != null ? String(v) : '';
}

/**
 * The default prototype custom format.
 * @alias defaults
 * @memberOf cdo.customFormat
 * @type cdo.CustomFormat
 */
customForm.defaults = customForm().formatter(customForm_defaultFormatter);


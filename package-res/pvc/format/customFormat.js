
/**
 * @class pvc.CustomFormat
 * @classdesc Represents a custom format, converting arbitrary values to a <tt>string</tt>.
 * This class allows values to be formatted using an externally provided formatting function.
 */

/**
 * Creates a new custom format object.
 *
 * @name pvc.customFormat
 * @function
 * @param {object|function} [config] A configuration value.
 * A function is taken to be the value {@link pvc.CustomFormat#formatter} function.
 * @param {pvc.CustomFormat} [proto] The prototype custom format from which default
 * property values are taken.
 * Defaults to {@link pvc.customFormat.defaults}.
 * @return {pvc.CustomFormat} A new custom format object.
 */
var customForm = pvc.customFormat = function() {
    var fields;

    function customFormat(v) {
        var formatter = fields.formatter;
        return String(formatter && formatter.apply(null, arguments));
    }

    /**
     *
     * @function
     * @name pvc.CustomFormat.prototype.format
     * @param {number} value The value to format.
     * @returns {string}
     */
    customFormat.format = customFormat;

    customFormat.tryConfigure = customForm_tryConfigure;

    fields = def.instance(customFormat, customForm, numForm_sharedProp, arguments, /** @lends  pvc.CustomFormat# */{
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
         * @return {pvc.CustomFormat|function} <tt>this</tt> or the current formatting mask.
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
 * @memberOf pvc.CustomFormat#
 * @param {any} other A value, not identical to this, to configure from.
 * @return {boolean|undefined}
 * <tt>true</tt> if the specified value is a function or a custom format,
 * <tt>undefined</tt> otherwise.
 */
function customForm_tryConfigure(other) {
    // Must test this first. cause a pvc.CustomFormat is a function as well...
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
 * @memberOf pvc.customFormat
 * @type pvc.CustomFormat
 */
customForm.defaults = customForm().formatter(customForm_defaultFormatter);


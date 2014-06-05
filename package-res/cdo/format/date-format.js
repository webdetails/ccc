/**
 * @class cdo.DateFormat
 * @classdesc Represents a date format, converting between a <tt>Date</tt> and a <tt>string</tt>.
 * The format mask is the same as that expected by the <tt>strftime</tt> function in C.
 * See the protovis' documentation of <tt>pv.Format.date</tt> for the actual format mask syntax.
 *
 * @variant class
 */

/**
 * Creates a new date format object.
 *
 * The format mask is the same as that expected by the <tt>strftime</tt> function in C.
 * See the protovis' documentation of the function <tt>pv.Format.date</tt>
 * for the actual format mask syntax
 * {@link http://mbostock.github.io/protovis/jsdoc/symbols/pv.Format.date.html}).
 *
 * The current date format implementation does not provide a configurable date style.
 *
 * The <tt>null</tt> value is formatted as an empty string.
 *
 * @name cdo.dateFormat
 * @function
 * @variant factory
 * @param {string|object|cdo.DateFormat} [config] A configuration value.
 * Can be a format mask string, or a date format object (or alike) to copy from.
 * @param {cdo.DateFormat} [proto] The prototype date format from which default
 * property values are taken.
 * Defaults to {@link cdo.dateFormat.defaults}.
 * @return {cdo.DateFormat} A new date format object.
 */
var dateForm = cdo.dateFormat = function() {
    var fields, formatter;

    function dateFormat(value) {
        if(!formatter) formatter = dateForm_createFormatter(fields.mask);
        return formatter(value);
    }

    /**
     * @function
     * @name cdo.DateFormat.prototype.format
     * @param {Date} value The value to format.
     * @returns {string}
     */
    dateFormat.format = dateFormat;

    dateFormat.tryConfigure = dateForm_tryConfigure;

    fields = def.instance(dateFormat, dateForm, numForm_sharedProp, arguments, /** @lends  cdo.DateFormat# */{
        /**
         * Gets or sets the formatting mask.
         *
         * The default formatting mask is empty,
         * which corresponds to formatting
         * <i>nully</i> values with the empty string,
         * and other values by calling the <i>Date#toString</i> method.
         *
         * @function
         * @param {string} [_] The formatting mask.
         * @return {cdo.DateFormat} <tt>this</tt> or the current formatting mask.
         */
        mask: {
            cast:   String,
            change: function() { formatter = null; }
        }
    });

    if(arguments.length) def.configure(dateFormat, arguments[0]);

    return dateFormat;
};

/**
 * Tries to configure this object, given a value.
 * @alias tryConfigure
 * @memberOf cdo.DateFormat#
 * @param {any} other A value, not identical to this, to configure from.
 * @return {boolean|undefined}
 * <tt>true</tt> if the specified value is a string or a date format,
 * <tt>undefined</tt> otherwise.
 */
function dateForm_tryConfigure(other) {
    if(def.string.is(other))    return !!this.mask(other);
    if(def.is(other, dateForm)) return !!this.mask(other.mask());
}

function dateForm_createFormatter(mask) {
    return mask 
        ? pv.Format.createFormatter(pv.Format.date(mask))
        : def.string.to;
}

/**
 * The default prototype date format.
 * @alias defaults
 * @memberOf cdo.dateFormat
 * @type cdo.DateFormat
 */
dateForm.defaults = dateForm();

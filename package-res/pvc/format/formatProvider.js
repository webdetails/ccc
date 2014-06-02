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
 * @param {object|pvc.FormatProvider|pvc.NumberFormat|pvc.DateFormat|pvc.CustomFormat} [config]
 * A format provider (or alike), a number format, a date format or a custom format
 * with which to initialize this instance.
 * @param {pvc.FormatProvider} [proto] The prototype format provider from which default
 * property values are taken.
 * Defaults to {@link pvc.format.defaults}.
 * @return {pvc.FormatProvider} A new format provider object.
 */
var formProvider = pvc.format = function() {

    function formatProvider() {}

    formatProvider.tryConfigure = formProvider_tryConfigure;

    // Initializes this instance's fields object and
    // defines accessors for a set of "complex"-valued properties.
    def.instance(formatProvider, formProvider, numForm_sharedProp, arguments, /** @lends  pvc.FormatProvider# */{
        /**
         * Gets, sets or <i>configures</i> the format provider's general number format.
         *
         * The global default of the number format mask is <tt>"#,0.##"</tt> —
         * numbers are first rounded to decimal places.
         * Then, they are formatted with a thousands group separator and only significant decimal places.
         *
         * See the {@link pvc.NumberFormatStyle}
         * for information on the global default number styles.
         *
         * See also related information in {@link pvc.BaseChart#valueFormat}.
         *
         * @function
         * @param {string|function|object|pvc.NumberFormat|pvc.CustomFormat} [_] The new value.
         * When a string is specified,
         * it is the {@link pvc.NumberFormat#mask}  property of
         * a new number format that replaces the current format.
         *
         * When a function is specified,
         * it is the {@link pvc.CustomFormat#formatter}  property
         * of a new custom format that replaces the current format.
         *
         * When an object is specified, it configures the <i>current</i> format object.
         *
         * Alternatively, direct instances of
         * {@link pvc.NumberFormat} and {@link pvc.CustomFormat}
         * can be specified, replacing the existing format.
         *
         * @return {pvc.FormatProvider|pvc.NumberFormat|pvc.CustomFormat} <tt>this</tt> or the number format.
         */
        number: formProvider_field(numForm),

        /**
         * Gets, sets or <i>configures</i> the format provider's percent number format.
         *
         * The formatting function should multiply the numeric value by 100.
         *
         * This function is used whenever a chart needs to show percentages,
         * like in the tooltips of a stacked chart or the percentages shown in a Pie chart.
         *
         * The global default percent mask is <tt>"#,0.#%"</tt> —
         * numbers are first multiplied by 100 and then
         * rounded to one decimal place.
         * Then, they are formatted
         * with a thousands group separator,
         * with only significant decimal places,
         * and by appending a "%" character.
         *
         * See the {@link pvc.options.format.NumberFormatStyle}
         * for information on the global default number styles.
         *
         * See also related information in {@link pvc.options.chart.Chart#percentValueFormat}.
         *
         * @function
         * @param {string|function|object|pvc.NumberFormat|pvc.CustomFormat} [_] The new value.
         * When a string is specified,
         * it is the {@link pvc.options.format.NumberFormat#mask} property of
         * a new number format that replaces the current format.
         *
         * When a function is specified,
         * it is the {@link pvc.options.format.CustomFormat#formatter} property
         * of a new custom format that replaces the current format.
         *
         * When an object is specified, it configures the <i>current</i> format object.
         *
         * Alternatively, direct instances of
         * {@link pvc.options.format.NumberFormat} and {@link pvc.options.format.CustomFormat}
         * can be specified, replacing the existing format.
         *
         * @return {pvc.FormatProvider|pvc.NumberFormat|pvc.CustomFormat} <tt>this</tt> or the percent number format.
         */
        percent: formProvider_field(numForm),

        /**
         * Gets, sets or <i>configures</i> the format provider's general date format.
         *
         * The global default date mask id <tt>"%Y/%m/%d"</tt>.
         *
         * @function
         * @param {string|function|object|pvc.DateFormat|pvc.CustomFormat} [_] The new value.
         * When a string is specified,
         * it is the {@link pvc.options.format.DateFormat#mask} property of
         * a new date format that replaces the current format.
         *
         * When a function is specified,
         * it is the {@link pvc.options.format.CustomFormat#formatter} property
         * of a new custom format that replaces the current format.
         *
         * When an object is specified, it configures the <i>current</i> format object.
         *
         * Alternatively, direct instances of
         * {@link pvc.options.format.DateFormat} and {@link pvc.options.format.CustomFormat}
         * can be specified, replacing the existing format.
         *
         * @return {pvc.FormatProvider|pvc.DateFormat|pvc.CustomFormat} <tt>this</tt> or the date format.
         */
        date: formProvider_field(dateForm),

        /**
         * Gets, sets or <i>configures</i> the format used by the format provider to format other
         * data types, like <i>string</i>, <i>boolean</i> and <i>object</i>.
         *
         * The global default custom formatter formats <i>nully</i>
         * values as an empty string and
         * other values by calling their <i>#toString()</i> method.
         *
         * @function
         * @param {object|pvc.CustomFormat} [_] The new value.
         * When a function is specified,
         * it is the {@link pvc.options.format.CustomFormat#formatter} property
         * of a new custom format that replaces the current format.
         *
         * When an object is specified, it configures the <i>current</i> format object.
         *
         * Alternatively, a direct instance of {@link pvc.options.format.CustomFormat}
         * can be specified, replacing the existing format.
         *
         * @return {pvc.FormatProvider|pvc.CustomFormat} <tt>this</tt> or the custom format.
         */
        any: {cast: def.createAs(customForm), factory: customForm}
    });

    return formatProvider;
};

/**
 * Creates a field specification.
 *
 * The included cast function tries to convert a given value to one supported by the field.
 * A field that uses this function will support values of two types:
 * <ul>
 *     <li>One that is an instance of the specified <i>mainFactory</i>, and</li>
 *     <li>An instance of the {@link pvc.CustomFormat} class</li>
 * </ul>
 * For any other value types, the cast function returns the <tt>null</tt> value.
 *
 * The included factory function dynamically chooses an appropriate underlying
 * factory depending on the type of configuration value received.
 *
 * If the configuration value is a function,
 * a custom format instance is created having that function as formatter.
 *
 * For other configuration value types the specified <i>mainFactory</i> is used.
 * @param {function} mainFactory The main factory function of the field.
 * @return {object} The built field specification function.
 * @private
 */
function formProvider_field(mainFactory) {

    // An "as" function of a type union...
    function fieldCast(value) {
        return (def.is(value, mainFactory) || def.is(value, customForm)) ? value : null;
    }

    function fieldFactory(config, proto) {
        var f = def.fun.is(config) ? customForm : mainFactory;
        return f(config, proto);
    }

    return {cast: fieldCast, factory: fieldFactory};
}

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
        case formProvider:
            return !!this
                .number (other.number ())
                .percent(other.percent())
                .date   (other.date   ())
                .any    (other.any    ()); // always true
        // When other is a pvc.NumberFormat,
        // we're favoring the generic "number" property,
        // instead of the percent property.
        case numForm:    return !!this.number(other); // idem
        case dateForm:   return !!this.date  (other); // idem
        case customForm: return !!this.any   (other); // idem
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
    date:    "%Y/%m/%d",
    any:     customForm()
});

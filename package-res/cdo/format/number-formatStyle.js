/**
 * Creates a number format style,
 * optionally initialized from an existing style or style-like object.
 * @name cdo.numberFormatStyle
 * @param {cdo.NumberFormatStyle|object} [config] A configuration value.
 * It can be another instance of number format style, or a generic object, alike.
 * @param {cdo.NumberFormatStyle} [proto=null] The prototype instance to connect to, for obtaining default values.
 * @return {cdo.NumberFormatStyle} The new number format style.
 */
var numFormStyle = cdo.numberFormatStyle = function(other, proto) {
    return new NumFormStyle(other, proto);
};

var numForm_privProp = def.priv.key().property();

// Mark the factory function as creating NumFormStyle instances, by filling in its "of" property.

var NumFormStyle = numFormStyle.of = def('cdo.NumberFormatStyle', def.FieldsBase.extend({
    /**
     * Builds a number format style,
     * optionally initialized from an existing style or style-like object.
     *
     * Normally, this constructor will not be used directly,
     * and the factory {@link cdo.numberFormatStyle} is used instead.
     *
     * @name cdo.NumberFormatStyle
     * @constructor
     * @param {cdo.NumberFormatStyle|object} [config] A configuration value.
     * It can be another instance of number format style, or a generic object, alike.
     * @param {cdo.NumberFormatStyle} [proto=null] The prototype instance to connect to, for obtaining default values.
     */
    init: function() {
        def.classify(this, numFormStyle);
    },

    fields: /** @lends cdo.NumberFormatStyle# */{
        /**
         * Gets or sets the character to use in place of the `.` mask character.
         * The decimal point separates the integer and fraction parts of the number.
         * The default is ".".
         * @function
         * @param {string} [_] The new decimal separator.
         * @return {cdo.NumberFormatStyle} <tt>this</tt> or the current decimal separator.
         */
        decimal: {cast: String, fail: def.falsy},

        /**
         * Gets or sets the character to use in place of the `,` mask character.
         * The group separator groups integer digits according to the sizes in <tt>groupSizes</tt>.
         * The default group separator is ",".
         * Grouping can be disabled, independently of the mask, by specifying "".
         *
         * @function
         * @param {string} [_] The new group separator.
         * @return {cdo.NumberFormatStyle} <tt>this</tt> or the current group separator.
         */
        group: {cast: String},

        /**
         * Gets or sets the array of group sizes.
         *
         * The last group is repeated indefinitely.
         *
         * @function
         * @param {number[]} [_] The new array of group sizes.
         * @return {cdo.NumberFormatStyle} <tt>this</tt> or the current array of group sizes.
         */
        groupSizes: {fail: def.array.empty},

        /**
         * Gets or sets the negative sign character.
         * The negative sign is used to indicate a negative number
         * when a mask does not have a negative values section.
         * The negative sign is placed leftmost in the resulting string.
         * The negative sign is also used for showing a negative exponent,
         * in scientific notation.
         * The default is "-".
         * @function
         * @param {string} [_] The new negative sign character.
         * @return {cdo.NumberFormatStyle} <tt>this</tt> or the current negative sign character.
         */
        negativeSign: {cast: String, fail: def.falsy},

        /**
         * Gets or sets the currency symbol to use in place of the `&amp;#164;` mask character or 'Currency' Macro.
         *
         * The <b>currency sign</b> &amp;#164; is a character used to denote an unspecified currency.
         * Its unicode is U+00A4 and
         * its HTML entities are &amp;amp;#164; and &amp;amp;curren;
         *
         * The default is "$".
         *
         * See {@link http://en.wikipedia.org/wiki/Currency_sign_(typography)"} for
         * more information on the currency sign character.
         * @function
         * @param {string} [_] The new currency symbol.
         * @return {cdo.NumberFormatStyle} <tt>this</tt> or the current currency symbol.
         */
        currency: {cast: String, fail: def.falsy},

        /**
         * Gets or sets the character to use in place of a `0` mask character in the integer part.
         * The default pad character is "0" (zero).
         * @function
         * @param {string} [_] the new integer pad character.
         * @returns {cdo.NumberFormatStyle} <tt>this</tt> or the current integer pad character.
         */
        integerPad: {cast: String, fail: def.falsy},

        /**
         * Gets or sets the character to use in place of a `0` mask character in the fractional part.
         * The default pad character is "0" (zero).
         * @function
         * @param {string} [_] the new fractional pad character.
         * @returns {cdo.NumberFormatStyle} <tt>this</tt> or the current fractional pad character.
         */
        fractionPad: {cast: String, fail: def.falsy},

        /**
         * Gets or sets the array of abbreviations.
         *
         * There is no maximum number of units abbreviations.
         * The first element of the array represents the Thousands unit,
         * the second Millions, the third Billions...
         *
         * @function
         * @param {string[]} [_] The new array of abbreviations.
         * @return {cdo.NumberFormatStyle} <tt>this</tt> or the current array of abbreviations.
         */
        abbreviations: {fail: def.array.empty}
    },

    methods: /** @lends cdo.NumberFormatStyle# */ {
        /**
         * Tries to configure this object, given a value.
         *
         * @param {any} other A value, not identical to this, to configure from.
         * @return {boolean|undefined}
         * <tt>true</tt> if the specified value is a number format style,
         * <tt>undefined</tt> otherwise.
         */
        tryConfigure: function(other) {

            if(def.is(other, numFormStyle))
                return !!this
                    .integerPad(other.integerPad())
                    .fractionPad(other.fractionPad())
                    .decimal(other.decimal())
                    .group(other.group())
                    .groupSizes(other.groupSizes())
                    .negativeSign(other.negativeSign())
                    .currency(other.currency())
                    .abbreviations(other.abbreviations());

            if(def.string.is(other)) {
                var formP = langProvider(other);
                if(formP) return !!def.configure(this, formP.number().style());
            }
        }
    }
}, {fieldsPrivProp: numForm_privProp}));

def.classify(NumFormStyle.prototype, numFormStyle);

/**
 * Default number format style used by instances of {@link cdo.formatNumber.Style}.
 *
 * The properties of this format object can be changed and
 * will be used for providing defaults for style objects created afterwards.
 *
 * @name cdo.numberFormatStyle.defaults
 * @type cdo.NumberFormatStyle
 */
numFormStyle.defaults = numFormStyle({
    integerPad:   "0",
    fractionPad:  "0",
    decimal:      ".",
    group:        ",",
    groupSizes:   [3],
    abbreviations: ['k','m', 'b', 't'],
    negativeSign: "-",
    currency:     "$"
});

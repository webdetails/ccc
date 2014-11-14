/**
 * A "bounded number" is a number or a number range.
 * @typedef {number|cgf.INumberRange} cgf.IBoundedNumber
 */

/**
 * Creates a bounded number, given the fixed, minimum and maximum value.
 *
 * @param {number} [value=null] The finite, fixed, value or `null`.
 * @param {number} [min=-Infinity] The minimum value.
 * @param {number} [max=Infinity] The maximum value.
 *
 * @return {cgf.IBoundedNumber} The bounded number.
 */
var cgf_boundedNumber = cgf.boundedNumber = function(value, min, max) {
    if(value != null) {
        if(max != null && value > max) value = max;
        return (min != null && value < min) ? min : value;
    }

    if(min == null || min === negInf) {
        if(max == null || max === posInf) return null;
        return {min: negInf, max: max}
    }

    if(max == null || max === posInf)
        return {min: min, max: posInf};

    return (min >= max) ? min : {min: min, max: max};
};

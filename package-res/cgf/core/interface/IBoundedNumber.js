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

/**
 * Obtains the maximum value, when a range,
 * the fixed value, when a number, or
 * the given default value, when _nully_.
 * @param {cgf.IBoundedNumber?} boundNum The bounded number.
 * @param {number?|undefined} [dv=undefined] The value to return when `boundNum` is _nully_.
 * @return {number?|undefined} The number result.
 */
cgf_boundedNumber.fixedOrMaxOrDefault = function(boundNum, dv) {
    if(boundNum == null) return dv;
    if(def.number.is(boundNum)) return boundNum;
    return boundNum.max;
};

/**
 * Returns a bounded number that is the result of
 * adding a bounded number and a fixed value.
 *
 * When the provided _boundedNum_ is a range object,
 * and unless the fixed value, _v_, is `0`,
 * a new range object is returned.
 *
 * Optionally, a function can be specified to keep the result within certain bounds.
 *
 * @param {cgf.IBoundedNumber?} boundNum The bounded number.
 * @param {number} v The fixed number to add.
 * @param {function} [castToBounds=def.fun.identity] A function that casts
 * a fixed value to certain bounds.
 *
 * @return {cgf.IBoundedNumber} The resulting bounded number.
 */
cgf_boundedNumber.addFixed = function(boundNum, v, castToBounds) {
    if(boundNum == null) return null;
    if(!v) return boundNum;

    if(!castToBounds) castToBounds = def.fun.identity;

    if(def.number.is(boundNum)) return castToBounds(boundNum + v);

    return {
        min: castToBounds(boundedNum.min + v),
        max: castToBounds(boundedNum.max + v)
    };
};

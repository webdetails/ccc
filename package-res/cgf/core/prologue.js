
/**
 * Root namespace of the CGF library.
 *
 * **CGF** is an acronym for **C**ommunity **G**raphics **F**ramework.
 *
 * @namespace cgf
 */
var DEBUG = 1, // build process may set this to false.
    cgf = def('cgf', {}),
    O_hasOwnProp = Object.prototype.hasOwnProperty,
    negInf = -Infinity,
    posInf = +Infinity;

// -------------------

function nullToNaN(n) {
    return n == null ? NaN : n;
}

function nullOrNegativeTo(v, dv) {
    return (v == null || v < 0) ? dv : v;
}

function nullOrNegativeOrInfiniteTo(v, dv) {
    return (v == null || v < 0 || !isFinite(v)) ? dv : v;
}

function infiniteTo(v, dv) {
    return !isFinite(v) ? dv : v;
}

function isFiniteAndNotNaN(v) {
    return !isNaN(v) && isFinite(v);
}

function isFiniteAndNotNaNAndNotNeg(v) {
    return !isNaN(v) && isFinite(v) && (v >= 0);
}

function toNonNegative(v) {
    return v < 0 ? 0 : v;
}

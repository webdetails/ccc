/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

function mult10(value, exponent) {
    if(!exponent) return value;
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exponent) : exponent));
}

// Adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
def.round10 = function(value, places) {
    if(!places) return Math.round(value);

    value = +value;

    // If the value is not a number or the exp is not an integer...
    if(isNaN(value) || !(typeof places === 'number' && places % 1 === 0)) return NaN;

    // Shift & round
    value = Math.round(mult10(value, places));

    // Shift back
    return mult10(value, -places);
};

def.mult10 = function(value, exponent) {
    return !exponent ? value : mult10(+value, exponent);
};

/**
 * Obtains the absolute numeric difference between two numbers.
 *
 * If either argument is <tt>NaN</tt>, the result is <tt>NaN</tt>.
 * If both values are <tt>Infinity</tt>, the result is <tt>0</tt>.
 * If both values are <tt>-Infinity</tt>, the result is <tt>0</tt>.
 *
 * @param {number} a A number.
 * @param {number} a Another number.
 * @return {number} The absolute numeric difference.
 */
def.delta = function(a, b) {
    // Infinity of same sign included.
    // NaN not included!
    if(a === b) return 0;
    var d = a - b;
    return d < 0 ? -d : d;
};

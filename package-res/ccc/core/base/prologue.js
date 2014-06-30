/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var DEBUG = 1;

/*global pvc:true */
var pvc = def.globalSpace('pvc', {});

var pvc_arraySlice = Array.prototype.slice;

// goldenRatio proportion
// ~61.8% ~ 38.2%
//pvc.goldenRatio = (1 + Math.sqrt(5)) / 2;

pvc.invisibleFill = 'rgba(127,127,127,0.00001)';

// TODO: don't publish this globally!
/**
 * @name NoDataException
 * @class An error thrown when a chart has no data.
 */
def.global.NoDataException = function() {};

/**
 * @name InvalidDataException
 * @class An error thrown when data exists but the chart cannot be rendered from it.
 */
def.global.InvalidDataException = function(msg) {
    this.message = msg ? msg : "Invalid Data.";
};

/**
 * Gets or sets the default CCC compatibility mode.
 * <p>
 * Use <tt>Infinity</tt> for the <i>latest</i> version.
 * Use <tt>1</tt> for CCC version 1.
 * </p>
 *
 * @param {number} [compatVersion] The new compatibility version.
 */
pvc.defaultCompatVersion = function(compatVersion) {
    var defaults = pvc.BaseChart.prototype.defaults;
    return (compatVersion != null)
        ? (defaults.compatVersion = compatVersion)
        : defaults.compatVersion;
};

pvc.cloneMatrix = function(m) {
    return m.map(function(d) { return d.slice(); });
};

pvc.normAngle = pv.Shape.normalizeAngle;

pvc.orientation = {
    vertical:   'vertical',
    horizontal: 'horizontal'
};

// TODO: change the name of this
pvc.removeTipsyLegends = function() {
    try {
        $('.tipsy').remove();
    } catch(e) {
        // Do nothing
    }
};

pvc.createDateComparer = function(parser, key) {
    if(!key) key = pv.identity;

    return function(a, b) {
        return parser.parse(key(a)) - parser.parse(key(b));
    };
};

// TODO: ccc_wrapper still uses this
pvc.buildIndexedId = def.indexedId;

pvc.makeEnumParser = function(enumName, hasKey, dk) {
    if(def.array.is(hasKey)) {
        var keySet = {};
        hasKey.forEach(function(k) { if(k) keySet[k.toLowerCase()] = k; });
        hasKey = function(k) { return def.hasOwn(keySet, k); };
    }

    if(dk) dk = dk.toLowerCase();

    return function(k) {
        if(k) k = (''+k).toLowerCase();

        if(!hasKey(k)) {
            if(k && pvc.debug >= 2) pvc.warn("Invalid '" + enumName + "' value: '" + k + "'. Assuming '" + dk + "'.");

            k = dk;
        }
        return k;
    };
};

pvc.parseDistinctIndexArray = function(value, min, max) {
    value = def.array.as(value);
    if(value == null) return null;
    if(min == null) min = 0;
    if(max == null) max = Infinity;

    var a = def
        .query(value)
        .select(function(index) { return +index; }) // to number
        .where (function(index) { return !isNaN(index) && index >= min && index <= max; })
        .distinct()
        .array();

    return a.length ? a : null;
};

pvc.unionExtents = function(result, range) {
    if(!result) {
        if(!range) return null;

        result = {min: range.min, max: range.max};
    } else if(range) {
        if(range.min < result.min) result.min = range.min;
        if(range.max > result.max) result.max = range.max;
    }
    return result;
};

// --------------------

// Implements support for svg detection
if($.support.svg == null) {
    /*global document:true */
    $.support.svg = document.implementation
        .hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
}

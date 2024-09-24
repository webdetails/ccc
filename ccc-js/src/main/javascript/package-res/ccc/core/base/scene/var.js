/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a scene variable.
 *
 * @name pvc.visual.ValueLabelVar
 * @class A scene variable holds the concrete value that
 * a {@link pvc.visual.Role} or other relevant piece of information
 * has in a {@link pvc.visual.Scene}.
 * Usually, it also contains a label that describes it.
 *
 * @constructor
 * @param {any} value The value of the variable.
 * @param {any} label The label of the variable.
 * @param {any} [rawValue] The raw value of the variable.
 */
var pvc_ValueLabelVar = pvc.visual.ValueLabelVar = function(value, label, rawValue, absLabel) {
    this.value = value;
    this.label = label;
    
    if(rawValue !== undefined) this.rawValue = rawValue;
    if(absLabel !== undefined) this.absLabel = absLabel; // Only Data have absLabel not undefined
};

def.set(
    pvc_ValueLabelVar.prototype,
    'rawValue', undefined,
    'absLabel', undefined,
    'setValue', function(v) { return this.value = v, this; },
    'setLabel', function(v) { return this.label = v, this; },
    'clone',    function() {
        return new pvc_ValueLabelVar(this.value, this.label, this.rawValue);
    },
    'toString', function() {
        var label = this.label || this.value;
        return label == null ? "" :
               (typeof label !== 'string') ? ('' + label) :
               label;
    }
    //'valueOf', function() { return this.value; }
    );

pvc_ValueLabelVar.fromComplex = function(complex) {
    return complex ?
           new pvc_ValueLabelVar(complex.value, complex.label, complex.rawValue, complex.absLabel) :
           new pvc_ValueLabelVar(null, "", null);
};

pvc_ValueLabelVar.fromAtom = pvc_ValueLabelVar.fromComplex;
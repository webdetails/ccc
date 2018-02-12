/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes an atom instance.
 *
 * @name cdo.Atom
 *
 * @class An atom represents a unit of information.
 *
 * <p>
 * To create an atom,
 * call the corresponding dimension's
 * {@link cdo.Dimension#intern} method.
 *
 * Usually this is done by a {@link cdo.TranslationOper}.
 * </p>
 *
 * @property {cdo.Dimension} dimension The owner dimension.
 *
 * @property {number} id
 *           A unique object identifier.
 *
 * @property {any} rawValue The raw value from which {@link #value} is derived.
 *           <p>
 *           It is not always defined.
 *           Values may be the result of
 *           combining multiple source values.
 *
 *           Values may even be constant
 *           and, as such,
 *           not be derived from
 *           any of the source values.
 *           </p>
 *
 * @property {any} value The typed value of the atom.
 *           It must be consistent with the corresponding {@link cdo.DimensionType#valueType}.
 *
 * @property {string} label The formatted value.
 *           Only the null atom can have a empty label.
 *           When nully, it is determined lazily.
 *
 * @property {string} key The value of the atom expressed as a
 *           string in a way that is unique amongst all atoms of its dimension.
 *           <p>
 *           Only the null atom has a key equal to "".
 *           </p>
 * @property {string} globalKey A semantic key that is unique across atoms of every dimensions.
 *
 * @constructor
 * @private
 * @param {cdo.Dimension} dimension The dimension that the atom belongs to.
 * @param {any} value The typed value.
 * @param {string} label The formatted value.
 * @param {any} rawValue The source value.
 * @param {string} key The key.
 */
def.type('cdo.Atom')
.init(function(dimension, value, label, rawValue, key) {
    this.dimension = dimension;
    this.id = (value == null ? -def.nextId() : def.nextId()); // Ensure null sorts first, when sorted by id
    this.value = value;
    this._label = label == null ? null : label;
    if(rawValue !== undefined) this.rawValue = rawValue;
    this.key = key;
})
.add(/** @lends cdo.Atom# */{

    isVirtual: false,
    rawValue: undefined,

    /**
     * Gets or sets the formatted value of an atom.
     *
     * When unspecified, the formatted value is the result of applying the
     * atom's dimension formatter to the atom's value.
     *
     * @type {string}
     * @readOnly
     */
    get label() {
        var label = this._label;
        if(label === null) {
            this._label = label = this.dimension.format(this.value, this.rawValue);
        }
        return label;
    },

    set label(label) {
        this._label = def.string.to(label);
    },

    /**
     * Gets the label of a numeric atom formatted as a percentage.
     *
     * @type {string}
     * @readOnly
     */
    get labelPercent() {
        var valuePctFormatter = this.dimension.type.format().percent();
        return valuePctFormatter(this.value);
    },

    /**
     * Obtains the label of the atom.
     *
     * @return {string} A string representation of the value of the atom.
     */
    toString: function() {
        var label = this.label;
        if(label != null) return label;

        label = this.value;
        return label != null ? ("" + label) : "";
    }
});

def.type('cdo.NumberAtom')
.init(function(complexType, value, label) {
    this.complexType = complexType;
    this.id = def.nextId();

    this.value = value == null ? null : value;
    this._label = label == null ? null : label;
    this.key = value == null ? "" : value.toString();
})
.add(/** @lends cdo.NumberAtom# */{

    dimension: null,

    get key() {
        return '' + this.value;
    },

    get rawValue() {
        return this.value;
    },

    get label() {
        var label = this._label;
        if(label === null) {
            this._label = label = this.complexType.format.number()(this.value, this.rawValue);
        }
        return label;
    },

    set label(label) {
        this._label = def.string.to(label);
    },

    get labelPercent() {
        return this.complexType.format.percent()(this.value);
    }
});

/**
 * Comparer for atom according to their id.
 */
function atom_idComparer(a, b) {
    return a.id - b.id; // works for numbers...
}

/**
 * Reverse comparer for atom according to their id.
 */
function atom_idComparerReverse(a, b) {
    return b.id - a.id; // works for numbers...
}

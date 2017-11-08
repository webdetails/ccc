/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var complex_nextId = 1;

/**
 * Initializes a complex instance.
 *
 * @name cdo.Complex
 *
 * @class A complex is a set of atoms,
 *        of distinct dimensions,
 *        all owned by the same data.
 *
 * @property {number} id
 *           A unique object identifier.
 *
 * @property {number} key
 *           A semantic identifier.
 *
 * @property {cdo.Data} owner
 *           The owner data instance.
 *
 * @property {object} atoms
 *           A index of {@link cdo.Atom} by the name of their dimension type.
 *
 * @constructor
 * @param {cdo.Complex} [source]
 *        A complex that provides for an owner and default base atoms.
 *
 * @param {object<string,any>} [atomsByName]
 *        A map of atoms or raw values by dimension name.
 *
 * @param {string[]} [dimNames] The dimension names of atoms in {@link atomsByName}.
 * The dimension names in this list will be used to build
 * the key and label of the complex.
 * When unspecified, all the dimensions of the associated complex type
 * will be used to create the key and label.
 * Null atoms are not included in the label.
 *
 * @param {object} [atomsBase]
 *        An object to serve as prototype to the {@link #atoms} object.
 *        <p>
 *        Atoms already present in this object are not set locally.
 *        The key and default label of a complex only contain information
 *        from its own atoms.
 *        </p>
 *        <p>
 *        The default value is the {@link #atoms} of the argument {@link source},
 *        when specified.
 *        </p>
 */
def
.type('cdo.Complex')
.init(function(source, atomsByName, dimNames, atomsBase, wantLabel, calculate) {

    // NOTE: this function is a hot spot and as such is performance critical

    this.id = complex_nextId++;

    if(!atomsBase) {
        atomsBase = null;
    }

    var owner;
    if(source) {
        owner = source.owner;
        if(atomsBase === null) {
            atomsBase = source.atoms;
        }
    } else {
        owner = this;
    }

    this.owner = owner;

    this.atoms = atomsBase ? Object.create(atomsBase) : {};

    var dimNamesSpecified = !!dimNames;
    if(!dimNames) {
        dimNames = owner.type._dimsNames;
    }

    if(atomsByName) {
        // Fill the atoms map
        var atomsMap = this.atoms;
        var ownerDims = owner._dimensions;

        var addAtom = function(addDimName) {
            // ownerDims, atomsBase, atomsMap, atomsByName

            var atom = atomsByName[addDimName];
            // Once extension dimension names have "." in their names, it is safe to not use getOwn.
            // Also, in terms of performance, use of extension dimension is much less frequent than not.
            var ownerDim = ownerDims[addDimName];
            if(ownerDim === undefined) {
                if(!dimNamesSpecified) {
                    // Or keys and labels would not be correctly determined.
                    throw def.error.operationInvalid("Extension atom values require dimension names to be specified.");
                }

                // An extension atom. Must already be an atom, then.
                if(!(atom instanceof cdo.Atom)) {
                    throw def.error.operationInvalid("Extension atom values must be cdo.Atom instances.");
                }

                // Add all extension atoms. Even if null.
                atomsMap[addDimName] = atom;
            } else {
                // atom can be a value.
                // Need to intern, even if null.
                atom = ownerDim.intern(atom);

                // Don't add atoms already in base proto object.
                // With the exception of (virtual) nulls, which are present at the root proto object,
                // for every dimension, inheriting an atom means that its value is already fixed at a higher level
                // (due to a group by operation).
                // Let's not shadow inherited atoms with an equal atom...
                // Should it even be possible that a non-null inherited atom would be different from the one
                // being received?
                // See also Complex#getSpecifiedAtom(.).
                if(atom.value != null && (atomsBase === null || atom !== atomsBase[addDimName])) {
                    atomsMap[addDimName] = atom;
                }
            }
        };

        var dimName;
        if(!dimNamesSpecified) {
            for(dimName in atomsByName) {
                addAtom(dimName);
            }
        } else {
            var i = -1;
            var D = dimNames.length;
            while(++i < D) {
                addAtom(dimNames[i]);
            }
        }

        if(calculate) {
            // May be null
            atomsByName = owner.type._calculate(this);

            // Assuming that `atomsByName` only contains dimensions declared by calculations.

            // When creating trend datums (a virtual datum), the "dataPart" role's dimension value is
            // explicitly set to "trend", and is present in `atomsMap`.
            // This explicitly overrides any "dataPart" calculations that are performed for arbitrary datums.
            // Ignoring calculated dimensions that are *own* properties of `atomsMap`...

            // Not yet added?
            for(dimName in atomsByName) if(!def.hasOwnProp.call(atomsMap, dimName)) addAtom(dimName);
        }
    }

    this._initValueKeyLabel(dimNames, wantLabel);
})
.add(/** @lends cdo.Complex# */{

    /**
     * The separator used between labels of dimensions of a complex.
     * Generally, it is the owner data's labelSep that is used.
     * @type string
     */
    labelSep: " ~ ",

    /**
     * The separator used between keys of dimensions of a complex,
     * to form a composite key or an absolute key.
     * Generally, it is the owner data's keySep that is used.
     * @type string
     */
    keySep: '~',

    value: null,
    label: null,
    rawValue: undefined,

    _initValueKeyLabel: function(dimNames, wantLabel) {
        var atom;

        var D = dimNames.length;
        if(D === 0) {
            this.key = '';
            this.value = null;
            if(wantLabel) {
                this.label = "";
            }
        } else if(D === 1) {
            atom = this.atoms[dimNames[0]];
            this.key = this._getAtomKey(atom); // string
            this.value = atom.value;    // always typed when only one
            this.rawValue = atom.rawValue; // original
            if(wantLabel) {
                this.label = atom.label;
            }
        } else {
            // D >= 2
            var key = '';

            var keySep = this.owner.keySep;
            var labelSep = this.owner.labelSep;
            var atomsMap = this.atoms;
            var value;
            var label = "";
            var atomKey;
            var atomLabel;

            var i = -1;
            while(++i < D) {
                atom = atomsMap[dimNames[i]];

                // Add to value, null or not
                if(i === 0) value  = atom.key;
                else        value += (keySep + atom.key);

                atomKey = this._getAtomKey(atom);
                if(atomKey !== null) {
                    if(i === 0) key  = atomKey;
                    else        key += (keySep + atomKey);
                }

                // Add to label, when non-empty
                if(wantLabel && (atomLabel = atom.label) !== "") {
                    if(label === "") label  = atomLabel;
                    else             label += (labelSep + atomLabel);
                }
            }

            this.value = this.rawValue = value;
            this.key = key;
            if(wantLabel) {
                this.label = label;
            }
        }
    },

    _getAtomKey: function(atom) {
        return atom.key;
    },

    /**
     * Gets an atom if it was specified.
     *
     * Note that a specified atom can have the `null` value.
     *
     * @param {string} dimName - The name of the atom's dimension.
     * @return {cdo.Atom} The atom is specified; `null`, if not.
     */
    getSpecifiedAtom: function(dimName) {
        return this.atoms[dimName];
    },

    ensureLabel: function() {
        var label = this.label;
        if(label == null) {
            label = "";
            var labelSep = this.owner.labelSep;
            def.eachOwn(this.atoms, function(atom) {
                var alabel = atom.label;
                if(alabel) {
                    if(label) label += (labelSep + alabel);
                    else      label  = alabel;
                }
            });

            this.label = label;
        }

        return label;
    },

    view: function(dimNames) {
        return new cdo.ComplexView(this, dimNames);
    },

    toString : function() {
       var s = [ '' + def.qualNameOf(this.constructor) ];

       if(this.index != null) s.push("#" + this.index);

       this.owner.type.dimensionsNames().forEach(function(name) {
           s.push(name + ": " + def.describe(this.atoms[name].value));
       }, this);

       return s.join(" ");
   },

   rightTrimKeySep: function(key) {
        return key && cdo.Complex.rightTrimKeySep(key, this.owner.keySep);
    },

    absKeyTrimmed: function() {
        return this.rightTrimKeySep(this.absKey);
    },

    keyTrimmed: function() {
        return this.rightTrimKeySep(this.key);
    }
});

cdo.Complex.rightTrimKeySep = function(key, keySep) {
    if(key && keySep) {
        var j, K = keySep.length;
        while(key.lastIndexOf(keySep) === (j = key.length - K) && j >= 0)
            key = key.substr(0, j);
    }
    return key;
};

cdo.Complex.values = function(complex, dimNames) {
    var atoms = complex.atoms;
    return dimNames.map(function(dimName) { return atoms[dimName].value; });
};

// This builds a key compatible with that of cdo.Complex#key
cdo.Complex.compositeKey = function(complex, dimNames) {
    var key    = '';
    var D      = dimNames.length;
    var keySep = complex.owner.keySep;
    var datoms = complex.atoms;

    for(var i = 0 ; i < D ; i++) {
        var k = datoms[dimNames[i]].key;
        if(!i) key = k;
        else   key += (keySep + k);
    }

    return key;
};

cdo.Complex.labels = function(complex, dimNames) {
    var atoms = complex.atoms;
    return dimNames.map(function(dimName) { return atoms[dimName].label; });
};

var complex_id = def.propGet('id');

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
    /*jshint expr:true */

    /* NOTE: this function is a hot spot and as such is performance critical */
    var me = this;

    me.id = complex_nextId++;

    var owner;
    if(source) {
        owner = source.owner;
        if(!atomsBase) atomsBase = source.atoms;
    }

    me.owner = owner = (owner || me);
    
    var type = owner.type || def.fail.argumentRequired('owner.type');

    me.atoms = atomsBase ? Object.create(atomsBase) : {};

    var dimNamesSpecified = !!dimNames;
    if(!dimNames) dimNames = type._dimsNames;

    var atomsMap = me.atoms,
        D = dimNames.length,
        i, dimName;

    if(atomsByName) {
        // Fill the atoms map

        var ownerDims = owner._dimensions,
            addAtom = function(dimName) { // ownerDims, atomsBase, atomsMap, atomsByName
                var v = atomsByName[dimName],
                    // Need to intern, even if null.
                    atom = ownerDims[dimName].intern(v);

                // Don't add atoms already in base proto object.
                // (virtual) nulls are already in the root proto object.
                if(v != null && (!atomsBase || atom !== atomsBase[dimName])) atomsMap[dimName] = atom;
            };

        if(!dimNamesSpecified) {
            for(dimName in atomsByName) addAtom(dimName);
        } else {
            i = D;
            while(i--) addAtom(dimNames[i]);
        }

        if(calculate) {
            // May be null
            atomsByName = type._calculate(me);
            // Not yet added?
            for(dimName in atomsByName) if(!def.hasOwnProp.call(atomsMap, dimName)) addAtom(dimName);
        }
    }

    /* Build Key and Label */
    var atom;
    if(!D) {
        me.value = null;
        me.key   = '';
        if(wantLabel) me.label = "";
    } else if(D === 1) {
        atom = atomsMap[dimNames[0]];
        me.value     = atom.value;    // always typed when only one
        me.rawValue  = atom.rawValue; // original
        me.key       = atom.key;      // string
        if(wantLabel) me.label = atom.label;
    } else {
        var key, label, alabel,
            keySep   = owner.keySep,
            labelSep = owner.labelSep;

        for(i = 0 ; i < D ; i++) {
            atom = atomsMap[dimNames[i]];

            // Add to key, null or not
            if(!i) key  = atom.key;
            else   key += (keySep + atom.key);

            // Add to label, when non-empty
            if(wantLabel && (alabel = atom.label)) {
                if(label) label += (labelSep + alabel);
                else      label  = alabel;
            }
        }

        me.value = me.rawValue = me.key = key;
        if(wantLabel) me.label = label;
    }
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
       var s = [ '' + this.constructor.typeName ];

       if(this.index != null) s.push("#" + this.index);

       this.owner.type.dimensionsNames().forEach(function(name) {
           s.push(name + ": " + pvc.stringify(this.atoms[name].value));
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

cdo.Complex.compositeKey = function(complex, dimNames) {
    var atoms = complex.atoms;
    return dimNames
        .map(function(dimName) { return atoms[dimName].key; })
        .join(complex.owner.keySep);
};

cdo.Complex.labels = function(complex, dimNames) {
    var atoms = complex.atoms;
    return dimNames.map(function(dimName) { return atoms[dimName].label; });
};

var complex_id = def.propGet('id');

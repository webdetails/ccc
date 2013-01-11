var complex_nextId = 1;

/**
 * Initializes a complex instance.
 * 
 * @name pvc.data.Complex
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
 * @property {pvc.data.Data} owner
 *           The owner data instance.
 * 
 * @property {object} atoms
 *           A index of {@link pvc.data.Atom} by the name of their dimension type.
 * 
 * @constructor
 * @param {pvc.data.Complex} [source] 
 *        A complex that provides for an owner and default base atoms.
 * 
 * @param {map(string any)} [atomsByName] 
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
.type('pvc.data.Complex')
.init(function(source, atomsByName, dimNames, atomsBase, wantLabel, calculate) {
    /*jshint expr:true */
    
    /* NOTE: this function is a hot spot and as such is performance critical */
    
    this.id = complex_nextId++;
    
    var owner;
    if(source){
        owner = source.owner;
        if(!atomsBase){
            atomsBase = source.atoms;
        }
    }
    
    this.owner = owner || this;
    this.atoms = atomsBase ? Object.create(atomsBase) : {};
	
    var hadDimNames = !!dimNames;
    if(!dimNames){
        dimNames = owner.type._dimsNames;
    }
    
    var atomsMap = this.atoms;
    var D = dimNames.length;
    var i, dimName;
    
    if(atomsByName){
        /* Fill the atoms map */
        var ownerDims = owner._dimensions;
        
        var addAtom = function(dimName, value){
            if(value != null){ // nulls are already in base proto object
                var dimension = def.getOwn(ownerDims, dimName);
                var atom = dimension.intern(value);
                if(!atomsBase || atom !== atomsBase[dimName]) { // don't add atoms already in base proto object
                    atomsMap[dimName] = atom;
                }
            }
        };
    
        if(!hadDimNames){
            for(dimName in atomsByName){
                addAtom(dimName, atomsByName[dimName]);
            }
        } else {
            for(i = 0 ; i < D ; i++){
                dimName = dimNames[i];
                addAtom(dimName, atomsByName[dimName]);
            }
        }
        
        if(calculate){
            var newAtomsByName = owner.type._calculate(this); // may be null
            for(dimName in newAtomsByName){
                if(!def.hasOwnProp.call(atomsMap, dimName)){ // not yet added
                    addAtom(dimName, newAtomsByName[dimName]);
                }
            }
        }
    }
    
    /* Build Key and Label */
    if(!D){
        this.value = null;
        this.key   = '';
        if(wantLabel){
            this.label = "";
        }
    } else if(D === 1){
        var singleAtom = atomsMap[dimNames[0]];
        this.value     = singleAtom.value;    // always typed when only one
        this.rawValue  = singleAtom.rawValue; // original
        this.key       = singleAtom.key;      // string
        if(wantLabel){
            this.label = singleAtom.label;
        }
    } else {
        var key, label;
        var labelSep = owner.labelSep;
        var keySep   = owner.keySep;
        
        for(i = 0 ; i < D ; i++){
            dimName = dimNames[i];
            var atom = atomsMap[dimName];
            
            // Add to key, null or not
            if(!i){
                key = atom.key;
            } else {
                key += keySep + atom.key;
            }
            
            // Add to label, when non-empty
            if(wantLabel){
                var atomLabel = atom.label;
                if(atomLabel){
                    if(!label){
                        label = atomLabel;
                    } else {
                        label += labelSep + atomLabel;
                    }
                }
            }
        }
        
        this.value = this.rawValue = this.key = key;
        if(wantLabel){
            this.label = label;
        }
    }
})
.add(/** @lends pvc.data.Complex# */{
    
    /**
     * The separator used between labels of dimensions of a complex.
     * Generally, it is the owner's labelSep that is used.
     */
    labelSep: " ~ ",
    
    keySep: ',',
    
    label: null,
    
    rawValue: undefined,
    
    ensureLabel: function(){
        var label = this.label;
        if(label != null){ // TODO: don't think this is being used...
            label = "";
            var labelSep = this.owner.labelSep;
            def.eachOwn(this.atoms, function(atom){
                var alabel = atom.label;
                if(alabel){
                    if(label){
                        label += labelSep + alabel;
                    } else {
                        label = alabel;
                    }
                }
            });
            
            this.label = label;
        }
        
        return label;
    },

    view: function(dimNames){
        return new pvc.data.ComplexView(this, dimNames);
    },
    
    toString : function() {
       var s = [ '' + this.constructor.typeName ];
       
       if (this.index != null) {
           s.push("#" + this.index);
       }

       this.owner.type.dimensionsNames().forEach(function(name) {
           s.push(name + ": " + pvc.stringify(this.atoms[name].value));
       }, this);

       return s.join(" ");
   }
});

pvc.data.Complex.values = function(complex, dimNames){
    var atoms = complex.atoms;
    return dimNames.map(function(dimName){
        return atoms[dimName].value;
    });
};

pvc.data.Complex.labels = function(complex, dimNames){
    var atoms = complex.atoms;
    return dimNames.map(function(dimName){
        return atoms[dimName].label;
    });
};
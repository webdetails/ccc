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
 *           <p>
 *           Only contains information related to locally set atoms.
 *           Atoms that are present in a base atoms object are not included.
 *           </p>
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
.init(function(source, atomsByName, atomsBase, wantLabel, calculate) {
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
	
    if (!atomsByName) {
        this.value = null;
        this.key   = '';
        if(wantLabel){
            this.label = "";
        }
    } else {
        // <Debug>
        var asserts = pvc.debug >= 6;
        // </Debug>
        
        /* Fill the atoms map */
        var atomsMap = this.atoms;
        var atom, dimName, dimension, singleAtom, value;
        var count = 0;
        var ownerDims = owner._dimensions;
        
        for(dimName in atomsByName){
            value = atomsByName[dimName];
            if(value != null){ // nulls are already in base proto object
                dimension = def.getOwn(ownerDims, dimName);
                atom = dimension.intern(value);
                
                if(!atomsBase || atom !== atomsBase[dimName]) { // don't add atoms already in base proto object
                    if(!count){
                        singleAtom = atom;
                    }
                    count++;
                    atomsMap[dimName] = atom;
                }
            }
        }
        
        if(calculate){
            var newAtomsByName = owner.type._calculate(this);
            if(newAtomsByName){
                for(dimName in newAtomsByName){
                    if(!def.hasOwnProp.call(atomsMap, dimName)){
                        
                        value = newAtomsByName[dimName];
                        if(value != null){ // nulls are already in base proto object
                            dimension = def.getOwn(ownerDims, dimName);
                            atom = dimension.intern(value);
                            if(!atomsBase || atom !== atomsBase[dimName]) { // don't add atoms already in base proto object
                                if(!count){
                                    singleAtom = atom;
                                }
                                count++;
                                atomsMap[dimName] = atom;
                            }
                        }
                    }
                }
            }
        }
        
        /* Build Key and Label in the order of type.dimensions */
        if(count === 0){
            this.value = null;
            this.key   = '';
            if(wantLabel){
                this.label = "";
            }
        } else if(count === 1){
            var isDiscrete = singleAtom.dimension.type.isDiscrete;
            
            this.value    = isDiscrete ? singleAtom.globalKey : singleAtom.value; // typed when continuous
            this.rawValue = singleAtom.rawValue;  // original
            this.key      = singleAtom.globalKey; // string
            
            if(wantLabel){
                this.label = singleAtom.label;
            }
        } else {
            // For a small number, of small strings, it's actually faster to 
            // just concatenate strings comparing to the array.join method 
            var dimNames = owner.type._dimsNames;
            var key = '', label = '';
            var labelSep = owner.labelSep;
            
            var L = dimNames.length;
            for(var i = 0 ; i < L ; i++){
                dimName = dimNames[i];
                if(def.hasOwnProp.call(atomsMap, dimName)){
                    atom = atomsMap[dimName];
                    if(key){
                        key += ',' + atom.globalKey;
                    } else {
                        key = atom.globalKey;
                    }
                    
                    if(wantLabel){
                        // Assuming labels are non-empty
                        // Non-null atoms => non-empty labels
                        if(label){
                            label += labelSep + atom.label;
                        } else {
                            label = atom.label;
                        }
                    }
                }
            }
        
            this.value = this.rawValue = this.key = key;
            if(wantLabel){
                this.label = label;
            }
        }
    }
})
.add(/** @lends pvc.data.Complex# */{
    
    /**
     * The separator used between labels of dimensions of a complex.
     * Generally, it is the owner's labelSep that is used.
     */
    labelSep: " ~ ",
    
    label: null,
    
    ensureLabel: function(){
        var label = this.label;
        if(label != null){
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
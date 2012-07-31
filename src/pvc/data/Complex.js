/**
 * The separator used between labels of dimensions of a complex.
 */
var complex_labelSep = " ~ ";
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
 * @param {pvc.data.Data} owner
 *        An owner data instance.
 * 
 * @param {pvc.data.Atom[]} [atoms]
 *        An array of atoms of distinct dimensions.
 *        
 * @param {object} [atomsBase] 
 *        An object to serve as prototype to the {@link #atoms} object.
 *        <p>
 *        Atoms already present in this object are not set locally.
 *        The key of the complex is thus affected.
 *        </p>  
 */
def
.type('pvc.data.Complex')
.init(function(owner, atoms, atomsBase) {
    /*jshint expr:true */
    
    /* NOTE: this function is a hot spot and as such is performance critical */
    
    // <Debug>
    var asserts = pvc.debug >= 6;
    if(asserts){
        (owner && owner.isOwner()) || def.fail.argumentInvalid('owner', "Must be an owner data.");
    }
    // </Debug>
    
    this.id    = complex_nextId++;
    this.owner = owner;
    this.atoms = atomsBase ? Object.create(atomsBase) : {};
	
    if (!atoms) {
        this.value = null;
        this.key   = '';
    } else {
        var atomsMap = this.atoms;
        var count = 0;
        var singleAtom;
        var i;
        var L = atoms.length;
        for(i = 0 ; i < L ; i++){
            var atom  = atoms[i] || def.fail.argumentRequired('atom');
            var value = atom.value; 
            if(value != null){ // nulls are already in base proto object
                var name     = atom.dimension.name,
                    atomBase = atomsBase && atomsBase[name];

                if(!atomBase || atom !== atomBase) { // don't add atoms already in base proto object
                    // <Debug>
                    if(asserts){
                        if(atom.dimension !== owner.dimensions(name)){
                            throw def.error.operationInvalid("Invalid atom dimension '{0}'.", [name]);
                        }
    
                        if(def.hasOwnProp.call(atomsMap, name)) {
                            throw def.error.operationInvalid("An atom of the same dimension has already been added '{0}'.", [name]);
                        }
                    }
                    // </Debug>
                    
                    count++;
                    atomsMap[name] = atom;
                    if(count === 1){
                        singleAtom = atom;
                    }
                }
            }
        }
        
        if(count === 1){
            this.value = singleAtom.value;     // typed
            this.key   = singleAtom.globalKey; // string
        } else {
            // For small number of strings, it's actually faster to 
            // just concatenate strings comparing to the array.join method 
            var dimNames = owner.type._dimsNames;
            var key;
            L = dimNames.length;
            for(i = 0 ; i < L ; i++){
                var dimName = dimNames[i];
                if(def.hasOwnProp.call(atomsMap, dimName)){
                    var akey = atomsMap[dimName].globalKey;
                    if(i === 0){
                        key = akey;
                    } else {
                        key += ',' + akey;
                    }
                }
            }
        
            this.value = this.key = key;
        }
	}
})
.add(/** @lends pvc.data.Complex# */{

    buildLabel: function(atoms){
    
        if(atoms){
            return atoms
                    .map(function(atom){ return atom.label; })
                    .filter(def.notEmpty)
                    .join(complex_labelSep);
        }
        
        return "";
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
           s.push(name + ": " + JSON.stringify(this.atoms[name].value));
       }, this);

       return s.join(" ");
   }
});

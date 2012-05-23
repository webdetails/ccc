var complex_labelSep = " ~ ";

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
def.type('pvc.data.Complex')
.init(function(owner, atoms, atomsBase) {
    // <Debug>
    (owner && owner.isOwner()) || def.fail.argumentInvalid('owner', "Must be an owner data.");
    // </Debug>
    
    this.id    = def.nextId();
    this.owner = owner;
    
    this.atoms = atomsBase ? Object.create(atomsBase) : {};
	
    if (!atoms) {
        this.value = null;
        this.key   = '';
    } else {
        var atomsMap = this.atoms,
            count    = 0,
            singleValue;
        
        atoms.forEach(function(atom) {
            atom || def.fail.argumentRequired('atom');
            
            var value = atom.value; 
            if(value != null){ // already in proto object
                var atomDim  = atom.dimension, 
                    name     = atomDim.name,
                    atomBase = atomsBase && atomsBase[name];
    	        
                if(!atomBase || atom !== atomBase) { 
                    // <Debug>
                    if(atomDim !== owner.dimensions(name)){
                        throw def.error.operationInvalid("Invalid atom dimension '{0}'.", [name]);
                    }

                    if(def.hasOwn(atomsMap, name)) {
                        throw def.error.operationInvalid("An atom of the same dimension has already been added '{0}'.", [name]);
                    }
                    // </Debug>
                    
                    count++;
                    atomsMap[name] = atom;
                    if(count === 1){
                        singleValue = atom.value;
                    }
                }
            }
        }, this);
		
        var keys = [];
        owner.type
            .dimensionsNames()
            .forEach(function(dimName){
                if(def.hasOwn(atomsMap, dimName)) {
                    keys.push(atomsMap[dimName].globalKey());
                }
            });

        this.key   = keys.join(',');
        this.value = count === 1 ? singleValue : this.key;
	}
})
.add(/** @lends pvc.data.Complex# */{

    buildLabel: function(){
        return def.own(this.atoms)
                .map(function(atom){ return atom.label; })
                .filter(def.notEmpty)
                .join(complex_labelSep);
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
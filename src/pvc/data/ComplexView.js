/**
 * Initializes a complex view instance.
 * 
 * @name pvc.data.ComplexView
 * 
 * @class Represents a view of certain dimensions over a given source complex instance.
 * @extends pvc.data.Complex
 * 
 * @property {pvc.data.Complex} source The source complex instance.
 * @property {string} label The composite label of the own atoms in the view.
 * @constructor
 * @param {pvc.data.Complex} source The source complex instance.
 * @param {string[]} ownDimNames The dimensions that should be revealed by the view.
 */
def.type('pvc.data.ComplexView', pvc.data.Complex)
.init(function(source, ownDimNames){

    this.source = source;
    var viewDimNames = this.viewDimNames = [];
    
    var sourceAtoms = source.atoms,
        atoms = [];

    ownDimNames.forEach(function(dimName){
        var atom = def.getOwn(sourceAtoms, dimName);
        if(atom){
            atoms.push(atom);
            viewDimNames.push(dimName);
        }
    });

    // Call base constructor
    var owner = source.owner;
    this.base(owner, atoms, owner.atoms);
    
    // Build label based on (really) own atoms
    this.label = this.buildLabel();
})
.add({
    values: function(){
        return this.viewDimNames.map(function(dimName){
            return this.atoms[dimName].value;
        }, this);
    }
});
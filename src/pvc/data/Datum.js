
/**
 * Initializes a datum instance.
 * 
 * @name pvc.data.Datum
 * 
 * @class A datum is a complex that contains atoms for all the
 * dimensions of the associated {@link #data}.
 *
 * @extends pvc.data.Complex
 * 
 * @property {Number} index The index of the Datum in its owning Data (constant).
 * This is immutable and can thus be used as the datum's key.
 * 
 * @property {boolean} isSelected The datum's selected state (read-only).
 * 
 * @constructor
 * @param {pvc.data.Data} data The data instance to which the datum belongs.
 * @param {pvc.data.Atom[]} [atoms] An array of atoms of distinct and complete dimensions.
 */
def.type('pvc.data.Datum', pvc.data.Complex)
.init(
function(data, atoms, index){
    
    (data && data.isOwner()) || def.assert("Only owner datas can own datums.");
    
    def.base.call(this, data, atoms, data.atoms);
    
    this.index = index >= 0 ? index : -1; // null atom = -1
})
.add(/** @lends pvc.data.Datum# */{
    
    isSelected: false,
    
    /**
     * Sets the selected state of the datum to a specified value.
     * 
     * @param {boolean} [select=true] The desired selected state.
     * 
     * @returns {boolean} true if the selected state changed, false otherwise.
     */
    setSelected: function(select){
        // Normalize 'select'
        select = (select == null) || !!select;

        var changed = this.isSelected !== select;
        if(changed){
            this.isSelected = select;
            if(this.index >= 0){ // not a null datum
                data_onDatumSelectedChanged.call(this.owner, this, select);
            }
        }

        return changed;
    },
    
    /**
     * Toggles the selected state of the datum.
     * 
     * @type {undefined}
     */
    toggleSelected: function(){
        this.setSelected(!this.isSelected);
    },
    
    
    /**
     * Indicates if the datum is a null datum.
     * <p>
     * A null datum is a datum that doesn't exist in the data source,
     * but is created for auxiliary reasons (null pattern).
     * </p>
     * 
     * @type boolean
     */
    isNull: function(){
        return this.index < 0;
    }
});

/**
 * Called by the owner group to clear the selected state (internal).
 * @name pvc.data.Datum#_deselect
 * @function
 * @type undefined
 * @private
 * 
 * @see pvc.data.Data#clearSelected
 */
function datum_deselect(){
    this.isSelected = false;
}


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
 * @property {boolean} isNull Indicates if the datum is a null datum.
 * <p>
 * A null datum is a datum that doesn't exist in the data source,
 * but is created for auxiliary reasons (null pattern).
 * </p>
 *
 * @property {boolean} isSelected The datum's selected state (read-only).
 * @property {boolean} isVisible The datum's visible state (read-only).
 * 
 * @constructor
 * @param {pvc.data.Data} data The data instance to which the datum belongs.
 * @param {pvc.data.Atom[]} [atoms] An array of atoms of <i>distinct</i> dimensions.
 * @param {boolean} [isNull=false] Indicates if the datum is a null datum.
 */
def.type('pvc.data.Datum', pvc.data.Complex)
.init(
function(data, atoms, isNull){
    
    (data && data.isOwner()) || def.assert("Only owner datas can own datums.");
    
    def.base.call(this, data, atoms, data.atoms);
    
    if(isNull) {
        this.isNull = true;
    } // otherwise inherit prototype default value
})
.add(/** @lends pvc.data.Datum# */{
    
    isSelected: false,
    isVisible:  true,
    isNull: false,
    
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
            if(!this.isNull){
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
     * Sets the visible state of the datum to a specified value.
     * 
     * @param {boolean} [visible=true] The desired visible state.
     * 
     * @returns {boolean} true if the visible state changed, false otherwise.
     */
    setVisible: function(visible){
        // Normalize 'visible'
        visible = (visible == null) || !!visible;

        var changed = this.isVisible !== visible;
        if(changed){
            this.isVisible = visible;
            if(!this.isNull){
                data_onDatumVisibleChanged.call(this.owner, this, visible);
            }
        }

        return changed;
    },
    
    /**
     * Toggles the visible state of the datum.
     * 
     * @type {undefined}
     */
    toggleVisible: function(){
        this.setVisible(!this.isVisible);
    }
});

/**
 * Called by the owner data to clear the datum's selected state (internal).
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
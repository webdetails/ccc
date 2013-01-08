
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
 * Note that the datum will belong instead to the owner of this data. 
 * However the datums atoms will inherit from the atoms of the specified data.
 * This is essentially to facilitate the creation of null datums.
 * @param {map(string any)} [atomsByName] A map of atoms or raw values by dimension name.
 * @param {boolean} [isNull=false] Indicates if the datum is a null datum.
 */
def.type('pvc.data.Datum', pvc.data.Complex)
.init(
function(data, atomsByName, isNull){
    
    this.base(data, atomsByName, /* dimNames */ null, /*atomsBase*/ null, /*wantLabel*/ false, /*calculate*/!isNull);
    
    if(isNull) {
        this.isNull = true;
    } // otherwise inherit prototype default value
})
.add(/** @lends pvc.data.Datum# */{
    
    isSelected: false,
    isVisible:  true,
    isNull:     false,
    
    isVirtual:  false, // like isNull, but is actually in a Data
    
    isTrend:    false,
    trendType:  null,
    
    isInterpolated: false,
    //isInterpolatedMiddle: false,
    interpolation: null,
    
    /**
     * Sets the selected state of the datum to a specified value.
     * 
     * @param {boolean} [select=true] The desired selected state.
     * 
     * @returns {boolean} true if the selected state changed, false otherwise.
     */
    setSelected: function(select){
        // Null datums are always not selected
        if(this.isNull){ return false; }
        
        // Normalize 'select'
        select = (select == null) || !!select;

        var changed = this.isSelected !== select;
        if(changed){
            if(!select){
                delete this.isSelected;
            } else {
                this.isSelected = true;
            }
            
            
            /*global data_onDatumSelectedChanged:true */
            data_onDatumSelectedChanged.call(this.owner, this, select);
        }

        return changed;
    },
    
    /**
     * Toggles the selected state of the datum.
     * 
     * @type {undefined}
     */
    toggleSelected: function(){
        return this.setSelected(!this.isSelected);
    },
    
    /**
     * Sets the visible state of the datum to a specified value.
     * 
     * @param {boolean} [visible=true] The desired visible state.
     * 
     * @returns {boolean} true if the visible state changed, false otherwise.
     */
    setVisible: function(visible){
        // Null datums are always visible
        if(this.isNull){ return false; }
        
        // Normalize 'visible'
        visible = (visible == null) || !!visible;

        var changed = this.isVisible !== visible;
        if(changed){
            this.isVisible = visible;
            //if(!this.isNull){
                /*global data_onDatumVisibleChanged:true */
                data_onDatumVisibleChanged.call(this.owner, this, visible);
            //}
        }

        return changed;
    },
    
    /**
     * Toggles the visible state of the datum.
     * 
     * @type {undefined}
     */
    toggleVisible: function(){
        return this.setVisible(!this.isVisible);
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
    delete this.isSelected;
}

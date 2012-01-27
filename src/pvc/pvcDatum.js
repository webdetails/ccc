pvc.Datum = Base.extend(
/** 
 * @lends Datum# 
 */
{
    /**
     * A datum is the atomic data entity of the data model.
     * A datum contains key properties, of specific data dimensions.
     * A datum contains a value property.
     * A datum belongs to a given data engine.
     * @constructs
     */
    constructor: function(dataEngine, datumIndex, serIndex, serValue, catIndex, catValue, value){
        // TODO: hardcoded for 2 dimensions
        
        this.engine = dataEngine;
        this.index = datumIndex; // -1 => null datum
        
        this.keyValues = {
            series:     serValue,
            categories: catValue
        };
        
        this.keyIndexes = {
            series:     serIndex,
            categories: catIndex
        };
        
        this.value = value;
        
        this._selected = false;
    },
    
    // -------------------
    // Selected state
    
    // Called by engine on clear
    _deselect: function(){
        this._selected = false;
    },
    
    /**
     * Changes the selected state of the datum,
     * to the specified value, 'select'.
     * Returns true if the selected state changed.
     */
    setSelected: function(select){
        // Normalize 'select'
        select = (select == null) || !!select;
        
        if(this._selected !== select){
            this._selected = select;
            if(this.index >= 0){ // not a null datum
                this.engine._onDatumSelectedChanged(this, select);
            }
            return true;
        }
        
        return false;
    },
    
    /**
     * Returns true if the datum is selected.
     */
    isSelected: function(){
        return this._selected;
    },
    
    /**
     * Toggles the selected state of the datum.
     */
    toggleSelected: function(){
        this.setSelected(!this._selected);
    }
});

/**
 * A datum is the atomic data entity of the data model.
 * A datum contains key properties, of specific data dimensions.
 * A datum contains a value property.
 * A datum belongs to a given data engine.
 *
 *  datum.elem["series"].value;
 *  datum.elem.category.value;
 *
 * @constructs
 */
pvc.Datum = function(dataEngine, datumIndex, elemsByDim, value){
    // TODO: hardcoded for 2 dimensions

    this.engine = dataEngine;
    this.index = datumIndex; // -1 => null datum
    this.elem = elemsByDim;
    this.value = value;
    this._selected = false;
};

$.extend(pvc.Datum.prototype,
/**
 * @lends Datum#
 */
{
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
    },

    describe: function(){
        var s = ["DATUM #" + this.index];

        this.engine._dimensionList.forEach(function(dimension){
            var name = dimension.name,
                elem = this.elem[name];
            s.push(
                "\t" + name + ": " +
                     JSON.stringify(elem.value) + "|" + elem.leafIndex);
        }, this);
        
        s.push("\tvalue: " +  this.value);

        return s.join(" ");
    },

    toString: function(){
        return '' + this.value;
    }
});
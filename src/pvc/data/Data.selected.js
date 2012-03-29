pvc.data.Data.add(/** @lends pvc.data.Data# */{
    /**
     * Obtains the number of selected datums.
     * <p>
     * Can only be called on an owner data.
     * </p>
     * 
     * @type Number
     */
    selectedCount: function(){
        if(!this.isOwner()){
            return this.where(null, {selected: true});
        }
        
        return this._selectedCount;
    },

    /**
     * Clears the selected state of any selected datum.
     * <p>
     * Can only be called on an owner data.
     * </p>
     */
    clearSelected: function(){
        data_assertIsOwner.call(this);
        
        def.forEachOwn(this._selectedDatums, function(datum){
            datum_deselect.call(datum);
        });

        this._selectedDatums = {};
        this._selectedCount  = 0;
    }
});

/**
 * Called by a datum on its owner data 
 * when its selected state changes.
 * 
 * @name pvc.data.Data#_onDatumSelectedChanged
 * @function
 * @param {pvc.data.Datum} datum The datum whose selected state changed.
 * @param {boolean} selected The new datum selected state.
 * @type undefined
 * @internal
 */
function data_onDatumSelectedChanged(datum, selected){
    if(selected){
        this._selectedDatums[datum.id] = datum;
        this._selectedCount++;
    } else {
        delete this._selectedDatums[datum.id];
        this._selectedCount--;
    }
}

/**
 * Called after reloading datums to recalculate selected datums.
 * 
 * @name pvc.data.Data#_syncSelected
 * @function
 * @type undefined
 * @private
 */
function data_syncSelected(){
    this._selectedDatums = {};
    this._selectedCount  = 0;
    
    this._datums.forEach(function(datum){
        if(datum.isSelected) {
            this._selectedDatums[datum.id] = datum;
            this._selectedCount++;
        }
    }, this);
}

/**
 * Sets the selected state of the given datums
 * to the state 'select'.
 * 
 * @param {def.Query} datums An enumerable of {@link pvc.data.Datum} to set.
 * @param {boolean} selected The desired selected state.
 * 
 * @returns {boolean} true if at least one datum changed its selected state.
 * @static
 */
pvc.data.Data.setSelected = function(datums, selected){
    var anyChanged = false;

    if(datums){
        def.query(datums).each(function(datum){
            if(datum.setSelected(selected)){
                // data_onDatumSelectedChanged has already been called
                anyChanged = true;
            }
        });
    }

    return anyChanged;
};

/**
 * Pseudo-toggles the selected state of the given datums.
 * If all are selected, clears their selected state.
 * Otherwise, selects all.
 * 
 * @param {def.Query} datums An enumerable of {@link pvc.data.Datum} to toggle.
 * 
 * @static
 */
pvc.data.Data.toggleSelected = function(datums){
    // TODO: improve this code by checking selected state before-hand
    if(!this.setSelected(datums, true)){
        this.setSelected(datums, false);
    }
};

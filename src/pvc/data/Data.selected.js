pvc.data.Data.add(/** @lends pvc.data.Data# */{
    /**
     * Obtains the number of selected datums.
     * <p>
     * This method is only optimized when called on an owner data.
     * </p>
     * 
     * @type Number
     */
    selectedCount: function(){
        if(!this.isOwner()){
            return this.datums(null, {selected: true}).count();
        }
        
        return this._selectedDatums.count;
    },
    
    /**
     * Obtains the selected datums, in an unspecified order.
     * <p>
     * If the datums should be sorted, 
     * they can be sorted by their {@link pvc.data.Datum#id}.
     * 
     * Alternatively, {@link #datums} can be called,
     * with the <tt>selected</tt> keyword argument.
     * </p>
     * @type pvc.data.Datum[]
     */
    selectedDatums: function(){
        if(!this.isOwner()){
            return this.datums(null, {selected: true}).array();
        }
        
        return this._selectedDatums.values();
    },
    
    /**
     * Obtains a map containing the selected datums, indexed by id.
     * 
     * @type def.Map(pvc.data.Datum)
     */
    selectedDatumMap: function(){
        if(!this.isOwner()){
            
            var datums = this
                .datums(null, {selected: true})
                .object({
                    name: function(datum){ return datum.id; }
                });
            
            return new def.Set(datums);
        }
        
        return this._selectedDatums.clone();
    },
    
    /**
     * Obtains the number of visible datums.
     * 
     * @type Number
     */
    visibleCount: function(){
        return this._visibleDatums.count;
    },
    
    /**
     * Replaces currently selected datums with the specified datums.
     *
     * @param {pvc.data.Datum[]|def.query<pvc.data.Datum>} [datums] The new datums to be selected.
     * @returns {boolean} Returns <tt>true</tt> if any datum was selected and <tt>false</tt> otherwise. 
     */
    replaceSelected: function(datums){
        /*global datum_deselect:true */
        
        // materialize, cause we're using it twice
        if(!def.array.is(datums)){
            datums = datums.array();
        }
        
        // Clear all but the ones we'll be selecting.
        // This way we can have a correct changed flag.
        var alreadySelectedById = 
            def
            .query(datums)
            .where(function(datum){ return datum.isSelected; })
            .object({ name: function(datum){ return datum.id; } });
        
        var changed = this.owner.clearSelected(function(datum){
                return !def.hasOwn(alreadySelectedById, datum.id); 
            });
        
        changed |= pvc.data.Data.setSelected(datums, true);
        
        return changed;
    },
    
    /**
     * Clears the selected state of any selected datum.
     *
     * @param {pvc.data.Datum} [funFilter] Allows excluding atoms from the clear operation.
     * @returns {boolean} Returns <tt>true</tt> if any datum was selected and <tt>false</tt> otherwise. 
     */
    clearSelected: function(funFilter){
        /*global datum_deselect:true */
        
        if(this.owner !== this){
             return this.owner.clearSelected(funFilter);
        }
        
        if(!this._selectedDatums.count) {
            return false;
        }
        
        var changed;
        if(funFilter){
            changed = false;
            this._selectedDatums
                .values()
                .filter(funFilter)
                .forEach(function(datum){
                    changed = true;
                    datum_deselect.call(datum);
                    this._selectedDatums.rem(datum.id);
                }, this);
        } else {
            changed = true;
            this._selectedDatums.values().forEach(function(datum){
                /*global datum_deselect:true */
                datum_deselect.call(datum);
            });
    
            this._selectedDatums.clear();
        }
        
        return changed;
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
    // <Debug>
    /*jshint expr:true */
    !datum.isNull || def.assert("Null datums do not notify selected changes");
    // </Debug>
    
    if(selected){
        this._selectedDatums.set(datum.id, datum);
    } else {
        this._selectedDatums.rem(datum.id);
    }

    this._sumAbsCache = null;
}

/**
 * Called by a datum on its owner data 
 * when its visible state changes.
 * 
 * @name pvc.data.Data#_onDatumVisibleChanged
 * @function
 * @param {pvc.data.Datum} datum The datum whose visible state changed.
 * @param {boolean} selected The new datum visible state.
 * @type undefined
 * @internal
 */
function data_onDatumVisibleChanged(datum, visible){
    if(def.hasOwn(this._datumsById, datum.id)) {
        
        // <Debug>
        /*jshint expr:true */
        !datum.isNull || def.assert("Null datums do not notify visible changes");
        // </Debug>
        
        if(visible){
            this._visibleDatums.set(datum.id, datum);
        } else {
            this._visibleDatums.rem(datum.id);
        }
        
        this._sumAbsCache = null;

        // Notify dimensions
        def.eachOwn(this._dimensions, function(dimension){
            /*global dim_onDatumVisibleChanged:true */
            dim_onDatumVisibleChanged.call(dimension, datum, visible);
        });
        
        // Notify child and link child datas
        this._children.forEach(function(data){
            data_onDatumVisibleChanged.call(data, datum, visible);
        });
        
        if(this._linkChildren) {
            this._linkChildren.forEach(function(data){
                data_onDatumVisibleChanged.call(data, datum, visible);
            });
        }
    }
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
 * @returns {boolean} true if at least one datum changed its selected state.
 * @static
 */
pvc.data.Data.toggleSelected = function(datums){
    if(!def.array.isLike(datums)){
        datums = def.query(datums).array();
    }
    
    // Ensure null datums don't affect the result
    var allSelected = def.query(datums).all(function(datum){ return datum.isNull || datum.isSelected; });
    return this.setSelected(datums, !allSelected);
};

/**
 * Sets the visible state of the given datums
 * to the state 'visible'.
 * 
 * @param {def.Query} datums An enumerable of {@link pvc.data.Datum} to set.
 * @param {boolean} visible The desired visible state.
 * 
 * @returns {boolean} true if at least one datum changed its visible state.
 * @static
 */
pvc.data.Data.setVisible = function(datums, visible){
    var anyChanged = false;

    if(datums){
        def.query(datums).each(function(datum){
            if(datum.setVisible(visible)){
                // data_onDatumVisibleChanged has already been called
                anyChanged = true;
            }
        });
    }

    return anyChanged;
};

/**
 * Pseudo-toggles the visible state of the given datums.
 * If all are visible, hides them.
 * Otherwise, shows them all.
 * 
 * @param {def.Query} datums An enumerable of {@link pvc.data.Datum} to toggle.
 * 
 * @returns {boolean} true if at least one datum changed its visible state.
 * @static
 */
pvc.data.Data.toggleVisible = function(datums){
    if(!def.array.isLike(datums)){
        datums = def.query(datums).array();
    }
    
    // Ensure null datums don't affect the result (null datums are always visible)
    var allVisible = def.query(datums).all(function(datum){ return datum.isVisible; });
    return pvc.data.Data.setVisible(datums, !allVisible);
};

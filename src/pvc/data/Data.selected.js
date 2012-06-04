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
     * Obtains the number of visible datums.
     * 
     * @type Number
     */
    visibleCount: function(){
        return this._visibleDatums.count;
    },

    /**
     * Clears the selected state of any selected datum.
     * <p>
     * Can only be called on an owner data.
     * </p>
     * 
     * @returns {boolean} Returns <tt>true</tt> if any datum was selected and <tt>false</tt> otherwise. 
     */
    clearSelected: function(){
        /*global data_assertIsOwner:true */
        data_assertIsOwner.call(this);
        if(!this._selectedDatums.count) {
            return false;
        }
        
        this._selectedDatums.values().forEach(function(datum){
            /*global datum_deselect:true */
            datum_deselect.call(datum);
        });

        this._selectedDatums.clear();
        return true;
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
 * Called after loading or reloading datums to 
 * calculate selected, visible datums and index them by id.
 * 
 * @name pvc.data.Data#_syncDatumsState
 * @function
 * @type undefined
 * @private
 * @internal
 */
function data_syncDatumsState(){
    if(this._selectedDatums) { this._selectedDatums.clear(); }
    this._visibleDatums.clear();
    this._datumsById = {};
    this._sumAbsCache = null;
    
    if(this._datums) {
        this._datums.forEach(data_onReceiveDatum, this);
    }
}

/**
 * Called to add a datum to the data.
 * The datum is only added if it is not present yet.
 * 
 * Used when synchonizing datum state, after a load,
 * or by the group operation.
 *
 * @name pvc.data.Data#_addDatum
 * @function
 * @param {pvc.data.Datum} datum The datum to add.
 * @type undefined
 * @private
 * @internal
 */
function data_addDatum(datum){
    if(!def.hasOwn(this._datumsById, datum.id)){
        this._datums.push(datum);
        data_onReceiveDatum.call(this, datum);
    }
}

/**
 * Accounts for an datum that has been added to the datums list.
 * Used when synchonizing datum state, after a load,
 * and by the group operation.
 *
 * @name pvc.data.Data#_onReceiveDatum
 * @function
 * @param {pvc.data.Datum} datum The datum to add.
 * @type undefined
 * @private
 * @internal
 */
function data_onReceiveDatum(datum){
    var id = datum.id;
    this._datumsById[id] = datum;

    if(this._selectedDatums && datum.isSelected) {
        this._selectedDatums.set(id, datum);
    }

    if(datum.isVisible) {
        this._visibleDatums.set(id, datum);
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
 * @static
 */
pvc.data.Data.toggleSelected = function(datums){
    if(!def.isArrayLike(datums)){
        datums = def.query(datums).array();
    }
     
    var allSelected = def.query(datums).all(function(datum){ return datum.isSelected; });
    this.setSelected(datums, !allSelected);
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
 * @static
 */
pvc.data.Data.toggleVisible = function(datums){
    datums = def.query(datums).array(); 
    var allVisible = def.query(datums).all(function(datum){ return datum.isVisible; });
    pvc.data.Data.setVisible(datums, !allVisible);
};

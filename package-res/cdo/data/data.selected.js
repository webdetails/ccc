/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

cdo.Data.add(/** @lends cdo.Data# */{
    /**
     * Obtains the number of not-null selected datums.
     * <p>
     * This method is only optimized when called on an owner data.
     * </p>
     *
     * @type Number
     */
    selectedCount: function() {
        // NOTE: isNull: false is not required here, because null datums cannot be selected
        return this.isOwner()
            ? this._selectedNotNullDatums.count
            : this.datums(null, {selected: true}).count();
    },

    /**
     * Obtains the not-null selected datums, in an unspecified order.
     * <p>
     * If the datums should be sorted,
     * they can be sorted by their {@link cdo.Datum#id}.
     *
     * Alternatively, {@link #datums} can be called,
     * with the <tt>selected</tt> keyword argument.
     * </p>
     * @type cdo.Datum[]
     */
    selectedDatums: function() {
        // NOTE: isNull: false is not required here, because null datums cannot be selected
        return this.isOwner()
            ? this._selectedNotNullDatums.values()
            : this.datums(null, {selected: true}).array();
    },

    /**
     * Obtains a map containing the not-null selected datums, indexed by id.
     *
     * @type def.Map(cdo.Datum)
     */
    selectedDatumMap: function() {
        if(this.isOwner()) return this._selectedNotNullDatums.clone();

        // NOTE: isNull: false is not required here, because null datums cannot be selected
        var datums = this.datums(null, {selected: true}).object({name: def.propGet('id')});
        return new def.Set(datums);
    },

    /**
     * Obtains the number of not-null visible datums.
     * @type Number
     */
    visibleCount: function() { return this._visibleNotNullDatums.count; },

    /**
     * Replaces currently selected datums with the specified datums.
     *
     * @param {cdo.Datum[]|def.query<cdo.Datum>} [datums] The new datums to be selected.
     * @returns {boolean} Returns <tt>true</tt> if any datum was selected and <tt>false</tt> otherwise.
     */
    replaceSelected: function(datums) {
        /*global datum_deselect:true, datum_isSelected:true, complex_id:true*/

        // Materialize, cause we're using it twice
        if(!def.array.is(datums)) datums = datums.array();

        // Clear all but the ones we'll be selecting.
        // This way we can have a correct changed flag.
        var alreadySelectedById = def.query(datums)
                .where(datum_isSelected)
                .object({name: complex_id}),
            changed = this.owner.clearSelected(function(datum) {
                    return !def.hasOwn(alreadySelectedById, datum.id);
                });

        changed |= cdo.Data.setSelected(datums, true);

        return changed;
    },

    /**
     * Clears the selected state of any selected datum.
     *
     * @param {cdo.Datum} [funFilter] Allows excluding atoms from the clear operation.
     * @returns {boolean} Returns <tt>true</tt> if any datum was selected and <tt>false</tt> otherwise.
     */
    clearSelected: function(funFilter) {
        /*global datum_deselect:true */

        if(this.owner !== this) return this.owner.clearSelected(funFilter);
        if(!this._selectedNotNullDatums.count) return false;

        var changed;
        if(funFilter) {
            changed = false;
            this._selectedNotNullDatums.values().filter(funFilter).forEach(function(datum) {
                    changed = true;
                    datum_deselect.call(datum);
                    this._selectedNotNullDatums.rem(datum.id);
                }, this);
        } else {
            changed = true;
            /*global datum_deselect:true */
            this._selectedNotNullDatums.values().forEach(function(datum) { datum_deselect.call(datum); });

            this._selectedNotNullDatums.clear();
        }

        return changed;
    }
});

/**
 * Called by a datum on its owner data
 * when its selected state changes.
 *
 * @name cdo.Data#_onDatumSelectedChanged
 * @function
 * @param {cdo.Datum} datum The datum whose selected state changed.
 * @param {boolean} selected The new datum selected state.
 * @type undefined
 * @internal
 */
function data_onDatumSelectedChanged(datum, selected) {
    // <Debug>
    /*jshint expr:true */
    !datum.isNull || def.assert("Null datums do not notify selected changes");
    // </Debug>

    if(selected) this._selectedNotNullDatums.set(datum.id, datum);
    else         this._selectedNotNullDatums.rem(datum.id);

    this._sumAbsCache = null;
}

/**
 * Called by a datum on its owner data
 * when its visible state changes.
 *
 * @name cdo.Data#_onDatumVisibleChanged
 * @function
 * @param {cdo.Datum} datum The datum whose visible state changed.
 * @param {boolean} visible The new datum visible state.
 * @type undefined
 * @internal
 */
function data_onDatumVisibleChanged(datum, visible) {
    var did = datum.id,
        me  = this,
        hasOwn = def.hasOwnProp;
    if(hasOwn.call(me._datumsById, did)) {

        // <Debug>
        /*jshint expr:true */
        !datum.isNull || def.assert("Null datums do not notify visible changes");
        // </Debug>

        if(visible) me._visibleNotNullDatums.set(did, datum);
        else        me._visibleNotNullDatums.rem(did);

        me._sumAbsCache = null;

        // Notify dimensions
        /*global dim_onDatumVisibleChanged:true */
        var list = me._dimensionsList,
            i = 0,
            L = list.length;
        while(i < L) dim_onDatumVisibleChanged.call(list[i++], datum, visible);

        // Notify child and link child datas
        list = me.childNodes;
        i = 0;
        L = list.length;
        while(i < L) data_onDatumVisibleChanged.call(list[i++], datum, visible);

        list = me._linkChildren;
        if(list && (L = list.length)) {
            i = 0;
            while(i < L) data_onDatumVisibleChanged.call(list[i++], datum, visible);
        }
    }
}

/**
 * Sets the selected state of the given datums
 * to the state 'select'.
 *
 * @param {def.Query} datums An enumerable of {@link cdo.Datum} to set.
 * @param {boolean} selected The desired selected state.
 *
 * @returns {boolean} true if at least one datum changed its selected state.
 * @static
 */
cdo.Data.setSelected = function(datums, selected) {
    var anyChanged = 0;
    // data_onDatumSelectedChanged is called
    if(datums) def.query(datums).each(function(datum) { anyChanged |= datum.setSelected(selected); });

    return !!anyChanged;
};

/**
 * Pseudo-toggles the selected state of the given datums.
 * If all are selected, clears their selected state.
 * Otherwise, selects all.
 *
 * If the `any` argument is <tt>true</tt>, the behavior changes to:
 * if any is selected, clears their selected state.
 * Otherwise, if all are not selected, select all.
 *
 * @param {def.Query} datums An enumerable of {@link cdo.Datum} to toggle.
 * @param {boolean} [any=false] If only some must be selected to consider
 *  the set currently selected or if all must be so.
 *
 * @returns {boolean} true if at least one datum changed its selected state.
 * @static
 */
cdo.Data.toggleSelected = function(datums, any) {
    if(!def.array.isLike(datums)) datums = def.query(datums).array();

    /*global datum_isSelected:true, datum_isNullOrSelected:true */

    // Null datums are always unselected.
    // In 'all', their existence would impede on ever being true.
    var q  = def.query(datums),
        on = any ? q.any(datum_isSelected) : q.all(datum_isNullOrSelected);

    return this.setSelected(datums, !on);
};

/**
 * Sets the visible state of the given datums to the value of argument 'visible'.
 *
 * @param {def.Query} datums An enumerable of {@link cdo.Datum} to set.
 * @param {boolean} visible The desired visible state.
 *
 * @returns {boolean} true if at least one datum changed its visible state.
 * @static
 */
cdo.Data.setVisible = function(datums, visible) {
    var anyChanged = 0;
    // data_onDatumVisibleChanged is called
    if(datums) def.query(datums).each(function(datum) { anyChanged |= datum.setVisible(visible); });
    return !!anyChanged;
};

/**
 * Pseudo-toggles the visible state of the given datums.
 * If all are visible, hides them.
 * Otherwise, shows them all.
 *
 * @param {def.Query} datums An enumerable of {@link cdo.Datum} to toggle.
 *
 * @returns {boolean} true if at least one datum changed its visible state.
 * @static
 */
cdo.Data.toggleVisible = function(datums) {
    if(!def.array.isLike(datums)) datums = def.query(datums).array();

    // Null datums are always visible. So they don't affect the result.
    var allVisible = def.query(datums).all(def.propGet('isVisible'));
    return cdo.Data.setVisible(datums, !allVisible);
};

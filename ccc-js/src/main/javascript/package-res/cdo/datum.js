/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a datum instance.
 *
 * @name cdo.Datum
 *
 * @class A datum is a complex that contains atoms for all the
 * dimensions of the associated {@link #data}.
 *
 * @extends cdo.Complex
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
 * @param {cdo.Data} data The data instance to which the datum belongs.
 * Note that the datum will belong instead to the owner of this data.
 * However the datums atoms will inherit from the atoms of the specified data.
 * This is essentially to facilitate the creation of null datums.
 * @param {object<string,any>} [atomsByName] A map of atoms or raw values by dimension name.
 */
def.type('cdo.Datum', cdo.Complex)
.init(
function(data, atomsByName, dimNames) {
    this.base(
        data,
        atomsByName,
        dimNames,
        /*atomsBase*/ null,
        /*wantLabel*/ false,
        /*calculate*/ true);

    if(!this.key) {
        this.key = this.id;
    }
})
.add(/** @lends cdo.Datum# */{

    isSelected: false,
    isVisible:  true,
    isNull:     false, // Indicates that all dimensions that are bound to a measure role are null.

    isVirtual:  false, // A datum that did not come in the original data (interpolated, trend)

    isTrend:    false,
    trend:      null,

    isInterpolated: false,
    interpolation: null, // type of interpolation

    _getAtomKey: function(atom) {
        return atom.dimension.isKey ? atom.key : null;
    },

    /**
     * Sets the selected state of the datum to a specified value.
     * @param {boolean} [select=true] The desired selected state.
     * @returns {boolean} true if the selected state changed, false otherwise.
     */
    setSelected: function(select) {
        // Null datums are always not selected
        if(this.isNull) { return false; }

        // Normalize 'select'
        select = (select == null) || !!select;

        var changed = this.isSelected !== select;
        if(changed) {
            if(!select) delete this.isSelected;
            else        this.isSelected = true;

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
    toggleSelected: function() { return this.setSelected(!this.isSelected); },

    /**
     * Sets the visible state of the datum to a specified value.
     *
     * @param {boolean} [visible=true] The desired visible state.
     *
     * @returns {boolean} true if the visible state changed, false otherwise.
     */
    setVisible: function(visible) {
        // Null datums are always visible
        if(this.isNull) { return false; }

        // Normalize 'visible'
        visible = (visible == null) || !!visible;

        var changed = this.isVisible !== visible;
        if(changed) {
            this.isVisible = visible;

            /*global data_onDatumVisibleChanged:true */
            data_onDatumVisibleChanged.call(this.owner, this, visible);
        }

        return changed;
    },

    /**
     * Toggles the visible state of the datum.
     *
     * @type {undefined}
     */
    toggleVisible: function() { return this.setVisible(!this.isVisible); }
});

/**
 * Called by the owner data to clear the datum's selected state (internal).
 * @name cdo.Datum#_deselect
 * @function
 * @type undefined
 * @private
 *
 * @see cdo.Data#clearSelected
 */
function datum_deselect() { delete this.isSelected; }

function datum_isNullOrSelected(d) { return d.isNull || d.isSelected; }

var datum_isSelected = cdo.Datum.isSelected = def.propGet('isSelected');

function datum_isSelectedT(d) { return d.isSelected  === true;  }
function datum_isSelectedF(d) { return d.isSelected  === false; }
function datum_isVisibleT (d) { return d.isVisible   === true;  }
function datum_isVisibleF (d) { return d.isVisible   === false; }
function datum_isNullT    (d) { return d.isNull      === true;  }
function datum_isNullF    (d) { return d.isNull      === false; }

cdo.Datum.isSelectedT = datum_isSelectedT;
cdo.Datum.isSelectedF = datum_isSelectedF;
cdo.Datum.isVisibleT  = datum_isVisibleT;
cdo.Datum.isVisibleF  = datum_isVisibleF;
cdo.Datum.isNullT     = datum_isNullT;
cdo.Datum.isNullF     = datum_isNullF;

// -----------------

def.type('cdo.TrendDatum', cdo.Datum)
.init(function(data, atomsByName, dimNames, trend) {
    this.base(data, atomsByName, dimNames);

    this.trend = trend;
})
.add({
    isVirtual: true,
    isTrend:   true
});

def.type('cdo.InterpolationDatum', cdo.Datum)
.init(function(data, atomsByName, dimNames, interpolation, dimName) {
    this.base(data, atomsByName, dimNames);

    this.interpolation = interpolation;
    this.interpDimName = dimName;
})
.add({
    isVirtual: true,
    isInterpolated: true
});

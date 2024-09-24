/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def.type('cdo.FilteredData', cdo.Data)
.init(function(keyArgs) {

    // Always a root, linked data.
    if(keyArgs == null || keyArgs.parent != null || keyArgs.linkParent == null) {
        throw def.error.argumentRequired('keyArgs.linkParent');
    }

    this.base(keyArgs);

    /**
     * The predicate that filtered the datums of this data set.
     *
     * @type {function(!cdo.Datum) : boolean}
     * @private
     */
    this._wherePred = keyArgs.where || def.fail.argumentRequired('keyArgs.where');
})
.add({
    _addDatumsSimple: function(newDatums) {

        newDatums = newDatums.filter(this._wherePred);

        this.base(newDatums);
    }
});

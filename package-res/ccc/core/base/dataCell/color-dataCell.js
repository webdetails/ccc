/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.visual.ColorDataCell', pvc.visual.DataCell)
.init(function(plot, axisType, axisIndex, role, dataPartValue) {

    this.base(plot, axisType, axisIndex, role, dataPartValue);

    this._legendGroupScene = null;
})
.add(/** @lends pvc.visual.ColorDataCell.prototype */{
    legendGroupScene: function(_) {
        if(arguments.length) {
            this._legendGroupScene = _;
            return this;
        }
        return this._legendGroupScene;
    }
});
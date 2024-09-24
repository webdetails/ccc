/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.visual.ColorDataCell', pvc.visual.DataCell)
.init(function(plot, axisType, axisIndex, role) {

    this.base(plot, axisType, axisIndex, role);

    this._legendGroupScene = null;
    this._legendSymbolRenderer = null;
})
.add(/** @lends pvc.visual.ColorDataCell.prototype */{
    legendSymbolRenderer: function(_) {
        if(arguments.length) {
            if(_ && typeof _ === 'object') _ = pvc.visual.legend.symbolRenderer(_);
            this._legendSymbolRenderer = _;
            return this;
        }
        return this._legendSymbolRenderer;
    }
});

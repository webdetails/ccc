/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.visual.CartesianOrthoDataCell', pvc.visual.DataCell)
.init(function(plot, axisType, axisIndex, roleName, dataPartValue,
        isStacked,
        nullInterpolationMode,
        trend) {

    this.base(plot, axisType, axisIndex, roleName, dataPartValue);

    this.isStacked = isStacked;
    this.nullInterpolationMode = nullInterpolationMode;
    this.trend = trend;
});
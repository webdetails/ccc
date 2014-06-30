/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a DataCell instance.
 *
 * @name pvc.visual.DataCell
 * @class Describes data requirements of a plot
 *        in terms of a role, given its name, 
 *        a data part value and 
 *        an axis, given its type and index.
 * 
 * @constructor
 */
def
.type('pvc.visual.DataCell')
.init(function(plot, axisType, axisIndex, role, dataPartValue) {
    this.plot = plot;
    this.axisType = axisType;
    this.axisIndex = axisIndex;
    this.role = role;
    this.dataPartValue = dataPartValue;

    this.key = [axisType, axisIndex, role.prettyId(), dataPartValue].join("~");
})
.add(/** @lends pvc.visual.DataCell# */{
    legendVisible: function() {
        return this.role.legendVisible();
    }
});

function dataCell_dataPartValue(dc) { return dc.dataPartValue; }
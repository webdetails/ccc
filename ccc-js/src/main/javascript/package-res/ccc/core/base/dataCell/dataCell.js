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
.init(function(plot, axisType, axisIndex, role) {
    this.plot = plot;
    this.dataPartValue = plot.dataPartValue;

    this.axisType = axisType;
    this.axisIndex = axisIndex;
    this.role = role;

    this.key = [axisType, axisIndex, role.prettyId(), this.dataPartValue].join("~");
})
.add(/** @lends pvc.visual.DataCell# */{
    legendVisible: function() {
        return this.role.legend().visible;
    },

    /**
     * Gets a value that indicates if the data cell is bound on the given base data.
     *
     * A data cell is bound if:
     * 1. it is statically bound to a visual role that is bound, and
     * 2. a) it is not bound to a measure visual role or
     * 2. b) it is bound to a measure visual role that is compatible with any measure discriminator dimensions already set on `baseData`.
     *
     * @param {!cdo.Data} baseData - The base data.
     * @return {boolean} `true` if the data cell is data bound; `false` otherwise.
     */
    isDataBoundOn: function(baseData) {
        var role = this.role;
        if(!role.isBound()) {
            return false;
        }

        if(!role.isMeasureEffective) {
            return true;
        }

        return role.isBoundDimensionCompatible(baseData);
    }
});

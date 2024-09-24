/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * MetricXYAbstract is the base class of metric XY charts.
 * (Metric stands for:
 *   Measure, Continuous or Not-categorical base and ortho axis)
 */
def
.type('pvc.MetricXYAbstract', pvc.CartesianAbstract)
.add({
    // Has no representation in this chart's main plot type.
    _defaultAxisBandSizeRatio: 1,

    _getIsNullDatum: function() {
        var me = this, measureDimNames, M;

        // If x or y are null, it is a null datum.
        return function(datum) {
            if(!measureDimNames) {
                measureDimNames = def.query([me.visualRoles.x, me.visualRoles.y])
                    .selectMany(function(role) { return role.grouping.dimensionNames(); })
                    .distinct()
                    .array();
                M = measureDimNames.length;
            }

            if(!M) return false;
            var atoms = datum.atoms;
            for(var i = 0 ; i < M ; i++) if(atoms[measureDimNames[i]].value == null) return true;
            return false;
        };
    }
});
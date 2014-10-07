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
    _defaultAxisBandSizeRatio: 1
});
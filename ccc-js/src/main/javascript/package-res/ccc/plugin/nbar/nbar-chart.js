/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A NormalizedBarChart is a 100% stacked bar chart.
 */
def
.type('pvc.NormalizedBarChart', pvc.BarChart)
.add({
    /** @Override */
    _createMainPlot: function() {
        this._addPlot(new pvc.visual.BarPlot(this, {
            fixed: {ValuesNormalized: true, Stacked:true}
        }));
    }
});

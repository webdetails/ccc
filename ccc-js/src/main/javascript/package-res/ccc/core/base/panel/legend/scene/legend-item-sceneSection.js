/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 - 2026 by Pentaho Canada Inc. : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2030-06-15
 ******************************************************************************/


def
.type('pvc.visual.legend.LegendItemSceneSection')
.init(function(index) {
    this.index = index;
    this.items = [];
    this.size  = {width: 0, height: 0};
});
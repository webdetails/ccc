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

/*global pvc_ValueLabelVar:true */

def
.type('pvc.visual.legend.WaterfallLegendItemScene', pvc.visual.legend.LegendItemScene)
.init(function(groupScene, keyArgs) {
    
    this.base.apply(this, arguments);
    
    // Don't allow any Action
    var I = pvc.visual.Interactive;
    this._ibits = I.Interactive | I.ShowsInteraction;
    
    this.color = def.get(keyArgs, 'color');
    
    // Pre-create 'value' variable
    this.vars.value = new pvc_ValueLabelVar(null, def.get(keyArgs, 'label'));
});

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

def
.type('pvc.PlotBgPanel', pvc.BasePanel)
.init(function(chart, parent, options) {
    // Prevent the border from affecting the box model,
    // providing a static 0 value, independently of the actual drawn value...
    //this.borderWidth = 0;
    
    this.base(chart, parent, options);
    
    //this._extensionPrefix = "plotBg";
})
.add({
    anchor: 'fill',

    _getExtensionId: function() {
        return 'plotBg';
    },
    
    _createCore: function(layoutInfo) {
        // Send the panel behind grid rules
        this.pvPanel
            .borderPanel
            .lock('zOrder', -13)
            .antialias(false);
        
        this.base(layoutInfo);
    }
});
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
.type('pvc.Abstract')
.init(function() {
    this.log = def.logger(this._getLogId, this);
})
.add({
    invisibleLineWidth: 0.001,
    defaultLineWidth:   1.5,
    
    _logId: null,
    
    _getLogId: function() {
        return this._logId || (this._logId = this._processLogId(this._createLogId()));
    },
    
    _createLogId: function() {
        return String(def.qualNameOf(this.constructor));
    },
    
    _processLogId: function(logInstanceId) {
        var L = 30,
            s = logInstanceId.substr(0, L);

        if(s.length < L) s += def.array.create(L - s.length, ' ').join('');

        return "[" + s + "]";
    }
});
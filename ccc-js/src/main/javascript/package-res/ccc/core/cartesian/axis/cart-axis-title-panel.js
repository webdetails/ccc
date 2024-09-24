/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Size:true */

def
.type('pvc.AxisTitlePanel', pvc.TitlePanelAbstract)
.init(function(chart, parent, axis, options) {
    
    this.axis = axis;
    
    this.base(chart, parent, options);
    
    this._extensionPrefix = 
        axis
        .extensionPrefixes
        .map(function(prefix) {
            return prefix + 'Title';
        });
})
.add({
    _calcLayout: function(layoutInfo) {
        var scale = this.axis.scale;
        if(!scale || scale.isNull) {
            return new pvc_Size(0, 0);
        }
        
        return this.base(layoutInfo);
    },
    
    _createCore: function(layoutInfo) {
        var scale = this.axis.scale;
        if(!scale || scale.isNull) {
            return;
        }
        
        return this.base(layoutInfo);
    }
});

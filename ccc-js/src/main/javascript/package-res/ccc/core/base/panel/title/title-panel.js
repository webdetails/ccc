/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.TitlePanel', pvc.TitlePanelAbstract)
.init(function(chart, parent, options) {
    
    if(!options) options = {};
    
    var isV1Compat = chart.compatVersion() <= 1;
    if(isV1Compat) {
        var size = options.titleSize;
        if(size == null) options.titleSize = 25;
    }
    
    // Must be done before calling base, cause it uses _getExtension
    this._extensionPrefix = !chart.parent ? "title" : "smallTitle";
    
    this.base(chart, parent, options);
})
.add({

    font: "14px sans-serif",
    
    defaultPaddings: 4
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a bullet plot.
 * 
 * @name pvc.visual.BulletPlot
 * @class Represents a bullet plot.
 * @extends pvc.visual.Plot
 */
def
.type('pvc.visual.BulletPlot', pvc.visual.Plot)
.add({
    type: 'bullet',
    
    _getOptionsDefinition: function(){
        return pvc.visual.BulletPlot.optionsDef;
    }
});

pvc.visual.BulletPlot.optionsDef = def.create(
    pvc.visual.Plot.optionsDef, {
        ValuesVisible: { // override
            value: true
        },
        
        ColorRole: {
            value: null
        }
    });
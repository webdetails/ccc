/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def.type('pvc.visual.Rule', pvc.visual.Sign)
.init(function(panel, parentMark, keyArgs) {

    var pvMark = parentMark.add(pv.Rule);
    
    var protoMark = def.get(keyArgs, 'proto');
    if(protoMark) pvMark.extend(protoMark);
    
    this.base(panel, pvMark, keyArgs);
    
    if(!def.get(keyArgs, 'freeStyle')) {
        // Colors & Line
        this._bindProperty('strokeStyle', 'strokeColor', 'color')
            ._bindProperty('lineWidth',   'strokeWidth');
    }
})
.prototype
.property('strokeWidth')
.constructor
.add({
    _addInteractive: function(keyArgs) {
        var t = true;
        keyArgs = def.setDefaults(keyArgs,
                        'noHover',       t,
                        'noSelect',      t,
                        'noTooltip',     t,
                        'noClick',       t,
                        'noDoubleClick', t,
                        'showsInteraction', false);

        this.base(keyArgs);
    },

    /* STROKE WIDTH */
    defaultStrokeWidth: def.fun.constant(1),

    interactiveStrokeWidth: function(scene, strokeWidth) {
        return this.mayShowActive(scene, /*noSeries*/true)
            ? Math.max(1, strokeWidth) * 2.2
            : strokeWidth;
    },

    /* STROKE COLOR */
    interactiveColor: function(scene, color, type) {
        if(scene.datum && 
           !this.mayShowActive(scene, /*noSeries*/true) &&
           this.mayShowNotAmongSelected(scene)) {
            return this.dimColor(color, type);
        }
        
        return this.base(scene, color, type);
    }
});

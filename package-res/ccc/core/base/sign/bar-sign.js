/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def.type('pvc.visual.Bar', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs) {

    var pvMark = protoMark.add(pv.Bar);
    
    keyArgs = def.setDefaults(keyArgs, 'freeColor', false);
    
    this.base(panel, pvMark, keyArgs);

    this.normalStroke = def.get(keyArgs, 'normalStroke', false);

    this._bindProperty('lineWidth',  'strokeWidth');
})
.prototype
.property('strokeWidth')
.constructor
.add({
    /* COLOR */
    /**
     * @override
     */
    normalColor: function(scene, color, type) {
        return (type === 'stroke' && !this.normalStroke) ? null : color;
    },

    /**
     * @override
     */
    interactiveColor: function(scene, color, type) {
        if(type === 'stroke') {
            if(this.mayShowActive(scene, /*noSeries*/true)) return color.brighter(1.3).alpha(0.7);
            if(!this.normalStroke) return null;
            
            if(this.mayShowNotAmongSelected(scene))
                return this.mayShowActive(scene)
                    ? pv.Color.names.darkgray.darker().darker()
                    : this.dimColor(color, type);
            
            if(this.mayShowActive(scene)) return color.brighter(1).alpha(0.7);

        } else if(type === 'fill') {
            if(this.mayShowActive(scene, /*noSeries*/true)) return color.brighter(0.2).alpha(0.8);

            if(this.mayShowNotAmongSelected(scene))
                return this.mayShowActive(scene)
                    ? pv.Color.names.darkgray.darker(2).alpha(0.8)
                    : this.dimColor(color, type);
            
            if(this.mayShowActive(scene)) return color.brighter(0.2).alpha(0.8);
        }

        return this.base(scene, color, type);
    },

    /* STROKE WIDTH */    
    defaultStrokeWidth: function() { return 0.5; },

    interactiveStrokeWidth: function(scene, strokeWidth) {
        return this.mayShowActive(scene, /*noSeries*/true)
            ? Math.max(1, strokeWidth) * 1.3
            : strokeWidth;
    }
});

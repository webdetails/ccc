/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def.type('pvc.visual.Dot', pvc.visual.Sign)
.init(function(panel, parentMark, keyArgs) {
    
    var pvMark = parentMark.add(pv.Dot);
    
    var protoMark = def.get(keyArgs, 'proto');
    if(protoMark) pvMark.extend(protoMark);
    
    keyArgs = def.setDefaults(keyArgs, 'freeColor', false);
    
    this.base(panel, pvMark, keyArgs);
    
    if(!def.get(keyArgs, 'freePosition', false)) {
        var a_left   = panel.isOrientationVertical() ? 'left' : 'bottom',
            a_bottom = panel.anchorOrtho(a_left);

        /* Positions */
        this._lockDynamic(a_left,   'x')
            ._lockDynamic(a_bottom, 'y');
    }

    /* Shape & Size */
    this._bindProperty('shape',       'shape' )
        ._bindProperty('shapeRadius', 'radius')
        ._bindProperty('shapeSize',   'size'  );
        
    /* Colors & Line */
    this.optional('strokeDasharray', undefined) // Break inheritance
        .optional('lineWidth',       1.5);      // Idem
})
.prototype
.property('size')
.property('shape')
.constructor
.add({
    /* Sign Spatial Coordinate System
     *  -> Cartesian coordinates
     *  -> Grows Up, vertically, and Right, horizontally
     *  -> Independent of the chart's orientation
     *  -> X - horizontal axis
     *  -> Y - vertical axis
     *  
     *  y
     *  ^
     *  |
     *  |
     *  o-----> x
     */
    y: def.fun.constant(0),
    x: def.fun.constant(0),
    
    radius: function() {
        // Store extended value, if any
        // See #baseSize
        this.instanceState().cccRadius = this.delegateExtension();
    },
    
    /* SIZE */
    baseSize: function(scene) {
        /* Radius has precedence */
        var radius = this.instanceState().cccRadius;
        return radius != null ? def.sqr(radius) : this.base(scene);
    },

    defaultSize: def.fun.constant(12),
    
    interactiveSize: function(scene, size) {
        return this.mayShowActive(scene, /*noSeries*/true) ?
               (Math.max(size, 5) * 2.5) : 
               size;
    },
    
    /* COLOR */
    
    /**
     * @override
     */
    interactiveColor: function(scene, color, type) {
        if(this.mayShowActive(scene, /*noSeries*/true)) {
            if(type === 'stroke') return color.brighter(1);
        } else if(this.mayShowNotAmongSelected(scene)) {
            if(this.mayShowActive(scene)) return color.alpha(0.8);
            
            switch(type) {
                case 'fill':   return this.dimColor(color, type);
                case 'stroke': return color.alpha(0.45);
            }
        }
        return this.base(scene, color, type);
    }
});

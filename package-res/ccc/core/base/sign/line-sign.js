/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Custom protovis mark inherited from pv.Line
pv.LineInterm = function() {
    pv.Line.call(this);
};

pv.LineInterm.prototype = pv.extend(pv.Line);
    
pv.LineInterm.prototype.getNearestInstanceToMouse = function(scene, eventIndex) {
    var mouseIndex = pv.Line.prototype.getNearestInstanceToMouse.call(this, scene, eventIndex),
        // Don't return intermediate scenes.
        s = scene[mouseIndex];

    if(s && s.data && s.data.isIntermediate && mouseIndex + 1 < scene.length) mouseIndex++;
    return mouseIndex;
};

def.type('pvc.visual.Line', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs) {
    
    var pvMark = protoMark.add(pv.LineInterm);
    
    this.base(panel, pvMark, keyArgs);
    
    this.lock('segmented', 'smart') // fixed
        .lock('antialias', true);

    if(!def.get(keyArgs, 'freePosition', false)) {
        var basePosProp  = panel.isOrientationVertical() ? "left" : "bottom",
            orthoPosProp = panel.anchorOrtho(basePosProp);

        // Positions
        this._lockDynamic(orthoPosProp, 'y')
            ._lockDynamic(basePosProp,  'x');
    }

    // Colors & Line
    this._bindProperty('strokeStyle', 'strokeColor', 'color')
        ._bindProperty('lineWidth',   'strokeWidth');

    // Segmented lines use fill color instead of stroke...so this doesn't work.
    //this.pvMark.lineCap('square');
})
.prototype
.property('strokeWidth')
.constructor
.add({
    _addInteractive: function(keyArgs) {
        keyArgs = def.setDefaults(keyArgs, 'noTooltip',  true);
        
        this.base(keyArgs);
    },

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

    /* STROKE WIDTH */
    defaultStrokeWidth: def.fun.constant(1.5),

    interactiveStrokeWidth: function(scene, strokeWidth) {
        return this.mayShowActive(scene) ? 
               Math.max(1, strokeWidth) * 2.5 :
               strokeWidth;
    },
    
    /* STROKE COLOR */
    /**
     * @override
     */
    interactiveColor: function(scene, color, type) {
        if(this.mayShowNotAmongSelected(scene))
            return this.mayShowActive(scene)
                ? pv.Color.names.darkgray.darker().darker()
                : this.dimColor(color, type);

        return this.base(scene, color, type);
    }
});

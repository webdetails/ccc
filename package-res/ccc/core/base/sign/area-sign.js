/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Custom protovis mark inherited from pv.Area
pv.AreaInterm = function() {
    pv.Area.call(this);
};

pv.AreaInterm.prototype = pv.extend(pv.Area);
    
pv.AreaInterm.prototype.getNearestInstanceToMouse = function(scene, eventIndex) {
    var mouseIndex = pv.Area.prototype.getNearestInstanceToMouse.call(this, scene, eventIndex),
        // Don't return intermediate scenes.
        s = scene[mouseIndex];

    if(s && s.data && s.data.isIntermediate && mouseIndex + 1 < scene.length) mouseIndex++;

    return mouseIndex;
};

def.type('pvc.visual.Area', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs) {
    
    var pvMark = protoMark.add(pv.AreaInterm);
    
    if(!keyArgs) keyArgs = {};
    
    keyArgs.freeColor = true;
    
    this.base(panel, pvMark, keyArgs);
    
    var antialias = def.get(keyArgs, 'antialias', true);
    
    this
        .lock('segmented', 'smart') // fixed, not inherited
        .lock('antialias', antialias);

    if(!def.get(keyArgs, 'freePosition', false)) {
        var basePosProp  = panel.isOrientationVertical() ? "left" : "bottom",
            orthoPosProp = panel.anchorOrtho(basePosProp),
            orthoLenProp = panel.anchorOrthoLength(orthoPosProp);
        
        /* Positions */
        this._lockDynamic(basePosProp,  'x')   // ex: left
            ._lockDynamic(orthoPosProp, 'y')   // ex: bottom
            ._lockDynamic(orthoLenProp, 'dy'); // ex: height
    }
    
    /* Colors */
    this._bindProperty('fillStyle', 'fillColor', 'color');
    
    // These really have no real meaning in the area and should not be used.
    // If lines are desired, they should be created with linesVisible of LineChart
    this.lock('strokeStyle', null)
        .lock('lineWidth',   0);
})
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
     *  y       ^
     *  ^    dY |
     *  |       - y
     *  |
     *  o-----> x
     */
    y:  def.fun.constant(0),
    x:  def.fun.constant(0),
    dy: def.fun.constant(0),
    
    /* COLOR */
    /**
     * @override
     */
    interactiveColor: function(scene, color, type) {
        return (type === 'fill' && this.mayShowNotAmongSelected(scene))
            ? this.dimColor(color, type)
            : this.base(scene, color, type);
    }
});

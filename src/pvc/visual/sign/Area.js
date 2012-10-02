
def.type('pvc.visual.Area', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){
    
    var pvMark = protoMark.add(pv.Area);
    
    if(!keyArgs) { keyArgs = {}; }
    
    keyArgs.freeColor = true;
    
    this.base(panel, pvMark, keyArgs);
    
    var antialias = def.get(keyArgs, 'antialias', true),
        segmented = def.get(keyArgs, 'segmented', true);
    
    this
        .lock('segmented', segmented) // fixed, not inherited
        .lock('antialias', antialias)
        ;

    if(!def.get(keyArgs, 'freePosition', false)){
        var basePosProp  = panel.isOrientationVertical() ? "left" : "bottom",
            orthoPosProp = panel.anchorOrtho(basePosProp),
            orthoLenProp = panel.anchorOrthoLength(orthoPosProp);
        
        /* Positions */
        this
            ._lockDynamic(basePosProp,  'x')  // ex: left
            ._lockDynamic(orthoPosProp, 'y')  // ex: bottom
            ._lockDynamic(orthoLenProp, 'dy') // ex: height
            ;
    }
    
    /* Colors */
    // NOTE: must be registered before fixAntialiasStrokeColor
    this._bindProperty('fillStyle', 'fillColor', 'color');
    
    /* Using antialias causes the vertical separation
     * of *segmented* areas to be noticed.
     * When lines are also shown, not using antialias
     * is ok because the ladder border that it causes is hidden by the line.
     * 
     * So, we only use antialias if there isn't a line 
     * to cover the side effect of not using it.
     */
    if(segmented && antialias) {
        // Try to hide the vertical lines noticeable between areas,
        // due to antialias
        this
            ._lockDynamic('strokeStyle', 'fixAntialiasStrokeColor')
            // NOTE: must be registered after fixAntialiasStrokeColor
            ._lockDynamic('lineWidth', 'fixAntialiasStrokeWidth')
            ;
    } else {
        // These really have no real meaning in the area and should not be used.
        // If lines are desired, they should be created with showLines of LineChart
        this.lock('strokeStyle', null)
            .lock('lineWidth',   0)
            ;
    }
})
.add({
    _addInteractive: function(keyArgs){
        keyArgs = def.setDefaults(keyArgs, 
                        'noTooltips',  true);

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
    x:  function(){ return 0; },
    y:  function(){ return 0; },
    dy: function(){ return 0; },
    
    /* COLOR */
    fixAntialiasStrokeColor: function(){ 
        /* Copy fill color */
        return this.pvMark.fillStyle();
    },
    
    /**
     * @override
     */
    interactiveColor: function(color, type){
        if(type === 'fill'){
            if(this.scene.anySelected() && !this.scene.isSelected()) {
                return this.dimColor(color, type);
            }
        }

        return this.base(color, type);
    },
    
    /* STROKE */
    fixAntialiasStrokeWidth: function(){
        // Hide the line when using alpha
        // Otherwise, show it to bridge the gaps of segmented areas.
        // If the line is too thick, 
        // the junctions become horrible on very small angles.
        var color = this.pvMark.strokeStyle();
        return (!color || color.a < 1) ? 0.00001 : 1;
    }
});

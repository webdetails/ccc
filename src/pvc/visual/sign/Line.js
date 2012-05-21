
def.type('pvc.visual.Line', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){
    
    var pvMark = protoMark.add(pv.Line);
    
    this.base(panel, pvMark, keyArgs);
    
    this.lockValue('segmented', true) // fixed
        .lockValue('antialias', true)
        ;

    if(!def.get(keyArgs, 'freePosition', false)){
        var basePosProp  = panel.isOrientationVertical() ? "left" : "bottom",
            orthoPosProp = panel.anchorOrtho(basePosProp);

        this/* Positions */
            .lock(orthoPosProp, 'y')
            .lock(basePosProp,  'x');
    }

    this/* Colors & Line */
        .intercept('strokeStyle', 'strokeColor')
        .intercept('lineWidth',   'strokeWidth')
        ;

    // Segmented lines use fill color instead of stroke...so this doesn't work.
    //this.pvMark.svg({ 'stroke-linecap': 'square' });
})
.add({
    _addInteractive: function(keyArgs){
        keyArgs = def.setDefaults(keyArgs, 
                        'noHoverable', true,
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
     *  y
     *  ^
     *  |
     *  |
     *  o-----> x
     */
    y: function(){ return 0; },
    x: function(){ return 0; },

    /* STROKE WIDTH */
    strokeWidth: function(){
        var strokeWidth = this.baseStrokeWidth();
        if(this.scene.anyInteraction()) {
            strokeWidth = this.interactiveStrokeWidth(strokeWidth);
        } else {
            strokeWidth = this.normalStrokeWidth(strokeWidth);
        }
        
        return strokeWidth;
    },
    
    baseStrokeWidth: function(){
        /* Delegate to possible lineWidth extension or default to 1.5 */
        return this.delegate(1.5);
    },

    normalStrokeWidth: function(strokeWidth){
        return strokeWidth;
    },

    interactiveStrokeWidth: function(strokeWidth){
        if(this.isActiveSeriesAware && this.scene.isActiveSeries()){
            /* - Ensure a normal width of at least 1,
             * - Double and a half that
             */
            return Math.max(1, strokeWidth) * 2.5;
        }

        return strokeWidth;
    },
    
    /* STROKE COLOR */
    strokeColor: function(){ 
        return this.color('stroke');
    },
    
    /**
     * @override
     */
    interactiveColor: function(type, color){
        var scene = this.scene;
        if(scene.anySelected() && !scene.isSelected()) {
            
            if(this.isActiveSeriesAware && scene.isActiveSeries()) {
                //return color.darker(1.5);
                return pv.Color.names.darkgray.darker().darker();
            }
            
            if(type === 'stroke'){
                return this.dimColor(type, color);
            }
        }

        return this.base(type, color);
    }
});

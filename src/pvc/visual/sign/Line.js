
def.type('pvc.visual.Line', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){
    
    var pvMark = protoMark.add(pv.Line);
    
    this.base(panel, pvMark, keyArgs);
    
    this.lock('segmented', 'smart') // fixed
        .lock('antialias', true)
        ;

    if(!def.get(keyArgs, 'freePosition', false)){
        var basePosProp  = panel.isOrientationVertical() ? "left" : "bottom",
            orthoPosProp = panel.anchorOrtho(basePosProp);

        this/* Positions */
            ._lockDynamic(orthoPosProp, 'y')
            ._lockDynamic(basePosProp,  'x');
    }

    this/* Colors & Line */
        ._bindProperty('strokeStyle', 'strokeColor', 'color')
        ._bindProperty('lineWidth',   'strokeWidth')
        ;

    // Segmented lines use fill color instead of stroke...so this doesn't work.
    //this.pvMark.lineCap('square');
})
.prototype
.property('strokeWidth')
.constructor
.add({
    _addInteractive: function(keyArgs){
        keyArgs = def.setDefaults(keyArgs, 
                        'noTooltip',  true);
        
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
    defaultStrokeWidth: function(){
        return 1.5;
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
    /**
     * @override
     */
    interactiveColor: function(color, type){
        var scene = this.scene;
        if(this.showsSelection() && scene.anySelected() && !scene.isSelected()) {
            
            if(this.isActiveSeriesAware && scene.isActiveSeries()) {
                //return color.darker(1.5);
                return pv.Color.names.darkgray.darker().darker();
            }
            
            if(type === 'stroke'){
                return this.dimColor(color, type);
            }
        }

        return this.base(color, type);
    }
});

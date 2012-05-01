
def.type('pvc.visual.Line', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){
    
    var pvMark = protoMark.add(pv.Line);
    
    this.base(panel, pvMark, keyArgs);
    
    var options = this.chart.options;
    
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
})
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
    y: function(){ return 0; },
    x: function(){ return 0; },
    
    /* STROKE WIDTH */
    strokeWidth: function(){
        var strokeWidth = this.normalStrokeWidth();
        if(this.scene.anyInteraction()) {
            strokeWidth = this.interactiveStrokeWidth(strokeWidth);
        }
        
        return strokeWidth;
    },
    
    normalStrokeWidth: function(){
        /* Delegate to possible lineWidth extension or default to 1.5 */
        return this.delegate(1.5);
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
            
            switch(type) {
                case 'stroke':
                    return pvc.toGrayScale(color);
            }
        }

        return this.base(type, color);
    }
});

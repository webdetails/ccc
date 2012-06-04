
def.type('pvc.visual.Dot', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){
    
    var pvMark = protoMark.add(pv.Dot);
    
    this.base(panel, pvMark, keyArgs);
    
    if(!def.get(keyArgs, 'freePosition', false)){
        var basePosProp  = panel.isOrientationVertical() ? "left" : "bottom",
            orthoPosProp = panel.anchorOrtho(basePosProp);
        
        this/* Positions */
            .lock(orthoPosProp, 'y')
            .lock(basePosProp,  'x');
    }
       
    this/* Shape & Size */
        .intercept('shape',       'shape' )
        .intercept('shapeRadius', 'radius')
        .intercept('shapeSize',   'size'  )
        
        /* Colors & Line */
        .optionalValue('strokeDasharray', null) // Break inheritance
        .optionalValue('lineWidth',       1.5)  // idem
        
        .intercept('fillStyle',   'fillColor'  )
        .intercept('strokeStyle', 'strokeColor')
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
    
    shape: function(){ 
        return this.delegate(); 
    },
    
    radius: function(){
        // Store extended value, if any
        // See #sizeCore
        this.state.radius = this.delegate();
    },
    
    /* SIZE */
    size: function(){
        var size = this.baseSize();
        if(this.scene.anyInteraction()) {
            size = this.interactiveSize(size);
        } else {
            size = this.normalSize(size);
        }
        
        return size;
    },
    
    baseSize: function(){
        /* Radius was specified? */
        var radius = this.state.radius;
        if(radius != null) {
            return radius * radius;
        }
        
        /* Delegate to possible Size extension or default to 12 */
        return this.delegate(12);
    },

    normalSize: function(size){
        return size;
    },

    interactiveSize: function(size){
        if(this.scene.isActive){
            return Math.max(size, 5) * 2.5;
        }
        
        return size;
    },
    
    /* COLOR */
    
    fillColor: function(){ 
        return this.color('fill');
    },
    
    strokeColor: function(){ 
        return this.color('stroke');
    },
    
    /**
     * @override
     */
    interactiveColor: function(type, color){
        var scene = this.scene;
        if(scene.isActive) {
            if(type === 'stroke') {
                return color.brighter(1);
            }
        } else if(scene.anySelected() && !scene.isSelected()) {
            
            if(this.isActiveSeriesAware && scene.isActiveSeries()) {
                //return color.darker(1.5);
                return pv.Color.names.darkgray.darker().darker();
            }
            
            switch(type) {
                case 'fill':
                case 'stroke':
                    return this.dimColor(type, color);
            }
        }

        return this.base(type, color);
    }
});

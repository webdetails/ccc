
def.type('pvc.visual.Dot', pvc.visual.Sign)
.init(function(panel, parentMark, keyArgs){
    
    var pvMark = parentMark.add(pv.Dot);
    
    var protoMark = def.get(keyArgs, 'proto');
    if(protoMark){
        pvMark.extend(protoMark);
    }
    
    keyArgs = def.setDefaults(keyArgs, 'freeColor', false);
    
    this.base(panel, pvMark, keyArgs);
    
    if(!def.get(keyArgs, 'freePosition', false)){
        var basePosProp  = panel.isOrientationVertical() ? "left" : "bottom",
            orthoPosProp = panel.anchorOrtho(basePosProp);
        
        this/* Positions */
            ._lockDynamic(orthoPosProp, 'y')
            ._lockDynamic(basePosProp,  'x');
    }
       
    this/* Shape & Size */
        ._bindProperty('shape',       'shape' )
        ._bindProperty('shapeRadius', 'radius')
        ._bindProperty('shapeSize',   'size'  )
        
        /* Colors & Line */
        .optional('strokeDasharray', undefined) // Break inheritance
        .optional('lineWidth',       1.5)       // Idem
        ;
})
.prototype
.property('size')
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
    y: function(){ return 0; },
    x: function(){ return 0; },
    
    shape: function(){ 
        return this.delegateExtension(); 
    },
    
    radius: function(){
        // Store extended value, if any
        // See #sizeCore
        this.state.radius = this.delegateExtension();
    },
    
    /* SIZE */
    baseSize: function(){
        /* Radius was specified? */
        var radius = this.state.radius;
        if(radius != null) {
            return radius * radius;
        }
      
        return this.base();
    },

    defaultSize: function(){
        return 12;
    },
    
    interactiveSize: function(size){
        if(this.scene.isActive){
            return Math.max(size, 5) * 2.5;
        }
        
        return size;
    },
    
    /* COLOR */
    
    /**
     * @override
     */
    interactiveColor: function(color, type){
        var scene = this.scene;
        if(scene.isActive) {
            if(type === 'stroke') {
                return color.brighter(1);
            }
        } else if(this.showsSelection() && scene.anySelected() && !scene.isSelected()) {
            
            if(this.isActiveSeriesAware && scene.isActiveSeries()) {
                //return color.darker(1.5);
                return color.alpha(0.8);
//                switch(type){
//                  case 'fill':   return pv.Color.names.darkgray.darker().darker();
//                  case 'stroke': return color;
//                }
            } else {
                switch(type) {
                    case 'fill':   return this.dimColor(color, type);
                    case 'stroke': return color.alpha(0.45);
                }
            }
        }

        return this.base(color, type);
    }
});

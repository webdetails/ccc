
def.type('pvc.visual.Dot', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){
    
    var pvMark = protoMark.add(pv.Dot);
    
    this.base(panel, pvMark, keyArgs);
    
    var options = this.chart.options;
    
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
    
    if(options.showTooltips){
        panel._addPropTooltip(pvMark);
    }
    
    if(options.hoverable) {
        // Add hover-active behavior
        // Still requires the point behavior on some ascendant panel
        pvMark
            .event('point', function(scene){
                scene.setActive(true);
                
                if(!panel.topRoot.rubberBand) {
                    panel._renderInteractive();
                }
             })
            .event('unpoint', function(scene){
                if(scene.clearActive()) {
                    /* Something was active */
                    if(!panel.topRoot.rubberBand) {
                        panel._renderInteractive();
                    }
                }
            });
    }
    
    if (panel._shouldHandleClick()){
        panel._addPropClick(pvMark);
    }
    
    if(options.doubleClickAction) {
        panel._addPropDoubleClick(pvMark);
    }
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
        var size = this.normalSize();
        if(this.scene.anyInteraction()) {
            size = this.interactiveSize(size);
        }
        
        return size;
    },
    
    normalSize: function(){
        /* Radius was specified? */
        var radius = this.state.radius;
        if(radius != null) {
            return radius * radius;
        }
        
        /* Delegate to possible Size extension or default to 12 */
        return this.delegate(12);
    },
    
    interactiveSize: function(size){
        if(this.scene.isActive){
            /* - Ensure a normal size of at least 12,
             * - Double that 
             */
            return Math.max(size, 12) * 2;
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
            switch(type) {
                case 'stroke': return color.brighter(1);
            }
        } else if(scene.anySelected() && !scene.isSelected()) {
            
            if(this.isActiveSeriesAware && scene.isActiveSeries()) {
                //return color.darker(1.5);
                return pv.Color.names.darkgray.darker().darker();
            }
            
            switch(type) {
                case 'fill':
                case 'stroke':
                    return pvc.toGrayScale(color);
            }
        }

        return this.base(type, color);
    }
});

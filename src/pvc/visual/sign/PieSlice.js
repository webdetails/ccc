

pv.PieSlice = function(){
    pv.Wedge.call(this);
};

pv.PieSlice.prototype = pv.extend(pv.Wedge);

// There's already a Wedge#midAngle method
// but it doesn't work well when end-angle isn't explicitly set,
// so we override the method.
pv.PieSlice.prototype.midAngle = function(){
    var instance = this.instance();
    return instance.startAngle + (instance.angle / 2);
};
    

def.type('pvc.visual.PieSlice', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){

    var pvMark = protoMark.add(pv.PieSlice);
    
    keyArgs = def.setDefaults(keyArgs, 'freeColor', false);
    
    this.base(panel, pvMark, keyArgs);
    
    this._activeOffsetRadius = def.get(keyArgs, 'activeOffsetRadius', 0);
    this._center = def.get(keyArgs, 'center');
    
    this/* Colors */
        .optional('lineWidth',  0.6)
        ._bindProperty('angle', 'angle')
        ._lockDynamic('bottom', 'y')
        ._lockDynamic('left',   'x')
        .lock('top',   null)
        .lock('right', null)
        ;
})
.prototype
.property('offsetRadius')
.constructor
.add({
    // Ensures that it is evaluated before x and y
    angle: function(){
        return 0;
    },
    
    x: function(){
        return this._center.x + this._offsetSlice('cos'); 
    },
    
    y: function(){ 
        return this._center.y - this._offsetSlice('sin'); 
    },
    
    // ~ midAngle -> (endAngle + startAngle) / 2
    _offsetSlice: function(fun) {
        var offset = this._getOffsetRadius();
        if(offset !== 0){
            offset = offset * Math[fun](this.pvMark.midAngle());
        }
            
        return offset;
    },
    
    // Get and cache offsetRadius 
    _getOffsetRadius: function(){
        var offset = this.state.offsetRadius;
        if(offset == null){
            offset = (this.state.offsetRadius = this.offsetRadius() || 0);
        }
        
        return offset;
    },
    
    /* COLOR */
    
    /**
     * @override
     */
    defaultColor: function(type){
        if(type === 'stroke'){
            return null;
        }
        
        return this.base(type);
    },
    
    /**
     * @override
     */
    interactiveColor: function(color, type){
        var scene = this.scene;
        if(scene.isActive) {
            switch(type) {
                // Like the bar chart
                case 'fill':   return color.brighter(0.2).alpha(0.8);
                case 'stroke': return color.brighter(1.3).alpha(0.7);
            }
        } else if(this.showsSelection() && scene.anySelected() && !scene.isSelected()) {
            //case 'stroke': // ANALYZER requirements, so until there's no way to configure it...
            if(type === 'fill') {
                return this.dimColor(color, type);
            }
        }

        return this.base(color, type);
    },
    
    /* Offset */
    baseOffsetRadius: function(){
        // There's no extension point for this
        return 0;
    },

    interactiveOffsetRadius: function(offsetRadius){
        if(this.scene.isActive){
            return offsetRadius + this._activeOffsetRadius;
        }

        return offsetRadius;
    }
});

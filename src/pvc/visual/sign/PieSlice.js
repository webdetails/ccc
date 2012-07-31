

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
    
    this.base(panel, pvMark, keyArgs);
    
    //this._normalRadius         = def.get(keyArgs, 'normalRadius',  10);
    this._activeOffsetRadius = def.get(keyArgs, 'activeOffsetRadius', 0);
    this._center = def.get(keyArgs, 'center');
    
    this/* Colors */
        .intercept('fillStyle',     'fillColor'  )
        .intercept('strokeStyle',   'strokeColor')
        .optionalValue('lineWidth',  0.6)
        .intercept('angle', 'angle')
        .lock('bottom', 'y')
        .lock('left',   'x')
        .lockValue('top',   null)
        .lockValue('right', null)
        ;
})
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
    
    _offsetSlice: function(fun) {
        var offset = this._getOffsetRadius();
        if(offset !== 0){
            offset = offset * Math[fun](this.pvMark.midAngle());
        }
            
        return offset;
    },
    
    _getOffsetRadius: function(){
        var offset = this.state.offsetRadius;
        if(offset == null){
            offset = (this.state.offsetRadius = this.offsetRadius() || 0);
        }
        
        return offset;
    },
    
    /* COLOR */
    fillColor:   function(){ return this.color('fill');   },
    strokeColor: function(){ return this.color('stroke'); },
    
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
    interactiveColor: function(type, color){
        var scene = this.scene;
        if(scene.isActive) {
            switch(type) {
                // Like the bar chart
                case 'fill':   return color.brighter(0.2).alpha(0.8);
                case 'stroke': return color.brighter(1.3).alpha(0.7);
            }
        } else if(scene.anySelected() && !scene.isSelected()) {
            switch(type) {
                case 'fill':
                //case 'stroke': // ANALYZER requirements, so until there's no way to configure it...
                    return this.dimColor(type, color);
            }
        }

        return this.base(type, color);
    },
    
    /* Offset */
    offsetRadius: function(){
        var offsetRadius = this.baseOffsetRadius();
        if(this.scene.anyInteraction()) {
            offsetRadius = this.interactiveOffsetRadius(offsetRadius);
        } else {
            offsetRadius = this.normalOffsetRadius(offsetRadius);
        }
        
        return offsetRadius;
    },
    
    baseOffsetRadius: function(){
        return 0;
    },

    normalOffsetRadius: function(offsetRadius){
        return offsetRadius;
    },
    
    interactiveOffsetRadius: function(offsetRadius){
        if(this.scene.isActive){
            return offsetRadius + this._activeOffsetRadius;
        }

        return offsetRadius;
    }
});

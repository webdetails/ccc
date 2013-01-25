
def.type('pvc.visual.Bar', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){

    var pvMark = protoMark.add(pv.Bar);
    
    keyArgs = def.setDefaults(keyArgs, 'freeColor', false);
    
    this.base(panel, pvMark, keyArgs);

    this.normalStroke = def.get(keyArgs, 'normalStroke', false);

    this._bindProperty('lineWidth',  'strokeWidth');
})
.prototype
.property('strokeWidth')
.constructor
.add({
    /* COLOR */
    /**
     * @override
     */
    normalColor: function(color, type){
        if(type === 'stroke' && !this.normalStroke){
            return null;
        }

        return color;
    },

    /**
     * @override
     */
    interactiveColor: function(color, type){
        var scene = this.scene;
        
        if(type === 'stroke'){
            if(scene.isActive){
               return color.brighter(1.3).alpha(0.7);
            }
            
            if(!this.normalStroke){
                return null;
            }

            if(this.showsSelection() && scene.anySelected() && !scene.isSelected()) {
                if(this.isActiveSeriesAware && scene.isActiveSeries()) {
                    return pv.Color.names.darkgray.darker().darker();
                }
                
                return this.dimColor(color, type);
                
            }
            
            if(this.isActiveSeriesAware && scene.isActiveSeries()){
                return color.brighter(1).alpha(0.7);
            }

        } else if(type === 'fill'){
            if(scene.isActive) {
                return color.brighter(0.2).alpha(0.8);
            } 

            if(this.showsSelection() && scene.anySelected() && !scene.isSelected()) {
                if(this.isActiveSeriesAware && scene.isActiveSeries()) {
                    return pv.Color.names.darkgray.darker(2).alpha(0.8);
                }
                
                return this.dimColor(color, type);
            }
            
            if(this.isActiveSeriesAware && scene.isActiveSeries()){
                return color.brighter(0.2).alpha(0.8);
            }
        }

        return this.base(color, type);
    },

    /* STROKE WIDTH */    
    defaultStrokeWidth: function(){
        return 0.5;
    },

    interactiveStrokeWidth: function(strokeWidth){
        if(this.scene.isActive){
            return Math.max(1, strokeWidth) * 1.3;
        }

        return strokeWidth;
    }
});

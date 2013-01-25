
def.type('pvc.visual.Rule', pvc.visual.Sign)
.init(function(panel, parentMark, keyArgs){

    var pvMark = parentMark.add(pv.Rule);
    
    var protoMark = def.get(keyArgs, 'proto');
    if(protoMark){
        pvMark.extend(protoMark);
        //pvMark.duckExtension(protoMark, pvc.extensionTag);
    }
    
    this.base(panel, pvMark, keyArgs);
    
    if(!def.get(keyArgs, 'freeStyle')){
        this/* Colors & Line */
            ._bindProperty('strokeStyle', 'strokeColor', 'color')
            ._bindProperty('lineWidth',   'strokeWidth')
            ;
    }
})
.prototype
.property('strokeWidth')
.constructor
.add({
    _addInteractive: function(keyArgs){
        keyArgs = def.setDefaults(keyArgs,
                        'noHover',       true,
                        'noSelect',      true,
                        'noTooltip',     true,
                        'noClick',       true,
                        'noDoubleClick', true);

        this.base(keyArgs);
    },

    /* STROKE WIDTH */
    defaultStrokeWidth: function(){
        return 1;
    },

    interactiveStrokeWidth: function(strokeWidth){
        if(this.scene.isActive){
            return Math.max(1, strokeWidth) * 2.2;
        }

        return strokeWidth;
    },

    /* STROKE COLOR */
    interactiveColor: function(color, type){
        var scene = this.scene;
        
        if(!scene.isActive && this.showsSelection() && scene.anySelected() && scene.datum && !scene.isSelected()) {
            return this.dimColor(color, type);
        }
        
        return this.base(color, type);
    }
});

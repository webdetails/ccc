
def.type('pvc.visual.Rule', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){

    var pvMark = protoMark.add(pv.Rule);
    
    protoMark = def.get(keyArgs, 'proto');
    if(protoMark){
        pvMark.extend(protoMark);
    }
    
    this.base(panel, pvMark, keyArgs);

    this/* Colors & Line */
        ._interceptDynamic('strokeStyle', 'strokeColor')
        ._interceptDynamic('lineWidth',   'strokeWidth')
        ;
})
.add({
    _addInteractive: function(keyArgs){
        keyArgs = def.setDefaults(keyArgs,
                        'noHover',       true,
                        'noSelect',      true,
                        'noTooltips',    true,
                        'noClick',       true,
                        'noDoubleClick', true);

        this.base(keyArgs);
    },

    /* STROKE WIDTH */
    strokeWidth: function(){
        var strokeWidth = this.baseStrokeWidth();
        if(this.showsInteraction() && this.scene.anyInteraction()) {
            strokeWidth = this.interactiveStrokeWidth(strokeWidth);
        } else {
            strokeWidth = this.normalStrokeWidth(strokeWidth);
        }

        return strokeWidth;
    },

    baseStrokeWidth: function(){
        var value = this.delegateExtension();
        if(value === undefined){
            value = this.defaultStrokeWidth();
        }

        return value;
    },

    defaultStrokeWidth: function(){
        return 1;
    },
    
    normalStrokeWidth: function(strokeWidth){
        return strokeWidth;
    },

    interactiveStrokeWidth: function(strokeWidth){
        if(this.scene.isActive){
            return Math.max(1, strokeWidth) * 2.2;
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
        
        if(!scene.isActive && scene.anySelected() && scene.datum && !scene.isSelected()) {
            return this.dimColor(type, color);
        }
        
        return this.base(type, color);
    }
});

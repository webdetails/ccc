
def.type('pvc.visual.Rule', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){

    var pvMark = protoMark.add(pv.Rule);

    this.base(panel, pvMark, keyArgs);

    this/* Colors & Line */
        .intercept('strokeStyle', 'strokeColor')
        .intercept('lineWidth',   'strokeWidth')
        ;
})
.add({
    _addInteractive: function(keyArgs){
        keyArgs = def.setDefaults(keyArgs,
                        'noHoverable', true,
                        'noTooltips',  true);

        this.base(keyArgs);
    },

    /* STROKE WIDTH */
    strokeWidth: function(){
        var strokeWidth = this.baseStrokeWidth();
        if(this.scene.anyInteraction()) {
            strokeWidth = this.interactiveStrokeWidth(strokeWidth);
        } else {
            strokeWidth = this.normalStrokeWidth(strokeWidth);
        }

        return strokeWidth;
    },

    baseStrokeWidth: function(){
        /* Delegate to possible lineWidth extension or default to 1.5 */
        return this.delegate(1);
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
        
        if(!scene.isActive && scene.anySelected() && !scene.isSelected()) {
            return this.dimColor(type, color);
        }
        
        return this.base(type, color);
    }
});

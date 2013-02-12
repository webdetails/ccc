
def
.type('pvc.visual.ValueLabel', pvc.visual.Label)
.init(function(panel, anchorMark, keyArgs){
    var protoMark = anchorMark.anchor(panel.valuesAnchor);

    if(keyArgs && keyArgs.extensionId == null){
        keyArgs.extensionId = 'label';
    }

    this.base(panel, protoMark, keyArgs);

    var valuesMask = panel.valuesMask;
    this.pvMark
        .font(panel.valuesFont)
        .text(function(scene){ return scene.format(valuesMask); });

    this.intercept('textStyle', function(){
        delete this._finished;
        var style = this.delegate();
        if(style &&
           !this.hasOwnProperty('_finished') &&
           !this.mayShowActive() &&
           this.mayShowNotAmongSelected()){
            style = this.dimColor(style, 'text');
        }

        return style;
    });
})
.addStatic({
    maybeCreate: function(panel, anchorMark, keyArgs){
        return panel.valuesVisible && panel.valuesMask ?
               new pvc.visual.ValueLabel(panel, anchorMark, keyArgs) :
               null;
    },

    isNeeded: function(panel){
        return panel.valuesVisible && panel.valuesMask;
    }
})
.add({
    _addInteractive: function(keyArgs){
        keyArgs = def.setDefaults(keyArgs, 
            'showsInteraction', true,
            'noSelect', false);
        
        this.base(keyArgs);
    }
});
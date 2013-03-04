
def
.type('pvc.visual.ValueLabel', pvc.visual.Label)
.init(function(panel, anchorMark, keyArgs){
    
    var protoMark;
    if(!def.get(keyArgs, 'noAnchor', false)){
        protoMark = anchorMark.anchor(panel.valuesAnchor);
    } else {
        protoMark = anchorMark;
    }
    

    if(keyArgs && keyArgs.extensionId == null){
        keyArgs.extensionId = 'label';
    }

    this.base(panel, protoMark, keyArgs);

    this._bindProperty('text', 'text');
    
    this.pvMark.font(panel.valuesFont);

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
.prototype
.property('text')
.constructor
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
            'noSelect',      false,
            'noTooltip',     false,
            'noClick',       false,
            'noDoubleClick', false,
            'noHover',       false);
        
        this.base(keyArgs);
    },
    
    defaultText: function(){
        return this.scene.format(this.panel.valuesMask); 
    },
    
    normalText: function(text){ 
        return this.trimText(text); 
    },
    
    interactiveText: function(text){ 
        return this.showsActivity() && this.scene.isActive ? 
               text : 
               this.trimText(text); 
    },
    
    trimText: function(text) {
        return text;
    }
});

def.type('pvc.visual.Label', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){

    var pvMark = protoMark.add(pv.Label);

    this.base(panel, pvMark, keyArgs);
})
.add({
    _addInteractive: function(keyArgs){
        keyArgs = def.setDefaults(keyArgs,
                        'noSelect',      true,
                        'noHover',       true,
                        'noTooltip',    true,
                        'noClick',       true,
                        'noDoubleClick', true);

        this.base(keyArgs);
    },
    
    defaultColor: function(type){
        return pv.Color.names.black;
    }
});
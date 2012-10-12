
def.type('pvc.visual.Panel', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){
    var pvPanel = def.get(keyArgs, 'panel');
    if(!pvPanel){
        var pvPanelType = def.get(keyArgs, 'panelType') || pv.Panel;
        
        pvPanel = protoMark.add(pvPanelType);
    }
    
    this.base(panel, pvPanel, keyArgs);
})
.add({
    _addInteractive: function(keyArgs){
        var t = true;
        keyArgs = def.setDefaults(keyArgs,
                        'noSelect',      t,
                        'noHover',       t,
                        'noTooltip',     t,
                        'noClick',       t,
                        'noDoubleClick', t);

        this.base(keyArgs);
    }
});
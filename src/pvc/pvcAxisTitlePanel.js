
def
.type('pvc.AxisTitlePanel', pvc.TitlePanelAbstract)
.init(function(chart, parent, axis, options) {
    
    this.axis = axis;
    
    this.base(chart, parent, options);
})
.add({
    
    panelName: 'axis',
    
    _calcLayout: function(layoutInfo){
        var scale = this.axis.scale;
        if(!scale || scale.isNull){
            return new pvc.Size(0, 0);
        }
        
        return this.base(layoutInfo);
    },
    
    _createCore: function(layoutInfo){
        var scale = this.axis.scale;
        if(!scale || scale.isNull){
            return;
        }
        
        return this.base(layoutInfo);
    },
    
    _getExtensionPrefix: function(){
        return this.panelName + def.firstUpperCase(this.base());
    }
});

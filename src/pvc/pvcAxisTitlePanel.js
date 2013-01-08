
def
.type('pvc.AxisTitlePanel', pvc.TitlePanelAbstract)
.init(function(chart, parent, axis, options) {
    
    this.axis = axis;
    
    this.base(chart, parent, options);
    
    this._extensionPrefix = 
        axis
        .extensionPrefixes
        .map(function(prefix){
            return prefix + 'Title';
        });
})
.add({
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
    }
});

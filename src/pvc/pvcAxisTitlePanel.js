
pvc.AxisTitlePanel = pvc.TitlePanel.extend({
    
    panelName: 'axis',
    
    titleSize: undefined,
    font: "12px sans-serif",
    
    _getFontExtension: function(){
        return this._getExtension(this.panelName + 'TitleLabel', 'font');
    },
    
    /**
     * @override
     */
    applyExtensions: function(){
        this.extend(this.pvPanel, this.panelName + 'Title_');
        this.extend(this.pvLabel, this.panelName + 'TitleLabel_');
    }
});

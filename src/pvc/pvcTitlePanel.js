
def
.type('pvc.TitlePanel', pvc.TitlePanelAbstract)
.init(function(chart, parent, options){
    
    if(!options){
        options = {};
    }
    
    var isV1Compat = chart.compatVersion() <= 1;
    if(isV1Compat){
        var size = options.titleSize;
        if(size == null){
            options.titleSize = 25;
        }
    }
    
    this.base(chart, parent, options);
    
    this._extensionPrefix = !chart.parent ? "title" : "smallTitle";
})
.add({

    font: "14px sans-serif",
    
    defaultPaddings: 4
});
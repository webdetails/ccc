
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
})
.add({

    font: "14px sans-serif",
    
    defaultPaddings: 4,
    
    _getExtensionPrefix: function(){
        return !this.chart.parent ? "title" : "smallTitle";
    }
});
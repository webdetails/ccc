
pvc.TitlePanel = pvc.TitlePanelAbstract.extend({

    font: "14px sans-serif",
    
    defaultPaddings: 4,
    
    constructor: function(chart, parent, options){
        
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
    }
});
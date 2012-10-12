
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
    },
    
    _getExtensionPrefix: function(){
        var basePrefix = this.base();
        
        var extensionIds = [basePrefix];
        
        // The multi-chart root has an additional extension point
        if(this.root.isMultiChartRoot()){
            extensionIds.push('multiChart' + def.firstUpperCase(basePrefix));
        }
        
        return extensionIds;
    }
});

pvc.MultiChartPanel = pvc.BasePanel.extend({
    anchor: 'fill',
    
    /**
     * Implements multi-chart layout.
     * Currently, it's essentially a flow-layout
     * 
     * @override
     */
    _calcLayout: function(availableSize, layoutInfo){
        
        this.setSize(availableSize);
        var chart = this.chart;
        var data = chart.visualRoleData('multiChartColumn', {visible: true}),
            options = chart.options;
        
        // TODO: reuse/dispose sub-charts
        
        // multiChartLimit can be Infinity
        var multiChartLimit = Number(options.multiChartLimit);
        if(isNaN(multiChartLimit) || multiChartLimit < 1) {
            multiChartLimit = Infinity;
        }
        
        var leafCount = data._leafs.length,
            count     = Math.min(leafCount, multiChartLimit);
        
        if(count === 0) {
            // TODO: show any message?
            return;
        }
        
        // multiChartWrapColumn can be Infinity
        var multiChartWrapColumn = Number(options.multiChartWrapColumn);
        if(isNaN(multiChartWrapColumn) || multiChartLimit < 1) {
            multiChartWrapColumn = 3;
        }
        
        var colCount   = Math.min(count, multiChartWrapColumn),
            rowCount   = Math.ceil(count / colCount),
            childClass = chart.constructor,
            margins    = this.margins,
            left       = margins.left,
            top        = margins.top,
            availWidth = availableSize.width  - left - margins.right,
            availHeight= availableSize.height - top  - margins.bottom,
            width      = availWidth  / colCount,
            height     = availHeight / rowCount;
        
        for(var index = 0 ; index < count ; index++) {
            var childData = data._leafs[index],
                childOptions = def.create(options, {
                    parent:     chart,
                    title:      childData.absLabel,
                    legend:     false,
                    dataEngine: childData,
                    width:      width,
                    height:     height,
                    left:       left + ((index % colCount) * width),
                    top:        top  + (Math.floor(index / colCount) * height),
                    margins:    {all: 5},
                    extensionPoints: {
                        // This lets the main bg color show through AND
                        // allows charts to overflow to other charts without that being covered
                        // Notably, axes values tend to overflow a little bit.
                        // Also setting to null, instead of transparent, for example
                        // allows the rubber band to set its "special transparent" color
                        base_fillStyle: null
                    }
                });
            
            var childChart = new childClass(childOptions);
            childChart._preRender();
            childChart.basePanel.layout();
        }
    }
});


pvc.MultiChartPanel = pvc.BasePanel.extend({
    anchor: 'fill',
    
    /**
     * Implements multi-chart layout.
     * Currently, it's essentially a flow-layout
     * 
     * @override
     */
    _calcLayout: function(availableSize, layoutInfo){
        
        var chart = this.chart;
        var data  = chart.visualRoles('multiChartColumn')
                         .flatten(chart.data, {visible: true});
        var options = chart.options;
        
        // TODO: reuse/dispose sub-charts
        
        // multiChartLimit can be Infinity
        var multiChartLimit = Number(options.multiChartLimit);
        if(isNaN(multiChartLimit) || multiChartLimit < 1) {
            multiChartLimit = Infinity;
        }
        
        var leafCount = data._children.length;
        var count = Math.min(leafCount, multiChartLimit);
        if(count === 0) {
            // Shows no message to the user.
            // An empty chart, like when all series are hidden with the legend.
            return;
        }
        
        // multiChartWrapColumn can be Infinity
        var multiChartWrapColumn = Number(options.multiChartWrapColumn);
        if(isNaN(multiChartWrapColumn) || multiChartLimit < 1) {
            multiChartWrapColumn = 3;
        }
        
        var colCount = Math.min(count, multiChartWrapColumn);
        var rowCount = Math.ceil(count / colCount);
        
        // ----------------------
        // Small Chart Size determination
        
        var margins    = this.margins;
        var marginLeft = margins.left;
        var marginTop  = margins.top;
        
        var availWidth  = availableSize.width  - marginLeft - margins.right;
        var availHeight = availableSize.height - marginTop  - margins.bottom;
        
        // Evenly divide available width and height by all small charts 
        var width  = availWidth  / colCount;
        var height = availHeight / rowCount;
        
        // Determine min width and min height
        var minWidth = Number(options.multiChartMinWidth);
        if(isNaN(minWidth) || !isFinite(minWidth) || minWidth < 0) {
            // Assume the available width is dimensioned to fit the specified number of columns
            if(isFinite(multiChartWrapColumn)){
                minWidth = width;
            }
        }
        
        var minHeight = Number(options.multiChartMinHeight);
        if(isNaN(minHeight) || !isFinite(minHeight) || minHeight < 0) {
            if(minWidth > 0){
                minHeight = minWidth / pvc.goldenRatio;
            } else {
                minHeight = null;
            }
        }
        
        if(minWidth == null && minHeight > 0){
            minWidth = pvc.goldenRatio * minHeight;
        }
        
        // ----------------------
        
        if(minWidth > 0 && width < minWidth){
            width = minWidth;
            availableSize.width = availWidth = width * colCount;
        }
        
        if(minHeight > 0 && height < minHeight){
            height = minHeight;
            availableSize.height = availHeight = height * rowCount;
        }
        
        // Consume space
        this.setSize(availableSize);
        
        // ----------------------
        // Create and layout small charts
        var ChildClass = chart.constructor;
        for(var index = 0 ; index < count ; index++) {
            var childData = data._children[index],
                childOptions = def.create(options, {
                    parent:     chart,
                    title:      childData.absLabel,
                    legend:     false,
                    data:       childData,
                    width:      width,
                    height:     height,
                    left:       marginLeft + ((index % colCount) * width),
                    top:        marginTop  + (Math.floor(index / colCount) * height),
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
            
            var childChart = new ChildClass(childOptions);
            childChart._preRender();
            childChart.basePanel.layout();
        }
    }
});

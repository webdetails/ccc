
pvc.MultiChartPanel = pvc.BasePanel.extend({
    anchor: 'fill',
    
    /**
     * Implements multi-chart layout.
     * Currently, it's essentially a flow-layout
     * 
     * @override
     */
    _calcLayout: function(layoutInfo){
        var clientSize = def.copyOwn(layoutInfo.clientSize);
        var chart = this.chart;
        var data  = chart.visualRoles('multiChartColumn')
                         .flatten(chart.data, {visible: true});
        
        var options = chart.options;
        
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
        
        // Evenly divide available width and height by all small charts 
        var width  = clientSize.width  / colCount;
        var height = clientSize.height / rowCount;
        
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
                minHeight = this._calulateHeight(minWidth);
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
            clientSize.width = width * colCount;
        }
        
        if(minHeight > 0 && height < minHeight){
            height = minHeight;
            clientSize.height = height * rowCount;
        }
        
        def.set(
           layoutInfo, 
            'data',  data,
            'count', count,
            'width',  width,
            'height', height,
            'colCount',  colCount);
        
        return clientSize;
    },
    
    _calulateHeight: function(totalWidth){
        var chart = this.chart;
        
        if(chart instanceof pvc.PieChart){
            // These are square bounded
            return totalWidth;
        }
        
        var options = chart.options;
        var chromeHeight = 0;
        var chromeWidth  = 0;
        
        // Try to estimate "chrome" of small chart
        if(chart instanceof pvc.CartesianAbstract){
            var isVertical = chart.isOrientationVertical();
            var size;
            if(options.showXScale){
                size = parseFloat(options.xAxisSize || 
                                  (isVertical ? options.baseAxisSize : options.orthoAxisSize) ||
                                  options.axisSize);
                if(isNaN(size)){
                    size = totalWidth * 0.1;
                }
                
                if(isVertical){
                    chromeHeight += size;
                } else {
                    chromeWidth += size;
                }
            }
            
            if(options.showYScale){
                size = parseFloat(options.yAxisSize || 
                                  (isVertical ? options.orthoAxisSize : options.baseAxisSize) ||
                                  options.axisSize);
                if(isNaN(size)){
                    size = totalWidth * 0.1;
                }
                
                if(isVertical){
                    chromeWidth += size;
                } else {
                    chromeHeight += size;
                }
            }
        }
        
        var contentWidth  = Math.max(totalWidth - chromeWidth, 10);
        var contentHeight = contentWidth / pvc.goldenRatio;
        
        return  chromeHeight + contentHeight;
    },
    
    _createCore: function(li){
        if(!li.data){
            // Empty
            return;
        }
        
        var chart = this.chart;
        var options = chart.options;
        
        // ----------------------
        // Create and layout small charts
        var ChildClass = chart.constructor;
        for(var index = 0 ; index < li.count ; index++) {
            var childData = li.data._children[index];
            
            var childOptions = def.create(options, {
                    parent:     chart,
                    title:      childData.absLabel,
                    legend:     false,
                    data:       childData,
                    width:      li.width,
                    height:     li.height,
                    left:       (index % li.colCount) * li.width,
                    top:        Math.floor(index / li.colCount) * li.height,
                    margins:    {all: new pvc.PercentValue(0.02)},
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
        }
        
        this.base(li);
    }
});

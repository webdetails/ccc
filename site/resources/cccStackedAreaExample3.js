new pvc.StackedAreaChart({
    canvas: 'cccStackedAreaExample3',
    width:  600,
    height: 250,
    title:  "Huge Dataset Stacked Area Chart",
    legend:     true,
    timeSeries: true,
    axisGrid:   true,
    extensionPoints: {
        axisGrid_strokeStyle: 'lightgray'
    }
})  
.setData(crosstab_01)
.render();
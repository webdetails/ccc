new pvc.StackedAreaChart({
    canvas: 'cccStackedAreaExample3',
    width:  400,
    height: 220,
    title:  "Huge Dataset Stacked Area Chart",
    legend:     true,
    timeSeries: true,
    axisGrid:   true
})  
.setData(crosstab_01)
.render();
new pvc.StackedAreaChart({
    canvas: 'cccStackedAreaExample2',
    width:  600,
    height: 250,
    title:  "Time Series Stacked Area Chart",
    
    legend: true,
    legendPosition: 'right',

    nullInterpolationMode: 'linear',
    timeSeries:   true,
    linesVisible: true,
    dotsVisible:  true,
    selectable:   true,
    hoverable:    true,
    axisGrid:     true,

    extensionPoints: {
        dot_fillStyle: "white",
        axisGrid_strokeStyle: 'lightgray'
    }
})
.setData(relational_01, { crosstabMode: false })
.render();
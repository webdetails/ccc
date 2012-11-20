new pvc.StackedAreaChart({
    canvas: 'cccStackedAreaExample2',
    width:  400,
    height: 220,
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
        dot_fillStyle: "white"
    }
})
.setData(relational_01, { crosstabMode: false })
.render();
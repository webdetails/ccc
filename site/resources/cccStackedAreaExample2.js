new pvc.StackedAreaChart({
    canvas: 'cccStackedAreaExample2',
    width:  600,
    height: 250,

    // Data source
    crosstabMode: false,

    // Data
    timeSeries: true,

    // Main plot
    linesVisible: true,
    dotsVisible:  true,
    dot_fillStyle: "white",
    nullInterpolationMode: 'linear',

    // Cartesian axes
    axisGrid: true,
    axisGrid_strokeStyle: 'lightgray',

    // Panels
    title: "Time Series Stacked Area Chart",

    legend: true,
    legendPosition: 'right',

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(relational_01)
.render();
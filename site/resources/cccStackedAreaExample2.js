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
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 10px "Open Sans"',

    // Panels
    title: "Time Series Stacked Area Chart",
    titleFont: 'lighter 20px "Open Sans"',
    titleMargins: '0 0 5 0',

    legend: true,
    legendPosition: 'right',
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: ['#005CA7', '#FFC20F', '#333333']
})
.setData(relational_01)
.render();
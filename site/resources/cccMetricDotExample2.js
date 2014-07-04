new pvc.MetricLineChart({
    canvas: 'cccMetricDotExample2',
    width:  600,
    height: 350,

    // Main plot
    dotsVisible: true,

    // Cartesian axes
    axisGrid: true,
    axisOriginIsZero: true,
    axisGrid_strokeStyle: 'lightgray',

    // Panels
    legend: true,
    legendAlign: 'right',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(testLDot2)
.render();
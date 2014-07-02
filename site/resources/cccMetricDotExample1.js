new pvc.MetricLineChart({
    canvas: 'cccMetricDotExample1',
    width:  600,
    height: 350,

    // Panels
    legend: false,

    // Main plot
    dotsVisible: true,

    // Cartesian axes
    axisGrid: true,
    axisOriginIsZero: true,
    axisGrid_strokeStyle: 'lightgray',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(testLDot)
.render();

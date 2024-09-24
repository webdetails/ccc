new pvc.MetricLineChart({
    canvas:   'cccMetricDotExample3',
    width:    600,
    height:   350,
    orientation: 'horizontal',

    // Main plot
    line_interpolate: 'cardinal',

    // Cartesian axes
    axisGrid: true,
    axisOriginIsZero: true,
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 8px "Open Sans"',

    // Panels
    legend: true,
    legendAlign: 'right',
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: ['#005CA7', '#FFC20F']
})
.setData(testLDot2)
.render();
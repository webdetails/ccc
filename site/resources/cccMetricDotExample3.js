new pvc.MetricLineChart({
    canvas:   'cccMetricDotExample3',
    width:    400,
    height:   250,
    orientation: 'horizontal',
    legend:      true,
    legendAlign: 'right',
    animate:     false,
    axisGrid:    true,
    axisOriginIsZero: true,
    selectable:  true,
    hoverable:   true
})
.setData(testLDot2)
.render();
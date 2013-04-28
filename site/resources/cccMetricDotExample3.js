new pvc.MetricLineChart({
    canvas:   'cccMetricDotExample3',
    width:    600,
    height:   350,
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
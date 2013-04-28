new pvc.MetricLineChart({
    canvas:   'cccMetricDotExample2',
    width:    600,
    height:   350,
    legend:   true,
    legendAlign: 'right',
    animate:  false,
    axisGrid: true,
    axisOriginIsZero: true,
    dotsVisible: true,
    selectable:  true,
    hoverable:   true
})
.setData(testLDot2)
.render();
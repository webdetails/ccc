new pvc.MetricLineChart({
    canvas:   'cccMetricDotExample2',
    width:    400,
    height:   250,
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
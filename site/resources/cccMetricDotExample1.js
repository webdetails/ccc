new pvc.MetricLineChart({
    canvas:   'cccMetricDotExample1',
    width:    400,
    height:   250,
    legend:   false,
    animate:  false,
    axisGrid: true,
    axisOriginIsZero: true,
    dotsVisible: true,
    selectable:  true,
    hoverable:   true
})
.setData(testLDot)
.render();

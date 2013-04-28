new pvc.MetricLineChart({
    canvas:   'cccMetricDotExample1',
    width:    600,
    height:   350,
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

new pvc.MetricDotChart({
    canvas:      'cccMetricDotExample4',
    width:       400,
    height:      250,
    legend:      true,
    legendAlign: 'right',
    animate:     false,
    axisGrid:    true,
    axisOriginIsZero: true,
    selectable:  true,
    hoverable:   true,
    clickable:   true,
    clickAction: function(scene){
        alert(scene.format("{series}: ({x},{y})"));
    }
})
.setData(testLDot2)
.render();
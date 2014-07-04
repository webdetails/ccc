new pvc.MetricDotChart({
    canvas: 'cccMetricDotExample4',
    width:  600,
    height: 400,

    // Cartesian axes
    axisGrid: true,
    axisOriginIsZero: true,
    axisGrid_strokeStyle: 'lightgray',

    // Panels
    legend:      true,
    legendAlign: 'right',

    // Chart/Interaction
    animate:     false,
    selectable:  true,
    hoverable:   true,
    clickable:   true,
    clickAction: function(scene) {
        alert(scene.format("{series}: ({x},{y})"));
    }
})
.setData(testLDot2)
.render();
new pvc.MetricDotChart({
    canvas: 'cccMetricDotExample4',
    width:  600,
    height: 400,

    // Cartesian axes
    axisGrid: true,
    axisOriginIsZero: true,
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 8px "Open Sans"',

    // Panels
    legend:      true,
    legendAlign: 'right',
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:     false,
    selectable:  true,
    hoverable:   true,
    clickable:   true,
    clickAction: function(scene) {
        alert(scene.format("{series}: ({x},{y})"));
    },

    // Color axes
    colors: ['#005CA7', '#FFC20F']
})
.setData(testLDot2)
.render();
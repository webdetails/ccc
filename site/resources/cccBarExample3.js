new pvc.BarChart({
    canvas: 'cccBarExample3',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    valuesVisible: false,

    // Cartesian axes
    axisGrid:   true,
    axisOffset: 0.05,
    axisGrid_strokeStyle: 'lightgray',
    baseAxisLabel_textAngle:    -Math.PI/3,
    baseAxisLabel_textAlign:    'right',
    baseAxisLabel_textBaseline: 'top',

    // Panels
    legend: true,

    // Chart/Interaction
    animate:    true,
    selectable: true,
    hoverable:  true,
    tooltipClassName: 'light',
    tooltipOpacity: 1
})
.setData(relational_01_neg)
.render();
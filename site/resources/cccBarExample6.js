new pvc.BarChart({
    canvas: 'cccBarExample6',
    width:  600,
    height: 400,
    orientation: 'horizontal',

    // Data source
    crosstabMode: false,

    // Main plot
    stacked: true,
    valuesVisible: true,
    valuesMask: '{series}',
    valuesFont: '20px sans-serif',
    valuesOverflow: 'trim',
    valuesOptimizeLegibility: true,

    // Cartesian axes
    orthoAxisLabelSpacingMin: 6,

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,
    tooltipClassName: 'light',
    tooltipOpacity: 1
})
.setData(relational_01)
.render();
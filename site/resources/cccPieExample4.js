new pvc.PieChart({
    canvas: 'cccPieExample4',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    valuesVisible: true,
    valuesFont: 'lighter 11px "Open Sans"',
    explodedSliceRadius: '2%',
    slice_innerRadiusEx: '50%',

    // Panels
    legend: false,

    // Chart/Interaction
    selectable: true,
    hoverable:  true,
    tooltipClassName: 'light',

    // Color axes
    colors: [
        '#333333', '#777777', '#FFC20F', '#FFE085',
        '#005CA7', '#0086F4', '#39A74A', '#63CA73'
    ]
})
.setData(relational_03_b)
.render();
new pvc.PieChart({
    canvas: 'cccPieExample1',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main Plot
    valuesVisible: true,
    valuesLabelStyle: 'inside',
    valuesMask: "{category}",
    valuesOverflow: 'trim',
    valuesOptimizeLegibility: true,
    valuesFont: 'normal 11px "Open Sans"',
    slice_strokeStyle: 'white',

    // Color axes
    colors: [
        '#333333', '#777777', '#FFC20F', '#FFE085',
        '#005CA7', '#0086F4', '#39A74A', '#63CA73'
    ],

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_03_b)
.render();
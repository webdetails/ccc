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
    valuesFont: '25px sans-serif',
    valuesOverflow: 'trim',
    valuesOptimizeLegibility: true,
    slice_strokeStyle: 'white',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_03_b)
.render();
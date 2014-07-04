var pie = new pvc.PieChart({
    canvas:  'cccPieExample5',
    width:   600,
    height:  400,

    // Data source
    isMultiValued: true,
    dataMeasuresInColumns: true,

    // Visual roles
    visualRoles: {multiChart: 'category3', category: 'category2'},

    // Main Plot
    slice_strokeStyle: 'white',

    // Panels
    titleFont:      'bold 16px sans-serif',
    smallTitleFont: 'italic 14px sans-serif',

    legend: true,
    legendPosition: 'right',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(steelWheels02)
.render();
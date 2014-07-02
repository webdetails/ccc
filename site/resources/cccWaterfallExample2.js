new pvc.WaterfallChart({
    canvas:  'cccWaterfallExample2',
    width:   600,
    height:  400,

    // Data source
    readers: ['productType, accountType, accountSource, value'],

    // Visual roles
    visualRoles: {
        series:   'productType',
        category: 'accountType, accountSource'
    },

    // Main plot
    allCategoryLabel: "Profit",
    direction: 'up',
    areasVisible: true,
    valuesVisible: true,
    line_lineWidth: 2,

    // Cartesian axes
    baseAxisLabel_textAngle:    -Math.PI/3,
    baseAxisLabel_textAlign:    'right',
    baseAxisLabel_textBaseline: 'top',

    // Panels
    title:        "Balance Analysis",
    titleMargins: '3%',
    titleFont:    '16px sans-serif',

    legend: true,
    legendPosition: 'right',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(testWaterfallBalance)
.render();
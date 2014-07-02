new pvc.WaterfallChart({
    canvas: 'cccWaterfallExample1',
    width:  600,
    height: 700,

    // Data source
    readers: ['product, territory, region, market, sales'],

    // Visual Roles
    visualRoles: {
        series:   'product',
        category: 'territory, region, market',
        value:    'sales'
    },

    // Main plot
    direction:     'down',
    areasVisible:  true,
    valuesVisible: true,
    label_font: '8px sans-serif',
    line_lineWidth: 2,

    // Cartesian axes
    baseAxisLabel_textAngle:    -Math.PI/3,
    baseAxisLabel_textAlign:    'right',
    baseAxisLabel_textBaseline: 'top',

    // Panels
    legend: true,
    legendPosition: 'top',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(testWaterfall1)
.render();
new pvc.WaterfallChart({
    canvas: 'cccWaterfallExample1',
    width:  600,
    height: 700,

    // Data source
    readers: 'product, territory, region, market, sales',

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
    label_font: 'normal 8px "Open Sans"',
    lineLabel_font: 'lighter 10px "Open Sans"',
    valuesOptimizeLegibility: true,
    line_lineWidth: 2,

    // Cartesian axes
    baseAxisLabel_textAngle:    -Math.PI/3,
    baseAxisLabel_textAlign:    'right',
    baseAxisLabel_textBaseline: 'top',
    axisLabel_font: 'normal 9px "Open Sans"',

    // Panels
    legend: true,
    legendPosition: 'top',
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: ['#005CA7', '#FFC20F']
})
.setData(testWaterfall1)
.render();

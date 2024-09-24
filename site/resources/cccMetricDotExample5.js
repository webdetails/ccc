new pvc.MetricDotChart({
    canvas:         'cccMetricDotExample5',
    width:          600,
    height:         550,

    // Data source
    isMultiValued: true,
    dataMeasuresInColumns: true,
    readers:
        'productClass, productLine, product, territory, country, ' +
        'quantity, sales, expectedSales, previousSales',

    // Data
    ignoreNulls: false,

    // Visual Roles
    visualRoles: {
        // Chart's
        multiChart: 'territory, country',

        // Main plot's
        x:     'quantity',
        y:     'sales',
        color: 'expectedSales',
        size:  'previousSales'
    },

    multiChartMax: 9,

    // Cartesian axes
    axisOriginIsZero: false,
    axisGrid:         true,
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 8px "Open Sans"',

    // Panels
    title:          "Small Multiple Bubbles (Qty x Sales)",
    titleFont:      'lighter 20px "Open Sans"',
    titleMargins:   '0 0 10 0',
    smallTitleFont: 'lighter 14px "Open Sans"',

    legend:         true,
    legendPosition: 'right',
    legendAlign:    'top',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: ['#005CA7', '#FFFFFF']
})
.setData(testHeatGrid4Measures)
.render();

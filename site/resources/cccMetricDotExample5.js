new pvc.MetricDotChart({
    canvas:         'cccMetricDotExample5',
    width:          600,
    height:         500,

    // Data source
    isMultiValued: true,
    dataMeasuresInColumns: true,
    readers: [
        'productClass, productLine, product, territory, country, ' +
        'quantity, sales, expectedSales, previousSales'
    ],

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
    axisGrid_strokeStyle: 'lightgray',

    // Panels
    title:          "Small Multiple Bubbles (Qty x Sales)",
    titleFont:      'bold 16px sans-serif',
    smallTitleFont: 'italic 14px sans-serif',

    legend:         true,
    legendPosition: 'right',
    legendAlign:    'top',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(testHeatGrid4Measures)
.render();
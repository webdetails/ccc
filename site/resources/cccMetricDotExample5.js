new pvc.MetricDotChart({
    canvas:         'cccMetricDotExample5',
    title:          "Small Multiple Bubbles (Qty x Sales)",
    width:          600,
    height:         500,
    animate:        false,
    legend:         true,
    legendPosition: 'right',
    legendAlign:    'top',
    selectable:     true,
    hoverable:      true,
    ignoreNulls:    false,
    titleFont:      'bold 16px sans-serif',
    multiChartMax:  9,
    smallTitleFont: 'italic 14px sans-serif',
    originIsZero:   false,
    axisGrid:       true,
    
    /* Visual Role mapping */
    multiChartRole: 'territory, country',
    xRole:          'quantity',
    yRole:          'sales',
    colorRole:      'expectedSales',
    sizeRole:       'previousSales',
      
    extensionPoints: {
        axisGrid_strokeStyle: 'lightgray'
    }
})
.setData(testHeatGrid4Measures, {
    isMultiValued: true,
    dataMeasuresInColumns: true,
    readers: [
        'productClass, productLine, product, territory, ' + 
        'country, quantity, sales, expectedSales, previousSales'
    ]
})
.render();
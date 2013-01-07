new pvc.WaterfallChart({
    canvas: 'cccWaterfallExample2',
    width:  800,
    height: 800,
    legend: true,
    legendPosition: 'top',

    direction:         'up',
    areasVisible:       true,
    valuesVisible:      true,
    totalValuesVisible: false,
    
    animate:    false,
    selectable: true,
    hoverable:  true,
    
    /* Visual Role mapping */
    seriesRole:   'product',
    categoryRole: 'territory|region,market',
    valueRole:    'sales',
    
    extensionPoints: {
        line_lineWidth: 2,
        label_font:    '8px sans-serif',
        baseAxisLabel_textAngle:    -Math.PI/3,
        baseAxisLabel_textAlign:    'right',
        baseAxisLabel_textBaseline: 'top'
    }
})
.setData(testWaterfall1, {
    readers: ['product, territory, region, market, sales']
})
.render();
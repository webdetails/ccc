new pvc.WaterfallChart({
    canvas: 'cccWaterfallExample1',
    width:  600,
    height: 700,
    legend: true,
    legendPosition: 'top',
    
    direction:      'down',
    areasVisible:   true,
    valuesVisible:  true,
    
    animate:    false,
    selectable: true,
    hoverable:  true,
    
    /* Visual Role mapping */
    seriesRole:   'product',
    categoryRole: 'territory, region, market',
    valueRole:    'sales',
    
    extensionPoints: {
        line_lineWidth: 2,
        label_font: '8px sans-serif',
        baseAxisLabel_textAngle:    -Math.PI/3,
        baseAxisLabel_textAlign:    'right',
        baseAxisLabel_textBaseline: 'top'
    }
})
.setData(testWaterfall1, {
    readers: ['product, territory, region, market, sales']
})
.render();
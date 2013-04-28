
new pvc.WaterfallChart({
    canvas:  'cccWaterfallExample3',
    width:   600,
    height:  400,
    title:   "Balance Analysis",
    titleMargins: '3%',
    legend:  true,
    legendPosition: 'right',
    animate:       false,
    selectable:    true,
    hoverable:     true,
    valuesVisible: true,
    titleFont:     '16px sans-serif',
    
    direction: 'up',
    areasVisible: true,
    allCategoryLabel: "Profit",
    
    seriesRole:   'productType',
    categoryRole: 'accountType, accountSource',

    extensionPoints: {
        line_lineWidth: 2,
        xAxisLabel_textAngle:    -Math.PI/3,
        xAxisLabel_textAlign:    'right',
        xAxisLabel_textBaseline: 'top'
    }
})
.setData(testWaterfallBalance, {
    readers: [
        'productType, accountType, accountSource, value'
    ]
})
.render();
new pvc.WaterfallChart({
    canvas:  'cccWaterfallExample3',
    width:   500,
    height:  400,
    title:   "Balance Analysis",
    titleMargins: '3%',
    legend:  true,
    legendPosition: 'right',
    animate:       false,
    selectable:    true,
    hoverable:     true,
    valuesVisible: true,
    
    direction: 'up',
    areasVisible: true,
    allCategoryLabel: "Profit",
    
    seriesRole:   'productType',
    categoryRole: 'accountType, accountSource',
    valueRole:    'value',
    
    dimensions: {
       productType:   {label: "Product Type"   },
       accountType:   {label: "Account Type"   },
       accountSource: {label: "Account Source" },
       value:         {label: "Value" }
    },

    extensionPoints: {
        xAxisLabel_textAngle:    -Math.PI/3,
        xAxisLabel_textAlign:    'right',
        xAxisLabel_textBaseline: 'top',
        titleLabel_font: '16px sans-serif',
        waterLine_lineWidth: 2
    }
})
.setData(testWaterfallBalance, {
    dataOptions: {categoriesCount: 2},
    readers: [
        {names: 'productType, accountType, accountSource, value'}
    ]
})
.render();
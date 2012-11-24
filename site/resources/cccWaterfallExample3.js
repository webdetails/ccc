new pvc.WaterfallChart({
    canvas:  'cccWaterfallExample3',
    width:   500,
    height:  400,
    title:   "Balance Analysis",
    legend:  true,
    legendPosition: 'right',
    animate:       false,
    selectable:    true,
    hoverable:     true,
    valuesVisible: true,
    
    direction: 'up',
    areasVisible: true,
    totalValuesVisible: true,
    allCategoryLabel: "Profit",
    //totalLineLabel: "Accumulated",
    
    /* Visual Role mapping */
    // multiChartRole: 'territory',
    seriesRole:   'productType',
    categoryRole: 'accountType, accountSource',
    valueRole:    'value',
    
    /* Data definition */
    dimensions: {
       productType:   {label: "Product Type"   },
       accountType:   {label: "Account Type"   },
       accountSource: {label: "Account Source" },
       value:         {label: "Value" }
    },

    /* Data mapping */
    readers: [
        {names: 'productType, accountType, accountSource, value'}
    ],

    crosstabMode: true,
    seriesInRows: false,
    dataOptions: {categoriesCount: 2},
    
    extensionPoints: {
        xAxisLabel_textAngle:    -Math.PI/3,
        xAxisLabel_textAlign:    "right",
        xAxisLabel_textBaseline: "top",
        titleLabel_font: "16px sans-serif",
        waterLine_lineWidth: 2
    }
})
.setData(testWaterfallBalance, {crosstabMode: true})
.render();
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
    totalLineLabel:     "Accumulated",
    allCategoryLabel:   "All",
    
    animate:    false,
    selectable: true,
    hoverable:  true,
    
    extensionPoints: {
        waterLine_lineWidth: 2,
        baseAxisLabel_textAngle:    -Math.PI/3,
        baseAxisLabel_textAlign:    'right',
        baseAxisLabel_textBaseline: 'top',
        barLabel_font: '8px sans-serif'
    },
    
    /* Visual Role mapping */
    seriesRole:   'product',
    categoryRole: 'territory|region,market',
    valueRole:    'sales',
    
    /* Data definition */
    dimensions: {
        territory: {label: "Territory"},
        region:    {label: "Region"},
        market:    {label: "Market"},
        product:   {label: "Product"},
        sales:     {label: "Sales", valueType: Number}
    }
})
.setData(testWaterfall1, {
    dataCategoriesCount: 3,
    readers: [
        {names: 'product, territory, region, market, sales'}
    ]
})
.render();
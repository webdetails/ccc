new pvc.WaterfallChart({
    canvas: 'cccWaterfallExample2',
    width:  800,
    height: 500,
    
    title: "Sales by territory, region, market and product",
    titleFont: 'bold 16px sans-serif',
    
    legend: true,
    legendPosition: 'right',

    direction:         'up',
    areasVisible:       true,
    valuesVisible:      true,
    waterValuesVisible: true,
    waterLineLabel:     "Accumulated",
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
    },

    /* Data translation */
    readers: [
        {names: 'product, territory, region, market, sales'}
    ],

    dataOptions:  {categoriesCount: 3}
})
.setData(testWaterfall1, {crosstabMode: true})
.render();
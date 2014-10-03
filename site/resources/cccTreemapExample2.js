new pvc.TreemapChart({
    canvas: 'cccTreemapExample2',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    rootCategoryLabel: "Earth",
    valuesFont: 'lighter 11px "Open Sans"',

    // Panels
    title:     "Three-Levels",
    titleFont: 'lighter 20px "Open Sans"',

    legend: true,
    legendPosition: 'right',
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    selectable: true,
    hoverable:  true,

    // Color axes   
    colors: [
        '#005CA7', '#0086F4', '#FFC20F', '#FFE085',
        '#39A74A', '#63CA73', '#333333', '#777777' 
    ]
})
.setData(testTreemapThreeLevel)
.render();
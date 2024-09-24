new pvc.TreemapChart({
    canvas:     'cccTreemapExample1',
    width:      600,
    height:     400,

    // Data source
    crosstabMode: false,

    // Main plot
    rootCategoryLabel: "World",
    valuesFont: 'lighter 11px "Open Sans"',

    // Panels
    title:     "Single-Level",
    titleFont: 'lighter 20px "Open Sans"',

    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: ['#005CA7']
})
.setData(testTreemapSingleLevel)
.render();
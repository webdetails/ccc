new pvc.TreemapChart({
    canvas:     'cccTreemapExample1',
    width:      600,
    height:     400,

    // Data source
    crosstabMode: false,

    // Main plot
    rootCategoryLabel: "World",

    // Panels
    title:     "Single-Level",
    titleFont: 'italic 14px sans-serif',

    legend: true,

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(testTreemapSingleLevel)
.render();
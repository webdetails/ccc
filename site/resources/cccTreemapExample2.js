new pvc.TreemapChart({
    canvas: 'cccTreemapExample2',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    rootCategoryLabel: "Earth",

    // Panels
    title:     "Three-Levels",
    titleFont: 'italic 14px sans-serif',

    legend: true,
    legendPosition: 'right',

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(testTreemapThreeLevel)
.render();
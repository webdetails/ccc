new pvc.TreemapChart({
    canvas: 'cccTreemapExample3',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    rootCategoryLabel: "Earth",
    layoutMode: 'slice-and-dice',
    colorMode:  'bySelf',
    valuesOptimizeLegibility: false,

    // Panels
    title:     "Slice-and-dice Layout And Self-Colored",
    titleFont: 'italic 14px sans-serif',

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(testTreemapThreeLevel)
.render();
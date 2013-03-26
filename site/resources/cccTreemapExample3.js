new pvc.TreemapChart({
    canvas:     'cccTreemapExample3',
    width:      400,
    height:     300,
    title:      "Slice-and-dice Layout And Self-Colored",
    titleFont:  'italic 14px sans-serif',
    selectable: true,
    hoverable:  true,
    legend:     true,
    legendPosition: 'right',
    rootCategoryLabel: "Earth",
    valuesOptimizeLegibility: false,
    layoutMode: 'slice-and-dice',
    colorMode:  'bySelf'
})
.setData(testTreemapThreeLevel, {crosstabMode: false})
.render();
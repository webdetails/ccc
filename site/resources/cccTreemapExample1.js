new pvc.TreemapChart({
    canvas:     'cccTreemapExample1',
    width:      400,
    height:     300,
    title:      "Single-Level",
    titleFont:  'italic 14px sans-serif',
    selectable: true,
    hoverable:  true,
    legend:     true,
    rootCategoryLabel: "World"
})
.setData(testTreemapSingleLevel, {crosstabMode: false})
.render();
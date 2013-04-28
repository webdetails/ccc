new pvc.TreemapChart({
    canvas:     'cccTreemapExample1',
    width:      600,
    height:     400,
    title:      "Single-Level",
    titleFont:  'italic 14px sans-serif',
    selectable: true,
    hoverable:  true,
    legend:     true,
    rootCategoryLabel: "World"
})
.setData(testTreemapSingleLevel, {crosstabMode: false})
.render();
new pvc.TreemapChart({
    canvas:     'cccTreemapExample2',
    width:      400,
    height:     300,
    title:      "Three-Levels",
    titleFont:  'italic 14px sans-serif',
    selectable: true,
    hoverable:  true,
    legend:     true,
    legendPosition: 'right',
    rootCategoryLabel: "Earth"
})
.setData(testTreemapThreeLevel, {crosstabMode: false})
.render();
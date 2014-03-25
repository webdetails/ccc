new pvc.TreemapChart({
    canvas:     'pvcTreemap4',
    width:      600,
    height:     400,
    title:      "Flare Library Modules",
    titleFont:  'italic 14px sans-serif',
    smallTitleFont:  'bold 14px sans-serif',
    colors:     pv.Colors.category19,
    selectable: true,
    hoverable:  true,
    legend:     true,
    legendPosition: 'right',
    valuesOverflow: 'hide', //trim
    multiChartIndexes: 0,
    colorRole: "multiChart, category, category2, category3",
    rootCategoryLabel: "flare"
})
.setData(buildDataset(flare), {crosstabMode: false})
.render();
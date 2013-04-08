new pvc.BarChart({
    canvas:      'cccBarExample9',
    width:       400,
    height:      300,
    title:       "Small Multiple Bar charts",
    orientation: 'horizontal',
    animate:     false,
    selectable:  true,
    hoverable:   true,
    stacked:     true,
    legend:      true,
    titleFont:      'bold 14px sans-serif',
    smallTitleFont: 'italic 12px sans-serif'
})
.setData(testHeatGridComp, {
    isMultiValued: true,
    multiChartIndexes: [0, 1]
})
.render();
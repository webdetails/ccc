var pie = new pvc.PieChart({
    canvas: 'cccPieExample3',
    width:  400,
    height: 400,
    title:  "Small Multiple Pie Charts",
    animate:    false,
    selectable: true,
    hoverable:  true,
    legend:     true,
    legendPosition: 'right',
    titleFont:      'bold 16px sans-serif',
    smallTitleFont: 'italic 14px sans-serif',
    multiChartRole: 'category3',
    categoryRole:   'category2',
    extensionPoints: {
       slice_strokeStyle: 'white'
    }
})
.setData(steelWheels02, {
    isMultiValued: true,
    dataMeasuresInColumns: true
})
.render();
new pvc.BarChart({
    canvas: "cccBarExample3",
    width:  400,
    height: 300,
    title:  "Bar chart with negative values",
    animate:    true,
    clickable:  true,
    selectable: true,
    hoverable:  true,
    legend:     true,
    legendPosition: 'right',
    axisGrid: true,
    axisOffset:   0.04,
    valuesVisible:   false,
    extensionPoints: {
    	xAxisLabel_textAngle:    -1,
    	xAxisLabel_textAlign:    'right',
    	xAxisLabel_textBaseline: 'top'
    }
})
.setData(relational_01_neg, {crosstabMode: false })
.render();
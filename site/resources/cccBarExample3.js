new pvc.BarChart({
    canvas: "cccBarExample3",
    width:  600,
    height: 400,
    animate:    true,
    selectable: true,
    hoverable:  true,
    legend:     true,
    axisGrid:   true,
    axisOffset: 0.05,
    valuesVisible: false,
    extensionPoints: {
        xAxisLabel_textAngle:    -Math.PI/3,
        xAxisLabel_textAlign:    'right',
        xAxisLabel_textBaseline: 'top',
        axisGrid_strokeStyle:    'lightgray'
    }
})
.setData(relational_01_neg, {crosstabMode: false })
.render();
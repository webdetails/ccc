new pvc.BarChart({
    canvas: "cccBarExample5",
    width:  600,
    height: 400,
    title:  "Negative Values Stacked Bar Chart",
    titleFont:  'bold italic 12px sans-serif',
    titleSize:  {width: '70%', height: '25%'},
    titleMargins:  10,
    titlePaddings: {all: '15%', top: 10, bottom: 10},
    stacked:    true,
    animate:    true,
    selectable: true,
    hoverable:  true,
    legend:     true,
    valuesVisible: false,
    axisGrid:   true,
    orthoAxisLabelSpacingMin: 2.5,
    extensionPoints: {
        title_fillStyle:   'rgba(0, 255, 0, 0.2)',
        title_strokeStyle: 'green',
        axisGrid_strokeStyle: 'lightgray'
    }
})
.setData(relational_01_neg, {crosstabMode: false })
.render();
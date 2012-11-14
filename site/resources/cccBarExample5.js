new pvc.BarChart({
    canvas: "cccBarExample5",
    width:  400,
    height: 300,
    title:  "Stacked bar chart with negative values",
    titleFont:  'bold italic 14px sans-serif',
    titleSize:  {width: '60%', height: '25%'},
    //titleSizeMax:  {width: '60%'},
    titleMargins:  10,
    titlePaddings: {all: '15%', top: 10, bottom: 10},
    stacked:    true,
    animate:    true,
    clickable:  true,
    selectable: true,
    hoverable:  true,
    legend:     true,
    legendPosition: 'right',
    valuesVisible:   false,
    axisGrid: true,
    orthoAxisLabelSpacingMin: 2.5,
    extensionPoints: {
        title_fillStyle:   'rgba(0, 255, 0, 0.2)',
        title_strokeStyle: 'green'
    }
})
.setData(relational_01_neg, {crosstabMode: false })
.render();
new pvc.BarChart({
    canvas: "cccBarExample2",
    width:  400,
    height: 250,
    title: "Sample Bar chart",
    titlePosition: 'left',
    titleSize: {height: '100%'},
    titleMargins: 10,
    orientation:   'horizontal',
    animate:    false,
    clickable:  true,
    selectable: true,
    hoverable:  true,
    legend:     true,
    legendPosition: 'right',
    valuesVisible:   false,
    axisGrid: true,
    extensionPoints: {
        bar_lineWidth:     1,
        title_fillStyle:   'lightblue',
        titleLabel_font:   '16px sans-serif',
        title_strokeStyle: 'black',
        legend_fillStyle:  'green',
        yAxisRule_strokeStyle: 'blue'
    }
})
.setData(relational_01, {crosstabMode: false })
.render();
new pvc.BarChart({
    canvas: "cccBarExample2",
    width:  600,
    height: 400,
    orientation: 'horizontal',
    title:  "Rich Bar chart",
    titlePosition: 'left',
    titleSize:  {height: '100%'},
    titleMargins: 10,
    titleFont:  '16px sans-serif',
    animate:    false,
    clickable:  true,
    selectable: true,
    hoverable:  true,
    legend:     true,
    legendPosition: 'right',
    axisGrid:   true,
    extensionPoints: {
        title_fillStyle:   'lightblue',
        title_strokeStyle: 'black',
        axisGrid_strokeStyle: 'lightgray'
    }
})
.setData(relational_01, {crosstabMode: false})
.render();
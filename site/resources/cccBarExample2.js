new pvc.BarChart({
    canvas: 'cccBarExample2',
    width:  600,
    height: 400,
    orientation: 'horizontal',

    // Cartesian axes
    axisGrid: true,
    axisGrid_strokeStyle: 'lightgray',

    // Panels
    title:         "Rich Bar chart",
    titlePosition: 'left',
    titleSize:     {height: '100%'},
    titleMargins:  10,
    titleFont:     '16px sans-serif',
    title_fillStyle:   'lightblue',
    title_strokeStyle: 'black',

    legend: true,
    legendPosition: 'right',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_01, {crosstabMode: false})
.render();
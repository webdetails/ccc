new pvc.StackedLineChart({
    canvas: 'cccStackedLineExample2',
    width:  600,
    height: 250,

    // Data
    dimensions: {
        // Category is a Date, but discrete
        category: {valueType: Date, isDiscrete: true } 
    },

    // Main plot
    dotsVisible: true,
    line_interpolate: 'monotone',
    area_interpolate: 'monotone',

    // Cartesian axes
    axisGrid:   true,
    axisOffset: 0,
    axisGrid_strokeStyle: 'lightgray',

    // Panels
    title: "Categorical Stacked Line Chart",
    legend: true,

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_01, { crosstabMode: false })
.render();
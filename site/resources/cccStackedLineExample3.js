new pvc.StackedLineChart({
    canvas: 'cccStackedLineExample3',
    width:  600,
    height: 250,

    // Data source
    crosstabMode: false,

    // Data
    dimensions: {
        // A Date, but discrete
        category: {valueType: Date, isDiscrete: true}
    },

    // Main plot
    nullInterpolationMode: 'linear',

    // Cartesian axes
    axisGrid: true,
    axisGrid_strokeStyle: 'lightgray',

    // Panels
    title:  "Interpolated Stacked Line Chart",
    legend: true,

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(relational_01)
.render();
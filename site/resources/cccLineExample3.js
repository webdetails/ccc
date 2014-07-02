new pvc.LineChart({
    canvas: 'cccLineExample2',
    width:  600,
    height: 250,

    // Data source
    crosstabMode: false,

    // Data
    dimensions: {
        // Category is a Date, but discrete
        category: {valueType: Date, isDiscrete: true }
    },

    // Main plot
    areasVisible: true,
    line_interpolate: 'cardinal',
    area_interpolate: 'cardinal',
    dotsVisible:  true,
    nullInterpolationMode: 'linear',

    // Cartesian axes
    axisGrid: true,
    axisGrid_strokeStyle: 'lightgray',

    // Panels
    title:  "Interpolated and Negatives Line Chart",
    legend: true,

    // Chart/Interaction
    animate:    true,
    selectable: true,
    hoverable:  true
})
.setData(relational_01_neg)
.render();
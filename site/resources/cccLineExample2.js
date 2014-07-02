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

    // Plots
    plots: [
        {
            // Main plot
            name: 'main',
            areasVisible: true,
            line_interpolate: 'monotone',
            area_interpolate: 'monotone',
            dotsVisible:  true
        }
    ],

    // Cartesian axes
    axisGrid:   true,
    axisGrid_strokeStyle: 'lightgray',

    // Panels
    title:  "Categorical Line Chart",
    legend: true,

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_01)
.render();
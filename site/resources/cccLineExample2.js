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
            dotsVisible:  true,
            dot_shapeSize:  7
        }
    ],

    // Cartesian axes
    axisGrid:   true,
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 9px "Open Sans"',

    // Panels
    title:  "Categorical Line Chart",
    titleFont: 'lighter 20px "Open Sans"',
    titleMargins: '0 0 5 0',
    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: [
        '#005CA7', '#FFC20F', '#333333'
    ]
})
.setData(relational_01)
.render();
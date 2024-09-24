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
    dot_shapeSize:  7,
    nullInterpolationMode: 'linear',

    // Cartesian axes
    axisGrid: true,
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 8px "Open Sans"',

    // Panels
    title:  "Interpolated and Negatives Line Chart",
    titleFont: 'lighter 20px "Open Sans"',
    titleMargins: '0 0 5 0',
    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    true,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: [
        '#005CA7', '#FFC20F', '#333333'
    ]
})
.setData(relational_01_neg)
.render();
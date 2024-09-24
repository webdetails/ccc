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
    dot_shapeSize: 7,
    line_interpolate: 'monotone',
    area_interpolate: 'monotone',

    // Cartesian axes
    axisGrid:   true,
    axisOffset: 0,
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 9px "Open Sans"',

    // Panels
    title: "Categorical Stacked Line Chart",
    titleFont: 'lighter 20px "Open Sans"',
    titleMargins: '0 0 5 0',
    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: ['#005CA7', '#FFC20F', '#333333']
})
.setData(relational_01, { crosstabMode: false })
.render();
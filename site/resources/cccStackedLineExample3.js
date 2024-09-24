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
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 9px "Open Sans"',

    // Panels
    title:  "Interpolated Stacked Line Chart",
    titleFont: 'lighter 20px "Open Sans"',
    titleMargins: '0 0 5 0',
    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: ['#005CA7', '#FFC20F', '#333333']
})
.setData(relational_01)
.render();
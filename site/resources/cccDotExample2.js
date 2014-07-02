new pvc.DotChart({
    canvas: 'cccDotExample2',
    width:  600,
    height: 400,
    orientation: 'horizontal',

    // Data source
    crosstabMode: false,

    // Plots
    plots: [
        {
            // Main plot
            name: 'main',
            valuesVisible:   true,
            plot_fillStyle:  '#eee',
            dot_shape:       'triangle',
            dot_fillStyle:   'orange',
            dot_shapeRadius: 3
        }
    ],

    // Cartesian axes
    axisLabel_textStyle: 'darkblue',
    baseAxis_fillStyle:  '#bbb',
    orthoAxisLabel_textAlign: 'center',

    // Panels
    title:           "A Rich Dot Chart",
    titlePosition:   'top',
    titleSize:       {width: '100%'},
    title_fillStyle: 'orange',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_03)
.render();
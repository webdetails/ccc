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
            plot_fillStyle:  '#F7F8F9',
            dot_shape:       'triangle',
            dot_fillStyle:   '#FFC20F',
            dot_strokeStyle: '#FFC20F',
            dot_shapeRadius: 3
        }
    ],
    valuesFont: 'lighter 11px "Open Sans"',

    // Cartesian axes
    axisLabel_font: 'normal 10px "Open Sans"',
    baseAxisLabel_textStyle: '#FFFFFF',
    baseAxis_fillStyle:  '#005CA7',
    orthoAxisLabel_textAlign: 'center',

    // Panels
    title:     "A Rich Dot Chart",
    titleFont: 'lighter 20px "Open Sans"',
    titlePosition: 'top',
    titleMargins:  '0 0 10 0',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_03)
.render();

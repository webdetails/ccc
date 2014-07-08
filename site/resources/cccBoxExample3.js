new pvc.BoxplotChart({
    canvas: 'cccBoxExample3',
    width:  600,
    height: 400,

    // Main plot
    boxSizeMax: 20,
    boxRuleWhisker_strokeDasharray: '- ',

    // Second plot
    plot2: true,
    plot2LinesVisible: true,
    plot2Line_shape:   'triangle',
    plot2DotsVisible:  true,
    plots: [
        // minimum, maximum, lowerQuartil, upperQuartil, median
        //{name: 'plot2', visualRoles: {value: 'maximum'}}
    ],

    // Cartesian axes
    baseAxisGrid: true,
    axisGrid_strokeStyle: 'lightgray',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(boxplotData_03)
.render();
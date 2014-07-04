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

    // Cartesian axes
    baseAxisGrid: true,
    axisGrid_strokeStyle: 'lightgray',

    // Panels
    title: "Boxplot with Median Line Chart",

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(boxplotData_01)
.render();
new pvc.BoxplotChart({
    canvas:  "cccBoxExample4",
    width:   600,
    height:  400,

    // Visual roles
    //  Point color role to category role,
    //  instead of the default, series,
    //  which would color all boxes in blue
    colorRole: {from: 'category'},

    // Main plot
    boxRuleWhisker_strokeDasharray: '- ',

    // Second plot
    //  shows the median line
    plot2: true,
    plot2LinesVisible: true,
    plot2DotsVisible:  true,
    plot2AreasVisible: true,

    // Cartesian axes
    baseAxisVisible: false, // Hide base axis!
    axisOffset: 0.03,

    // Color axes
    //  But hide its legend cause it's identical to
    //  that of the color1Axis...
    color2AxisLegendVisible: false,

    // Panels
    title: "All-in-one Boxplot",

    // Show legend (have fun showing/hiding boxes!)
    legend: true,

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(boxplotData_02)
.render();
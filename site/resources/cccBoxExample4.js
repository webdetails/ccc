new pvc.BoxplotChart({
    canvas:  "cccBoxExample4",
    width:   400,
    height:  300,
    title:   "All-in-one Boxplot",
    
    selectable: true,
    hoverable:  true,
    
    // Show legend (have fun showing/hiding boxes!)
    legend: true,
    
    // Hide base axis
    baseAxisVisible:  false,
    axisOffset: 0.03,
    
    // Point color role to category role, instead of series
    // which would color all boxes in blue
    colorRole: {from: 'category'},

    // Show the median line
    plot2: true,
    plot2LinesVisible: true,
    plot2DotsVisible:  true,
    plot2AreasVisible: true,

    // But hide its legend cause it's identical
    // to that of the color1Axis...
    color2AxisLegendVisible: false,
    
    extensionPoints: {
        boxRuleWhisker_strokeDasharray: '- '
    }
})
.setData(boxplotData_02)
.render();
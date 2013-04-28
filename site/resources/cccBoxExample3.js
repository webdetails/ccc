new pvc.BoxplotChart({
    canvas:  "cccBoxExample3",
    width:   600,
    height:  400,
    
    title:   "Boxplot with Median Line Chart",
    animate:      false,
    selectable:   true,
    hoverable:    true,
    baseAxisGrid: true,
    boxSizeMax:   20,
    
    plot2: true,
    plot2LinesVisible: true,
    plot2DotsVisible:  true,
    
    extensionPoints: {
        boxRuleWhisker_strokeDasharray: '- ',
        plot2Line_shape: 'triangle'
    }
})
.setData(boxplotData_01)
.render();
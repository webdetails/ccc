new pvc.BoxplotChart({
    canvas:  'cccBoxExample2',
    width:   600,
    height:  400,
    orientation: 'horizontal',

    // Main plot
    boxSizeMax:   15,
    boxPanel_fillStyle: 'rgba(255,153,0,0.3)',
    boxBar_fillStyle:   'rgb(255,153,0)',
    boxRuleMedian_lineWidth: 3,
    boxRuleMin_strokeStyle: 'blue',
    boxRuleMax_strokeStyle: 'red',
    boxRuleWhisker_strokeDasharray: '- ',

    // Cartesian axes
    baseAxisGrid: true,
    axisGrid_strokeStyle: 'lightgray',
    panelSizeRatio: 0.8,

    // Panels
    title: "Horizontal Boxplot Chart",

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(boxplotData_01)
.render();
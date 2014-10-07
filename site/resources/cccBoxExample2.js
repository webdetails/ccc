new pvc.BoxplotChart({
    canvas:  'cccBoxExample2',
    width:   600,
    height:  400,
    orientation: 'horizontal',

    // Main plot
    boxSizeMax: 15,
    boxBar_fillStyle: 'rgb(255,153,0)',
    boxRuleMedian_lineWidth: 3,
    boxRuleMin_strokeStyle: 'blue',
    boxRuleMax_strokeStyle: 'red',
    boxRuleWhisker_strokeDasharray: '- ',

    // Cartesian axes
    baseAxisGrid: true,
    axisGrid_strokeStyle: 'lightgray',
    axisBandSizeRatio: 0.8,

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(boxplotData_01)
.render();
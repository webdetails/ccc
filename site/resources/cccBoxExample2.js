new pvc.BoxplotChart({
    canvas:  'cccBoxExample2',
    width:   600,
    height:  400,
    orientation: 'horizontal',

    // Main plot
    boxSizeMax: 15,
    boxBar_fillStyle: '#FFC20F',
    boxRuleMedian_lineWidth: 3,
    boxRuleMin_strokeStyle: '#005CA7',
    boxRuleMax_strokeStyle: '#005CA7',
    boxRuleWhisker_strokeDasharray: '- ',

    // Cartesian axes
    baseAxisGrid: true,
    axisGrid_strokeStyle: '#F7F8F9',
    panelSizeRatio: 0.8,
    axisLabel_font: 'normal 10px "Open Sans"',

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(boxplotData_01)
.render();
new pvc.BoxplotChart({
    canvas:  "cccBoxExample2",
    width:   400,
    height:  250,
    title:   "Horizontal Boxplot Chart",
    orientation: 'horizontal',
    animate:      false,
    selectable:   true,
    hoverable:    true,
    baseAxisGrid: true,
    panelSizeRatio: 0.8,
    boxSizeMax:   15,
    extensionPoints: {
        boxPanel_fillStyle: 'rgba(255,153,0,0.3)',
        boxBar_fillStyle:   'rgb(255,153,0)',
        boxRuleMedian_lineWidth: 3,
        boxRuleMin_strokeStyle: 'blue',
        boxRuleMax_strokeStyle: 'red',
        boxRuleWhisker_strokeDasharray: '- '
    }
})
.setData(boxplotData_01)
.render();
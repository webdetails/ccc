new pvc.PieChart({
    canvas: 'cccPieExample1',
    width:  600,
    height: 400,
    animate:    false,
    selectable: true,
    hoverable:  true,
    valuesVisible: true,
    valuesLabelStyle: 'inside',
    valuesMask: "{category}",
    valuesFont: '40px sans-serif',
    valuesOverflow: 'trim',
    valuesOptimizeLegibility: true,
    extensionPoints: {
       slice_strokeStyle: 'white' 
    }
})
.setData(relational_03_b, {crosstabMode: false})
.render();
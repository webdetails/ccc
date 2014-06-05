new pvc.BarChart({
    canvas: "cccBarExample6",
    width:  600,
    height: 400,
    titleFont:   'bold italic 16px sans-serif',
    titleAlign:  'left',
    orientation: 'horizontal',
    stacked: true,
    animate: false,
    selectable: true,
    hoverable: true,
    valuesVisible: true,
    valuesMask: '{series}',
    valuesFont: '20px sans-serif',
    valuesOverflow: 'trim',
    valuesOptimizeLegibility: true,
    orthoAxisLabelSpacingMin: 6,
    tooltipClassName: 'light'
})
.setData(relational_01, {crosstabMode: false })
.render();
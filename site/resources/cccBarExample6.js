new pvc.BarChart({
    canvas: "cccBarExample6",
    width:  600,
    height: 400,
    titleFont:   'bold italic 16px sans-serif',
    titleAlign:  'left',
    orientation: 'horizontal',
    stacked: true,
    animate: false,
    legend:  true,
    legendPosition: 'top',
    legendAlign:    'right',
    orthoAxisLabelSpacingMin: 6
})
.setData(relational_01, {crosstabMode: false })
.render();
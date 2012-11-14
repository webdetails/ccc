new pvc.BarChart({
    canvas: "cccBarExample6",
    width:  400,
    height: 250,
    title:  "Stacked Bar Chart - Horizontal",
    titleFont:  'bold italic 16px sans-serif',
    titleAlign: 'left',
    orientation: 'horizontal',
    stacked: true,
    animate: false,
    legend:  true,
    legendPosition: 'top',
    legendAlign:    'right',
    orthoAxisLabelSpacingMin: 2.5
})
.setData(relational_01, {crosstabMode: false })
.render();
new pvc.BarChart({
    canvas:  "cccBarExample4",
    width:   600,
    height:  350,
    title:   "Stacked Bar Chart",
    stacked:    true,
    barStackedMargin: 3,
    animate:    false,
    clickable:  true,
    selectable: true,
    hoverable:  true,
    legend:     true,
    legendPosition: 'right',
    orthoAxisFixedMax:   130,
    baseAxisTicks: true,
    extensionPoints: {
        xAxisTicks_strokeStyle: 'gray',
        rubberBand_strokeStyle: 'rgb(0,0,240)',
        rubberBand_fillStyle:   'rgba(0,0,255, 0.5)',
        rubberBand_lineWidth:   2.5
    }
})
.setData(relational_01, {crosstabMode: false })
.render();
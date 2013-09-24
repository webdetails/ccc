new pvc.BarChart({
    canvas:  "cccBarExample4",
    width:   600,
    height:  400,
    stacked:    true,
    barStackedMargin: 3,
    valuesVisible: true,
    valuesOptimizeLegibility: true,
    animate:    false,
    selectable: true,
    hoverable:  true,
    legend:     true,
    orthoAxisFixedMax: 130,
    baseAxisTicks: true,
    extensionPoints: {
        baseAxisTicks_strokeStyle: 'gray',
        rubberBand_strokeStyle: 'rgb(0,0,240)',
        rubberBand_fillStyle:   'rgba(0,0,255, 0.5)',
        rubberBand_lineWidth:   2.5
    }
})
.setData(relational_01, {crosstabMode: false })
.render();
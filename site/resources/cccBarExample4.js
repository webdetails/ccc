new pvc.BarChart({
    canvas: 'cccBarExample4',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    stacked: true,
    barStackedMargin: 3,
    valuesVisible: true,
    valuesOptimizeLegibility: true,

    // Cartesian axes
    orthoAxisFixedMax: 130,
    baseAxisTicks: true,
    baseAxisTicks_strokeStyle: 'gray',
    baseAxisTooltipAutoContent: 'summary',

    // Panels
    legend: true,

    // Rubber-band
    rubberBand_strokeStyle: 'rgb(0,0,240)',
    rubberBand_fillStyle:   'rgba(0,0,255, 0.5)',
    rubberBand_lineWidth:   2.5,

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_01)
.render();
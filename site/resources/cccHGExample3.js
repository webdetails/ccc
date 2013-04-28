new pvc.HeatGridChart({
    canvas: 'cccHGExample3',
    width:  600,
    height: 350,
    title:  "Horizontal Colors By Column Heat-grid",
    orientation: 'horizontal'
})
.setData(testHeatGrid)
.render();
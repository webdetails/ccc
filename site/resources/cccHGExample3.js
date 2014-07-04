new pvc.HeatGridChart({
    canvas: 'cccHGExample3',
    width:  600,
    height: 350,
    orientation: 'horizontal',

    // Panels
    title: "Horizontal Colors By Column Heat-grid"
})
.setData(testHeatGrid)
.render();
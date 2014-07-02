new pvc.HeatGridChart({
    canvas: 'cccHGExample2',
    width:  600,
    height: 350,

    // Main plot
    valuesAnchor: 'right',

    // Panels
    title: "Colors By Column Heat-grid"
})
.setData(testHeatGrid)
.render();
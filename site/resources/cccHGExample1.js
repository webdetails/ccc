new pvc.HeatGridChart({
    canvas: 'cccHGExample1',
    width:  600,
    height: 350,

    // Color axes
    colorNormByCategory: false,

    // Panels
    title: "Global Colors Heat-grid"
})
.setData(testHeatGrid)
.render();
new pvc.HeatGridChart({
    canvas: 'cccHGExample1',
    width:  600,
    height: 350,
    title:  "Global Colors Heat-grid",
    colorNormByCategory: false
})
.setData(testHeatGrid)
.render();
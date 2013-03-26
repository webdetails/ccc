new pvc.HeatGridChart({
    canvas: 'cccHGExample1',
    width:  400,
    height: 400,
    title:  "Global Colors Heat-grid",
    colorNormByCategory: false
})
.setData(testHeatGrid)
.render();
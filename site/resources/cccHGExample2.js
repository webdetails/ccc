new pvc.HeatGridChart({
    canvas: 'cccHGExample2',
    width:  600,
    height: 350,
    title:  "Colors By Column Heat-grid",
    valuesAnchor: 'right'
})
.setData(testHeatGrid)
.render();
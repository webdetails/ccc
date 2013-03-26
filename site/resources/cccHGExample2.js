new pvc.HeatGridChart({
    canvas: 'cccHGExample2',
    width:  400,
    height: 400,
    title:  "Colors By Column Heat-grid",
    valuesAnchor: 'right'
})
.setData(testHeatGrid)
.render();
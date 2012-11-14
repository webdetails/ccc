new pvc.BarChart({
    canvas: "cccBarExample8",
    width:  700,
    height: 400,
    animate:    false,
    selectable: true,
    hoverable:  true,
    stacked:    true,
    valuesVisible: false,
    legend:     true,
    panelSizeRatio: 0.7,
    barSizeMax:     100,
    contentMargins: '5%'
})
.setData(crosstab_02)
.render();
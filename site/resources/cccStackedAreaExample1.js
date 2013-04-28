new pvc.StackedAreaChart({
    canvas: 'cccStackedAreaExample1',
    width:  600,
    height: 250,
    title:  "Simple Area chart",
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_02, {crosstabMode: false})
.render();
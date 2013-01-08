new pvc.StackedAreaChart({
    canvas: 'cccStackedAreaExample1',
    width:  400,
    height: 220,
    title:  "Simple Area chart",
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_02, {crosstabMode: false})
.render();
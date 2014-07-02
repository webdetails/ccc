new pvc.StackedAreaChart({
    canvas: 'cccStackedAreaExample1',
    width:  600,
    height: 250,

    // Data source
    crosstabMode: false,

    // Panels
    title: "Simple Area chart",

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_02)
.render();
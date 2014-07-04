new pvc.DotChart({
    canvas: 'cccDotExample1',
    width:  600,
    height: 400,
    orientation: 'horizontal',

    // Data source
    crosstabMode: false,

    // Main plot
    valuesVisible: true,

    // Panels
    title:  "Simple Dot Chart",
    titlePosition: 'bottom',

    // Chart/Interaction
    animate:    false,
    selectable: true
})
.setData(relational_03)
.render();
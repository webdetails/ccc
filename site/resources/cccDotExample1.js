new pvc.DotChart({
    canvas: 'cccDotExample1',
    width:  400,
    height: 300,
    title:  "Simple Dot Chart",
    titlePosition: 'bottom',
    orientation:   'horizontal',
    animate:       false,
    selectable:    true,
    valuesVisible: true
})
.setData(relational_03, { crosstabMode: false })
.render();
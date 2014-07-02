new pvc.BarChart({
    canvas: 'cccBarExample1',
    width:  600,
    height: 400,
    orientation: 'horizontal',

    // Data source
    crosstabMode: false,

    // Main plot
    valuesVisible: false,

    bar_fillStyle: 'linear-gradient(90deg, green, blue)',
    // 'linear-gradient(to bottom left, red, yellow 20%, green, blue)'
    // 'radial-gradient(red, yellow 40%, red)'
    // 'linear-gradient(red, rgb(0,0,255))'

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_03)
.render();
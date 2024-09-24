new pvc.StackedAreaChart({
    canvas: 'cccStackedAreaExample1',
    width:  600,
    height: 250,

    // Data source
    crosstabMode: false,
    
    // Cartesian Axes
    baseAxisLabel_font: 'normal 10px "Open Sans"',
    orthoAxisLabel_font: 'normal 9px "Open Sans"',

    // Panels
    title: "Simple Area chart",
    titleFont: 'lighter 20px "Open Sans"',
    titleMargins: '0 0 5 0',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: ['#005CA7', '#FFC20F', '#333333']
})
.setData(relational_02)
.render();
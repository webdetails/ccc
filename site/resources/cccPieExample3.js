new pvc.PieChart({
    canvas: 'cccPieExample3',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main Plot
    valuesVisible: true,
    valuesFont: 'lighter 11px "Open Sans"',
    explodedSliceIndex:  1,
    explodedSliceRadius: '10%',
    slice_strokeStyle: 'white',

    // Color axes
    colors: [
        '#333333', '#777777', '#FFC20F', '#FFE085',
        '#005CA7', '#0086F4', '#39A74A', '#63CA73'
    ],

    // Panels
    title:           "Rich Pie",
    titleSize:       {width: '100%'},
    titlePaddings:   '4%',
    titleFont:       'lighter 30px "Open Sans"',
    title_fillStyle: '#FFFFFF',
    titleLabel_textStyle: '#333333',

    legend:      true,
    legendShape: 'circle',
    legendSize:  {width: '100%'},
    legendArea_fillStyle: '#FFFFFF',
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_03_b)
.render();
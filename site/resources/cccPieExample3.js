new pvc.PieChart({
    canvas: 'cccPieExample3',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main Plot
    valuesVisible: true,
    explodedSliceIndex:  1,
    explodedSliceRadius: '10%',

    // Color axes
    colors: [
        '#8ED300', '#7CB021', '#568000',
        '#3A3A3A', '#969696', '#F5F4F2'
    ],

    // Panels
    title:           "Rich Pie",
    titleSize:       {width: '100%'},
    titlePaddings:   '4%',
    titleFont:       'bold 16px sans-serif',
    title_fillStyle: 'lightblue',

    legend:      true,
    legendShape: 'circle',
    legendSize:  {width: '100%'},
    legendArea_fillStyle: 'lightgray',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_03_b)
.render();
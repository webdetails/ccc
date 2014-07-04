new pvc.BarChart({
    canvas: 'cccBarExample5',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    stacked: true,
    valuesVisible: false,

    // Cartesian axes
    axisGrid: true,
    axisGrid_strokeStyle: 'lightgray',
    orthoAxisLabelSpacingMin: 2.5,

    // Panels
    title:     "Negative Values Stacked Bar Chart",
    titleFont: 'bold italic 14px sans-serif',
    titleSize:     {width: '70%', height: '25%'},
    titleMargins:  10,
    titlePaddings: {all: '15%', top: 10, bottom: 10},
    title_fillStyle:   'rgba(0, 255, 0, 0.2)',
    title_strokeStyle: 'green',

    legend: true,

    // Chart/Interaction
    animate:    true,
    selectable: true,
    hoverable:  true
})
.setData(relational_01_neg)
.render();
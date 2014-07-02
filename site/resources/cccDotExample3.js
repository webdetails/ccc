new pvc.DotChart({
    canvas:  'cccDotExample3',
    width:   600,
    height:  400,
    margins: {right: '2%'},
    orientation: 'vertical',

    // Data source
    crosstabMode: false,
    timeSeriesFormat: '%Y-%m-%d',

    // Data
    timeSeries: true,

    // Main plot
    valuesVisible: true,
    plot_fillStyle: '#eee',
    dot_shape: 'cross',
    dot_shapeRadius: 3,

    // Cartesian plots
    axisLabel_textStyle:        'darkblue',
    baseAxisLabel_textAngle:    -Math.PI/6,
    baseAxisLabel_textAlign:    'center',
    baseAxisLabel_textBaseline: 'top',

    // Panels
    title:           "A Time Series Dot Chart",
    titlePosition:   'left',
    titleSize:       {height: '100%'},
    title_fillStyle: 'lightblue',

    legend:      true,
    legendAlign: 'left',

    // Chart/Interaction
    animate:    false,
    selectable: true
})
.setData(relational_012)
.render();
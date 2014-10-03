new pvc.StackedLineChart({
    canvas: 'cccStackedLineExample1',
    width:  600,
    height: 250,

    // Data source
    crosstabMode: false,

    // Data
    timeSeries: true,

    // Main plot
    line_interpolate: 'monotone',
    area_interpolate: 'monotone',

    // Cartesian axes
    axisGrid: true,
    axisOffset: 0,
    axisGrid_strokeStyle: '#F7F8F9',
    baseAxisLabel_textAngle: -0.8,
    baseAxisLabel_textAlign: 'right',
    baseAxisScale_dateTickFormat: "%Y/%m/%d",
    baseAxisScale_dateTickPrecision: pvc.time.intervals.w,
    axisLabel_font: 'normal 8px "Open Sans"',


    // Panels
    title: "Time Series Stacked Line Chart",
    titleFont: 'lighter 20px "Open Sans"',
    titleMargins: '0 0 5 0',

    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,
    tooltipClassName: 'light',

    // Color axes
    colors: ['#005CA7', '#FFC20F', '#333333']
})
.setData(relational_01)
.render();
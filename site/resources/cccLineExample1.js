new pvc.LineChart({
    canvas: 'cccLineExample1',
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
    axisGrid_strokeStyle: '#F7F8F9',
    axisOffset: 0,
    orthoAxisLabel_font: 'normal 8px "Open Sans"',
    baseAxisLabel_font: 'normal 9px "Open Sans"',
    baseAxisLabel_textAngle: -0.8,
    baseAxisLabel_textAlign: 'right',
    baseAxisScale_dateTickFormat:    "%Y/%m/%d",
    baseAxisScale_dateTickPrecision: pvc.time.intervals.w,

    // Panels
    title:  "Time Series Line Chart",
    titleFont: 'lighter 20px "Open Sans"',
    titleMargins: '0 0 5 0',
    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: [
        '#005CA7', '#FFC20F', '#333333'
    ]
})
.setData(relational_01)
.render();
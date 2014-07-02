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
    axisGrid_strokeStyle: 'lightgray',
    axisOffset: 0,
    baseAxisLabel_textAngle: -0.8,
    baseAxisLabel_textAlign: 'right',
    baseAxisScale_dateTickFormat:    "%Y/%m/%d",
    baseAxisScale_dateTickPrecision: pvc.time.intervals.w,

    // Panels
    title:  "Time Series Line Chart",
    legend: true,

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_01)
.render();
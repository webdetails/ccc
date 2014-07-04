new pvc.BarChart({
    canvas: 'cccBarExample7',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    stacked: true,

    // Second plot
    plot2: true,
    plot2Series: ['Paris'],
    plot2OrthoAxis: 2,
    plot2NullInterpolationMode: 'linear',
    plot2Line_lineWidth: 2,
    plot2Dot_shapeSize:  20,

    // Trend plot
    trendType: 'moving-average',
    trendAreasVisible: true,
    trendColorAxis: 3,
    trendLine_interpolate: 'cardinal',
    trendArea_interpolate: 'cardinal',

    // Cartesian axes
    axisGrid: true,
    axisGrid_strokeStyle: 'lightgray',
    orthoAxisOffset: 0.1,
    continuousAxisTicks_strokeStyle: 'red',

    // Color axes
    colors: ['#e20a16', '#0b99d5'],
    color2AxisColors: ['#395b68'],
    color3AxisTransform: function(c) { return c.darker(); },

    // Panels
    title: "All-in-one Bar Chart",
    titleFont: 'bold 14px sans-serif',

    legend: true,

    // Chart/Interaction
    animate:    true,
    selectable: true,
    hoverable:  true
})
.setData(relational_01_neg)
.render();
new pvc.BarChart({
    canvas: "cccBarExample7",
    width:  600,
    height: 400,
    
    title: "All-in-one Bar Chart",
    titleFont: 'bold 14px sans-serif',
    
    colors: ['#e20a16', '#0b99d5'],
    
    stacked:    true,
    animate:    true,
    selectable: true,
    hoverable:  true,
    legend:     true,
    axisGrid:   true,
    orthoAxisOffset: 0.1,
    
    plot2: true,
    plot2Series: ['Paris'],
    plot2OrthoAxis: 2,
    plot2NullInterpolationMode: 'linear',
    
    color2AxisColors: ['#395b68'],
    
    trendType: 'moving-average',
    trendAreasVisible: true,
    
    trendColorAxis: 3,
    color3AxisTransform: function(c) { return c.darker(); },

    extensionPoints: {
        plot2Line_lineWidth: 2,
        plot2Dot_shapeSize:  20,
        trendLine_interpolate: 'cardinal',
        trendArea_interpolate: 'cardinal',
        continuousAxisTicks_strokeStyle: 'red',
        axisGrid_strokeStyle:  'lightgray'
    }
})
.setData(relational_01_neg, { crosstabMode: false })
.render();
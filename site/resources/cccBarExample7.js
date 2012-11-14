new pvc.BarChart({
    canvas: "cccBarExample7",
    width:  400,
    height: 250,
    title: "Stacked bar chart with line series",
    stacked: true,
    
    plot2: true,
    plot2Series: ['Paris'],
    plot2OrthoAxis: 2,
    plot2ColorAxis: 2,
    plot2NullInterpolationMode: 'linear',
    
    color2AxisColors: ['yellow'],
    
    trendType: 'linear',
    trendOrthoAxis: 3,
    trendAreasVisible: true,
    
    animate:    true,
    clickable:  true,
    selectable: true,
    hoverable:  true,
    legend:     true,
    
    axisGrid: true,
    orthoAxisOffset: 0.1,
    extensionPoints: {
        plot2Line_lineWidth: 3,
        plot2Dot_shapeSize: 20,
        continuousAxisTicks_strokeStyle: 'red'
    }
})
.setData(relational_01_neg, { crosstabMode: false })
.render();
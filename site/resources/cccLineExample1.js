new pvc.LineChart({
    canvas: 'cccLineExample1',
    width:  400,
    height: 200,
    title:  "Time Series Line Chart",
    
    timeSeries: true,
    
    legend:  true,
    legendPosition: 'right',
    legendAlign:    'top',
    
    animate:    false,
    selectable: true,
    hoverable:  true,
    axisGrid:   true,
    axisOffset: 0,
    
    extensionPoints: {
      baseAxisScale_dateTickFormat:    "%Y/%m/%d",
      baseAxisScale_dateTickPrecision: 798336000/1.5,
      line_interpolate: 'monotone',
      area_interpolate: 'monotone'
    }
})
.setData(relational_01, { crosstabMode: false })
.render();
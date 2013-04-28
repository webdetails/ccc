new pvc.LineChart({
    canvas: 'cccLineExample1',
    width:  600,
    height: 250,
    title:  "Time Series Line Chart",
    timeSeries: true,
    legend:     true,
    animate:    false,
    selectable: true,
    hoverable:  true,
    axisGrid:   true,
    axisOffset: 0,
    extensionPoints: {
        baseAxisLabel_textAngle: -0.8,
        baseAxisLabel_textAlign: 'right',
        baseAxisScale_dateTickFormat:    "%Y/%m/%d",
        baseAxisScale_dateTickPrecision: 798336000/1.5,
        line_interpolate: 'monotone',
        area_interpolate: 'monotone',
        axisGrid_strokeStyle: 'lightgray'
    }
})
.setData(relational_01, { crosstabMode: false })
.render();
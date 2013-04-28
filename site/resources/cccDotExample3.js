new pvc.DotChart({
    canvas:  'cccDotExample3',
    width:   600,
    height:  400,
    
    timeSeries: true,
    timeSeriesFormat: '%Y-%m-%d',
    
    title: "A Time Series Dot Chart",
    titlePosition: 'left',
    titleSize: {height: '100%'},
    orientation:  'vertical',
    animate:       false,
    legend:        true,
    legendAlign:   'left',
    selectable:    true,
    valuesVisible: true,
    margins: {right: '2%'},
    extensionPoints: {
        chart_fillStyle: '#eee',
        title_fillStyle: 'lightblue',
        axisLabel_textStyle: 'darkblue',
        baseAxisLabel_textAngle: -Math.PI/6,
        baseAxisLabel_textAlign: 'center',
        baseAxisLabel_textBaseline: 'top',
        dot_shape: 'cross',
        dot_shapeRadius: 3
    }
})
.setData(relational_012, {crosstabMode: false})
.render();
new pvc.StackedLineChart({
    canvas: 'cccStackedLineExample3',
    width:  400,
    height: 200,
    title:  "Interpolated Stacked Line Chart",
    
    nullInterpolationMode: 'linear',
    dimensions:   {
        // Category is a Date, but discrete
        category: {valueType: Date, isDiscrete: true } 
    },

    legend:     true,
    selectable: true,
    hoverable:  true,
    axisGrid:   true
})
.setData(relational_01, { crosstabMode: false })
.render();
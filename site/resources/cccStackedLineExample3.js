new pvc.StackedLineChart({
    canvas: 'cccStackedLineExample3',
    width:  600,
    height: 250,
    title:  "Interpolated Stacked Line Chart",
    
    nullInterpolationMode: 'linear',
    dimensions:   {
        // Category is a Date, but discrete
        category: {valueType: Date, isDiscrete: true } 
    },

    legend:     true,
    selectable: true,
    hoverable:  true,
    axisGrid:   true,
    extensionPoints: {
        axisGrid_strokeStyle: 'lightgray'
    }
})
.setData(relational_01, { crosstabMode: false })
.render();
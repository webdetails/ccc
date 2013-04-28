new pvc.StackedLineChart({
    canvas: 'cccStackedLineExample2',
    width:  600,
    height: 250,
    title:  "Categorical Stacked Line Chart",
    
    dimensions:   {
        // Category is a Date, but discrete
        category: {valueType: Date, isDiscrete: true } 
    },
    
    dotsVisible: true,
    legend:      true,
    animate:     false,
    selectable:  true,
    hoverable:   true,
    axisGrid:    true,
    axisOffset:  0,
    
    extensionPoints: {
        line_interpolate: 'monotone',
        area_interpolate: 'monotone',
        axisGrid_strokeStyle: 'lightgray'
    }
})
.setData(relational_01, { crosstabMode: false })
.render();
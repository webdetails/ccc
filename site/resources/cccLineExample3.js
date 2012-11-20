new pvc.LineChart({
    canvas: 'cccLineExample2',
    width:  400,
    height: 200,
    title:  "Interpolated and Negatives Line Chart",
    
    areasVisible: true,
    dotsVisible:  true,
    nullInterpolationMode: 'linear',
    dimensions:   {
        // Category is a Date, but discrete
        category: {valueType: Date, isDiscrete: true } 
    },

    legend:     true,
    animate:    true,
    selectable: true,
    hoverable:  true,
    axisGrid:   true,
    
    extensionPoints: {
      line_interpolate: 'cardinal',
      area_interpolate: 'cardinal'
    }
})
.setData(relational_01_neg, { crosstabMode: false })
.render();
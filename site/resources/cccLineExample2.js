new pvc.LineChart({
    canvas: 'cccLineExample2',
    width:  600,
    height: 250,
    title:  "Categorical Line Chart",
    
    areasVisible: true,
    dotsVisible:  true,
    dimensions: {
        // Category is a Date, but discrete
        category: {valueType: Date, isDiscrete: true } 
    },

    legend:     true,
    animate:    false,
    selectable: true,
    hoverable:  true,
    axisGrid:   true,
    extensionPoints: {
      line_interpolate: 'monotone',
      area_interpolate: 'monotone',
      axisGrid_strokeStyle: 'lightgray'
    }
})
.setData(relational_01, { crosstabMode: false })
.render();
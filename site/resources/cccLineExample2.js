new pvc.LineChart({
    canvas: 'cccLineExample2',
    width:  400,
    height: 200,
    title:  "Categorical Line Chart",
    
    areasVisible: true,
    dotsVisible:  true,
    dimensions:   {
        // Category is a Date, but discrete
        category: {valueType: Date, isDiscrete: true } 
    },

    legend:  true,
    legendPosition: 'right',
    legendAlign:    'top',
    
    animate:    false,
    selectable: true,
    hoverable:  true,
    axisGrid:   true,
    axisOffset: 0,
    
    extensionPoints: {
      line_interpolate: 'monotone',
      area_interpolate: 'monotone'
    }
})
.setData(relational_01, { crosstabMode: false })
.render();
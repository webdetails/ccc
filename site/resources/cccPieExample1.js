new pvc.PieChart({
    canvas: 'cccPieExample1',
    width:  450,
    height: 350,
    title:     "Simple Pie",
    titleFont: 'italic 18px sans-serif',
    animate:    false,
    selectable: true,
    hoverable:  true,
    valuesVisible: true,
    valuesLabelStyle: 'inside',
    valuesMask: "{category}",
    
    extensionPoints: {
       slice_strokeStyle: 'white' 
    }
})
.setData(relational_03_b, {crosstabMode: false})
.render();
new pvc.PieChart({
    canvas: 'cccPieExample3',
    width:  600,
    height: 400,
    legend:     false,
    selectable: true,
    hoverable:  true,
    valuesVisible: true,
    explodedSliceRadius: '5%',
    
    extensionPoints: {
        slice_innerRadiusEx: '20%'
    }
})
.setData(relational_03_b, {crosstabMode: false})
.render();
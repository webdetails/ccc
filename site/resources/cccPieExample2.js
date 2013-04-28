new pvc.PieChart({
    canvas: 'cccPieExample2',
    width:   600,
    height:  400,
    
    title:   "Rich Pie",
    titleSize: { width: '100%' },
    titlePaddings: '4%',
    titleFont:     'bold 16px sans-serif',
        
    legend: true,
    legendShape: 'circle',
    legendSize: { width: '100%' },
    
    animate:    false,
    selectable: true,
    hoverable:  true,
    valuesVisible: true,
    explodedSliceIndex:  1,
    explodedSliceRadius: '10%',
    
    colors: ['#8ED300', '#7CB021', '#568000', 
             '#3A3A3A', '#969696', '#F5F4F2'],
    extensionPoints: {
        legendArea_fillStyle: 'lightgray',
        title_fillStyle:      'lightblue'
    }
})
.setData(relational_03_b, {crosstabMode: false})
.render();
new pvc.HeatGridChart({
    canvas: 'cccHGExample5',
    width:   600,
    height:  250,
    title:   "Size, Color and Composite Axis Heat-grid",
    
    useShapes:     true,
    shape:         'circle',
    nullShape:     'cross',
    axisComposite: true,
    
    sizeRole:      'value', 
    colorRole:     'value2',
    
    selectable:     true,
    ctrlSelectMode: true,
    hoverable:      true,
    valuesVisible:  false,
    colorNormByCategory: false,
    
    colors: ['red', 'yellow', 
             'lightgreen', 'darkgreen'],
    axisFont:   '14px helvetica',
    yAxisSize:   60,
    xAxisSize:   100
})
.setData(testHeatGridComp, {
    dataCategoriesCount: 2,
    isMultiValued: true
})
.render();
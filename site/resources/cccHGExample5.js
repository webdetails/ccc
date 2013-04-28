new pvc.HeatGridChart({
    canvas: 'cccHGExample5',
    width:   600,
    height:  700,
    title:   "Size, Color and Composite Axis Heat-grid",
    
    useShapes:     true,
    shape:         'circle',
    nullShape:     'cross',
    axisComposite: true,
    orientation:   'horizontal',
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
    yAxisSize:   150,
    xAxisSize:   100
})
.setData(testHeatGridComp, {isMultiValued: true})
.render();
new pvc.HeatGridChart({
    canvas: 'cccHGExample5',
    width:   600,
    height:  700,
    orientation:  'horizontal',

    // Data source
    isMultiValued: true,

    // Visual roles
    sizeRole:  'value',
    colorRole: 'value2',

    // Main plot options
    useShapes: true,
    shape:     'circle',
    valuesVisible:  false,

    // Cartesian axes
    axisComposite: true,
    axisFont:  '14px helvetica',
    yAxisSize: 150,
    xAxisSize: 100,

    // Color axes
    colors: ['red', 'yellow', 'lightgreen', 'darkgreen'],
    colorNormByCategory: false,

    // Size axes
    nullShape: 'cross',

    // Panels
    title: "Size, Color and Composite Axis Heat-grid",

    // Chart/Interaction
    selectable:     true,
    ctrlSelectMode: true,
    hoverable:      true
})
.setData(testHeatGridComp)
.render();
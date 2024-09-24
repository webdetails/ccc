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
    axisFont: 'normal 10px "Open Sans"',
    yAxisSize: 150,
    xAxisSize: 100,

    // Color axes
    colors: ['#005CA7', '#FFFFFF', '#FFC20F'],
    colorNormByCategory: false,

    // Size axes
    nullShape: 'cross',

    // Panels
    title: "Size, Color and Composite Axis Heat-grid",
    titleFont: 'lighter 20px "Open Sans"',
    titleMargins: '0 0 20 0',

    // Chart/Interaction
    selectable:     true,
    ctrlSelectMode: true,
    hoverable:      true
})
.setData(testHeatGridComp)
.render();
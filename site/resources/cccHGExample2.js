new pvc.HeatGridChart({
    canvas: 'cccHGExample2',
    width:  600,
    height: 350,

    // Color axes
    colors: ['#005CA7', '#fff', '#FFC20F'],
    colorMissing: '#333333',

    // Main plot
    valuesAnchor: 'right',

    // Panels
    title: "Colors By Column Heat-grid",
    titleFont: 'lighter 20px "Open Sans"',
    titleMargins: '0 0 5 0',
    
    // Cartesian axes
    axisLabel_font: 'normal 10px "Open Sans"',
    axisRule_strokeStyle: '#FFFFFF',
    
    // Main Plot
    valuesFont: 'lighter 11px "Open Sans"',
    valuesOptimizeLegibility: true
})
.setData(testHeatGrid)
.render();
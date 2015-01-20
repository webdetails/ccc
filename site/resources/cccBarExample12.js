new pvc.BarChart({
    canvas: 'cccBarExample12',
    width:  600,
    height: 400,
    orientation: 'horizontal',

    // Data source
    isMultiValued: true,

    // Data
    ignoreNulls: false,
    dimensionGroups: {
        category: {comparer: def.ascending}
    },

    // Visual roles
    multiChartIndexes: [0, 1],

    // Main plot
    stacked: true,
    axisLabel_font: 'normal 9px "Open Sans"',

    // Panels
    title:          "Small Multiple Bar charts",
    titleFont: 'lighter 20px "Open Sans"',
    smallTitleFont: 'lighter 14px "Open Sans"',

    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:     false,
    selectable:  true,
    hoverable:   true,

    // Color axes
    colors: [
        '#005CA7', '#FFC20F', '#333333'
    ]
})
.setData(testHeatGridComp)
.render();
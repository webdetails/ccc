new pvc.BarChart({
    canvas: 'cccBarExample10',
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

    // Panels
    title:          "Small Multiple Bar charts",
    titleFont:      'bold 14px sans-serif',
    smallTitleFont: 'italic 12px sans-serif',

    legend: true,

    // Chart/Interaction
    animate:     false,
    selectable:  true,
    hoverable:   true
})
.setData(testHeatGridComp)
.render();
new pvc.TreemapChart({
    canvas: 'pvcTreemap4',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Visual roles
    colorRole: "multiChart, category, category2, category3",
    multiChartIndexes: 0,

    // Main plot
    rootCategoryLabel: "flare",
    valuesOverflow: 'hide',

    // Color axes
    colors: pv.Colors.category19,

    // Panels
    title: "Flare Library Modules",
    titleFont:      'italic 14px sans-serif',
    smallTitleFont: 'bold 14px sans-serif',

    legend: false,

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(buildDataset(flare))
.render();
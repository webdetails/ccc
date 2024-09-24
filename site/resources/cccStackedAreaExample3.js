new pvc.StackedAreaChart({
    canvas: 'cccStackedAreaExample3',
    width:  600,
    height: 250,

    // Data
    timeSeries: true,

    // Cartesian axes
    axisGrid: true,
    axisGrid_strokeStyle: 'lightgray',

    // Panels
    title: "Huge Dataset Stacked Area Chart",
    legend: true
})  
.setData(crosstab_01)
.render();
new pvc.PieChart({
    canvas: 'cccPieExample6',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    valuesVisible: true,
    explodedSliceRadius: '10%',
    slice_offsetRadius: function(scene) {
        return scene.isSelected() ? '10%' : 0;
    },

    // Panels
    legend: false,

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(relational_03_b)
.render();
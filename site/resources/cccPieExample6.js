new pvc.PieChart({
    canvas: 'cccPieExample6',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    valuesVisible: true,
    valuesFont: 'lighter 11px "Open Sans"',
    explodedSliceRadius: '10%',
    slice_offsetRadius: function(scene) {
        return scene.isSelected() ? '10%' : 0;
    },

    // Panels
    legend: false,

    // Chart/Interaction
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: [
        '#333333', '#777777', '#FFC20F', '#FFE085',
        '#005CA7', '#0086F4', '#39A74A', '#63CA73'
    ]
})
.setData(relational_03_b)
.render();
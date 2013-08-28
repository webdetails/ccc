new pvc.PieChart({
    canvas: 'cccPieExample5',
    width:  600,
    height: 400,
    legend: false,
    selectable: true,
    hoverable:  true,
    valuesVisible: true,
    explodedSliceRadius: '10%',

    extensionPoints: {
        slice_offsetRadius: function(scene) {
            return scene.isSelected() ? '10%' : 0;
        }
    }
})
.setData(relational_03_b, {crosstabMode: false})
.render();
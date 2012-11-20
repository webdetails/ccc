new pvc.HeatGridChart({
    canvas: 'cccHGExample4',
    width:    400,
    height:   300,
    title:    "Interactive Heat-grid",
    colorMin: '#FEDFE1',
    colorMax: '#F11929',
    clickable:  true,
    selectable: true,
    hoverable:  true,
    clickAction: function(scene){
        alert(
            'series = "'     + scene.vars.series.value + 
            '", category = ' + scene.vars.category.value + 
            '", color = '    + scene.vars.color.value);
    },
    plotFrameVisible: true,
    extensionPoints: {
        plotFrame_strokeStyle: 'black'
    }
})
.setData(testHeatGrid)
.render();
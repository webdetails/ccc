new pvc.HeatGridChart({
    canvas: 'cccHGExample4',
    width:    600,
    height:   400,
    title:    "Interactive Heat-grid",
    colorMin: '#FEDFE1',
    colorMax: '#F11929',
    
    clickable:     true,
    selectable:    true,
    hoverable:     true,
    valuesVisible: false,
    
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